import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { RequestService } from '../services/request.service';
import { RoutingService } from '../services/routing.service';
import { NotificationService } from '../services/notification.service';
import { SlaService } from '../services/sla.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// Zod Schemas
const createComplaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  location: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  category: z.string().optional(),
  photoUrl: z.string().optional(),
});

const resolveSchema = z.object({
  resolutionNotes: z.string().min(3, 'Resolution notes are required'),
});

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

// POST /api/complaints - Student creates complaint
router.post(
  '/',
  authenticate,
  requirePermission('requests.create'),
  validateBody(createComplaintSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description, priority, location, photoUrl } = req.body;

      // 1. Automatic Deterministic Keyword Routing
      const route = await RoutingService.routeComplaint(title, description);

      const finalLocation =
        location ||
        (req.user!.hostelBlock && req.user!.roomNumber
          ? `${req.user!.hostelBlock} / Room ${req.user!.roomNumber}`
          : 'Campus Hostel');

      // 2. Create base request via Request Engine
      const initialStatus = route.assignedStaffUserId ? 'ASSIGNED' : 'ROUTED';

      const request = await RequestService.createRequest(
        {
          requesterId: req.user!.id,
          requestTypeCode: 'COMPLAINT',
          title,
          description,
          location: finalLocation,
          priority,
          category: route.category,
          assignedTo: route.assignedStaffUserId,
          initialStatus,
        },
        req.user!.id
      );

      // 3. Create complaint details record
      const complaint = await prisma.complaint.create({
        data: {
          requestId: request.id,
          category: route.category,
          issueType: route.specialization,
          photoUrl,
        },
      });

      // 4. Notify assigned staff if assigned
      if (route.assignedStaffUserId) {
        await NotificationService.send({
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
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/complaints/assigned - Staff view assigned complaints
router.get(
  '/assigned',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;

      const requests = await prisma.request.findMany({
        where: {
          assignedTo: req.user!.id,
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

async function getFullComplaintTask(requestId: string) {
  const fullRequest = await prisma.request.findUnique({
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
    },
  });

  if (!fullRequest) return null;

  const timeline = await RequestService.getRequestTimeline(requestId);
  const sla = SlaService.computeSla(fullRequest);

  return {
    ...fullRequest,
    timeline,
    sla,
  };
}

// POST /api/complaints/:id/accept - Staff accepts complaint
router.post(
  '/:id/accept',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = String(req.params.id);
      const request = await prisma.request.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new AppError('Complaint not found', 404);
      }

      if (request.status === 'CANCELLED') {
        throw new AppError('Cannot accept a cancelled complaint', 422);
      }

      if (request.assignedTo !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('You are not assigned to this complaint', 403);
      }

      // Transition to ACCEPTED
      const updated = await RequestService.transitionStatus(
        requestId,
        'ACCEPTED',
        req.user!.id,
        'Staff accepted task assignment'
      );

      // Record acceptedAt in requestAssignment
      await prisma.requestAssignment.updateMany({
        where: { requestId, assignedTo: req.user!.id },
        data: { acceptedAt: new Date() },
      });

      const fullTask = await getFullComplaintTask(requestId);

      res.json({
        success: true,
        message: 'Complaint accepted successfully',
        data: fullTask || updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/complaints/:id/start - Staff starts work
router.post(
  '/:id/start',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = String(req.params.id);
      const request = await prisma.request.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new AppError('Complaint not found', 404);
      }

      if (request.status === 'CANCELLED') {
        throw new AppError('Cannot start work on a cancelled complaint', 422);
      }

      if (request.assignedTo !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('You are not assigned to this complaint', 403);
      }

      const updated = await RequestService.transitionStatus(
        requestId,
        'IN_PROGRESS',
        req.user!.id,
        'Staff has started on-site maintenance work'
      );

      const fullTask = await getFullComplaintTask(requestId);

      res.json({
        success: true,
        message: 'Work status marked as in progress',
        data: fullTask || updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/complaints/:id/resolve - Staff resolves complaint
router.post(
  '/:id/resolve',
  authenticate,
  validateBody(resolveSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = String(req.params.id);
      const { resolutionNotes } = req.body;

      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: { complaint: true },
      });

      if (!request) {
        throw new AppError('Complaint not found', 404);
      }

      if (request.status === 'CANCELLED') {
        throw new AppError('Cannot resolve a cancelled complaint', 422);
      }

      if (request.assignedTo !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('You are not assigned to this complaint', 403);
      }

      // Update resolution notes
      if (request.complaint) {
        await prisma.complaint.update({
          where: { id: request.complaint.id },
          data: { resolutionNotes },
        });
      }

      // Record completedAt in assignment
      await prisma.requestAssignment.updateMany({
        where: { requestId, assignedTo: req.user!.id },
        data: { completedAt: new Date() },
      });

      // Transition to RESOLVED
      const updated = await RequestService.transitionStatus(
        requestId,
        'RESOLVED',
        req.user!.id,
        `Resolved with notes: ${resolutionNotes}`
      );

      const fullTask = await getFullComplaintTask(requestId);

      res.json({
        success: true,
        message: 'Complaint marked as resolved',
        data: fullTask || updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/complaints/:id/confirm - Student confirms resolution
router.post(
  '/:id/confirm',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = String(req.params.id);
      const request = await prisma.request.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new AppError('Complaint not found', 404);
      }

      if (request.requesterId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('Only the requester can confirm complaint resolution', 403);
      }

      const updated = await RequestService.transitionStatus(
        requestId,
        'CONFIRMED',
        req.user!.id,
        'Student confirmed resolution of issue'
      );

      if (request.assignedTo) {
        await NotificationService.send({
          userId: request.assignedTo,
          title: 'Work Order Confirmed',
          message: `Student confirmed resolution for ticket ${request.requestNumber}.`,
          type: 'SUCCESS',
          referenceType: 'COMPLAINT',
          referenceId: request.id,
        });
      }

      res.json({
        success: true,
        message: 'Complaint resolution confirmed',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/complaints/:id/rating - Student rates the resolution
router.post(
  '/:id/rating',
  authenticate,
  validateBody(ratingSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = String(req.params.id);
      const { rating, feedback } = req.body;

      const request = await prisma.request.findUnique({
        where: { id: requestId },
        include: { complaint: true },
      });

      if (!request || !request.complaint) {
        throw new AppError('Complaint not found', 404);
      }

      if (request.requesterId !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new AppError('Only the requester can rate this complaint', 403);
      }

      const updatedComplaint = await prisma.complaint.update({
        where: { id: request.complaint.id },
        data: {
          studentRating: rating,
          studentFeedback: feedback,
        },
      });

      if (request.status === 'CONFIRMED' || request.status === 'RESOLVED') {
        await RequestService.transitionStatus(
          requestId,
          'CLOSED',
          req.user!.id,
          `Student rated ${rating}/5 stars: "${feedback || 'No feedback'}"`
        );
      }

      if (request.assignedTo) {
        await NotificationService.send({
          userId: request.assignedTo,
          title: 'Service Rating Received',
          message: `Student rated your service ${rating}/5 stars on ticket ${request.requestNumber}.`,
          type: 'INFO',
          referenceType: 'COMPLAINT',
          referenceId: request.id,
        });
      }

      res.json({
        success: true,
        message: 'Rating and feedback submitted successfully',
        data: updatedComplaint,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/complaints/:id/cancel - Student cancels their complaint
router.post(
  '/:id/cancel',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const complaint = await prisma.complaint.findFirst({
        where: { OR: [{ id }, { requestId: id }] },
      });
      const targetRequestId = complaint ? complaint.requestId : id;

      const updated = await RequestService.cancelRequest(
        targetRequestId,
        req.user!.id,
        req.body?.reason
      );

      res.json({
        success: true,
        message: 'Complaint cancelled successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
