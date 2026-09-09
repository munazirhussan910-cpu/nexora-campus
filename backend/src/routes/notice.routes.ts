import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

const createNoticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
  targets: z.array(
    z.object({
      targetType: z.enum(['ALL', 'BRANCH', 'YEAR', 'HOSTEL']),
      targetValue: z.string().min(1),
    })
  ).min(1, 'At least one target filter is required'),
});

// GET /api/notices - List notices relevant to the authenticated user
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const isStaffOrAdmin = ['ADMIN', 'STAFF', 'WARDEN', 'SECURITY'].includes(user.role);

      // Fetch all published notices
      const allNotices = await prisma.notice.findMany({
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
        if (isStaffOrAdmin) return true; // Staff/Admin view all notices

        // Check student targeting criteria
        return n.targets.some((t) => {
          if (t.targetType === 'ALL') return true;
          if (t.targetType === 'BRANCH' && (user.branch === t.targetValue || user.department === t.targetValue)) return true;
          if (t.targetType === 'YEAR' && String(user.year) === String(t.targetValue)) return true;
          if (t.targetType === 'HOSTEL' && user.hostelBlock === t.targetValue) return true;
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
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notices - Publish targeted notice (Admin / Warden)
router.post(
  '/',
  authenticate,
  requirePermission('notices.create'),
  validateBody(createNoticeSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content, priority, targets } = req.body;

      const notice = await prisma.$transaction(async (tx) => {
        const n = await tx.notice.create({
          data: {
            title,
            content,
            priority,
            createdBy: req.user!.id,
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
      await AuditService.log({
        actorId: req.user!.id,
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
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notices/:id/read - Mark notice as read
router.post(
  '/:id/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const noticeId = String(req.params.id);

      await prisma.noticeRead.upsert({
        where: {
          noticeId_userId: {
            noticeId,
            userId: req.user!.id,
          },
        },
        update: {},
        create: {
          noticeId,
          userId: req.user!.id,
          readAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Notice marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
