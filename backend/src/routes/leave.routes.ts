import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { RequestService } from '../services/request.service';
import { NotificationService } from '../services/notification.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

const createLeaveSchema = z.object({
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid start date is required'),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid end date is required'),
  reason: z.string().min(5, 'Reason is required'),
  emergencyContact: z.string().min(5, 'Emergency contact information is required'),
  parentConsent: z.boolean().default(false),
});

// POST /api/leaves - Student applies for leave
router.post(
  '/',
  authenticate,
  requirePermission('leave.create'),
  validateBody(createLeaveSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, reason, emergencyContact, parentConsent } = req.body;

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        throw new AppError('End date must be after start date', 400);
      }

      // Create base request via Request Engine
      const request = await RequestService.createRequest(
        {
          requesterId: req.user!.id,
          requestTypeCode: 'LEAVE',
          title: `Hostel Leave (${start.toLocaleDateString()} to ${end.toLocaleDateString()})`,
          description: reason,
          location: req.user!.hostelBlock || 'Hostel',
          priority: 'NORMAL',
          initialStatus: 'PENDING_APPROVAL',
        },
        req.user!.id
      );

      const leave = await prisma.leaveRequest.create({
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
      const warden = await prisma.staff.findFirst({
        where: { department: 'Hostel', specialization: 'WARDEN' },
      });

      if (warden) {
        await NotificationService.send({
          userId: warden.userId,
          title: `New Leave Application: ${request.requestNumber}`,
          message: `${req.user!.fullName || req.user!.username} requested leave from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`,
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
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/leaves/pending - Warden review
router.get(
  '/pending',
  authenticate,
  requirePermission('leave.approve'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pending = await prisma.leaveRequest.findMany({
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
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/leaves/my - Student list
router.get(
  '/my',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leaves = await prisma.leaveRequest.findMany({
        where: {
          request: { requesterId: req.user!.id },
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
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/leaves/:id/approve - Warden approves leave
router.post(
  '/:id/approve',
  authenticate,
  requirePermission('leave.approve'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const leave = await prisma.leaveRequest.findUnique({
        where: { id },
        include: { request: true },
      });

      if (!leave) {
        throw new AppError('Leave application not found', 404);
      }

      const updated = await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: 'APPROVED',
          approvedBy: req.user!.id,
          approvedAt: new Date(),
        },
      });

      await RequestService.transitionStatus(
        leave.requestId,
        'APPROVED',
        req.user!.id,
        'Hostel leave approved by Warden'
      );

      await NotificationService.send({
        userId: leave.request.requesterId,
        title: 'Hostel Leave Approved',
        message: `Your leave request (${leave.request.requestNumber}) has been approved by Warden.`,
        type: 'SUCCESS',
        referenceType: 'LEAVE',
        referenceId: leave.requestId,
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'LEAVE_APPROVED',
        entityType: 'LEAVE',
        entityId: leave.id,
      });

      res.json({
        success: true,
        message: 'Leave approved successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/leaves/:id/reject - Warden rejects leave
router.post(
  '/:id/reject',
  authenticate,
  requirePermission('leave.reject'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { reason } = req.body;
      const leave = await prisma.leaveRequest.findUnique({
        where: { id },
        include: { request: true },
      });

      if (!leave) {
        throw new AppError('Leave application not found', 404);
      }

      const updated = await prisma.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: 'REJECTED',
          approvedBy: req.user!.id,
          approvedAt: new Date(),
        },
      });

      await RequestService.transitionStatus(
        leave.requestId,
        'REJECTED',
        req.user!.id,
        `Leave rejected: ${reason || 'Application not approved'}`
      );

      await NotificationService.send({
        userId: leave.request.requesterId,
        title: 'Hostel Leave Rejected',
        message: `Your leave application was rejected: ${reason || 'Application not approved by Warden.'}`,
        type: 'ALERT',
        referenceType: 'LEAVE',
        referenceId: leave.requestId,
      });

      await AuditService.log({
        actorId: req.user!.id,
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
    } catch (err) {
      next(err);
    }
  }
);

export default router;
