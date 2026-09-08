"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = require("../config/env");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const request_service_1 = require("../services/request.service");
const pdf_service_1 = require("../services/pdf.service");
const notification_service_1 = require("../services/notification.service");
const audit_service_1 = require("../services/audit.service");
const router = (0, express_1.Router)();
const createBonafideSchema = zod_1.z.object({
    purpose: zod_1.z.string().min(2, 'Purpose is required'),
});
// POST /api/bonafide - Student requests bonafide certificate
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('bonafide.create'), (0, validate_middleware_1.validateBody)(createBonafideSchema), async (req, res, next) => {
    try {
        const { purpose } = req.body;
        // Create base request via Request Engine
        const request = await request_service_1.RequestService.createRequest({
            requesterId: req.user.id,
            requestTypeCode: 'BONAFIDE',
            title: `Bonafide Certificate Request (${purpose})`,
            description: `Application for official Bonafide Certificate required for: ${purpose}`,
            location: 'Academic Office',
            priority: 'NORMAL',
            initialStatus: 'PENDING_APPROVAL',
        }, req.user.id);
        // Create bonafide request record
        const bonafide = await prisma_1.default.bonafideRequest.create({
            data: {
                requestId: request.id,
                purpose,
            },
        });
        // Notify academic authority / admin
        const adminUsers = await prisma_1.default.user.findMany({
            where: { role: { name: 'ADMIN' } },
        });
        for (const a of adminUsers) {
            await notification_service_1.NotificationService.send({
                userId: a.id,
                title: `Bonafide Certificate Requested: ${request.requestNumber}`,
                message: `Student ${req.user.fullName || req.user.username} requested Bonafide for "${purpose}".`,
                type: 'INFO',
                referenceType: 'BONAFIDE',
                referenceId: request.id,
            });
        }
        res.status(201).json({
            success: true,
            message: 'Bonafide certificate request submitted successfully',
            data: {
                ...request,
                bonafide,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/bonafide/pending - Authority review
router.get('/pending', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('bonafide.approve'), async (req, res, next) => {
    try {
        const pending = await prisma_1.default.bonafideRequest.findMany({
            where: { certificateId: null },
            include: {
                request: {
                    include: {
                        requester: {
                            include: {
                                student: {
                                    include: { branch: true },
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
// GET /api/bonafide/my - Student list
router.get('/my', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const myRequests = await prisma_1.default.bonafideRequest.findMany({
            where: {
                request: { requesterId: req.user.id },
            },
            include: {
                request: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({
            success: true,
            data: myRequests,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/bonafide/:id/approve - Authority approves and generates PDF
router.post('/:id/approve', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('bonafide.approve'), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const bonafide = await prisma_1.default.bonafideRequest.findUnique({
            where: { id },
            include: {
                request: {
                    include: {
                        requester: {
                            include: {
                                student: {
                                    include: { branch: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!bonafide) {
            throw new error_middleware_1.AppError('Bonafide request not found', 404);
        }
        if (bonafide.certificateId) {
            throw new error_middleware_1.AppError('This certificate has already been issued', 409);
        }
        const student = bonafide.request.requester.student;
        if (!student) {
            throw new error_middleware_1.AppError('Requester does not have an active student profile', 400);
        }
        // Generate Certificate ID: e.g. NX-BON-2026-XXXXX
        const randomSeq = Math.floor(10000 + Math.random() * 90000);
        const certificateId = `NX-BON-2026-${randomSeq}`;
        const verificationToken = crypto_1.default.randomBytes(16).toString('hex');
        const verificationUrl = `${env_1.config.frontendUrl}/verify/${certificateId}`;
        const issueDate = new Date();
        // Dynamically Generate the PDF via PDFKit
        const fileUrl = await pdf_service_1.PdfService.generateBonafidePdf({
            certificateId,
            studentName: student.fullName,
            rollNumber: student.rollNumber,
            branchName: student.branch.name,
            year: student.year,
            purpose: bonafide.purpose,
            issueDate,
            issuedByName: req.user.fullName || 'Dr. Ananya Ray',
            verificationUrl,
        });
        // Update Database via Transaction
        const result = await prisma_1.default.$transaction(async (tx) => {
            // 1. Update bonafide request
            const updatedBonafide = await tx.bonafideRequest.update({
                where: { id: bonafide.id },
                data: {
                    certificateId,
                    generatedAt: issueDate,
                    documentUrl: fileUrl,
                    verificationToken,
                },
            });
            // 2. Create official Document record for verification registry
            await tx.document.create({
                data: {
                    ownerId: student.id,
                    documentType: 'BONAFIDE',
                    documentNumber: certificateId,
                    fileUrl,
                    verificationToken,
                    issuedBy: req.user.id,
                    issuedAt: issueDate,
                    expiresAt: new Date(issueDate.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months validity
                    status: 'VALID',
                },
            });
            // 3. Update Request status to APPROVED & COMPLETED
            await tx.request.update({
                where: { id: bonafide.requestId },
                data: {
                    status: 'APPROVED',
                    completedAt: issueDate,
                },
            });
            await tx.requestStatusHistory.create({
                data: {
                    requestId: bonafide.requestId,
                    oldStatus: 'PENDING_APPROVAL',
                    newStatus: 'APPROVED',
                    changedBy: req.user.id,
                    comment: `Certificate ${certificateId} generated and digitally certified.`,
                },
            });
            return updatedBonafide;
        });
        // Notify Student
        await notification_service_1.NotificationService.send({
            userId: bonafide.request.requesterId,
            title: 'Bonafide Certificate Ready!',
            message: `Your Bonafide Certificate (${certificateId}) has been officially generated and is ready for download.`,
            type: 'SUCCESS',
            referenceType: 'BONAFIDE',
            referenceId: bonafide.requestId,
        });
        // Audit Log
        await audit_service_1.AuditService.log({
            actorId: req.user.id,
            action: 'BONAFIDE_APPROVED',
            entityType: 'BONAFIDE',
            entityId: bonafide.id,
            newValues: {
                certificateId,
                studentName: student.fullName,
                purpose: bonafide.purpose,
            },
        });
        res.json({
            success: true,
            message: 'Bonafide certificate generated successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/bonafide/:id/download - Download the PDF
router.get('/:id/download', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const bonafide = await prisma_1.default.bonafideRequest.findUnique({
            where: { id },
            include: { request: true },
        });
        if (!bonafide || !bonafide.documentUrl) {
            throw new error_middleware_1.AppError('Certificate document not available for download', 404);
        }
        const filePath = path_1.default.join(env_1.config.storageDir, path_1.default.basename(bonafide.documentUrl));
        if (!fs_1.default.existsSync(filePath)) {
            throw new error_middleware_1.AppError('File not found on storage server', 404);
        }
        res.download(filePath, `Bonafide-${bonafide.certificateId}.pdf`);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
