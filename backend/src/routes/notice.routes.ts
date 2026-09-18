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
      const isLite = req.query.lite === 'true';
      const limit = req.query.limit
        ? Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 50)
        : undefined;

      // Push notice targeting down to the SQLite database level
      const whereClause: any = {
        status: 'PUBLISHED',
      };

      if (!isStaffOrAdmin) {
        const targetConditions: any[] = [{ targetType: 'ALL' }];
        if (user.branch) {
          targetConditions.push({ targetType: 'BRANCH', targetValue: user.branch });
        }
        if (user.department) {
          targetConditions.push({ targetType: 'BRANCH', targetValue: user.department });
        }
        if (user.year) {
          targetConditions.push({ targetType: 'YEAR', targetValue: String(user.year) });
        }
        if (user.hostelBlock) {
          targetConditions.push({ targetType: 'HOSTEL', targetValue: user.hostelBlock });
        }

        whereClause.targets = {
          some: {
            OR: targetConditions,
          },
        };
      }

      // Lite Mode: Tailored light payload, excludes read-status checks and target trees
      if (isLite) {
        const liteNotices = await prisma.notice.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            content: true,
            priority: true,
            publishedAt: true,
            author: {
              select: {
                username: true,
                staff: { select: { fullName: true, designation: true } },
              },
            },
          },
          orderBy: { publishedAt: 'desc' },
          take: limit || 10,
        });

        const formatted = liteNotices.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          priority: n.priority,
          publishedAt: n.publishedAt,
          authorName: n.author.staff?.fullName || n.author.username,
          authorRole: n.author.staff?.designation || 'Administration',
          isRead: false,
        }));

        res.json({
          success: true,
          data: formatted,
        });
        return;
      }

      // Standard Portal Mode: With read tracking and full targets list
      const notices = await prisma.notice.findMany({
        where: whereClause,
        include: {
          targets: true,
          author: { select: { username: true, staff: { select: { fullName: true, designation: true } } } },
          reads: { where: { userId: user.id } },
        },
        orderBy: { publishedAt: 'desc' },
        ...(limit ? { take: limit } : {}),
      });

      const formatted = notices.map((n) => ({
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
