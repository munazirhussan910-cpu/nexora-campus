import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { RequestService } from '../services/request.service';
import { QrService } from '../services/qr.service';
import { NotificationService } from '../services/notification.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

const createGatePassSchema = z.object({
  destination: z.string().min(2, 'Destination is required'),
  reason: z.string().min(5, 'Reason is required'),
  departureTime: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid departure date/time is required'),
  expectedReturnTime: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid return date/time is required'),
});

const verifySchema = z.object({
  tokenOrPin: z.string().min(1, 'QR Token or PIN is required'),
});

const actionNoteSchema = z.object({
  notes: z.string().optional(),
  verificationMethod: z.enum(['QR', 'PIN']).default('QR'),
});

// POST /api/gate-passes - Student creates gate pass
router.post(
  '/',
  authenticate,
  requirePermission('gatepass.create'),
  validateBody(createGatePassSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { destination, reason, departureTime, expectedReturnTime } = req.body;

      const departureDate = new Date(departureTime);
      const returnDate = new Date(expectedReturnTime);

      if (returnDate <= departureDate) {
        throw new AppError('Expected return time must be after departure time', 400);
      }

      // Generate 4-digit PIN upfront
      const passPin = QrService.generatePin();

      // Create base request via Request Engine
      const request = await RequestService.createRequest(
        {
          requesterId: req.user!.id,
          requestTypeCode: 'GATE_PASS',
          title: `Gate Pass to ${destination}`,
          description: reason,
          location: req.user!.hostelBlock || 'Hostel',
          priority: 'NORMAL',
          initialStatus: 'PENDING_APPROVAL',
        },
        req.user!.id
      );

      // Create gate pass record
      const gatePass = await prisma.gatePass.create({
        data: {
          requestId: request.id,
          destination,
          reason,
          departureTime: departureDate,
          expectedReturnTime: returnDate,
          passPin,
          gateStatus: 'PENDING_APPROVAL',
        },
      });

      // Find Warden of student's hostel block to notify
      const wardenStaff = await prisma.staff.findFirst({
        where: {
          department: 'Hostel',
          specialization: 'WARDEN',
        },
      });

      if (wardenStaff) {
        await NotificationService.send({
          userId: wardenStaff.userId,
          title: `New Gate Pass Application: ${request.requestNumber}`,
          message: `${req.user!.fullName || req.user!.username} requested gate pass to ${destination}.`,
          type: 'INFO',
          referenceType: 'GATE_PASS',
          referenceId: request.id,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Gate pass application submitted for warden approval',
        data: {
          ...request,
          gatePass,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/gate-passes/pending - Warden review
router.get(
  '/pending',
  authenticate,
  requirePermission('gatepass.approve'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pendingPasses = await prisma.gatePass.findMany({
        where: { gateStatus: 'PENDING_APPROVAL' },
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
        data: pendingPasses,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/gate-passes/my - Student list
router.get(
  '/my',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const myPasses = await prisma.gatePass.findMany({
        where: {
          request: { requesterId: req.user!.id },
        },
        include: {
          request: true,
          approver: {
            select: {
              staff: { select: { fullName: true, designation: true } },
            },
          },
          events: { orderBy: { eventTime: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: myPasses,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/gate-passes/:id/approve - Warden approves gate pass
router.post(
  '/:id/approve',
  authenticate,
  requirePermission('gatepass.approve'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const gatePass = await prisma.gatePass.findUnique({
        where: { id },
        include: {
          request: {
            include: {
              requester: {
                include: { student: true },
              },
            },
          },
        },
      });

      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }

      if (gatePass.gateStatus !== 'PENDING_APPROVAL') {
        throw new AppError(`Cannot approve gate pass with status: ${gatePass.gateStatus}`, 422);
      }

      const rollNumber = gatePass.request.requester.student?.rollNumber || 'STUDENT';
      const qrExpiresAt = new Date(gatePass.expectedReturnTime.getTime() + 4 * 60 * 60 * 1000); // 4 hour grace period
      const qrTokenHash = QrService.generateSignedQrToken(gatePass.id, rollNumber, qrExpiresAt);

      // Update gate pass
      const updatedGatePass = await prisma.gatePass.update({
        where: { id: gatePass.id },
        data: {
          gateStatus: 'APPROVED',
          approvedBy: req.user!.id,
          approvedAt: new Date(),
          qrTokenHash,
          qrExpiresAt,
        },
      });

      // Update Request status
      await RequestService.transitionStatus(
        gatePass.requestId,
        'APPROVED',
        req.user!.id,
        `Approved by Warden. QR token and PIN ${gatePass.passPin} issued.`
      );

      // Notify student
      await NotificationService.send({
        userId: gatePass.request.requesterId,
        title: 'Gate Pass Approved!',
        message: `Your gate pass to ${gatePass.destination} has been approved. PIN: ${gatePass.passPin}.`,
        type: 'SUCCESS',
        referenceType: 'GATE_PASS',
        referenceId: gatePass.requestId,
      });

      // Audit Log
      await AuditService.log({
        actorId: req.user!.id,
        action: 'GATE_PASS_APPROVED',
        entityType: 'GATE_PASS',
        entityId: gatePass.id,
        newValues: {
          passNumber: gatePass.request.requestNumber,
          pin: gatePass.passPin,
          expiresAt: qrExpiresAt,
        },
      });

      res.json({
        success: true,
        message: 'Gate pass approved successfully',
        data: updatedGatePass,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/gate-passes/:id/reject - Warden rejects gate pass
router.post(
  '/:id/reject',
  authenticate,
  requirePermission('gatepass.reject'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { reason } = req.body;
      const gatePass = await prisma.gatePass.findUnique({
        where: { id },
        include: { request: true },
      });

      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }

      const updatedGatePass = await prisma.gatePass.update({
        where: { id: gatePass.id },
        data: {
          gateStatus: 'REJECTED',
          approvedBy: req.user!.id,
          approvedAt: new Date(),
        },
      });

      await RequestService.transitionStatus(
        gatePass.requestId,
        'REJECTED',
        req.user!.id,
        `Rejected by Warden: ${reason || 'Application not approved'}`
      );

      await NotificationService.send({
        userId: gatePass.request.requesterId,
        title: 'Gate Pass Rejected',
        message: `Your gate pass application was rejected. Reason: ${reason || 'Application rejected by Warden.'}`,
        type: 'ALERT',
        referenceType: 'GATE_PASS',
        referenceId: gatePass.requestId,
      });

      res.json({
        success: true,
        message: 'Gate pass rejected',
        data: updatedGatePass,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/gate-passes/verify - Security officer verifies QR or PIN
router.post(
  '/verify',
  authenticate,
  requirePermission('gatepass.verify'),
  validateBody(verifySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tokenOrPin } = req.body;
      const result = await QrService.verifyGatePass(tokenOrPin);

      if (result.gatePass) {
        await AuditService.log({
          actorId: req.user!.id,
          action: 'GATE_PASS_VERIFIED',
          entityType: 'GATE_PASS',
          entityId: result.gatePass.id,
          newValues: { result: result.status, message: result.message },
        });
      }

      res.json({
        success: result.valid,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/gate-passes/:id/depart - Security marks student departed
router.post(
  '/:id/depart',
  authenticate,
  requirePermission('gatepass.verify'),
  validateBody(actionNoteSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { notes, verificationMethod } = req.body;
      const gatePass = await prisma.gatePass.findUnique({
        where: { id },
        include: { request: true },
      });

      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }

      if (gatePass.gateStatus !== 'APPROVED') {
        throw new AppError(`Cannot mark departed. Current status is ${gatePass.gateStatus}`, 422);
      }

      const now = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        const gp = await tx.gatePass.update({
          where: { id: gatePass.id },
          data: {
            gateStatus: 'DEPARTED',
            departedAt: now,
          },
        });

        // Record Gate Event
        await tx.gateEvent.create({
          data: {
            gatePassId: gatePass.id,
            eventType: 'DEPARTED',
            verifiedBy: req.user!.id,
            eventTime: now,
            verificationMethod,
            notes,
          },
        });

        // Update Request status
        await tx.request.update({
          where: { id: gatePass.requestId },
          data: { status: 'DEPARTED' },
        });

        await tx.requestStatusHistory.create({
          data: {
            requestId: gatePass.requestId,
            oldStatus: 'APPROVED',
            newStatus: 'DEPARTED',
            changedBy: req.user!.id,
            comment: `Student passed gate and departed at ${now.toLocaleTimeString()}`,
          },
        });

        return gp;
      });

      // Notify Student
      await NotificationService.send({
        userId: gatePass.request.requesterId,
        title: 'Gate Departure Recorded',
        message: `Departure logged at ${now.toLocaleTimeString()} by Main Gate Security. Safe travels!`,
        type: 'INFO',
        referenceType: 'GATE_PASS',
        referenceId: gatePass.requestId,
      });

      // Audit Log
      await AuditService.log({
        actorId: req.user!.id,
        action: 'GATE_DEPARTURE_LOGGED',
        entityType: 'GATE_PASS',
        entityId: gatePass.id,
        newValues: { departedAt: now, method: verificationMethod },
      });

      res.json({
        success: true,
        message: 'Student departure logged successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/gate-passes/:id/return - Security marks student returned
router.post(
  '/:id/return',
  authenticate,
  requirePermission('gatepass.verify'),
  validateBody(actionNoteSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { notes, verificationMethod } = req.body;
      const gatePass = await prisma.gatePass.findUnique({
        where: { id },
        include: { request: true },
      });

      if (!gatePass) {
        throw new AppError('Gate pass not found', 404);
      }

      if (gatePass.gateStatus !== 'DEPARTED') {
        throw new AppError(`Cannot mark returned. Current status is ${gatePass.gateStatus}`, 422);
      }

      const now = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        const gp = await tx.gatePass.update({
          where: { id: gatePass.id },
          data: {
            gateStatus: 'RETURNED',
            returnedAt: now,
          },
        });

        // Record Gate Event
        await tx.gateEvent.create({
          data: {
            gatePassId: gatePass.id,
            eventType: 'RETURNED',
            verifiedBy: req.user!.id,
            eventTime: now,
            verificationMethod,
            notes,
          },
        });

        // Update Request status
        await tx.request.update({
          where: { id: gatePass.requestId },
          data: {
            status: 'RETURNED',
            completedAt: now,
          },
        });

        await tx.requestStatusHistory.create({
          data: {
            requestId: gatePass.requestId,
            oldStatus: 'DEPARTED',
            newStatus: 'RETURNED',
            changedBy: req.user!.id,
            comment: `Student returned through main gate at ${now.toLocaleTimeString()}`,
          },
        });

        return gp;
      });

      await NotificationService.send({
        userId: gatePass.request.requesterId,
        title: 'Campus Return Logged',
        message: `Welcome back! Return registered at ${now.toLocaleTimeString()} by Main Gate Security.`,
        type: 'SUCCESS',
        referenceType: 'GATE_PASS',
        referenceId: gatePass.requestId,
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'GATE_RETURN_LOGGED',
        entityType: 'GATE_PASS',
        entityId: gatePass.id,
        newValues: { returnedAt: now, method: verificationMethod },
      });

      res.json({
        success: true,
        message: 'Student return logged successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
