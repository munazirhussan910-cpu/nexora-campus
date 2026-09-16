import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { EmergencyService } from '../services/emergency.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

const triggerSosSchema = z.object({
  distressType: z.enum(['MEDICAL', 'SECURITY', 'FIRE', 'HARASSMENT', 'GENERAL']).default('GENERAL'),
  description: z.string().optional(),
  location: z.string().optional(),
});

const acknowledgeSosSchema = z.object({
  responderName: z.string().optional(),
});

const resolveSosSchema = z.object({
  resolutionNotes: z.string().min(2, 'Resolution notes are required'),
  resolverName: z.string().optional(),
});

// POST /api/emergency/trigger - Student triggers emergency SOS
router.post(
  '/trigger',
  authenticate,
  validateBody(triggerSosSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { distressType, description, location } = req.body;

      // Fetch student details if available
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          hostelRoom: { include: { hostelBlock: true } },
        },
      });

      const studentName = student?.fullName || user.fullName || user.username;
      const rollNumber = student?.rollNumber || 'STUDENT';
      const phone = student?.phone || user.email;
      const hostelBlock = student?.hostelRoom?.hostelBlock?.name || user.hostelBlock || (location ? location.split('/')[0]?.trim() : 'Campus Hostel');
      const roomNumber = student?.hostelRoom?.roomNumber || user.roomNumber || (location ? location.split('/')[1]?.trim() : 'Room Area');

      const alert = await EmergencyService.trigger({
        userId: user.id,
        studentName,
        rollNumber,
        hostelBlock,
        roomNumber,
        phone,
        distressType,
        description,
      });

      res.status(201).json({
        success: true,
        message: '🚨 Emergency SOS broadcasted immediately! Security & medical teams have been alerted.',
        data: alert,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/emergency/active - Security / Warden gets active alerts
router.get(
  '/active',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const active = EmergencyService.getActive();
      res.json({
        success: true,
        data: active,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/emergency/all - Full incident history
router.get(
  '/all',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const all = EmergencyService.getAll();
      res.json({
        success: true,
        data: all,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/emergency/:id/acknowledge - Security acknowledges SOS
router.post(
  '/:id/acknowledge',
  authenticate,
  validateBody(acknowledgeSosSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const responderName = req.body.responderName || req.user!.fullName || req.user!.username;
      const alert = await EmergencyService.acknowledge(id, responderName, req.user!.id);

      if (!alert) {
        throw new AppError('Emergency alert not found or already closed', 404);
      }

      res.json({
        success: true,
        message: `Emergency acknowledged by ${responderName}. Response squad dispatched.`,
        data: alert,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/emergency/:id/resolve - Security / Warden marks resolved
router.post(
  '/:id/resolve',
  authenticate,
  validateBody(resolveSosSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { resolutionNotes } = req.body;
      const resolverName = req.body.resolverName || req.user!.fullName || req.user!.username;
      const alert = await EmergencyService.resolve(id, resolverName, resolutionNotes, req.user!.id);

      if (!alert) {
        throw new AppError('Emergency alert not found', 404);
      }

      res.json({
        success: true,
        message: 'Emergency alert marked resolved.',
        data: alert,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
