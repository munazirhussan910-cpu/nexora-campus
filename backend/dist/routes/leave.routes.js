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
const notification_service_1 = require("../services/notification.service");
const audit_service_1 = require("../services/audit.service");
const router = (0, express_1.Router)();
const createLeaveSchema = zod_1.z.object({
    startDate: zod_1.z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid start date is required'),
    endDate: zod_1.z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid end date is required'),
    reason: zod_1.z.string().min(5, 'Reason is required'),
    emergencyContact: zod_1.z.string().min(5, 'Emergency contact information is required'),
    parentConsent: zod_1.z.boolean().default(false),
});
// POST /api/leaves - Student applies for leave
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('leave.create'), (0, validate_middleware_1.validateBody)(createLeaveSchema), async (req, res, next) => {
    try {
        const { startDate, endDate, reason, emergencyContact, parentConsent } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
            throw new error_middleware_1.AppError('End date must be after start date', 400);
        }
        // Create base request via Request Engine
        const request = await request_service_1.RequestService.createRequest({
            requesterId: req.user.id,
            requestTypeCode: 'LEAVE',
            title: `Hostel Leave (${start.toLocaleDateString()} to ${end.toLocaleDateString()})`,
            description: reason,
            location: req.user.hostelBlock || 'Hostel',
            priority: 'NORMAL',
            initialStatus: 'PENDING_APPROVAL',
        }, req.user.id);
        const leave = await prisma_1.default.leaveRequest.create({
            data: {
                requestId: request.id,
                startDate: start,
                endDate: end,
                reason,
                emergencyContact,
                parentConsent,
                status: 'PENDING_APPROVAL',
            },
        });
        // Notify Warden
        const warden = await prisma_1.default.staff.findFirst({
            where: { department: 'Hostel', specialization: 'WARDEN' },
        });
        if (warden) {
            await notification_service_1.NotificationService.send({
                userId: warden.userId,
                title: `New Leave Application: ${request.requestNumber}`,
                message: `${req.user.fullName || req.user.username} requested leave from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`,
                type: 'INFO',
                referenceType: 'LEAVE',
                referenceId: request.id,
            });
        }
        res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully for warden review',
            data: {
                ...request,
                leave,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/leaves/pending - Warden review
router.get('/pending', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('leave.approve'), async (req, res, next) => {
    try {
        const pending = await prisma_1.default.leaveRequest.findMany({
            where: { status: 'PENDING_APPROVAL' },
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
            data: pending,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/leaves/my - Student list
router.get('/my', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const leaves = await prisma_1.default.leaveRequest.findMany({
            where: {
                request: { requesterId: req.user.id },
            },
            include: {
                request: true,
                approver: {
                    select: { staff: { select: { fullName: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: leaves,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/leaves/:id/approve - Warden approves leave
router.post('/:id/approve', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('leave.approve'), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const leave = await prisma_1.default.leaveRequest.findUnique({
            where: { id },
            include: { request: true },
        });
        if (!leave) {
            throw new error_middleware_1.AppError('Leave application not found', 404);
        }
        const updated = await prisma_1.default.leaveRequest.update({
            where: { id: leave.id },
            data: {
                status: 'APPROVED',
                approvedBy: req.user.id,
                approvedAt: new Date(),
            },
        });
        await request_service_1.RequestService.transitionStatus(leave.requestId, 'APPROVED', req.user.id, 'Hostel leave approved by Warden');
        await notification_service_1.NotificationService.send({
            userId: leave.request.requesterId,
            title: 'Hostel Leave Approved',
            message: `Your leave request (${leave.request.requestNumber}) has been approved by Warden.`,
            type: 'SUCCESS',
            referenceType: 'LEAVE',
            referenceId: leave.requestId,
        });
        await audit_service_1.AuditService.log({
            actorId: req.user.id,
            action: 'LEAVE_APPROVED',
            entityType: 'LEAVE',
            entityId: leave.id,
        });
        res.json({
            success: true,
            message: 'Leave approved successfully',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/leaves/:id/reject - Warden rejects leave
router.post('/:id/reject', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('leave.reject'), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { reason } = req.body;
        const leave = await prisma_1.default.leaveRequest.findUnique({
            where: { id },
            include: { request: true },
        });
        if (!leave) {
            throw new error_middleware_1.AppError('Leave application not found', 404);
        }
        const updated = await prisma_1.default.leaveRequest.update({
            where: { id: leave.id },
            data: {
                status: 'REJECTED',
                approvedBy: req.user.id,
                approvedAt: new Date(),
            },
        });
        await request_service_1.RequestService.transitionStatus(leave.requestId, 'REJECTED', req.user.id, `Leave rejected: ${reason || 'Application not approved'}`);
        await notification_service_1.NotificationService.send({
            userId: leave.request.requesterId,
            title: 'Hostel Leave Rejected',
            message: `Your leave application was rejected: ${reason || 'Application not approved by Warden.'}`,
            type: 'ALERT',
            referenceType: 'LEAVE',
            referenceId: leave.requestId,
        });
        await audit_service_1.AuditService.log({
            actorId: req.user.id,
            action: 'LEAVE_REJECTED',
            entityType: 'LEAVE',
            entityId: leave.id,
            newValues: { reason },
        });
        res.json({
            success: true,
            message: 'Leave rejected',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
