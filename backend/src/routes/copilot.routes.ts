import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createRateLimiter } from '../middleware/rateLimit.middleware';
import { CopilotService } from '../services/copilot.service';
import { VERIFIED_CAMPUS_PROCEDURES, searchCampusProcedures } from '../data/campusGuide.data';
import { VERIFIED_CAMPUS_RESOURCES } from '../data/campusResources.data';
import {
  VERIFIED_CAMPUS_KNOWLEDGE,
  searchCampusKnowledge,
  listVerifiedKnowledge,
} from '../data/campusKnowledge.data';
import { AuthenticatedRequest } from '../types/auth';
import { config } from '../config/env';

const router = Router();

// Rate limiter for conversational messaging: 60 requests per minute
const copilotMessageLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Copilot query rate limit exceeded. Please wait a moment before sending another message.',
  code: 'COPILOT_RATE_LIMITED',
});

// Validation Schemas
const messageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(20)
    .optional(),
});

const planSchema = z.object({
  subject: z.string().min(2, 'Subject is required'),
  subjectCode: z.string().optional(),
  days: z.number().int().min(1).max(60).default(10),
  hoursPerDay: z.number().int().min(1).max(12).default(3),
});

const validateActionSchema = z.object({
  actionType: z.enum(['COMPLAINT', 'BONAFIDE', 'LEAVE', 'GATE_PASS']),
  payload: z.record(z.any()),
});

/**
 * POST /api/copilot/message
 * Main conversational endpoint for Nexora Copilot
 * Fully authenticated, rate-limited, and grounded in verified campus records.
 */
router.post(
  '/message',
  authenticate,
  copilotMessageLimiter,
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
 * POST /api/copilot/action/validate
 * Validates a prospective action before execution.
 * Enforces server-side authorization, input validity, and required explicit confirmation.
 */
router.post(
  '/action/validate',
  authenticate,
  validateBody(validateActionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { actionType, payload } = req.body;
      const user = req.user!;

      // 1. Validate permissions
      if (actionType === 'COMPLAINT' && !user.permissions.includes('requests.create')) {
        res.status(403).json({
          success: false,
          valid: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to submit facility complaints.',
          },
        });
        return;
      }

      if (actionType === 'BONAFIDE' && !user.permissions.includes('bonafide.create')) {
        res.status(403).json({
          success: false,
          valid: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to request bonafide certificates.',
          },
        });
        return;
      }

      if (actionType === 'LEAVE' && !user.permissions.includes('leave.create')) {
        res.status(403).json({
          success: false,
          valid: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to apply for hostel leave.',
          },
        });
        return;
      }

      if (actionType === 'GATE_PASS' && !user.permissions.includes('gatepass.create')) {
        res.status(403).json({
          success: false,
          valid: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to generate campus gate passes.',
          },
        });
        return;
      }

      // 2. Validate payload fields
      let preview: any = {};

      if (actionType === 'COMPLAINT') {
        const title = String(payload.title || '').trim();
        const description = String(payload.description || '').trim();
        const category = String(payload.category || 'Maintenance').trim();
        const priority = ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(payload.priority)
          ? payload.priority
          : 'NORMAL';

        if (title.length < 3) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_TITLE', message: 'Complaint title must be at least 3 characters.' },
          });
          return;
        }

        const location =
          payload.location ||
          (user.hostelBlock && user.roomNumber
            ? `${user.hostelBlock} / Room ${user.roomNumber}`
            : 'Campus Facility');

        preview = {
          actionType: 'COMPLAINT',
          title: `Submit ${category} Maintenance Complaint`,
          targetEndpoint: 'POST /api/complaints',
          responsibleDepartment: 'Estate Management & Maintenance Wing',
          estimatedSla: priority === 'URGENT' ? '4 Hours' : '24 to 48 Hours',
          requiresConfirmation: true,
          data: {
            title,
            description,
            category,
            priority,
            location,
          },
        };
      } else if (actionType === 'BONAFIDE') {
        const purpose = String(payload.purpose || '').trim();
        const allowedPurposes = ['Scholarship', 'Bank', 'Internship', 'Education', 'Passport', 'Other'];

        if (!purpose || purpose.length < 2) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_PURPOSE', message: 'Valid bonafide purpose is required.' },
          });
          return;
        }

        preview = {
          actionType: 'BONAFIDE',
          title: 'Request Official Bonafide Certificate',
          targetEndpoint: 'POST /api/bonafide',
          responsibleDepartment: 'Academic Affairs Cell (Ground Floor, Admin Block)',
          estimatedSla: '24 to 48 Working Hours',
          requiresConfirmation: true,
          data: {
            purpose,
            studentName: user.fullName || user.username,
            rollNumber: user.rollNumber || 'Enrolled Student',
            branch: user.branch || 'CSE',
            year: user.year || 2,
          },
        };
      } else if (actionType === 'LEAVE') {
        const startDate = new Date(payload.startDate);
        const endDate = new Date(payload.endDate);
        const reason = String(payload.reason || '').trim();
        const emergencyContact = String(payload.emergencyContact || '').trim();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_DATES', message: 'Valid start and end dates are required.' },
          });
          return;
        }

        if (endDate <= startDate) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_DATE_RANGE', message: 'End date must be after start date.' },
          });
          return;
        }

        if (reason.length < 5) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_REASON', message: 'Reason must be at least 5 characters.' },
          });
          return;
        }

        if (emergencyContact.length < 5) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_EMERGENCY_CONTACT', message: 'Parent/guardian emergency contact is required.' },
          });
          return;
        }

        preview = {
          actionType: 'LEAVE',
          title: 'Apply for Overnight Hostel Leave',
          targetEndpoint: 'POST /api/leaves',
          responsibleDepartment: 'Hostel Administration & Block Warden',
          estimatedSla: 'Within 12 Hours',
          requiresConfirmation: true,
          data: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            reason,
            emergencyContact,
            parentConsent: Boolean(payload.parentConsent),
            hostelBlock: user.hostelBlock || 'Hostel Block',
          },
        };
      } else if (actionType === 'GATE_PASS') {
        const departureTime = new Date(payload.departureTime);
        const expectedReturnTime = new Date(payload.expectedReturnTime);
        const destination = String(payload.destination || '').trim();
        const reason = String(payload.reason || '').trim();

        if (isNaN(departureTime.getTime()) || isNaN(expectedReturnTime.getTime())) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_TIMES', message: 'Valid departure and return timestamps are required.' },
          });
          return;
        }

        if (expectedReturnTime <= departureTime) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_TIME_RANGE', message: 'Expected return time must be after departure time.' },
          });
          return;
        }

        if (destination.length < 2) {
          res.status(400).json({
            success: false,
            valid: false,
            error: { code: 'INVALID_DESTINATION', message: 'Destination is required.' },
          });
          return;
        }

        preview = {
          actionType: 'GATE_PASS',
          title: 'Generate Day Exit Gate Pass',
          targetEndpoint: 'POST /api/gate-passes',
          responsibleDepartment: 'Chief Warden & Main Gate Security',
          estimatedSla: '2 to 4 Hours',
          requiresConfirmation: true,
          data: {
            destination,
            reason,
            departureTime: departureTime.toISOString(),
            expectedReturnTime: expectedReturnTime.toISOString(),
            curfewNote: 'Return mandatory before curfew (7:30 PM for 1st Yr / 8:30 PM for Seniors)',
          },
        };
      }

      res.json({
        success: true,
        valid: true,
        requiresConfirmation: true,
        preview,
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
        procedures = searchCampusProcedures(query, category as string | undefined);
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
 * GET /api/copilot/knowledge
 * Returns verified campus knowledge items with full metadata and provenance tracking.
 */
router.get(
  '/knowledge',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, search, audience } = req.query;

      let items = VERIFIED_CAMPUS_KNOWLEDGE;

      if (search && typeof search === 'string') {
        items = searchCampusKnowledge(search, 10, req.user?.role);
      } else {
        items = listVerifiedKnowledge({
          category: category as string | undefined,
          audience: (audience as string) || req.user?.role,
          suitableForStudents: req.user?.role === 'STUDENT' ? true : undefined,
        });
      }

      res.json({
        success: true,
        data: {
          total: items.length,
          items,
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
      const { branch, semester, type, search } = req.query;

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

/**
 * GET /api/copilot/status
 * Returns system readiness, model connectivity status, and verified knowledge stats.
 */
router.get(
  '/status',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({
        success: true,
        data: {
          engineStatus: 'ONLINE',
          aiProvider: config.geminiApiKey ? 'Google Gemini + Local Grounding' : 'Deterministic Grounded Engine',
          verifiedProceduresCount: VERIFIED_CAMPUS_PROCEDURES.length,
          verifiedKnowledgeCount: VERIFIED_CAMPUS_KNOWLEDGE.length,
          verifiedResourcesCount: VERIFIED_CAMPUS_RESOURCES.length,
          roleScope: req.user?.role,
          userAuthenticated: true,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
