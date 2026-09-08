"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const request_service_1 = require("../services/request.service");
const qr_service_1 = require("../services/qr.service");
const notification_service_1 = require("../services/notification.service");
const audit_service_1 = require("../services/audit.service");
const router = (0, express_1.Router)();
const createGatePassSchema = zod_1.z.object({
    destination: zod_1.z.string().min(2, 'Destination is required'),
    reason: zod_1.z.string().min(5, 'Reason is required'),
    departureTime: zod_1.z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid departure date/time is required'),
    expectedReturnTime: zod_1.z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid return date/time is required'),
});
const verifySchema = zod_1.z.object({
    tokenOrPin: zod_1.z.string().min(1, 'QR Token or PIN is required'),
});
const actionNoteSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
    verificationMethod: zod_1.z.enum(['QR', 'PIN']).default('QR'),
});
// POST /api/gate-passes - Student creates gate pass
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gatepass.create'), (0, validate_middleware_1.validateBody)(createGatePassSchema), async (req, res, next) => {
    try {
        const { destination, reason, departureTime, expectedReturnTime } = req.body;
        const departureDate = new Date(departureTime);
        const returnDate = new Date(expectedReturnTime);
        if (returnDate <= departureDate) {
            throw new error_middleware_1.AppError('Expected return time must be after departure time', 400);
        }
        // Generate 4-digit PIN upfront
        const passPin = qr_service_1.QrService.generatePin();
        // Create base request via Request Engine
        const request = await request_service_1.RequestService.createRequest({
            requesterId: req.user.id,
            requestTypeCode: 'GATE_PASS',
            title: `Gate Pass to ${destination}`,
            description: reason,
            location: req.user.hostelBlock || 'Hostel',
            priority: 'NORMAL',
            initialStatus: 'PENDING_APPROVAL',
        }, req.user.id);
        // Create gate pass record
        const gatePass = await prisma_1.default.gatePass.create({
            data: {
                requestId: request.id,
                destination,
                reason,
                departureTime: departureDate,
                expectedReturnTime: returnDate,
                passPin,
                gateStatus: 'PENDING_APPROVAL',
            },
        });
        // Find Warden of student's hostel block to notify
        const wardenStaff = await prisma_1.default.staff.findFirst({
            where: {
                department: 'Hostel',
                specialization: 'WARDEN',
            },
        });
        if (wardenStaff) {
            await notification_service_1.NotificationService.send({
                userId: wardenStaff.userId,
                title: `New Gate Pass Application: ${request.requestNumber}`,
                message: `${req.user.fullName || req.user.username} requested gate pass to ${destination}.`,
                type: 'INFO',
                referenceType: 'GATE_PASS',
                referenceId: request.id,
            });
        }
        res.status(201).json({
            success: true,
            message: 'Gate pass application submitted for warden approval',
            data: {
                ...request,
                gatePass,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/gate-passes/pending - Warden review
router.get('/pending', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gatepass.approve'), async (req, res, next) => {
    try {
        const pendingPasses = await prisma_1.default.gatePass.findMany({
            where: { gateStatus: 'PENDING_APPROVAL' },
            include: {
                request: {
                    include: {
                        requester: {
                            include: {
                                student: {
                                    include: {
                                        branch: true,
                                        hostelRoom: { include: { hostelBlock: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: pendingPasses,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/gate-passes/my - Student list
router.get('/my', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const myPasses = await prisma_1.default.gatePass.findMany({
            where: {
                request: { requesterId: req.user.id },
            },
            include: {
                request: true,
                approver: {
                    select: {
                        staff: { select: { fullName: true, designation: true } },
                    },
                },
                events: { orderBy: { eventTime: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: myPasses,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/gate-passes/:id/approve - Warden approves gate pass
router.post('/:id/approve', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gatepass.approve'), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const gatePass = await prisma_1.default.gatePass.findUnique({
            where: { id },
            include: {
                request: {
                    include: {
                        requester: {
                            include: { student: true },
                        },
                    },
                },
            },
        });
        if (!gatePass) {
            throw new error_middleware_1.AppError('Gate pass not found', 404);
        }
        if (gatePass.gateStatus !== 'PENDING_APPROVAL') {
            throw new error_middleware_1.AppError(`Cannot approve gate pass with status: ${gatePass.gateStatus}`, 422);
        }
        const rollNumber = gatePass.request.requester.student?.rollNumber || 'STUDENT';
        const qrExpiresAt = new Date(gatePass.expectedReturnTime.getTime() + 4 * 60 * 60 * 1000); // 4 hour grace period
        const qrTokenHash = qr_service_1.QrService.generateSignedQrToken(gatePass.id, rollNumber, qrExpiresAt);
        // Update gate pass
        const updatedGatePass = await prisma_1.default.gatePass.update({
            where: { id: gatePass.id },
            data: {
                gateStatus: 'APPROVED',
                approvedBy: req.user.id,
                approvedAt: new Date(),
                qrTokenHash,
                qrExpiresAt,
            },
        });
        // Update Request status
        await request_service_1.RequestService.transitionStatus(gatePass.requestId, 'APPROVED', req.user.id, `Approved by Warden. QR token and PIN ${gatePass.passPin} issued.`);
        // Notify student
        await notification_service_1.NotificationService.send({
            userId: gatePass.request.requesterId,
            title: 'Gate Pass Approved!',
            message: `Your gate pass to ${gatePass.destination} has been approved. PIN: ${gatePass.passPin}.`,
            type: 'SUCCESS',
            referenceType: 'GATE_PASS',
            referenceId: gatePass.requestId,
        });
        // Audit Log
        await audit_service_1.AuditService.log({
            actorId: req.user.id,
            action: 'GATE_PASS_APPROVED',
            entityType: 'GATE_PASS',
            entityId: gatePass.id,
            newValues: {
                passNumber: gatePass.request.requestNumber,
                pin: gatePass.passPin,
                expiresAt: qrExpiresAt,
            },
        });
        res.json({
            success: true,
            message: 'Gate pass approved successfully',
            data: updatedGatePass,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/gate-passes/:id/reject - Warden rejects gate pass
router.post('/:id/reject', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gatepass.reject'), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { reason } = req.body;
        const gatePass = await prisma_1.default.gatePass.findUnique({
            where: { id },
            include: { request: true },
        });
        if (!gatePass) {
            throw new error_middleware_1.AppError('Gate pass not found', 404);
        }
        const updatedGatePass = await prisma_1.default.gatePass.update({
            where: { id: gatePass.id },
            data: {
                gateStatus: 'REJECTED',
                approvedBy: req.user.id,
                approvedAt: new Date(),
            },
        });
        await request_service_1.RequestService.transitionStatus(gatePass.requestId, 'REJECTED', req.user.id, `Rejected by Warden: ${reason || 'Application not approved'}`);
        await notification_service_1.NotificationService.send({
            userId: gatePass.request.requesterId,
            title: 'Gate Pass Rejected',
            message: `Your gate pass application was rejected. Reason: ${reason || 'Application rejected by Warden.'}`,
            type: 'ALERT',
            referenceType: 'GATE_PASS',
            referenceId: gatePass.requestId,
        });
        res.json({
            success: true,
            message: 'Gate pass rejected',
            data: updatedGatePass,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/gate-passes/verify - Security officer verifies QR or PIN
router.post('/verify', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gatepass.verify'), (0, validate_middleware_1.validateBody)(verifySchema), async (req, res, next) => {
    try {
        const { tokenOrPin } = req.body;
        const result = await qr_service_1.QrService.verifyGatePass(tokenOrPin);
        if (result.gatePass) {
            await audit_service_1.AuditService.log({
                actorId: req.user.id,
                action: 'GATE_PASS_VERIFIED',
                entityType: 'GATE_PASS',
                entityId: result.gatePass.id,
                newValues: { result: result.status, message: result.message },
            });
        }
        res.json({
            success: result.valid,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/gate-passes/:id/depart - Security marks student departed
router.post('/:id/depart', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gatepass.verify'), (0, validate_middleware_1.validateBody)(actionNoteSchema), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { notes, verificationMethod } = req.body;
        const gatePass = await prisma_1.default.gatePass.findUnique({
            where: { id },
            include: { request: true },
        });
        if (!gatePass) {
            throw new error_middleware_1.AppError('Gate pass not found', 404);
        }
        if (gatePass.gateStatus !== 'APPROVED') {
            throw new error_middleware_1.AppError(`Cannot mark departed. Current status is ${gatePass.gateStatus}`, 422);
        }
        const now = new Date();
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const gp = await tx.gatePass.update({
                where: { id: gatePass.id },
                data: {
                    gateStatus: 'DEPARTED',
                    departedAt: now,
                },
            });
            // Record Gate Event
            await tx.gateEvent.create({
                data: {
                    gatePassId: gatePass.id,
                    eventType: 'DEPARTED',
                    verifiedBy: req.user.id,
                    eventTime: now,
                    verificationMethod,
                    notes,
                },
            });
            // Update Request status
            await tx.request.update({
                where: { id: gatePass.requestId },
                data: { status: 'DEPARTED' },
            });
            await tx.requestStatusHistory.create({
                data: {
                    requestId: gatePass.requestId,
                    oldStatus: 'APPROVED',
                    newStatus: 'DEPARTED',
                    changedBy: req.user.id,
                    comment: `Student passed gate and departed at ${now.toLocaleTimeString()}`,
                },
            });
            return gp;
        });
        // Notify Student
        await notification_service_1.NotificationService.send({
            userId: gatePass.request.requesterId,
            title: 'Gate Departure Recorded',
            message: `Departure logged at ${now.toLocaleTimeString()} by Main Gate Security. Safe travels!`,
            type: 'INFO',
            referenceType: 'GATE_PASS',
            referenceId: gatePass.requestId,
        });
        // Audit Log
        await audit_service_1.AuditService.log({
            actorId: req.user.id,
            action: 'GATE_DEPARTURE_LOGGED',
            entityType: 'GATE_PASS',
            entityId: gatePass.id,
            newValues: { departedAt: now, method: verificationMethod },
        });
        res.json({
            success: true,
            message: 'Student departure logged successfully',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/gate-passes/:id/return - Security marks student returned
router.post('/:id/return', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('gatepass.verify'), (0, validate_middleware_1.validateBody)(actionNoteSchema), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { notes, verificationMethod } = req.body;
        const gatePass = await prisma_1.default.gatePass.findUnique({
            where: { id },
            include: { request: true },
        });
        if (!gatePass) {
            throw new error_middleware_1.AppError('Gate pass not found', 404);
        }
        if (gatePass.gateStatus !== 'DEPARTED') {
            throw new error_middleware_1.AppError(`Cannot mark returned. Current status is ${gatePass.gateStatus}`, 422);
        }
        const now = new Date();
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const gp = await tx.gatePass.update({
                where: { id: gatePass.id },
                data: {
                    gateStatus: 'RETURNED',
                    returnedAt: now,
                },
            });
            // Record Gate Event
            await tx.gateEvent.create({
                data: {
                    gatePassId: gatePass.id,
                    eventType: 'RETURNED',
                    verifiedBy: req.user.id,
                    eventTime: now,
                    verificationMethod,
                    notes,
                },
            });
            // Update Request status
            await tx.request.update({
                where: { id: gatePass.requestId },
                data: {
                    status: 'RETURNED',
                    completedAt: now,
                },
            });
            await tx.requestStatusHistory.create({
                data: {
                    requestId: gatePass.requestId,
                    oldStatus: 'DEPARTED',
                    newStatus: 'RETURNED',
                    changedBy: req.user.id,
                    comment: `Student returned through main gate at ${now.toLocaleTimeString()}`,
                },
            });
            return gp;
        });
        await notification_service_1.NotificationService.send({
            userId: gatePass.request.requesterId,
            title: 'Campus Return Logged',
            message: `Welcome back! Return registered at ${now.toLocaleTimeString()} by Main Gate Security.`,
            type: 'SUCCESS',
            referenceType: 'GATE_PASS',
            referenceId: gatePass.requestId,
        });
        await audit_service_1.AuditService.log({
            actorId: req.user.id,
            action: 'GATE_RETURN_LOGGED',
            entityType: 'GATE_PASS',
            entityId: gatePass.id,
            newValues: { returnedAt: now, method: verificationMethod },
        });
        res.json({
            success: true,
            message: 'Student return logged successfully',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
