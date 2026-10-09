import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { CopilotService } from '../services/copilot.service';
import { VERIFIED_CAMPUS_PROCEDURES } from '../data/campusGuide.data';
import { VERIFIED_CAMPUS_RESOURCES } from '../data/campusResources.data';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// Validation Schemas
const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

const planSchema = z.object({
  subject: z.string().min(2, 'Subject is required'),
  subjectCode: z.string().optional(),
  days: z.number().int().min(1).max(60).default(10),
  hoursPerDay: z.number().int().min(1).max(12).default(3),
});

/**
 * POST /api/copilot/message
 * Main conversational endpoint for Nexora Copilot
 */
router.post(
  '/message',
  authenticate,
  validateBody(messageSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message, history } = req.body;
      const response = await CopilotService.processMessage(message, req.user!, history);

      res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/copilot/guide
 * Returns verified campus procedures and official department guides
 */
router.get(
  '/guide',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, query } = req.query;

      let procedures = VERIFIED_CAMPUS_PROCEDURES;

      if (category && typeof category === 'string') {
        procedures = procedures.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (query && typeof query === 'string') {
        const q = query.toLowerCase();
        procedures = procedures.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.department.toLowerCase().includes(q) ||
            p.keywords.some((k) => k.includes(q))
        );
      }

      res.json({
        success: true,
        data: {
          total: procedures.length,
          categories: ['All', 'Academic', 'Hostel', 'Security', 'Documents', 'Maintenance', 'General'],
          procedures,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/copilot/plan
 * Generates an academic study plan roadmap
 */
router.post(
  '/plan',
  authenticate,
  validateBody(planSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subject, subjectCode, days, hoursPerDay } = req.body;
      const derivedCode = subjectCode || (subject.toLowerCase().includes('dbms') ? 'CS204' : 'GEN101');

      const plan = CopilotService.generateStructuredStudyPlan(
        subject,
        derivedCode,
        days,
        hoursPerDay
      );

      // Check matching resources
      const relatedResources = VERIFIED_CAMPUS_RESOURCES.filter(
        (r) => r.subjectCode === derivedCode
      );

      res.json({
        success: true,
        data: {
          subject,
          subjectCode: derivedCode,
          days,
          hoursPerDay,
          totalRecommendedHours: days * hoursPerDay,
          plan,
          relatedResources,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/copilot/resources
 * Searches verified university notes, syllabus, and PYQs
 */
router.get(
  '/resources',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branch, semester, subject, type, search } = req.query;

      let resources = VERIFIED_CAMPUS_RESOURCES;

      if (branch && typeof branch === 'string') {
        resources = resources.filter(
          (r) => r.branch.toLowerCase() === branch.toLowerCase() || r.branch === 'ALL'
        );
      }

      if (semester) {
        const semNum = parseInt(String(semester), 10);
        if (!isNaN(semNum)) {
          resources = resources.filter((r) => r.semester === semNum);
        }
      }

      if (type && typeof type === 'string') {
        resources = resources.filter(
          (r) => r.type.toLowerCase() === type.toLowerCase()
        );
      }

      if (search && typeof search === 'string') {
        const s = search.toLowerCase();
        resources = resources.filter(
          (r) =>
            r.title.toLowerCase().includes(s) ||
            r.subjectName.toLowerCase().includes(s) ||
            r.subjectCode.toLowerCase().includes(s) ||
            (r.keyTopics && r.keyTopics.some((t) => t.toLowerCase().includes(s)))
        );
      }

      res.json({
        success: true,
        data: {
          total: resources.length,
          resources,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
