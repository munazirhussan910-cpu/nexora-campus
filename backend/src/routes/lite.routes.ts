import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// Strictly enforce STUDENT role for all Lite APIs
router.use(authenticate);
router.use(requireRole('STUDENT'));

/**
 * GET /api/lite/me
 * Ultra-compact payload delivering complete Student ID & Profile information.
 * Cached locally for offline access on weak campus networks.
 */
router.get('/me', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            email: true,
            profilePhotoUrl: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        hostelRoom: {
          select: {
            roomNumber: true,
            hostelBlock: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student profile not found for this account.',
        },
      });
      return;
    }

    const hostelInfo = student.hostelRoom
      ? `${student.hostelRoom.hostelBlock.name} • Room ${student.hostelRoom.roomNumber}`
      : 'Day Scholar';

    // Canonical verification payload for student QR Code
    const qrData = `NEXORA:STUDENT:${student.rollNumber}:${student.fullName}:${student.branch?.code || 'CSE'}:${student.hostelRoom?.roomNumber || 'NA'}`;

    res.status(200).json({
      success: true,
      data: {
        id: student.id,
        userId: req.user!.id,
        email: student.user.email,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        department: student.branch?.code || 'CSE',
        branchName: student.branch?.name || 'Computer Science & Engineering',
        year: student.year,
        semester: student.year * 2,
        section: 'A',
        hostel: hostelInfo,
        roomNumber: student.hostelRoom?.roomNumber || 'N/A',
        hostelBlock: student.hostelRoom?.hostelBlock.name || 'Day Scholar',
        phone: student.phone || '',
        parentPhone: student.parentPhone || '',
        institution: 'Biju Patnaik University of Technology (BPUT)',
        status: 'ACTIVE',
        profilePhotoUrl: student.user.profilePhotoUrl,
        qrCodeData: qrData,
        role: 'STUDENT',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/lite/attendance
 * Compact overall summary and subject-wise attendance numbers.
 */
router.get('/attendance', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student record not found.' },
      });
      return;
    }

    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: {
        subject: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { subject: { code: 'asc' } },
    });

    // Check individual session records for EXCUSED
    const sessionRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: { session: { select: { subjectId: true, date: true } } },
    });

    const recordsBySub = new Map<string, typeof sessionRecords>();
    let latestDate: Date | null = null;
    for (const r of sessionRecords) {
      if (!recordsBySub.has(r.session.subjectId)) {
        recordsBySub.set(r.session.subjectId, []);
      }
      recordsBySub.get(r.session.subjectId)!.push(r);
      if (!latestDate || r.session.date > latestDate) {
        latestDate = r.session.date;
      }
    }

    let overallTotal = 0;
    let overallAttended = 0;

    const subjects = attendances.map((item) => {
      const sRecs = recordsBySub.get(item.subjectId);
      let present = item.present;
      let total = item.total;

      if (sRecs && sRecs.length > 0) {
        const excused = sRecs.filter((r) => r.status === 'EXCUSED').length;
        total = Math.max(0, sRecs.length - excused);
        present = sRecs.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
      }

      overallTotal += total;
      overallAttended += present;

      const pct = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;
      let status: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
      if (pct < 65) status = 'CRITICAL';
      else if (pct < 75) status = 'WARNING';

      return {
        code: item.subject.code,
        name: item.subject.name,
        attended: present,
        total,
        percentage: pct,
        status,
      };
    });

    const overallPercentage =
      overallTotal > 0 ? Number(((overallAttended / overallTotal) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        overallPercentage,
        totalClasses: overallTotal,
        attendedClasses: overallAttended,
        lastUpdated: latestDate ? latestDate.toISOString() : new Date().toISOString(),
        subjects,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/lite/timetable
 * Compact daily schedule and weekly timetable for student.
 */
router.get('/timetable', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student record not found.' },
      });
      return;
    }

    const entries = await prisma.timetableEntry.findMany({
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

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = dayNames[new Date().getDay()];

    const formatted = entries.map((e) => ({
      id: e.id,
      day: e.day,
      time: `${e.startTime} - ${e.endTime}`,
      subjectCode: e.subject.code,
      subjectName: e.subject.name,
      room: e.room,
      faculty: e.faculty || 'Dept. Faculty',
    }));

    const todayClasses = formatted.filter((e) => e.day === currentDay);

    res.status(200).json({
      success: true,
      data: {
        todayDay: currentDay,
        todayClasses,
        allEntries: formatted,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/lite/updates
 * Compact notifications, announcements, and class updates.
 */
router.get('/updates', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        publishedAt: true,
        author: {
          select: {
            username: true,
            staff: {
              select: {
                fullName: true,
                designation: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      take: 15,
    });

    res.status(200).json({
      success: true,
      data: {
        updates: notices.map((n) => {
          const author = n.author.staff?.fullName || n.author.username || 'Academic Office';
          return {
            id: n.id,
            title: n.title,
            content: n.content.length > 150 ? `${n.content.slice(0, 150)}...` : n.content,
            fullContent: n.content,
            priority: n.priority,
            author,
            date: n.publishedAt.toISOString(),
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/lite/requests
 * Single compact endpoint fetching all recent student requests (Complaints, Gate Passes, Bonafides, Leaves).
 */
router.get('/requests', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await prisma.request.findMany({
      where: { requesterId: req.user!.id },
      select: {
        id: true,
        requestNumber: true,
        status: true,
        priority: true,
        title: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        requestType: {
          select: {
            code: true,
            name: true,
          },
        },
        gatePass: {
          select: {
            id: true,
            destination: true,
            reason: true,
            passPin: true,
            qrTokenHash: true,
            gateStatus: true,
            departureTime: true,
            expectedReturnTime: true,
          },
        },
        bonafide: {
          select: {
            id: true,
            purpose: true,
            certificateId: true,
            documentUrl: true,
          },
        },
        leaveRequest: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            reason: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const items = requests.map((r) => {
      let type: 'COMPLAINT' | 'GATE_PASS' | 'BONAFIDE' | 'LEAVE' = 'COMPLAINT';
      if (r.requestType.code === 'GATE_PASS') type = 'GATE_PASS';
      else if (r.requestType.code === 'BONAFIDE') type = 'BONAFIDE';
      else if (r.requestType.code === 'LEAVE') type = 'LEAVE';

      return {
        id: r.id,
        number: r.requestNumber,
        type,
        typeName: r.requestType.name,
        title: r.title,
        status: r.status,
        priority: r.priority,
        location: r.location,
        createdAt: r.createdAt.toISOString(),
        gatePass: r.gatePass
          ? {
              destination: r.gatePass.destination,
              reason: r.gatePass.reason,
              pin: r.gatePass.passPin,
              qrTokenHash: r.gatePass.qrTokenHash,
              gateStatus: r.gatePass.gateStatus,
              departureTime: r.gatePass.departureTime.toISOString(),
              expectedReturnTime: r.gatePass.expectedReturnTime.toISOString(),
            }
          : undefined,
        bonafide: r.bonafide
          ? {
              purpose: r.bonafide.purpose,
              certificateId: r.bonafide.certificateId,
              pdfUrl: r.bonafide.documentUrl,
            }
          : undefined,
        leave: r.leaveRequest
          ? {
              startDate: r.leaveRequest.startDate.toISOString(),
              endDate: r.leaveRequest.endDate.toISOString(),
              reason: r.leaveRequest.reason,
              leaveStatus: r.leaveRequest.status,
            }
          : undefined,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        requests: items,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
