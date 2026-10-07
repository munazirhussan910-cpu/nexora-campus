import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// Validation Schemas
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

const createTimetableSchema = z.object({
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
});

const updateTimetableSchema = createTimetableSchema.partial();

const createAcademicUpdateSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters'),
  content: z.string().trim().min(10, 'Content must be at least 10 characters'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).default('NORMAL'),
  targets: z
    .array(
      z.object({
        targetType: z.enum(['ALL', 'BRANCH', 'YEAR', 'SEMESTER', 'SECTION', 'SUBJECT']),
        targetValue: z.string().trim().min(1, 'Target value cannot be empty'),
      })
    )
    .min(1, 'At least one target filter is required'),
});

const updateAcademicUpdateSchema = z.object({
  title: z.string().trim().min(5).optional(),
  content: z.string().trim().min(10).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT']).optional(),
  targets: z
    .array(
      z.object({
        targetType: z.enum(['ALL', 'BRANCH', 'YEAR', 'SEMESTER', 'SECTION', 'SUBJECT']),
        targetValue: z.string().trim().min(1),
      })
    )
    .optional(),
});

// ==========================================
// 1. ACADEMIC OVERVIEW DASHBOARD
// ==========================================
/**
 * GET /api/academic/dashboard
 * Academic Officer Portal Overview
 * Metrics: Total Subjects, Active Faculty, Today's Classes, Recent Academic Updates
 */
router.get(
  '/dashboard',
  authenticate,
  requirePermission('academic.dashboard', 'academic.subject.read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Total Subjects
      const totalSubjects = await prisma.subject.count();

      // 2. Active Faculty count (distinct faculty listed in subjects & timetable)
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

      // 3. Today's Classes
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayDay = dayNames[new Date().getDay()];
      const queryDay = todayDay === 'SUNDAY' ? 'MONDAY' : todayDay;

      const todayClasses = await prisma.timetableEntry.findMany({
        where: { day: queryDay },
        include: {
          subject: { select: { code: true, name: true } },
          branch: { select: { code: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
      });

      // 4. Recent Academic Updates (Notices with academic targets)
      const recentUpdates = await prisma.notice.findMany({
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
        take: 6,
      });

      // 5. Academic Structure Summary
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
            totalSubjects,
            activeFaculty: activeFacultyCount,
            todayClasses: todayClasses.length,
            recentUpdates: recentUpdates.length,
          },
          todayDay: queryDay,
          todayClasses,
          recentUpdates,
          academicStructure: branches,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 2. SUBJECT MANAGEMENT
// ==========================================
/**
 * GET /api/academic/subjects
 * View all academic subjects with filtering
 */
router.get(
  '/subjects',
  authenticate,
  requirePermission('academic.subject.read'),
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

      res.json({
        success: true,
        data: subjects,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/academic/subjects
 * Create a new academic subject
 */
router.post(
  '/subjects',
  authenticate,
  requirePermission('academic.subject.create'),
  validateBody(createSubjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, name, branchId, year, semester, section, faculty } = req.body;

      // Verify branch exists
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        throw new AppError('Specified academic branch does not exist', 404);
      }

      // Check unique code
      const existing = await prisma.subject.findUnique({ where: { code } });
      if (existing) {
        throw new AppError(`Subject with code '${code}' already exists`, 409);
      }

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

      await AuditService.log({
        actorId: req.user!.id,
        action: 'SUBJECT_CREATED',
        entityType: 'SUBJECT',
        entityId: subject.id,
        newValues: { code, name, branch: branch.code, year, semester, section, faculty },
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
 * Edit an existing subject
 */
router.put(
  '/subjects/:id',
  authenticate,
  requirePermission('academic.subject.update'),
  validateBody(updateSubjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { code, name, branchId, year, semester, section, faculty } = req.body;

      const existing = await prisma.subject.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Subject not found', 404);
      }

      if (code && code !== existing.code) {
        const codeConflict = await prisma.subject.findUnique({ where: { code } });
        if (codeConflict) {
          throw new AppError(`Subject code '${code}' is already used by another subject`, 409);
        }
      }

      if (branchId) {
        const branch = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch) {
          throw new AppError('Specified branch not found', 404);
        }
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

      await AuditService.log({
        actorId: req.user!.id,
        action: 'SUBJECT_UPDATED',
        entityType: 'SUBJECT',
        entityId: updated.id,
        oldValues: existing,
        newValues: updated,
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
 * Delete a subject
 */
router.delete(
  '/subjects/:id',
  authenticate,
  requirePermission('academic.subject.delete'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);

      const existing = await prisma.subject.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Subject not found', 404);
      }

      await prisma.subject.delete({ where: { id } });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'SUBJECT_DELETED',
        entityType: 'SUBJECT',
        entityId: id,
        oldValues: existing,
      });

      res.json({
        success: true,
        message: `Subject ${existing.code} deleted successfully`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 3. TIMETABLE MANAGEMENT
// ==========================================
/**
 * GET /api/academic/timetable
 * View timetable entries
 */
router.get(
  '/timetable',
  authenticate,
  requirePermission('academic.timetable.read'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { branchId, year, semester, section, day } = req.query;

      const where: any = {};
      if (branchId) where.branchId = String(branchId);
      if (year) where.year = parseInt(String(year), 10);
      if (semester) where.semester = parseInt(String(semester), 10);
      if (section) where.section = String(section).toUpperCase();
      if (day) where.day = String(day).toUpperCase();

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
 * POST /api/academic/timetable
 * Create a new timetable entry
 */
router.post(
  '/timetable',
  authenticate,
  requirePermission('academic.timetable.create'),
  validateBody(createTimetableSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subjectId, branchId, year, semester, section, day, startTime, endTime, room, faculty } =
        req.body;

      // Verify subject and branch
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        throw new AppError('Subject not found', 404);
      }

      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        throw new AppError('Branch not found', 404);
      }

      const entry = await prisma.timetableEntry.create({
        data: {
          subjectId,
          branchId,
          year,
          semester: semester || subject.semester || year * 2 - 1,
          section: section ? section.toUpperCase() : subject.section || null,
          day,
          startTime,
          endTime,
          room,
          faculty: faculty || subject.faculty || 'Department Faculty',
        },
        include: {
          subject: true,
          branch: true,
        },
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'TIMETABLE_ENTRY_CREATED',
        entityType: 'TIMETABLE_ENTRY',
        entityId: entry.id,
        newValues: { subjectCode: subject.code, day, startTime, endTime, room, faculty },
      });

      res.status(201).json({
        success: true,
        message: 'Timetable entry scheduled successfully',
        data: entry,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/academic/timetable/:id
 * Edit timetable entry
 */
router.put(
  '/timetable/:id',
  authenticate,
  requirePermission('academic.timetable.update'),
  validateBody(updateTimetableSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.timetableEntry.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Timetable entry not found', 404);
      }

      const { subjectId, branchId, year, semester, section, day, startTime, endTime, room, faculty } =
        req.body;

      if (subjectId) {
        const sub = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!sub) throw new AppError('Subject not found', 404);
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
        },
        include: {
          subject: true,
          branch: true,
        },
      });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'TIMETABLE_ENTRY_UPDATED',
        entityType: 'TIMETABLE_ENTRY',
        entityId: id,
        oldValues: existing,
        newValues: updated,
      });

      res.json({
        success: true,
        message: 'Timetable entry updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/academic/timetable/:id
 * Delete timetable entry
 */
router.delete(
  '/timetable/:id',
  authenticate,
  requirePermission('academic.timetable.delete'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.timetableEntry.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Timetable entry not found', 404);
      }

      await prisma.timetableEntry.delete({ where: { id } });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'TIMETABLE_ENTRY_DELETED',
        entityType: 'TIMETABLE_ENTRY',
        entityId: id,
        oldValues: existing,
      });

      res.json({
        success: true,
        message: 'Timetable entry deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 4. ACADEMIC CLASS UPDATES (Notice Integration)
// ==========================================
/**
 * GET /api/academic/updates
 * View all published academic / class updates
 */
router.get(
  '/updates',
  authenticate,
  requirePermission('academic.update.read', 'notices.view'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

      res.json({
        success: true,
        data: formatted,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/academic/updates
 * Publish official academic / class update targeted to branch, year, semester, section, subject
 */
router.post(
  '/updates',
  authenticate,
  requirePermission('academic.update.create', 'notices.create'),
  validateBody(createAcademicUpdateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content, priority, targets } = req.body;

      const notice = await prisma.$transaction(async (tx) => {
        const n = await tx.notice.create({
          data: {
            title,
            content,
            priority,
            createdBy: req.user!.id,
            publishedAt: new Date(),
            status: 'PUBLISHED',
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
        action: 'ACADEMIC_UPDATE_PUBLISHED',
        entityType: 'NOTICE',
        entityId: notice.id,
        newValues: { title, priority, targets },
      });

      res.status(201).json({
        success: true,
        message: 'Official academic class update published successfully',
        data: notice,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/academic/updates/:id
 * Edit an existing academic class update
 */
router.put(
  '/updates/:id',
  authenticate,
  requirePermission('academic.update.update'),
  validateBody(updateAcademicUpdateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { title, content, priority, targets } = req.body;

      const existing = await prisma.notice.findUnique({
        where: { id },
        include: { targets: true },
      });

      if (!existing) {
        throw new AppError('Academic update notice not found', 404);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const n = await tx.notice.update({
          where: { id },
          data: {
            ...(title ? { title } : {}),
            ...(content ? { content } : {}),
            ...(priority ? { priority } : {}),
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
        action: 'ACADEMIC_UPDATE_MODIFIED',
        entityType: 'NOTICE',
        entityId: id,
        oldValues: existing,
        newValues: updated,
      });

      res.json({
        success: true,
        message: 'Academic update updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/academic/updates/:id
 * Delete an academic update notice
 */
router.delete(
  '/updates/:id',
  authenticate,
  requirePermission('academic.update.delete'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const existing = await prisma.notice.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Academic update notice not found', 404);
      }

      await prisma.notice.delete({ where: { id } });

      await AuditService.log({
        actorId: req.user!.id,
        action: 'ACADEMIC_UPDATE_DELETED',
        entityType: 'NOTICE',
        entityId: id,
        oldValues: existing,
      });

      res.json({
        success: true,
        message: 'Academic update deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 5. ATTENDANCE OVERVIEW (READ-ONLY FOR ACADEMIC OFFICER)
// ==========================================
/**
 * GET /api/academic/attendance
 * Read-only attendance overview for Academic Officer
 */
router.get(
  '/attendance',
  authenticate,
  requirePermission('academic.attendance.read'),
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

      res.json({
        success: true,
        data: formatted,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// 6. HELPER DATA (BRANCHES & FACULTY)
// ==========================================
/**
 * GET /api/academic/branches
 * List all branches for subject & timetable selectors
 */
router.get(
  '/branches',
  authenticate,
  requirePermission('academic.subject.read'),
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
 * List all available teaching faculty
 */
router.get(
  '/faculty',
  authenticate,
  requirePermission('academic.subject.read'),
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

      // Also grab any custom faculty names from timetable/subject seeds
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
