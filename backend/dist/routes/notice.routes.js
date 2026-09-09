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
const audit_service_1 = require("../services/audit.service");
const router = (0, express_1.Router)();
const createNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters'),
    content: zod_1.z.string().min(10, 'Content must be at least 10 characters'),
    priority: zod_1.z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
    targets: zod_1.z.array(zod_1.z.object({
        targetType: zod_1.z.enum(['ALL', 'BRANCH', 'YEAR', 'HOSTEL']),
        targetValue: zod_1.z.string().min(1),
    })).min(1, 'At least one target filter is required'),
});
// GET /api/notices - List notices relevant to the authenticated user
router.get('/', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const isStaffOrAdmin = ['ADMIN', 'STAFF', 'WARDEN', 'SECURITY'].includes(user.role);
        // Fetch all published notices
        const allNotices = await prisma_1.default.notice.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                targets: true,
                author: { select: { username: true, staff: { select: { fullName: true, designation: true } } } },
                reads: { where: { userId: user.id } },
            },
            orderBy: { publishedAt: 'desc' },
        });
        // Filter notices according to targeting logic
        const filtered = allNotices.filter((n) => {
            if (isStaffOrAdmin)
                return true; // Staff/Admin view all notices
            // Check student targeting criteria
            return n.targets.some((t) => {
                if (t.targetType === 'ALL')
                    return true;
                if (t.targetType === 'BRANCH' && (user.branch === t.targetValue || user.department === t.targetValue))
                    return true;
                if (t.targetType === 'YEAR' && String(user.year) === String(t.targetValue))
                    return true;
                if (t.targetType === 'HOSTEL' && user.hostelBlock === t.targetValue)
                    return true;
                return false;
            });
        });
        const formatted = filtered.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            priority: n.priority,
            publishedAt: n.publishedAt,
            authorName: n.author.staff?.fullName || n.author.username,
            authorRole: n.author.staff?.designation || 'Administration',
            targets: n.targets,
            isRead: n.reads.length > 0,
            readAt: n.reads[0]?.readAt || null,
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
// POST /api/notices - Publish targeted notice (Admin / Warden)
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('notices.create'), (0, validate_middleware_1.validateBody)(createNoticeSchema), async (req, res, next) => {
    try {
        const { title, content, priority, targets } = req.body;
        const notice = await prisma_1.default.$transaction(async (tx) => {
            const n = await tx.notice.create({
                data: {
                    title,
                    content,
                    priority,
                    createdBy: req.user.id,
                    publishedAt: new Date(),
                    status: 'PUBLISHED',
                },
            });
            for (const t of targets) {
                await tx.noticeTarget.create({
                    data: {
                        noticeId: n.id,
                        targetType: t.targetType,
                        targetValue: t.targetValue,
                    },
                });
            }
            return n;
        });
        // Audit Log
        await audit_service_1.AuditService.log({
            actorId: req.user.id,
            action: 'NOTICE_PUBLISHED',
            entityType: 'NOTICE',
            entityId: notice.id,
            newValues: { title, priority, targets },
        });
        res.status(201).json({
            success: true,
            message: 'Targeted campus notice published successfully',
            data: notice,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/notices/:id/read - Mark notice as read
router.post('/:id/read', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const noticeId = String(req.params.id);
        await prisma_1.default.noticeRead.upsert({
            where: {
                noticeId_userId: {
                    noticeId,
                    userId: req.user.id,
                },
            },
            update: {},
            create: {
                noticeId,
                userId: req.user.id,
                readAt: new Date(),
            },
        });
        res.json({
            success: true,
            message: 'Notice marked as read',
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
