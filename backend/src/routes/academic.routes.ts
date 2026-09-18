import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// GET /api/academic/dashboard - Academic Officer Command Center & Request Queue
router.get(
  '/dashboard',
  authenticate,
  requirePermission('bonafide.approve'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Metrics strictly scoped to Academic / Certificate workflows
      const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
        prisma.request.count({
          where: {
            requestType: { code: 'BONAFIDE' },
            status: 'PENDING_APPROVAL',
          },
        }),
        prisma.request.count({
          where: {
            requestType: { code: 'BONAFIDE' },
            status: 'APPROVED',
          },
        }),
        prisma.request.count({
          where: {
            requestType: { code: 'BONAFIDE' },
            status: 'REJECTED',
          },
        }),
        prisma.request.count({
          where: {
            requestType: { code: 'BONAFIDE' },
          },
        }),
      ]);

      // 2. Pending Bonafide / Certificate Requests
      const pendingRequests = await prisma.bonafideRequest.findMany({
        where: {
          certificateId: null,
          request: { status: 'PENDING_APPROVAL' },
        },
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

      // 3. Recently Approved Requests
      const recentlyApproved = await prisma.bonafideRequest.findMany({
        where: {
          certificateId: { not: null },
          request: { status: 'APPROVED' },
        },
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
        orderBy: { generatedAt: 'desc' },
        take: 10,
      });

      // 4. Recently Rejected Requests
      const recentlyRejected = await prisma.bonafideRequest.findMany({
        where: {
          request: { status: 'REJECTED' },
        },
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
              statusHistory: {
                where: { newStatus: 'REJECTED' },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json({
        success: true,
        data: {
          metrics: {
            pendingApprovals: pendingCount,
            approvedCount,
            rejectedCount,
            totalRequests: totalCount,
          },
          pendingRequests,
          recentlyApproved,
          recentlyRejected,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
