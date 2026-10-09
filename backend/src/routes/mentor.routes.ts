import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AuthenticatedRequest, AuthUser } from '../types/auth';
import { AppError } from '../middleware/error.middleware';

const router = Router();

const profileSchema = z.object({
  headline: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(600).optional().nullable(),
  linkedinUrl: z.string().trim().url().max(300).optional().nullable().or(z.literal('')),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  interests: z.string().trim().max(300).optional().nullable(),
  isAvailable: z.boolean(),
});

const requestSchema = z.object({
  mentorId: z.string().uuid(),
  message: z.string().trim().min(10).max(600),
});

const decisionSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  response: z.string().trim().max(600).optional(),
});

/**
 * Universal year and semester resolution helper
 * Reliably normalizes academic year across string formats, number formats, and semester conversions
 */
export function resolveStudentYear(student: {
  year?: number | string | null;
  semester?: number | string | null;
  admissionYear?: number | string | null;
} | null | undefined): number {
  if (!student) return 1;

  // 1. If explicit semester is provided:
  if (student.semester !== undefined && student.semester !== null) {
    const semStr = String(student.semester).trim();
    const semNum = parseInt(semStr.replace(/\D/g, ''), 10);
    if (!isNaN(semNum) && semNum >= 1 && semNum <= 8) {
      return Math.ceil(semNum / 2);
    }
  }

  // 2. If year is provided:
  if (student.year !== undefined && student.year !== null) {
    if (typeof student.year === 'number') {
      if (student.year >= 1 && student.year <= 4) return student.year;
      // If entered as semester number (e.g. 5-8):
      if (student.year >= 5 && student.year <= 8) return Math.ceil(student.year / 2);
    }

    const yearStr = String(student.year).trim().toUpperCase();

    if (yearStr === 'FIRST_YEAR' || yearStr.includes('1ST') || yearStr === 'FIRST') return 1;
    if (yearStr === 'SECOND_YEAR' || yearStr.includes('2ND') || yearStr === 'SECOND') return 2;
    if (yearStr === 'THIRD_YEAR' || yearStr.includes('3RD') || yearStr === 'THIRD') return 3;
    if (yearStr === 'FOURTH_YEAR' || yearStr.includes('4TH') || yearStr === 'FOURTH' || yearStr === 'FINAL_YEAR') return 4;

    // Check if it's formatted as "Semester X" or "Sem X"
    if (yearStr.includes('SEM')) {
      const match = yearStr.match(/(\d+)/);
      if (match) {
        const sem = parseInt(match[1], 10);
        if (sem >= 1 && sem <= 8) return Math.ceil(sem / 2);
      }
    }

    const digits = yearStr.replace(/\D/g, '');
    if (digits) {
      const num = parseInt(digits, 10);
      if (num >= 1 && num <= 4) return num;
      if (num >= 5 && num <= 8) return Math.ceil(num / 2);
    }
  }

  // 3. Fallback based on admission year relative to current academic calendar
  if (student.admissionYear && typeof student.admissionYear === 'number') {
    const currentAcademicYear = 2026;
    const diff = currentAcademicYear - student.admissionYear + 1;
    if (diff >= 1 && diff <= 4) return diff;
  }

  return 1;
}

/**
 * Mentor profile eligibility validation rule:
 * Students who are currently in 2nd year or above (Year >= 2) are eligible.
 */
export function isMentorEligible(student: any): boolean {
  return resolveStudentYear(student) >= 2;
}

async function currentStudent(user: AuthUser) {
  let student = null;
  if (user.studentId) {
    student = await prisma.student.findUnique({
      where: { id: user.studentId },
      include: { branch: true },
    });
  }
  if (!student) {
    student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { branch: true },
    });
  }
  if (!student) {
    throw new AppError('A student profile is required for mentorship.', 404, 'STUDENT_NOT_FOUND');
  }
  return student;
}

// List available mentors from later academic years. Contact details stay private.
router.get(
  '/',
  authenticate,
  requireRole('STUDENT', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await currentStudent(req.user!);
      const requesterYear = resolveStudentYear(student);
      const branch = typeof req.query.branch === 'string' ? req.query.branch : undefined;

      const mentors = await prisma.student.findMany({
        where: {
          id: { not: student.id },
          year: { gte: 2, gt: requesterYear },
          ...(branch ? { branch: { code: branch } } : {}),
          mentorProfile: { is: { isAvailable: true } },
        },
        include: { branch: true, mentorProfile: true },
        orderBy: [{ year: 'desc' }, { fullName: 'asc' }],
      });

      res.json({
        success: true,
        data: mentors.map((mentor) => ({
          id: mentor.id,
          fullName: mentor.fullName,
          rollNumber: mentor.rollNumber,
          year: resolveStudentYear(mentor),
          branch: mentor.branch.code,
          profile: mentor.mentorProfile,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticate, requireRole('STUDENT', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const student = await currentStudent(req.user!);
    const profile = await prisma.mentorProfile.findUnique({ where: { studentId: student.id } });
    const effectiveYear = resolveStudentYear(student);
    const effectiveSemester = (student as any).semester || (effectiveYear * 2);
    const isEligible = effectiveYear >= 2;

    res.json({
      success: true,
      data: {
        student: {
          ...student,
          year: effectiveYear,
          semester: effectiveSemester,
        },
        profile,
        isEligible,
        hasProfile: !!profile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Backend authorization check: enforce Year >= 2 for creating or updating mentor profile
router.put('/me', authenticate, requireRole('STUDENT', 'ADMIN'), validateBody(profileSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const student = await currentStudent(req.user!);
    if (!isMentorEligible(student)) {
      throw new AppError(
        'Mentor profiles are available from 2nd year onwards.',
        403,
        'MENTOR_INELIGIBLE'
      );
    }

    const profile = await prisma.mentorProfile.upsert({
      where: { studentId: student.id },
      update: { ...req.body, linkedinUrl: req.body.linkedinUrl || null },
      create: { studentId: student.id, ...req.body, linkedinUrl: req.body.linkedinUrl || null },
    });
    res.json({ success: true, data: profile, message: 'Mentor profile updated.' });
  } catch (err) {
    next(err);
  }
});

router.post('/requests', authenticate, requireRole('STUDENT', 'ADMIN'), validateBody(requestSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const requester = await currentStudent(req.user!);
    const requesterYear = resolveStudentYear(requester);

    const mentor = await prisma.student.findUnique({
      where: { id: req.body.mentorId },
      include: { mentorProfile: true },
    });

    const mentorYear = mentor ? resolveStudentYear(mentor) : 0;

    if (!mentor || !mentor.mentorProfile?.isAvailable || mentorYear <= requesterYear) {
      throw new AppError('This senior is not currently available for mentorship.', 422, 'MENTOR_UNAVAILABLE');
    }
    const existing = await prisma.mentorshipRequest.findFirst({
      where: { requesterId: requester.id, mentorId: mentor.id, status: 'PENDING' },
    });
    if (existing) throw new AppError('You already have a pending request with this mentor.', 409, 'REQUEST_EXISTS');

    const request = await prisma.mentorshipRequest.create({
      data: { requesterId: requester.id, mentorId: mentor.id, message: req.body.message },
    });
    res.status(201).json({ success: true, data: request, message: 'Guidance request sent to your senior.' });
  } catch (err) {
    next(err);
  }
});

router.get('/requests/incoming', authenticate, requireRole('STUDENT', 'ADMIN'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const mentor = await currentStudent(req.user!);
    const requests = await prisma.mentorshipRequest.findMany({
      where: { mentorId: mentor.id },
      include: { requester: { include: { branch: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

router.patch('/requests/:id', authenticate, requireRole('STUDENT', 'ADMIN'), validateBody(decisionSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const mentor = await currentStudent(req.user!);
    const requestId = String(req.params.id);
    const request = await prisma.mentorshipRequest.findFirst({ where: { id: requestId, mentorId: mentor.id } });
    if (!request) throw new AppError('Mentorship request not found.', 404, 'NOT_FOUND');
    if (request.status !== 'PENDING') throw new AppError('This mentorship request has already been decided.', 422, 'REQUEST_DECIDED');
    const updated = await prisma.mentorshipRequest.update({
      where: { id: request.id },
      data: {
        status: req.body.status as 'ACCEPTED' | 'DECLINED',
        response: typeof req.body.response === 'string' ? req.body.response : null,
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
