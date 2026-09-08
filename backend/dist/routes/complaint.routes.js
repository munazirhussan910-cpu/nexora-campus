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
const routing_service_1 = require("../services/routing.service");
const notification_service_1 = require("../services/notification.service");
const sla_service_1 = require("../services/sla.service");
const router = (0, express_1.Router)();
// Zod Schemas
const createComplaintSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().min(5, 'Description must be at least 5 characters'),
    location: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    category: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().optional(),
});
const resolveSchema = zod_1.z.object({
    resolutionNotes: zod_1.z.string().min(3, 'Resolution notes are required'),
});
const ratingSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    feedback: zod_1.z.string().optional(),
});
// POST /api/complaints - Student creates complaint
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('requests.create'), (0, validate_middleware_1.validateBody)(createComplaintSchema), async (req, res, next) => {
    try {
        const { title, description, priority, location, photoUrl } = req.body;
        // 1. Automatic Deterministic Keyword Routing
        const route = await routing_service_1.RoutingService.routeComplaint(title, description);
        const finalLocation = location ||
            (req.user.hostelBlock && req.user.roomNumber
                ? `${req.user.hostelBlock} / Room ${req.user.roomNumber}`
                : 'Campus Hostel');
        // 2. Create base request via Request Engine
        const initialStatus = route.assignedStaffUserId ? 'ASSIGNED' : 'ROUTED';
        const request = await request_service_1.RequestService.createRequest({
            requesterId: req.user.id,
            requestTypeCode: 'COMPLAINT',
            title,
            description,
            location: finalLocation,
            priority,
            category: route.category,
            assignedTo: route.assignedStaffUserId,
            initialStatus,
        }, req.user.id);
        // 3. Create complaint details record
        const complaint = await prisma_1.default.complaint.create({
            data: {
                requestId: request.id,
                category: route.category,
                issueType: route.specialization,
                photoUrl,
            },
        });
        // 4. Notify assigned staff if assigned
        if (route.assignedStaffUserId) {
            await notification_service_1.NotificationService.send({
                userId: route.assignedStaffUserId,
                title: `New ${route.category} Complaint: ${request.requestNumber}`,
                message: `Assigned task "${title}" at ${finalLocation}.`,
                type: 'INFO',
                referenceType: 'COMPLAINT',
                referenceId: request.id,
            });
        }
        res.status(201).json({
            success: true,
            message: 'Complaint submitted and routed successfully',
            data: {
                ...request,
                complaint,
                routing: {
                    category: route.category,
                    specialization: route.specialization,
                    assignedTo: route.assignedStaffName || 'Pending manual allocation',
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/complaints/assigned - Staff view assigned complaints
router.get('/assigned', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const { status } = req.query;
        const requests = await prisma_1.default.request.findMany({
            where: {
                assignedTo: req.user.id,
                requestType: { code: 'COMPLAINT' },
                ...(status ? { status: String(status) } : {}),
            },
            include: {
                requestType: true,
                complaint: true,
                requester: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        student: {
                            select: {
                                fullName: true,
                                rollNumber: true,
                                phone: true,
                                hostelRoom: { include: { hostelBlock: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const formatted = requests.map((r) => ({
            ...r,
            sla: sla_service_1.SlaService.computeSla(r),
        }));
        res.json({
            success: true,
            data: formatted,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/complaints/:id/accept - Staff accepts complaint
router.post('/:id/accept', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const requestId = String(req.params.id);
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Complaint not found', 404);
        }
        if (request.assignedTo !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('You are not assigned to this complaint', 403);
        }
        // Transition to ACCEPTED
        const updated = await request_service_1.RequestService.transitionStatus(requestId, 'ACCEPTED', req.user.id, 'Staff accepted task assignment');
        // Record acceptedAt in requestAssignment
        await prisma_1.default.requestAssignment.updateMany({
            where: { requestId, assignedTo: req.user.id },
            data: { acceptedAt: new Date() },
        });
        res.json({
            success: true,
            message: 'Complaint accepted successfully',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/complaints/:id/start - Staff starts work
router.post('/:id/start', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const requestId = String(req.params.id);
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Complaint not found', 404);
        }
        if (request.assignedTo !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('You are not assigned to this complaint', 403);
        }
        const updated = await request_service_1.RequestService.transitionStatus(requestId, 'IN_PROGRESS', req.user.id, 'Staff has started on-site maintenance work');
        res.json({
            success: true,
            message: 'Work status marked as in progress',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/complaints/:id/resolve - Staff resolves complaint
router.post('/:id/resolve', auth_middleware_1.authenticate, (0, validate_middleware_1.validateBody)(resolveSchema), async (req, res, next) => {
    try {
        const requestId = String(req.params.id);
        const { resolutionNotes } = req.body;
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
            include: { complaint: true },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Complaint not found', 404);
        }
        if (request.assignedTo !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('You are not assigned to this complaint', 403);
        }
        // Update resolution notes
        if (request.complaint) {
            await prisma_1.default.complaint.update({
                where: { id: request.complaint.id },
                data: { resolutionNotes },
            });
        }
        // Record completedAt in assignment
        await prisma_1.default.requestAssignment.updateMany({
            where: { requestId, assignedTo: req.user.id },
            data: { completedAt: new Date() },
        });
        // Transition to RESOLVED
        const updated = await request_service_1.RequestService.transitionStatus(requestId, 'RESOLVED', req.user.id, `Resolved with notes: ${resolutionNotes}`);
        res.json({
            success: true,
            message: 'Complaint marked as resolved',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/complaints/:id/confirm - Student confirms resolution
router.post('/:id/confirm', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const requestId = String(req.params.id);
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Complaint not found', 404);
        }
        if (request.requesterId !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('Only the requester can confirm complaint resolution', 403);
        }
        const updated = await request_service_1.RequestService.transitionStatus(requestId, 'CONFIRMED', req.user.id, 'Student confirmed resolution of issue');
        res.json({
            success: true,
            message: 'Complaint resolution confirmed',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/complaints/:id/rating - Student rates the resolution
router.post('/:id/rating', auth_middleware_1.authenticate, (0, validate_middleware_1.validateBody)(ratingSchema), async (req, res, next) => {
    try {
        const requestId = String(req.params.id);
        const { rating, feedback } = req.body;
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
            include: { complaint: true },
        });
        if (!request || !request.complaint) {
            throw new error_middleware_1.AppError('Complaint not found', 404);
        }
        if (request.requesterId !== req.user.id && req.user.role !== 'ADMIN') {
            throw new error_middleware_1.AppError('Only the requester can rate this complaint', 403);
        }
        const updatedComplaint = await prisma_1.default.complaint.update({
            where: { id: request.complaint.id },
            data: {
                studentRating: rating,
                studentFeedback: feedback,
            },
        });
        if (request.status === 'CONFIRMED' || request.status === 'RESOLVED') {
            await request_service_1.RequestService.transitionStatus(requestId, 'CLOSED', req.user.id, `Student rated ${rating}/5 stars: "${feedback || 'No feedback'}"`);
        }
        res.json({
            success: true,
            message: 'Rating and feedback submitted successfully',
            data: updatedComplaint,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
