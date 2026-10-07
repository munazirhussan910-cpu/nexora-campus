import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { AuthenticatedRequest, AuthUser } from '../types/auth';

const router = Router();

// Helper to reliably retrieve the Student entity for the authenticated user
const getStudentForUser = async (user: AuthUser) => {
  if (user.studentId) {
    const student = await prisma.student.findUnique({
      where: { id: user.studentId },
      include: { branch: true },
    });
    if (student) return student;
  }
  return prisma.student.findUnique({
    where: { userId: user.id },
    include: { branch: true },
  });
};

/**
 * GET /api/student/attendance
 * Returns subject-wise and overall attendance for the authenticated student.
 * Cross-student access is strictly prevented by resolving the student ID from the session.
 */
router.get(
  '/attendance',
  authenticate,
  requireRole('STUDENT', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await getStudentForUser(req.user!);

      if (!student) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'No student profile linked to this account.',
          },
        });
        return;
      }

      // Fetch attendance records specifically for this student
      const attendances = await prisma.attendance.findMany({
        where: { studentId: student.id },
        include: {
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: {
          subject: {
            code: 'asc',
          },
        },
      });

      let totalPresent = 0;
      let totalClasses = 0;

      const records = attendances.map((item) => {
        const present = item.present;
        const total = item.total;
        const absent = Math.max(0, total - present);
        totalPresent += present;
        totalClasses += total;

        const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;
        const isAbove = percentage >= 75.0;

        return {
          id: item.id,
          subjectId: item.subjectId,
          subjectCode: item.subject.code,
          subjectName: item.subject.name,
          present,
          absent,
          total,
          percentage,
          isAboveThreshold: isAbove,
        };
      });

      // Fetch recent daily attendance history sessions
      const recentHistoryRecords = await prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        include: {
          session: {
            include: {
              subject: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
        orderBy: {
          session: {
            date: 'desc',
          },
        },
        take: 30,
      });

      const recentHistory = recentHistoryRecords.map((r) => ({
        id: r.id,
        sessionId: r.attendanceSessionId,
        date: r.session.date,
        subjectCode: r.session.subject.code,
        subjectName: r.session.subject.name,
        period: r.session.period,
        status: r.status,
        remarks: r.remarks,
      }));

      const overallPercentage =
        totalClasses > 0 ? Number(((totalPresent / totalClasses) * 100).toFixed(1)) : 0;
      const isOverallAbove = overallPercentage >= 75.0;

      // Mathematical margin calculation:
      // If above 75%: How many consecutive classes can be safely missed?
      // present / (total + x) >= 0.75 => x <= (present - 0.75 * total) / 0.75
      // If below 75%: How many consecutive classes must be attended?
      // (present + y) / (total + y) >= 0.75 => y >= (0.75 * total - present) / 0.25
      const safeMisses =
        isOverallAbove && totalClasses > 0
          ? Math.max(0, Math.floor((totalPresent - 0.75 * totalClasses) / 0.75))
          : 0;

      const neededAttends =
        !isOverallAbove && totalClasses > 0
          ? Math.max(0, Math.ceil((0.75 * totalClasses - totalPresent) / 0.25))
          : 0;

      const statusInsight = isOverallAbove
        ? totalClasses === 0
          ? 'Attendance tracking has just commenced for this semester.'
          : safeMisses > 0
          ? `Your attendance is above the 75% threshold. You can miss up to ${safeMisses} upcoming class${safeMisses > 1 ? 'es' : ''} and still maintain 75%.`
          : 'Your attendance is above the 75% threshold. Attend upcoming classes to build a safety buffer.'
        : `Your attendance is below the 75% threshold. Attend the next ${neededAttends} consecutive class${neededAttends > 1 ? 'es' : ''} to recover.`;

      res.json({
        success: true,
        data: {
          student: {
            id: student.id,
            fullName: student.fullName,
            rollNumber: student.rollNumber,
            branch: student.branch.code,
            year: student.year,
          },
          overall: {
            present: totalPresent,
            absent: Math.max(0, totalClasses - totalPresent),
            total: totalClasses,
            percentage: overallPercentage,
            threshold: 75.0,
            isAboveThreshold: isOverallAbove,
            statusMessage: isOverallAbove
              ? 'Your attendance is above the 75% threshold.'
              : 'Attendance Alert: Below 75% mandatory threshold.',
            insight: statusInsight,
          },
          records,
          recentHistory,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/student/timetable
 * Returns current day timetable and full weekly timetable matching student's branch & year.
 */
router.get(
  '/timetable',
  authenticate,
  requireRole('STUDENT', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await getStudentForUser(req.user!);

      if (!student) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'No student profile linked to this account.',
          },
        });
        return;
      }

      const allEntries = await prisma.timetableEntry.findMany({
        where: {
          branchId: student.branchId,
          year: student.year,
        },
        include: {
          subject: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        orderBy: [{ startTime: 'asc' }],
      });

      // Map day index to day name
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayDay = dayNames[new Date().getDay()];

      const formatted = allEntries.map((e) => ({
        id: e.id,
        day: e.day,
        startTime: e.startTime,
        endTime: e.endTime,
        timeDisplay: `${e.startTime} – ${e.endTime}`,
        subjectCode: e.subject.code,
        subjectName: e.subject.name,
        room: e.room,
        faculty: e.faculty || 'Department Faculty',
        section: e.section || null,
      }));

      // Group by day of week
      const weekly: Record<string, typeof formatted> = {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
      };

      for (const item of formatted) {
        if (weekly[item.day]) {
          weekly[item.day].push(item);
        }
      }

      // If requested for a specific day via query
      const dayFilter = typeof req.query.day === 'string' ? req.query.day.toUpperCase() : null;
      const todayClasses = weekly[todayDay] || [];

      res.json({
        success: true,
        data: {
          studentCohort: {
            branchCode: student.branch.code,
            branchName: student.branch.name,
            year: student.year,
          },
          today: todayDay,
          todayClasses,
          weekly,
          filteredClasses: dayFilter && weekly[dayFilter] ? weekly[dayFilter] : null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/student/class-updates
 * Reuses the existing Notice & NoticeTarget infrastructure to serve relevant academic/class updates.
 */
router.get(
  '/class-updates',
  authenticate,
  requireRole('STUDENT', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await getStudentForUser(req.user!);

      if (!student) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'No student profile linked to this account.',
          },
        });
        return;
      }

      // Query student subjects to match subject-specific class updates
      const studentSubjects = await prisma.subject.findMany({
        where: { branchId: student.branchId, year: student.year },
        select: { code: true },
      });
      const subjectCodes = studentSubjects.map((s) => s.code);

      // Query notices matching student's branch, year, semester, section, subject, or ALL targets
      const notices = await prisma.notice.findMany({
        where: {
          status: 'PUBLISHED',
          targets: {
            some: {
              OR: [
                { targetType: 'ALL' },
                { targetType: 'BRANCH', targetValue: student.branch.code },
                { targetType: 'YEAR', targetValue: String(student.year) },
                { targetType: 'SEMESTER', targetValue: String(student.year * 2 - 1) },
                { targetType: 'SEMESTER', targetValue: String(student.year * 2) },
                { targetType: 'SECTION', targetValue: 'A' },
                ...(subjectCodes.length > 0
                  ? subjectCodes.map((code) => ({ targetType: 'SUBJECT', targetValue: code }))
                  : []),
              ],
            },
          },
        },
        include: {
          targets: true,
          author: {
            select: {
              username: true,
              staff: {
                select: {
                  fullName: true,
                  designation: true,
                  department: true,
                },
              },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      });

      // Filter and format notices into clean class & academic updates
      const updates = notices.map((n) => {
        // Parse subject if formatted as "Subject — Details" or "[Subject] Details"
        let subjectName = 'General Academic';
        let headline = n.title;

        if (n.title.includes('—')) {
          const parts = n.title.split('—');
          subjectName = parts[0].trim();
          headline = parts.slice(1).join('—').trim();
        } else if (n.title.includes(':')) {
          const parts = n.title.split(':');
          subjectName = parts[0].trim();
          headline = parts.slice(1).join(':').trim();
        }

        return {
          id: n.id,
          rawTitle: n.title,
          subject: subjectName,
          headline,
          content: n.content,
          priority: n.priority,
          publishedAt: n.publishedAt,
          author: n.author.staff?.fullName || n.author.username,
          authorRole: n.author.staff?.designation || 'Academic Faculty',
          targets: n.targets.map((t) => `${t.targetType}:${t.targetValue}`),
        };
      });

      res.json({
        success: true,
        data: updates,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/student/academic-overview
 * Compact payload for the Student Dashboard "Academic Snapshot" card
 */
router.get(
  '/academic-overview',
  authenticate,
  requireRole('STUDENT', 'ADMIN'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await getStudentForUser(req.user!);

      if (!student) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'No student profile linked to this account.',
          },
        });
        return;
      }

      // 1. Attendance aggregation
      const attendances = await prisma.attendance.findMany({
        where: { studentId: student.id },
        select: { present: true, total: true },
      });

      let totalPresent = 0;
      let totalClasses = 0;
      for (const a of attendances) {
        totalPresent += a.present;
        totalClasses += a.total;
      }

      const overallPercentage =
        totalClasses > 0 ? Number(((totalPresent / totalClasses) * 100).toFixed(1)) : 0;

      // 2. Today's classes
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayDay = dayNames[new Date().getDay()];

      const todayClasses = await prisma.timetableEntry.findMany({
        where: {
          branchId: student.branchId,
          year: student.year,
          day: todayDay === 'SUNDAY' ? 'MONDAY' : todayDay, // Fallback to Monday if viewed on Sunday
        },
        include: {
          subject: { select: { name: true, code: true } },
        },
        orderBy: { startTime: 'asc' },
      });

      // Determine next upcoming class or display first class of the day
      const now = new Date();
      const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      let nextClass = todayClasses.find((c) => c.startTime >= currentHourMinute);
      if (!nextClass && todayClasses.length > 0) {
        nextClass = todayClasses[0]; // Next scheduled morning session
      }

      // 3. Count of recent class updates
      const studentSubCount = await prisma.subject.findMany({
        where: { branchId: student.branchId, year: student.year },
        select: { code: true },
      });
      const subCodesForCount = studentSubCount.map((s) => s.code);

      const updatesCount = await prisma.notice.count({
        where: {
          status: 'PUBLISHED',
          targets: {
            some: {
              OR: [
                { targetType: 'ALL' },
                { targetType: 'BRANCH', targetValue: student.branch.code },
                { targetType: 'YEAR', targetValue: String(student.year) },
                { targetType: 'SEMESTER', targetValue: String(student.year * 2 - 1) },
                { targetType: 'SEMESTER', targetValue: String(student.year * 2) },
                { targetType: 'SECTION', targetValue: 'A' },
                ...(subCodesForCount.length > 0
                  ? subCodesForCount.map((code) => ({ targetType: 'SUBJECT', targetValue: code }))
                  : []),
              ],
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          attendance: {
            percentage: overallPercentage,
            present: totalPresent,
            total: totalClasses,
            isAboveThreshold: overallPercentage >= 75.0,
          },
          todayClassesCount: todayClasses.length,
          nextClass: nextClass
            ? {
                subject: nextClass.subject.name,
                code: nextClass.subject.code,
                time: nextClass.startTime,
                room: nextClass.room,
                faculty: nextClass.faculty,
              }
            : null,
          recentUpdatesCount: updatesCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
