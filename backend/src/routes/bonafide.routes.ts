import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { config } from '../config/env';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { RequestService } from '../services/request.service';
import { PdfService } from '../services/pdf.service';
import { NotificationService } from '../services/notification.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

const createBonafideSchema = z.object({
  purpose: z.string().min(2, 'Purpose is required'),
});

// POST /api/bonafide - Student requests bonafide certificate
router.post(
  '/',
  authenticate,
  requirePermission('bonafide.create'),
  validateBody(createBonafideSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { purpose } = req.body;

      // Create base request via Request Engine
      const request = await RequestService.createRequest(
        {
          requesterId: req.user!.id,
          requestTypeCode: 'BONAFIDE',
          title: `Bonafide Certificate Request (${purpose})`,
          description: `Application for official Bonafide Certificate required for: ${purpose}`,
          location: 'Academic Office',
          priority: 'NORMAL',
          initialStatus: 'PENDING_APPROVAL',
        },
        req.user!.id
      );

      // Create bonafide request record
      const bonafide = await prisma.bonafideRequest.create({
        data: {
          requestId: request.id,
          purpose,
        },
      });

      // Notify academic authority / admin
      const adminUsers = await prisma.user.findMany({
        where: { role: { name: 'ADMIN' } },
      });

      for (const a of adminUsers) {
        await NotificationService.send({
          userId: a.id,
          title: `Bonafide Certificate Requested: ${request.requestNumber}`,
          message: `Student ${req.user!.fullName || req.user!.username} requested Bonafide for "${purpose}".`,
          type: 'INFO',
          referenceType: 'BONAFIDE',
          referenceId: request.id,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Bonafide certificate request submitted successfully',
        data: {
          ...request,
          bonafide,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/bonafide/pending - Authority review
router.get(
  '/pending',
  authenticate,
  requirePermission('bonafide.approve'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pending = await prisma.bonafideRequest.findMany({
        where: { certificateId: null },
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

      res.json({
        success: true,
        data: pending,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/bonafide/my - Student list
router.get(
  '/my',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const myRequests = await prisma.bonafideRequest.findMany({
        where: {
          request: { requesterId: req.user!.id },
        },
        include: {
          request: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: myRequests,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/bonafide/:id/approve - Authority approves and generates PDF
router.post(
  '/:id/approve',
  authenticate,
  requirePermission('bonafide.approve'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const bonafide = await prisma.bonafideRequest.findUnique({
        where: { id },
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
      });

      if (!bonafide) {
        throw new AppError('Bonafide request not found', 404);
      }

      if (bonafide.certificateId) {
        throw new AppError('This certificate has already been issued', 409);
      }

      const student = bonafide.request.requester.student;
      if (!student) {
        throw new AppError('Requester does not have an active student profile', 400);
      }

      // Generate Certificate ID: e.g. NX-BON-2026-XXXXX
      const randomSeq = Math.floor(10000 + Math.random() * 90000);
      const certificateId = `NX-BON-2026-${randomSeq}`;
      const verificationToken = crypto.randomBytes(16).toString('hex');
      const verificationUrl = `${config.frontendUrl}/verify/${certificateId}`;
      const issueDate = new Date();

      // Dynamically Generate the PDF via PDFKit
      const fileUrl = await PdfService.generateBonafidePdf({
        certificateId,
        studentName: student.fullName,
        rollNumber: student.rollNumber,
        branchName: student.branch.name,
        year: student.year,
        purpose: bonafide.purpose,
        issueDate,
        issuedByName: req.user!.fullName || 'Dr. Ananya Ray',
        verificationUrl,
      });

      // Update Database via Transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update bonafide request
        const updatedBonafide = await tx.bonafideRequest.update({
          where: { id: bonafide.id },
          data: {
            certificateId,
            generatedAt: issueDate,
            documentUrl: fileUrl,
            verificationToken,
          },
        });

        // 2. Create official Document record for verification registry
        await tx.document.create({
          data: {
            ownerId: student.id,
            documentType: 'BONAFIDE',
            documentNumber: certificateId,
            fileUrl,
            verificationToken,
            issuedBy: req.user!.id,
            issuedAt: issueDate,
            expiresAt: new Date(issueDate.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months validity
            status: 'VALID',
          },
        });

        // 3. Update Request status to APPROVED & COMPLETED
        await tx.request.update({
          where: { id: bonafide.requestId },
          data: {
            status: 'APPROVED',
            completedAt: issueDate,
          },
        });

        await tx.requestStatusHistory.create({
          data: {
            requestId: bonafide.requestId,
            oldStatus: 'PENDING_APPROVAL',
            newStatus: 'APPROVED',
            changedBy: req.user!.id,
            comment: `Certificate ${certificateId} generated and digitally certified.`,
          },
        });

        return updatedBonafide;
      });

      // Notify Student
      await NotificationService.send({
        userId: bonafide.request.requesterId,
        title: 'Bonafide Certificate Ready!',
        message: `Your Bonafide Certificate (${certificateId}) has been officially generated and is ready for download.`,
        type: 'SUCCESS',
        referenceType: 'BONAFIDE',
        referenceId: bonafide.requestId,
      });

      // Audit Log
      await AuditService.log({
        actorId: req.user!.id,
        action: 'BONAFIDE_APPROVED',
        entityType: 'BONAFIDE',
        entityId: bonafide.id,
        newValues: {
          certificateId,
          studentName: student.fullName,
          purpose: bonafide.purpose,
        },
      });

      res.json({
        success: true,
        message: 'Bonafide certificate generated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/bonafide/:id/download - Download the PDF
router.get(
  '/:id/download',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const bonafide = await prisma.bonafideRequest.findUnique({
        where: { id },
        include: { request: true },
      });

      if (!bonafide || !bonafide.documentUrl) {
        throw new AppError('Certificate document not available for download', 404);
      }

      const filePath = path.join(config.storageDir, path.basename(bonafide.documentUrl));

      if (!fs.existsSync(filePath)) {
        throw new AppError('File not found on storage server', 404);
      }

      res.download(filePath, `Bonafide-${bonafide.certificateId}.pdf`);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
