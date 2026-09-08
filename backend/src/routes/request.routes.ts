import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { RequestService } from '../services/request.service';
import { SlaService } from '../services/sla.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// GET /api/requests/my
router.get(
  '/my',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, type } = req.query;

      const requests = await prisma.request.findMany({
        where: {
          requesterId: req.user!.id,
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
        sla: SlaService.computeSla(r),
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

// GET /api/requests (All requests for Admin / Warden)
router.get(
  '/',
  authenticate,
  requirePermission('requests.view.all'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, priority, type, search, hostel, category } = req.query;

      const whereClause: any = {};

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

      const requests = await prisma.request.findMany({
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
        sla: SlaService.computeSla(r),
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

// GET /api/requests/:id
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = String(req.params.id);
      const request = await prisma.request.findUnique({
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
      const isOwner = request.requesterId === req.user!.id;
      const isAssigned = request.assignedTo === req.user!.id;
      const canViewAll = req.user!.permissions.includes('requests.view.all') || req.user!.role === 'ADMIN';

      if (!isOwner && !isAssigned && !canViewAll) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Unauthorized to view this request' },
        });
        return;
      }

      const timeline = await RequestService.getRequestTimeline(request.id);
      const sla = SlaService.computeSla(request);

      res.json({
        success: true,
        data: {
          ...request,
          timeline,
          sla,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/requests/:id/status
const updateStatusSchema = z.object({
  status: z.string().min(1),
  comment: z.string().optional(),
});

router.patch(
  '/:id/status',
  authenticate,
  validateBody(updateStatusSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, comment } = req.body;
      const updated = await RequestService.transitionStatus(
        String(req.params.id),
        status,
        req.user!.id,
        comment
      );

      res.json({
        success: true,
        message: `Request status transitioned to ${status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/requests/:id/reassign
const reassignSchema = z.object({
  staffUserId: z.string().min(1),
  comment: z.string().optional(),
});

router.post(
  '/:id/reassign',
  authenticate,
  requirePermission('requests.reassign'),
  validateBody(reassignSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { staffUserId, comment } = req.body;
      const updated = await RequestService.reassignRequest(
        String(req.params.id),
        staffUserId,
        req.user!.id,
        comment
      );

      res.json({
        success: true,
        message: 'Request reassigned successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
