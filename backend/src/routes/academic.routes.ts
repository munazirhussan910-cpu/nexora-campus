import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================
const createSubjectSchema = z.object({
  code: z.string().trim().min(2, 'Subject code must be at least 2 characters').toUpperCase(),
  name: z.string().trim().min(2, 'Subject name must be at least 2 characters'),
  branchId: z.string().min(1, 'Branch is required'),
  year: z.coerce.number().int().min(1).max(4),
  semester: z.coerce.number().int().min(1).max(8).optional().nullable(),
  section: z.string().trim().max(10).optional().nullable(),
  faculty: z.string().trim().optional().nullable(),
});

const updateSubjectSchema = createSubjectSchema.partial();

const createRoutineSchema = z.object({
  subjectId: z.string().min(1, 'Subject is required'),
  branchId: z.string().min(1, 'Branch is required'),
  year: z.coerce.number().int().min(1).max(4),
  semester: z.coerce.number().int().min(1).max(8).optional().nullable(),
  section: z.string().trim().max(10).optional().nullable(),
  day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format'),
  room: z.string().trim().min(1, 'Room is required'),
  faculty: z.string().trim().optional().nullable(),
  type: z.enum(['LECTURE', 'LAB', 'TUTORIAL']).default('LECTURE'),
  date: z.string().trim().optional().nullable(),
});

const updateRoutineSchema = createRoutineSchema.partial();

const createNoticeSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  content: z.string().trim().min(5, 'Content must be at least 5 characters'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  expiresAt: z.string().optional().nullable(),
  targets: z
    .array(
      z.object({
        targetType: z.enum(['ALL', 'BRANCH', 'YEAR', 'SEMESTER', 'SECTION', 'SUBJECT']),
        targetValue: z.string().trim().min(1, 'Target value cannot be empty'),
      })
    )
    .min(1, 'At least one target filter is required'),
});

const updateNoticeSchema = createNoticeSchema.partial();

const createDeadlineSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  deadline: z.string().min(1, 'Valid deadline date is required'),
  targetYear: z.coerce.number().int().min(1).max(4).optional().nullable(),
  targetSemester: z.coerce.number().int().min(1).max(8).optional().nullable(),
  targetBranchId: z.string().optional().nullable(),
  targetSection: z.string().trim().optional().nullable(),
  relatedForm: z.string().trim().optional().nullable(),
  actionUrl: z.string().trim().optional().nullable(),
});

const updateDeadlineSchema = createDeadlineSchema.partial();

const createGuidanceSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  category: z.string().trim().min(2, 'Category is required'),
  subcategory: z.string().trim().optional().nullable(),
  description: z.string().trim().min(5, 'Description is required'),
  targetYear: z.coerce.number().int().min(1).max(4).optional().nullable(),
  targetBranchId: z.string().optional().nullable(),
  requiredDocs: z.union([z.string(), z.array(z.string())]),
  processSteps: z.union([z.string(), z.array(z.string())]),
  responsibleRole: z.string().default('ACADEMIC_OFFICER'),
  relatedForm: z.string().trim().optional().nullable(),
  actionUrl: z.string().trim().min(1, 'Action URL is required'),
  actionLabel: z.string().trim().min(1, 'Action label is required'),
  isActive: z.boolean().default(true),
});

const updateGuidanceSchema = createGuidanceSchema.partial();

// ==========================================
// 1. ACADEMIC OVERVIEW DASHBOARD
// ==========================================
/**
 * GET /api/academic/dashboard
 * Academic Operations Officer Dashboard
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalSubjects,
        totalBonafides,
        pendingBonafidesCount,
        approvedBonafidesCount,
        rejectedBonafidesCount,
        activeDeadlinesCount,
        activeGuidanceCount,
        pendingBonafides,
        recentlyApproved,
        recentlyRejected,
      ] = await Promise.all([
        prisma.subject.count(),
        prisma.bonafideRequest.count(),
        prisma.bonafideRequest.count({
          where: { certificateId: null, request: { status: 'PENDING_APPROVAL' } },
        }),
        prisma.bonafideRequest.count({
          where: { request: { status: 'APPROVED' } },
        }),
        prisma.bonafideRequest.count({
          where: { request: { status: 'REJECTED' } },
        }),
        prisma.academicDeadline.count({
          where: { isActive: true, deadline: { gte: new Date() } },
        }),
        prisma.guidanceItem.count({
          where: { isActive: true },
        }),
        prisma.bonafideRequest.findMany({
          where: { certificateId: null, request: { status: 'PENDING_APPROVAL' } },
          include: {
            request: {
              include: {
                requester: {
                  include: {
                    student: { include: { branch: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.bonafideRequest.findMany({
          where: { request: { status: 'APPROVED' } },
          include: {
            request: {
              include: {
                requester: {
                  include: {
                    student: { include: { branch: true } },
                  },
                },
              },
            },
          },
          orderBy: { generatedAt: 'desc' },
          take: 5,
        }),
        prisma.bonafideRequest.findMany({
          where: { request: { status: 'REJECTED' } },
          include: {
            request: {
              include: {
                requester: {
                  include: {
                    student: { include: { branch: true } },
                  },
                },
              },
            },
          },
          orderBy: { request: { updatedAt: 'desc' } },
          take: 5,
        }),
      ]);

      // Faculty calculation
      const [subjectFaculty, timetableFaculty, teachingStaff] = await Promise.all([
        prisma.subject.findMany({
          where: { faculty: { not: null } },
          select: { faculty: true },
          distinct: ['faculty'],
        }),
        prisma.timetableEntry.findMany({
          where: { faculty: { not: null } },
          select: { faculty: true },
          distinct: ['faculty'],
        }),
        prisma.staff.findMany({
          where: {
            OR: [
              { department: { contains: 'Academic' } },
              { designation: { contains: 'Professor' } },
              { designation: { contains: 'Faculty' } },
              { specialization: { contains: 'FACULTY' } },
            ],
          },
          select: { fullName: true },
        }),
      ]);

      const uniqueFacultyNames = new Set<string>();
      subjectFaculty.forEach((s) => s.faculty && uniqueFacultyNames.add(s.faculty.trim()));
      timetableFaculty.forEach((t) => t.faculty && uniqueFacultyNames.add(t.faculty.trim()));
      teachingStaff.forEach((st) => st.fullName && uniqueFacultyNames.add(st.fullName.trim()));
      const activeFacultyCount = Math.max(uniqueFacultyNames.size, 5);

      // Today's classes
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayDay = dayNames[new Date().getDay()];
      const queryDay = todayDay === 'SUNDAY' ? 'MONDAY' : todayDay;

      const todayClasses = await prisma.timetableEntry.findMany({
        where: { day: queryDay },
        include: {
          subject: { select: { code: true, name: true, faculty: true } },
          branch: { select: { code: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
      });

      // Recent academic notices
      const recentUpdates = await prisma.notice.findMany({
        include: {
          targets: true,
          author: {
            select: {
              username: true,
              staff: { select: { fullName: true, designation: true } },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      });

      // Upcoming deadlines
      const upcomingDeadlines = await prisma.academicDeadline.findMany({
        where: { isActive: true },
        include: { branch: true },
        orderBy: { deadline: 'asc' },
        take: 5,
      });

      // Guidance items
      const guidanceItems = await prisma.guidanceItem.findMany({
        where: { isActive: true },
        include: { branch: true },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      });

      // Academic Structure Summary
      const branches = await prisma.branch.findMany({
        include: {
          _count: {
            select: {
              subjects: true,
              students: true,
              timetableEntries: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });

      res.json({
        success: true,
        data: {
          metrics: {
            pendingApprovals: pendingBonafidesCount,
            approvedCount: approvedBonafidesCount,
            rejectedCount: rejectedBonafidesCount,
            totalRequests: totalBonafides,
            totalSubjects,
            activeFaculty: activeFacultyCount,
            todayClasses: todayClasses.length,
            recentUpdates: recentUpdates.length,
            upcomingDeadlines: activeDeadlinesCount,
            guidanceArticles: activeGuidanceCount,
          },
          todayDay: queryDay,
          todayClasses,
          pendingRequests: pendingBonafides,
          recentlyApproved,
          recentlyRejected,
          recentUpdates,
          deadlines: upcomingDeadlines,
          guidanceItems,
          academicStructure: branches,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 2. DAILY ACADEMIC ROUTINE (TIMETABLE CRUD)
// ==========================================
/**
 * GET /api/academic/routine
 * View daily routine entries with flexible filtering
 */
router.get(
  '/routine',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId, branchCode, year, semester, section, day, date, type } = req.query;

      const where: any = {};
      if (branchId) where.branchId = String(branchId);
      if (branchCode) where.branch = { code: String(branchCode).toUpperCase() };
      if (year) where.year = parseInt(String(year), 10);
      if (semester) where.semester = parseInt(String(semester), 10);
      if (section) where.section = String(section).toUpperCase();
      if (day) where.day = String(day).toUpperCase();
      if (date) where.date = String(date);
      if (type) where.type = String(type).toUpperCase();

      const entries = await prisma.timetableEntry.findMany({
        where,
        include: {
          subject: { select: { id: true, code: true, name: true, faculty: true } },
          branch: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      });

      res.json({
        success: true,
        data: entries,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/academic/routine
 * Create a routine entry (lecture, lab, tutorial)
 */
router.post(
  '/routine',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(createRoutineSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        subjectId,
        branchId,
        year,
        semester,
        section,
        day,
        startTime,
        endTime,
        room,
        faculty,
        type,
        date,
      } = req.body;

      // Verify subject and branch
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) throw new AppError('Subject not found', 404);

      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) throw new AppError('Branch not found', 404);

      const entry = await prisma.timetableEntry.create({
        data: {
          subjectId,
          branchId,
          year,
          semester: semester || subject.semester || year * 2 - 1,
          section: section ? section.toUpperCase() : subject.section || 'A',
          day,
          startTime,
          endTime,
          room,
          faculty: faculty || subject.faculty || 'Department Faculty',
          type: type || 'LECTURE',
          date: date || null,
        },
        include: {
          subject: true,
          branch: true,
        },
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ROUTINE_ENTRY_CREATED',
        entityType: 'TIMETABLE_ENTRY',
        entityId: entry.id,
        newValues: {
          subject: subject.code,
          day,
          startTime,
          endTime,
          room,
          faculty,
          type,
          date,
        },
      });

      res.status(201).json({
        success: true,
        message: `Routine entry scheduled: ${subject.name} (${startTime}-${endTime})`,
        data: entry,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/academic/routine/:id
 * Edit routine entry
 */
router.put(
  '/routine/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(updateRoutineSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.timetableEntry.findUnique({ where: { id } });
      if (!existing) throw new AppError('Routine entry not found', 404);

      const {
        subjectId,
        branchId,
        year,
        semester,
        section,
        day,
        startTime,
        endTime,
        room,
        faculty,
        type,
        date,
      } = req.body;

      if (subjectId) {
        const sub = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!sub) throw new AppError('Subject not found', 404);
      }

      if (branchId) {
        const br = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!br) throw new AppError('Branch not found', 404);
      }

      const updated = await prisma.timetableEntry.update({
        where: { id },
        data: {
          ...(subjectId ? { subjectId } : {}),
          ...(branchId ? { branchId } : {}),
          ...(year ? { year } : {}),
          ...(semester !== undefined ? { semester } : {}),
          ...(section !== undefined ? { section: section ? section.toUpperCase() : null } : {}),
          ...(day ? { day } : {}),
          ...(startTime ? { startTime } : {}),
          ...(endTime ? { endTime } : {}),
          ...(room ? { room } : {}),
          ...(faculty !== undefined ? { faculty } : {}),
          ...(type ? { type } : {}),
          ...(date !== undefined ? { date: date || null } : {}),
        },
        include: {
          subject: true,
          branch: true,
        },
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ROUTINE_ENTRY_UPDATED',
        entityType: 'TIMETABLE_ENTRY',
        entityId: id,
        oldValues: existing,
        newValues: updated,
      });

      res.json({
        success: true,
        message: 'Routine entry updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/academic/routine/:id
 * Delete routine entry
 */
router.delete(
  '/routine/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.timetableEntry.findUnique({ where: { id } });
      if (!existing) throw new AppError('Routine entry not found', 404);

      await prisma.timetableEntry.delete({ where: { id } });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ROUTINE_ENTRY_DELETED',
        entityType: 'TIMETABLE_ENTRY',
        entityId: id,
        oldValues: existing,
      });

      res.json({
        success: true,
        message: 'Routine entry deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// Backward-compatibility aliases for timetable
router.get('/timetable', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, branchCode, year, semester, section, day, date, type } = req.query;

    const where: any = {};
    if (branchId) where.branchId = String(branchId);
    if (branchCode) where.branch = { code: String(branchCode).toUpperCase() };
    if (year) where.year = parseInt(String(year), 10);
    if (semester) where.semester = parseInt(String(semester), 10);
    if (section) where.section = String(section).toUpperCase();
    if (day) where.day = String(day).toUpperCase();
    if (date) where.date = String(date);
    if (type) where.type = String(type).toUpperCase();

    const entries = await prisma.timetableEntry.findMany({
      where,
      include: {
        subject: { select: { id: true, code: true, name: true, faculty: true } },
        branch: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    res.json({
      success: true,
      data: entries,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. ACADEMIC NOTICES MANAGEMENT
// ==========================================
/**
 * GET /api/academic/notices
 * View all notices managed by Academic Officer
 */
router.get(
  '/notices',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notices = await prisma.notice.findMany({
        include: {
          targets: true,
          author: {
            select: {
              username: true,
              staff: { select: { fullName: true, designation: true } },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
      });

      res.json({
        success: true,
        data: notices,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/academic/notices
 * Create & publish academic notice with targeting
 */
router.post(
  '/notices',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(createNoticeSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content, priority, status, expiresAt, targets } = req.body;

      const notice = await prisma.$transaction(async (tx) => {
        const n = await tx.notice.create({
          data: {
            title,
            content,
            priority: priority || 'NORMAL',
            status: status || 'PUBLISHED',
            publishedAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.user!.id,
          },
        });

        for (const t of targets) {
          await tx.noticeTarget.create({
            data: {
              noticeId: n.id,
              targetType: t.targetType,
              targetValue: String(t.targetValue).trim(),
            },
          });
        }

        return n;
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ACADEMIC_NOTICE_CREATED',
        entityType: 'NOTICE',
        entityId: notice.id,
        newValues: { title, priority, status, targets },
      });

      res.status(201).json({
        success: true,
        message: 'Academic notice published successfully',
        data: notice,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/academic/notices/:id
 * Edit notice
 */
router.put(
  '/notices/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(updateNoticeSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.notice.findUnique({
        where: { id },
        include: { targets: true },
      });

      if (!existing) throw new AppError('Notice not found', 404);

      const { title, content, priority, status, expiresAt, targets } = req.body;

      const updated = await prisma.$transaction(async (tx) => {
        const n = await tx.notice.update({
          where: { id },
          data: {
            ...(title ? { title } : {}),
            ...(content ? { content } : {}),
            ...(priority ? { priority } : {}),
            ...(status ? { status } : {}),
            ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
          },
        });

        if (targets && targets.length > 0) {
          await tx.noticeTarget.deleteMany({ where: { noticeId: id } });
          for (const t of targets) {
            await tx.noticeTarget.create({
              data: {
                noticeId: id,
                targetType: t.targetType,
                targetValue: String(t.targetValue).trim(),
              },
            });
          }
        }

        return n;
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ACADEMIC_NOTICE_UPDATED',
        entityType: 'NOTICE',
        entityId: id,
        oldValues: existing,
        newValues: updated,
      });

      res.json({
        success: true,
        message: 'Notice updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/academic/notices/:id/publish
 * Toggle publish / unpublish status
 */
router.patch(
  '/notices/:id/publish',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) throw new AppError('Notice not found', 404);

      const newStatus = existing.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      const updated = await prisma.notice.update({
        where: { id },
        data: { status: newStatus },
      });

      res.json({
        success: true,
        message: `Notice status updated to ${newStatus}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/academic/notices/:id
 * Delete academic notice
 */
router.delete(
  '/notices/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) throw new AppError('Notice not found', 404);

      await prisma.notice.delete({ where: { id } });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ACADEMIC_NOTICE_DELETED',
        entityType: 'NOTICE',
        entityId: id,
        oldValues: existing,
      });

      res.json({
        success: true,
        message: 'Notice deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// Backward-compatibility updates alias
router.get('/updates', authenticate, async (req, res, next) => {
  try {
    const updates = await prisma.notice.findMany({
      where: {
        status: 'PUBLISHED',
        targets: {
          some: {
            targetType: { in: ['BRANCH', 'YEAR', 'SEMESTER', 'SECTION', 'SUBJECT', 'ALL'] },
          },
        },
      },
      include: {
        targets: true,
        author: {
          select: {
            username: true,
            staff: { select: { fullName: true, designation: true } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    const formatted = updates.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      priority: n.priority,
      publishedAt: n.publishedAt,
      authorName: n.author.staff?.fullName || n.author.username,
      authorRole: n.author.staff?.designation || 'Academic Officer',
      targets: n.targets.map((t) => ({
        id: t.id,
        targetType: t.targetType,
        targetValue: t.targetValue,
      })),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. ACADEMIC DEADLINES MANAGEMENT
// ==========================================
/**
 * GET /api/academic/deadlines
 * List all academic deadlines
 */
router.get(
  '/deadlines',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deadlines = await prisma.academicDeadline.findMany({
        include: {
          branch: { select: { id: true, code: true, name: true } },
          creator: {
            select: {
              username: true,
              staff: { select: { fullName: true, designation: true } },
            },
          },
        },
        orderBy: { deadline: 'asc' },
      });

      res.json({
        success: true,
        data: deadlines,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/academic/deadlines
 * Create a new academic deadline
 */
router.post(
  '/deadlines',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(createDeadlineSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        title,
        description,
        deadline,
        targetYear,
        targetSemester,
        targetBranchId,
        targetSection,
        relatedForm,
        actionUrl,
      } = req.body;

      if (targetBranchId) {
        const br = await prisma.branch.findUnique({ where: { id: targetBranchId } });
        if (!br) throw new AppError('Target branch does not exist', 404);
      }

      const item = await prisma.academicDeadline.create({
        data: {
          title,
          description,
          deadline: new Date(deadline),
          targetYear: targetYear || null,
          targetSemester: targetSemester || null,
          targetBranchId: targetBranchId || null,
          targetSection: targetSection ? targetSection.toUpperCase() : null,
          relatedForm: relatedForm || null,
          actionUrl: actionUrl || null,
          createdBy: req.user!.id,
          isActive: true,
        },
        include: { branch: true },
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ACADEMIC_DEADLINE_CREATED',
        entityType: 'ACADEMIC_DEADLINE',
        entityId: item.id,
        newValues: { title, deadline, targetYear, targetBranchId },
      });

      res.status(201).json({
        success: true,
        message: `Deadline created: ${title}`,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/academic/deadlines/:id
 * Edit deadline
 */
router.put(
  '/deadlines/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(updateDeadlineSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.academicDeadline.findUnique({ where: { id } });
      if (!existing) throw new AppError('Deadline not found', 404);

      const {
        title,
        description,
        deadline,
        targetYear,
        targetSemester,
        targetBranchId,
        targetSection,
        relatedForm,
        actionUrl,
      } = req.body;

      const updated = await prisma.academicDeadline.update({
        where: { id },
        data: {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(deadline ? { deadline: new Date(deadline) } : {}),
          ...(targetYear !== undefined ? { targetYear } : {}),
          ...(targetSemester !== undefined ? { targetSemester } : {}),
          ...(targetBranchId !== undefined ? { targetBranchId } : {}),
          ...(targetSection !== undefined ? { targetSection: targetSection ? targetSection.toUpperCase() : null } : {}),
          ...(relatedForm !== undefined ? { relatedForm } : {}),
          ...(actionUrl !== undefined ? { actionUrl } : {}),
        },
        include: { branch: true },
      });

      res.json({
        success: true,
        message: 'Deadline updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/academic/deadlines/:id
 * Delete deadline
 */
router.delete(
  '/deadlines/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.academicDeadline.findUnique({ where: { id } });
      if (!existing) throw new AppError('Deadline not found', 404);

      await prisma.academicDeadline.delete({ where: { id } });

      res.json({
        success: true,
        message: 'Deadline deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 5. GUIDANCE CONTENT MANAGEMENT
// ==========================================
/**
 * GET /api/academic/guidance
 * View all guidance items
 */
router.get(
  '/guidance',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, targetYear } = req.query;

      const where: any = {};
      if (category) where.category = String(category).toUpperCase();
      if (targetYear) where.targetYear = parseInt(String(targetYear), 10);

      const items = await prisma.guidanceItem.findMany({
        where,
        include: { branch: true },
        orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
      });

      res.json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/academic/guidance
 * Create guidance item
 */
router.post(
  '/guidance',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(createGuidanceSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        title,
        category,
        subcategory,
        description,
        targetYear,
        targetBranchId,
        requiredDocs,
        processSteps,
        responsibleRole,
        relatedForm,
        actionUrl,
        actionLabel,
        isActive,
      } = req.body;

      const item = await prisma.guidanceItem.create({
        data: {
          title,
          category: category.toUpperCase(),
          subcategory: subcategory ? subcategory.toUpperCase() : null,
          description,
          targetYear: targetYear || null,
          targetBranchId: targetBranchId || null,
          requiredDocs: typeof requiredDocs === 'string' ? requiredDocs : JSON.stringify(requiredDocs),
          processSteps: typeof processSteps === 'string' ? processSteps : JSON.stringify(processSteps),
          responsibleRole: responsibleRole || 'ACADEMIC_OFFICER',
          relatedForm: relatedForm || null,
          actionUrl,
          actionLabel,
          isActive: isActive !== undefined ? isActive : true,
          createdBy: req.user!.id,
        },
        include: { branch: true },
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'GUIDANCE_ITEM_CREATED',
        entityType: 'GUIDANCE_ITEM',
        entityId: item.id,
        newValues: { title, category, actionUrl },
      });

      res.status(201).json({
        success: true,
        message: `Guidance item created: ${title}`,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/academic/guidance/:id
 * Edit guidance item
 */
router.put(
  '/guidance/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(updateGuidanceSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.guidanceItem.findUnique({ where: { id } });
      if (!existing) throw new AppError('Guidance item not found', 404);

      const {
        title,
        category,
        subcategory,
        description,
        targetYear,
        targetBranchId,
        requiredDocs,
        processSteps,
        responsibleRole,
        relatedForm,
        actionUrl,
        actionLabel,
        isActive,
      } = req.body;

      const updated = await prisma.guidanceItem.update({
        where: { id },
        data: {
          ...(title ? { title } : {}),
          ...(category ? { category: category.toUpperCase() } : {}),
          ...(subcategory !== undefined ? { subcategory: subcategory ? subcategory.toUpperCase() : null } : {}),
          ...(description ? { description } : {}),
          ...(targetYear !== undefined ? { targetYear } : {}),
          ...(targetBranchId !== undefined ? { targetBranchId } : {}),
          ...(requiredDocs !== undefined
            ? { requiredDocs: typeof requiredDocs === 'string' ? requiredDocs : JSON.stringify(requiredDocs) }
            : {}),
          ...(processSteps !== undefined
            ? { processSteps: typeof processSteps === 'string' ? processSteps : JSON.stringify(processSteps) }
            : {}),
          ...(responsibleRole ? { responsibleRole } : {}),
          ...(relatedForm !== undefined ? { relatedForm } : {}),
          ...(actionUrl ? { actionUrl } : {}),
          ...(actionLabel ? { actionLabel } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
        include: { branch: true },
      });

      res.json({
        success: true,
        message: 'Guidance item updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/academic/guidance/:id
 * Delete guidance item
 */
router.delete(
  '/guidance/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.guidanceItem.findUnique({ where: { id } });
      if (!existing) throw new AppError('Guidance item not found', 404);

      await prisma.guidanceItem.delete({ where: { id } });

      res.json({
        success: true,
        message: 'Guidance item deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 6. ACADEMIC REQUEST MANAGEMENT & CERTIFICATES
// ==========================================
/**
 * GET /api/academic/requests
 * View all academic requests (Bonafide certificates, academic inquiries)
 */
router.get(
  '/requests',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.request = { status: String(status).toUpperCase() };
      }

      const requests = await prisma.bonafideRequest.findMany({
        where,
        include: {
          request: {
            include: {
              requestType: true,
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
              statusHistory: {
                include: {
                  changer: { select: { username: true } },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: requests,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 7. SUBJECTS, ATTENDANCE & METADATA
// ==========================================
/**
 * GET /api/academic/subjects
 */
router.get(
  '/subjects',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId, branchCode, year, semester, section } = req.query;

      const where: any = {};
      if (branchId) where.branchId = String(branchId);
      if (branchCode) where.branch = { code: String(branchCode).toUpperCase() };
      if (year) where.year = parseInt(String(year), 10);
      if (semester) where.semester = parseInt(String(semester), 10);
      if (section) where.section = String(section).toUpperCase();

      const subjects = await prisma.subject.findMany({
        where,
        include: {
          branch: { select: { id: true, code: true, name: true } },
          _count: {
            select: {
              timetableEntries: true,
              attendances: true,
            },
          },
        },
        orderBy: [{ branch: { code: 'asc' } }, { year: 'asc' }, { code: 'asc' }],
      });

      res.json({ success: true, data: subjects });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/academic/subjects
 */
router.post(
  '/subjects',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(createSubjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, name, branchId, year, semester, section, faculty } = req.body;

      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) throw new AppError('Branch not found', 404);

      const existing = await prisma.subject.findUnique({ where: { code } });
      if (existing) throw new AppError(`Subject with code '${code}' already exists`, 409);

      const subject = await prisma.subject.create({
        data: {
          code,
          name,
          branchId,
          year,
          semester: semester || (year ? year * 2 - 1 : null),
          section: section ? section.toUpperCase() : null,
          faculty: faculty || null,
        },
        include: { branch: true },
      });

      res.status(201).json({
        success: true,
        message: `Subject ${subject.code} (${subject.name}) created successfully`,
        data: subject,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/academic/subjects/:id
 */
router.put(
  '/subjects/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  validateBody(updateSubjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { code, name, branchId, year, semester, section, faculty } = req.body;

      const existing = await prisma.subject.findUnique({ where: { id } });
      if (!existing) throw new AppError('Subject not found', 404);

      if (code && code !== existing.code) {
        const conflict = await prisma.subject.findUnique({ where: { code } });
        if (conflict) throw new AppError(`Subject code '${code}' already exists`, 409);
      }

      const updated = await prisma.subject.update({
        where: { id },
        data: {
          ...(code ? { code } : {}),
          ...(name ? { name } : {}),
          ...(branchId ? { branchId } : {}),
          ...(year ? { year } : {}),
          ...(semester !== undefined ? { semester } : {}),
          ...(section !== undefined ? { section: section ? section.toUpperCase() : null } : {}),
          ...(faculty !== undefined ? { faculty } : {}),
        },
        include: { branch: true },
      });

      res.json({
        success: true,
        message: `Subject ${updated.code} updated successfully`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/academic/subjects/:id
 */
router.delete(
  '/subjects/:id',
  authenticate,
  requireRole('ACADEMIC_OFFICER', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.subject.findUnique({ where: { id } });
      if (!existing) throw new AppError('Subject not found', 404);

      await prisma.subject.delete({ where: { id } });

      res.json({
        success: true,
        message: `Subject ${existing.code} deleted successfully`,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/academic/attendance
 */
router.get(
  '/attendance',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId, year, subjectId } = req.query;

      const where: any = {};
      if (branchId) where.student = { branchId: String(branchId) };
      if (year) where.student = { ...where.student, year: parseInt(String(year), 10) };
      if (subjectId) where.subjectId = String(subjectId);

      const records = await prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              rollNumber: true,
              year: true,
              branch: { select: { code: true, name: true } },
            },
          },
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
              faculty: true,
            },
          },
        },
        orderBy: [{ subject: { code: 'asc' } }, { student: { rollNumber: 'asc' } }],
      });

      const formatted = records.map((r) => {
        const pct = r.total > 0 ? Number(((r.present / r.total) * 100).toFixed(1)) : 0;
        return {
          id: r.id,
          studentName: r.student.fullName,
          rollNumber: r.student.rollNumber,
          branch: r.student.branch.code,
          year: r.student.year,
          subjectCode: r.subject.code,
          subjectName: r.subject.name,
          faculty: r.subject.faculty || 'Department Faculty',
          present: r.present,
          total: r.total,
          percentage: pct,
          isAboveThreshold: pct >= 75.0,
        };
      });

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/academic/branches
 */
router.get(
  '/branches',
  authenticate,
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branches = await prisma.branch.findMany({
        orderBy: { code: 'asc' },
      });
      res.json({ success: true, data: branches });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/academic/faculty
 */
router.get(
  '/faculty',
  authenticate,
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staffFaculty = await prisma.staff.findMany({
        where: {
          OR: [
            { department: { contains: 'Academic' } },
            { department: { contains: 'Computer Science' } },
            { designation: { contains: 'Professor' } },
            { designation: { contains: 'Faculty' } },
            { specialization: { contains: 'FACULTY' } },
            { specialization: { contains: 'ACADEMIC' } },
          ],
        },
        select: { id: true, fullName: true, designation: true, department: true },
        orderBy: { fullName: 'asc' },
      });

      const [subjectFaculty, timetableFaculty] = await Promise.all([
        prisma.subject.findMany({
          where: { faculty: { not: null } },
          select: { faculty: true },
          distinct: ['faculty'],
        }),
        prisma.timetableEntry.findMany({
          where: { faculty: { not: null } },
          select: { faculty: true },
          distinct: ['faculty'],
        }),
      ]);

      const facultyList = staffFaculty.map((s) => ({
        name: s.fullName,
        designation: s.designation,
        department: s.department,
      }));

      const knownNames = new Set(facultyList.map((f) => f.name));
      subjectFaculty.forEach((s) => {
        if (s.faculty && !knownNames.has(s.faculty)) {
          facultyList.push({
            name: s.faculty,
            designation: 'Faculty',
            department: 'Academic Department',
          });
          knownNames.add(s.faculty);
        }
      });
      timetableFaculty.forEach((t) => {
        if (t.faculty && !knownNames.has(t.faculty)) {
          facultyList.push({
            name: t.faculty,
            designation: 'Faculty',
            department: 'Academic Department',
          });
          knownNames.add(t.faculty);
        }
      });

      res.json({ success: true, data: facultyList });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
