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
const request_service_1 = require("../services/request.service");
const sla_service_1 = require("../services/sla.service");
const router = (0, express_1.Router)();
// GET /api/requests/my
router.get('/my', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const { status, type } = req.query;
        const requests = await prisma_1.default.request.findMany({
            where: {
                requesterId: req.user.id,
                ...(status ? { status: String(status) } : {}),
                ...(type ? { requestType: { code: String(type) } } : {}),
            },
            include: {
                requestType: true,
                assignedStaff: {
                    select: {
                        id: true,
                        staff: { select: { fullName: true, designation: true, phone: true } },
                    },
                },
                complaint: true,
                gatePass: true,
                leaveRequest: true,
                bonafide: true,
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
// GET /api/requests (All requests for Admin / Warden)
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('requests.view.all'), async (req, res, next) => {
    try {
        const { status, priority, type, search, hostel, category } = req.query;
        const whereClause = {};
        if (status && status !== 'ALL') {
            whereClause.status = String(status);
        }
        if (priority && priority !== 'ALL') {
            whereClause.priority = String(priority);
        }
        if (type && type !== 'ALL') {
            whereClause.requestType = { code: String(type) };
        }
        if (category && category !== 'ALL') {
            whereClause.complaint = { category: String(category) };
        }
        if (hostel && hostel !== 'ALL') {
            whereClause.location = { contains: String(hostel) };
        }
        if (search) {
            whereClause.OR = [
                { requestNumber: { contains: String(search) } },
                { title: { contains: String(search) } },
                { description: { contains: String(search) } },
                { location: { contains: String(search) } },
            ];
        }
        const requests = await prisma_1.default.request.findMany({
            where: whereClause,
            include: {
                requestType: true,
                requester: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        student: {
                            include: {
                                branch: true,
                                hostelRoom: { include: { hostelBlock: true } },
                            },
                        },
                    },
                },
                assignedStaff: {
                    select: {
                        id: true,
                        staff: { select: { fullName: true, designation: true, phone: true } },
                    },
                },
                complaint: true,
                gatePass: true,
                leaveRequest: true,
                bonafide: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
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
// GET /api/requests/:id
router.get('/:id', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const requestId = String(req.params.id);
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
            include: {
                requestType: true,
                requester: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        student: {
                            include: {
                                branch: true,
                                hostelRoom: { include: { hostelBlock: true } },
                            },
                        },
                    },
                },
                assignedStaff: {
                    select: {
                        id: true,
                        staff: { select: { fullName: true, designation: true, phone: true } },
                    },
                },
                complaint: true,
                gatePass: {
                    include: {
                        events: {
                            include: { verifier: { select: { staff: { select: { fullName: true } } } } },
                            orderBy: { eventTime: 'desc' },
                        },
                    },
                },
                leaveRequest: true,
                bonafide: true,
            },
        });
        if (!request) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Request not found' },
            });
            return;
        }
        // Check access: must be requester, assigned staff, or have requests.view.all
        const isOwner = request.requesterId === req.user.id;
        const isAssigned = request.assignedTo === req.user.id;
        const canViewAll = req.user.permissions.includes('requests.view.all') || req.user.role === 'ADMIN';
        if (!isOwner && !isAssigned && !canViewAll) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Unauthorized to view this request' },
            });
            return;
        }
        const timeline = await request_service_1.RequestService.getRequestTimeline(request.id);
        const sla = sla_service_1.SlaService.computeSla(request);
        res.json({
            success: true,
            data: {
                ...request,
                timeline,
                sla,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/requests/:id/status
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.string().min(1),
    comment: zod_1.z.string().optional(),
});
router.patch('/:id/status', auth_middleware_1.authenticate, (0, validate_middleware_1.validateBody)(updateStatusSchema), async (req, res, next) => {
    try {
        const { status, comment } = req.body;
        const updated = await request_service_1.RequestService.transitionStatus(String(req.params.id), status, req.user.id, comment);
        res.json({
            success: true,
            message: `Request status transitioned to ${status}`,
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/requests/:id/reassign
const reassignSchema = zod_1.z.object({
    staffUserId: zod_1.z.string().min(1),
    comment: zod_1.z.string().optional(),
});
router.post('/:id/reassign', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('requests.reassign'), (0, validate_middleware_1.validateBody)(reassignSchema), async (req, res, next) => {
    try {
        const { staffUserId, comment } = req.body;
        const updated = await request_service_1.RequestService.reassignRequest(String(req.params.id), staffUserId, req.user.id, comment);
        res.json({
            success: true,
            message: 'Request reassigned successfully',
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
