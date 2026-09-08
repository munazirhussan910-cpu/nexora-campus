import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { RequestService } from '../services/request.service';
import { RoutingService } from '../services/routing.service';
import { QrService } from '../services/qr.service';
import { SlaService } from '../services/sla.service';

const router = Router();

// GET /api/kiosk/student/:rollNumber
router.get(
  '/student/:rollNumber',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rollNumber = String(req.params.rollNumber);

      const student = await prisma.student.findUnique({
        where: { rollNumber },
        include: {
          branch: true,
          hostelRoom: { include: { hostelBlock: true } },
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      if (!student) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: `No student record found with Roll Number ${rollNumber}`,
          },
        });
        return;
      }

      // Fetch active requests for this student
      const recentRequests = await prisma.request.findMany({
        where: { requesterId: student.userId },
        include: {
          requestType: true,
          complaint: true,
          gatePass: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      res.json({
        success: true,
        data: {
          student: {
            id: student.id,
            userId: student.userId,
            rollNumber: student.rollNumber,
            fullName: student.fullName,
            branch: student.branch.name,
            year: student.year,
            hostelBlock: student.hostelRoom?.hostelBlock.name,
            roomNumber: student.hostelRoom?.roomNumber,
          },
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

// POST /api/kiosk/requests
const kioskRequestSchema = z.object({
  rollNumber: z.string().min(1),
  type: z.enum(['COMPLAINT', 'GATE_PASS', 'BONAFIDE', 'LEAVE']),
  title: z.string().min(3),
  description: z.string().min(5),
  location: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  extraData: z.record(z.any()).optional(),
});

router.post(
  '/requests',
  validateBody(kioskRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rollNumber, type, title, description, location, priority, extraData } = req.body;

      const student = await prisma.student.findUnique({
        where: { rollNumber },
        include: { hostelRoom: { include: { hostelBlock: true } } },
      });

      if (!student) {
        throw new AppError(`Student with roll number ${rollNumber} not found`, 404);
      }

      const finalLocation =
        location ||
        (student.hostelRoom
          ? `${student.hostelRoom.hostelBlock.name} / Room ${student.hostelRoom.roomNumber}`
          : 'Campus Hostel');

      if (type === 'COMPLAINT') {
        const route = await RoutingService.routeComplaint(title, description);
        const reqRecord = await RequestService.createRequest(
          {
            requesterId: student.userId,
            requestTypeCode: 'COMPLAINT',
            title,
            description,
            location: finalLocation,
            priority,
            category: route.category,
            assignedTo: route.assignedStaffUserId,
            initialStatus: route.assignedStaffUserId ? 'ASSIGNED' : 'ROUTED',
          },
          student.userId
        );

        await prisma.complaint.create({
          data: {
            requestId: reqRecord.id,
            category: route.category,
            issueType: route.specialization,
          },
        });

        res.status(201).json({
          success: true,
          message: `Complaint registered at Kiosk. Request: ${reqRecord.requestNumber}`,
          data: reqRecord,
        });
        return;
      }

      if (type === 'GATE_PASS') {
        const passPin = QrService.generatePin();
        const reqRecord = await RequestService.createRequest(
          {
            requesterId: student.userId,
            requestTypeCode: 'GATE_PASS',
            title: title || `Gate Pass (${extraData?.destination || 'City'})`,
            description,
            location: finalLocation,
            priority: 'NORMAL',
            initialStatus: 'PENDING_APPROVAL',
          },
          student.userId
        );

        const departureTime = extraData?.departureTime ? new Date(extraData.departureTime) : new Date();
        const expectedReturnTime = extraData?.expectedReturnTime
          ? new Date(extraData.expectedReturnTime)
          : new Date(Date.now() + 4 * 60 * 60 * 1000);

        await prisma.gatePass.create({
          data: {
            requestId: reqRecord.id,
            destination: extraData?.destination || 'Market',
            reason: description,
            departureTime,
            expectedReturnTime,
            passPin,
            gateStatus: 'PENDING_APPROVAL',
          },
        });

        res.status(201).json({
          success: true,
          message: `Gate pass registered at Kiosk. Request: ${reqRecord.requestNumber}. PIN: ${passPin}`,
          data: reqRecord,
        });
        return;
      }

      // Default generic kiosk request
      const reqRecord = await RequestService.createRequest(
        {
          requesterId: student.userId,
          requestTypeCode: type,
          title,
          description,
          location: finalLocation,
          priority,
        },
        student.userId
      );

      res.status(201).json({
        success: true,
        message: `Request registered at Kiosk: ${reqRecord.requestNumber}`,
        data: reqRecord,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
