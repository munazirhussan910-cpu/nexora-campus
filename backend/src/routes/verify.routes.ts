import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

const router = Router();

// GET /api/verify/document/:certificateId - Public verification endpoint
router.get(
  '/document/:certificateId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const certificateId = String(req.params.certificateId);

      const doc = await prisma.document.findUnique({
        where: { documentNumber: certificateId },
        include: {
          owner: {
            include: {
              branch: true,
            },
          },
          issuer: {
            include: {
              staff: true,
            },
          },
        },
      });

      if (!doc) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'No official campus document found matching this Certificate ID.',
          },
        });
        return;
      }

      // Safe public payload (minimum necessary information)
      res.json({
        success: true,
        data: {
          verified: doc.status === 'VALID',
          status: doc.status,
          certificateId: doc.documentNumber,
          documentType: doc.documentType,
          studentName: doc.owner.fullName,
          rollNumber: doc.owner.rollNumber,
          course: `B.Tech ${doc.owner.branch.name}`,
          year: doc.owner.year,
          issuedAt: doc.issuedAt,
          expiresAt: doc.expiresAt,
          issuedBy: doc.issuer.staff?.fullName || 'Nexora Campus Administration',
          institution: 'Biju Patnaik University of Technology (BPUT)',
          fileUrl: doc.fileUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
