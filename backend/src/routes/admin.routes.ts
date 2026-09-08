import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { SlaService } from '../services/sla.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// GET /api/admin/dashboard - Command Center Metrics
router.get(
  '/dashboard',
  authenticate,
  requirePermission('analytics.view'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Total & Open Requests
      const totalRequests = await prisma.request.count();
      const openRequests = await prisma.request.count({
        where: {
          status: {
            in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_APPROVAL'],
          },
        },
      });

      // 2. Overdue Requests
      const overdueRequests = await prisma.request.count({
        where: {
          status: {
            in: ['SUBMITTED', 'ROUTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_APPROVAL'],
          },
          dueAt: { lt: now },
        },
      });

      // 3. Pending Approvals
      const pendingApprovals = await prisma.request.count({
        where: { status: 'PENDING_APPROVAL' },
      });

      // 4. Resolved Today
      const resolvedToday = await prisma.request.count({
        where: {
          status: { in: ['RESOLVED', 'CONFIRMED', 'CLOSED'] },
          completedAt: { gte: startOfDay },
        },
      });

      // 5. Active Staff Count
      const activeStaff = await prisma.staff.count({
        where: { user: { isActive: true } },
      });

      // 6. Category breakdown
      const complaints = await prisma.complaint.groupBy({
        by: ['category'],
        _count: { category: true },
      });

      // 7. Recent Requests for Live Stream
      const recentRequests = await prisma.request.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          requestType: true,
          requester: {
            select: {
              username: true,
              student: { select: { fullName: true } },
            },
          },
          assignedStaff: {
            select: {
              staff: { select: { fullName: true, specialization: true } },
            },
          },
        },
      });

      // 8. Recurring Issues
      const recurringIssues = await getRecurringIssuesInternal();

      res.json({
        success: true,
        data: {
          metrics: {
            totalRequests,
            openRequests,
            overdueRequests,
            pendingApprovals,
            resolvedToday,
            activeStaff,
            recurringIssueCount: recurringIssues.length,
          },
          categoryBreakdown: complaints.map((c) => ({
            category: c.category,
            count: c._count.category,
          })),
          recurringIssues,
          recentRequests: recentRequests.map((r) => ({
            ...r,
            sla: SlaService.computeSla(r),
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/sla - SLA Deep-Dive & Ageing Breakdown
router.get(
  '/sla',
  authenticate,
  requirePermission('analytics.view'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = await SlaService.getCampusSlaMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Internal helper for Section 44 Recurring Issue Detection
async function getRecurringIssuesInternal() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Fetch complaints from last 14 days
  const recentComplaints = await prisma.complaint.findMany({
    where: {
      createdAt: { gte: fourteenDaysAgo },
    },
    include: {
      request: {
        include: {
          requester: {
            include: {
              student: {
                include: {
                  hostelRoom: {
                    include: { hostelBlock: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Group by Hostel Block + Category
  const clusters: Record<string, { hostelBlock: string; category: string; count: number; sampleRoom: string }> = {};

  for (const c of recentComplaints) {
    const blockName =
      c.request.requester.student?.hostelRoom?.hostelBlock.name ||
      (c.request.location && c.request.location.includes('Block')
        ? c.request.location.split('/')[0].trim()
        : 'Campus Block');

    const key = `${blockName}:${c.category}`;
    if (!clusters[key]) {
      clusters[key] = {
        hostelBlock: blockName,
        category: c.category,
        count: 0,
        sampleRoom: c.request.location || 'Hostel Room',
      };
    }
    clusters[key].count++;
  }

  // Filter clusters with >= 3 complaints in 14 days
  const detectedIssues = Object.values(clusters)
    .filter((c) => c.count >= 3)
    .map((c) => ({
      hostelBlock: c.hostelBlock,
      category: c.category,
      complaintCount: c.count,
      periodDays: 14,
      sampleLocation: c.sampleRoom,
      severity: c.count >= 5 ? 'CRITICAL' : 'HIGH',
      recommendation: `Conduct systematic inspection of ${c.hostelBlock} ${c.category.toLowerCase()} infrastructure. Multiple recurring failures detected.`,
    }));

  return detectedIssues;
}

// GET /api/admin/recurring-issues - Section 44
router.get(
  '/recurring-issues',
  authenticate,
  requirePermission('analytics.view'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const issues = await getRecurringIssuesInternal();
      res.json({
        success: true,
        data: issues,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/staff - Staff directory & workloads
router.get(
  '/staff',
  authenticate,
  requirePermission('staff.manage'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staffList = await prisma.staff.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              isActive: true,
              role: { select: { name: true } },
            },
          },
        },
        orderBy: { fullName: 'asc' },
      });

      // Count active assigned tasks for each staff
      const staffWithWorkload = await Promise.all(
        staffList.map(async (s) => {
          const activeTasks = await prisma.request.count({
            where: {
              assignedTo: s.userId,
              status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
            },
          });
          const completedTasks = await prisma.request.count({
            where: {
              assignedTo: s.userId,
              status: { in: ['RESOLVED', 'CONFIRMED', 'CLOSED'] },
            },
          });

          return {
            ...s,
            activeTasks,
            completedTasks,
          };
        })
      );

      res.json({
        success: true,
        data: staffWithWorkload,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/audit-logs
router.get(
  '/audit-logs',
  authenticate,
  requirePermission('audit.view'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, offset, entityType, action } = req.query;
      const logs = await AuditService.getLogs(
        limit ? parseInt(String(limit), 10) : 50,
        offset ? parseInt(String(offset), 10) : 0,
        entityType ? String(entityType) : undefined,
        action ? String(action) : undefined
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/students - Student roster
router.get(
  '/students',
  authenticate,
  requirePermission('students.manage'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const students = await prisma.student.findMany({
        include: {
          branch: true,
          hostelRoom: {
            include: { hostelBlock: true },
          },
          user: {
            select: { id: true, username: true, email: true, isActive: true },
          },
        },
        orderBy: { rollNumber: 'asc' },
        take: 100,
      });

      res.json({
        success: true,
        data: students,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
