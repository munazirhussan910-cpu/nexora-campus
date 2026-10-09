import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from '../services/audit.service';
import { getWardenHostelBlock } from '../services/warden.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

const dayEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

const mealEnum = z.enum(['BREAKFAST', 'LUNCH', 'DINNER']);

const mealItemSchema = z.object({
  day: dayEnum,
  meal: mealEnum,
  items: z.string().min(1, 'Meal item description is required'),
  timings: z.string().optional().nullable(),
  specialNotes: z.string().optional().nullable(),
});

const updateMessMenuSchema = z
  .object({
    hostelBlockId: z.string().optional(),
    day: dayEnum.optional(),
    meal: mealEnum.optional(),
    items: z.string().optional(),
    timings: z.string().optional().nullable(),
    specialNotes: z.string().optional().nullable(),
    updates: z.array(mealItemSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.updates && data.updates.length > 0) return true;
      if (data.day && data.meal && data.items) return true;
      return false;
    },
    {
      message:
        'Please provide either a single meal update (day, meal, items) or an array of meal updates.',
    }
  );

/**
 * Helper to resolve the target hostel block ID based on the authenticated user's role:
 * - STUDENT: Must reside in a hostel; returns student's hostel block ID.
 * - WARDEN: Resolves warden's assigned block, or accepts requested hostelBlockId query param.
 * - ADMIN: Accepts requested hostelBlockId query param, or defaults to first available block.
 */
async function resolveHostelBlockForUser(
  req: AuthenticatedRequest
): Promise<{ block: any; allBlocks: any[]; isHostelResident: boolean }> {
  const user = req.user!;
  const allBlocks = await prisma.hostelBlock.findMany({
    orderBy: { name: 'asc' },
  });

  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        hostelRoom: {
          include: { hostelBlock: true },
        },
      },
    });

    if (!student || !student.hostelRoomId || !student.hostelRoom?.hostelBlock) {
      return { block: null, allBlocks, isHostelResident: false };
    }

    return {
      block: student.hostelRoom.hostelBlock,
      allBlocks,
      isHostelResident: true,
    };
  }

  // WARDEN or ADMIN
  const requestedBlockId = req.query.hostelBlockId as string | undefined;

  if (requestedBlockId) {
    const matched = allBlocks.find((b) => b.id === requestedBlockId);
    if (matched) {
      return { block: matched, allBlocks, isHostelResident: true };
    }
  }

  if (user.role === 'WARDEN') {
    const wardenBlockInfo = await getWardenHostelBlock(user);
    if (wardenBlockInfo) {
      const matched = allBlocks.find((b) => b.id === wardenBlockInfo.id);
      if (matched) {
        return { block: matched, allBlocks, isHostelResident: true };
      }
    }
  }

  return {
    block: allBlocks[0] || null,
    allBlocks,
    isHostelResident: true,
  };
}

/**
 * GET /api/mess-menu
 * Fetches the weekly hostel mess menu, including today's menu and complete schedule.
 * Access Control:
 * - Hostel Students: Read-only access to their assigned hostel block menu.
 * - Wardens & Admins: Read access to their assigned or selected hostel block menu.
 * - Non-hostel students and unauthorized roles are blocked with 403 Forbidden.
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      if (!['STUDENT', 'WARDEN', 'ADMIN'].includes(user.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Role '${user.role}' is not authorized to access the hostel mess menu.`,
          },
        });
        return;
      }

      const { block, allBlocks, isHostelResident } = await resolveHostelBlockForUser(req);

      if (user.role === 'STUDENT' && !isHostelResident) {
        res.status(403).json({
          success: false,
          error: {
            code: 'HOSTEL_RESIDENT_REQUIRED',
            message:
              'Hostel Mess Menu is exclusively accessible to students residing in campus hostels.',
          },
        });
        return;
      }

      if (!block) {
        res.status(404).json({
          success: false,
          error: {
            code: 'HOSTEL_BLOCK_NOT_FOUND',
            message: 'No hostel block configuration found.',
          },
        });
        return;
      }

      const menuRecords = await prisma.messMenu.findMany({
        where: { hostelBlockId: block.id },
        include: {
          updater: {
            select: {
              id: true,
              username: true,
              staff: { select: { designation: true, fullName: true } },
            },
          },
        },
      });

      const days = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ];
      const meals = ['BREAKFAST', 'LUNCH', 'DINNER'];

      // Organize weekly schedule
      const weekly: Record<string, Record<string, any>> = {};
      for (const d of days) {
        weekly[d] = {
          BREAKFAST: null,
          LUNCH: null,
          DINNER: null,
        };
      }

      let lastUpdated: Date | null = null;
      let lastUpdatedBy: string | null = null;

      for (const record of menuRecords) {
        if (weekly[record.day]) {
          weekly[record.day][record.meal] = {
            id: record.id,
            day: record.day,
            meal: record.meal,
            items: record.items,
            timings: record.timings || null,
            specialNotes: record.specialNotes || null,
            updatedAt: record.updatedAt,
            updatedBy:
              record.updater?.staff?.fullName ||
              record.updater?.username ||
              null,
          };
        }

        if (!lastUpdated || record.updatedAt > lastUpdated) {
          lastUpdated = record.updatedAt;
          lastUpdatedBy =
            record.updater?.staff?.fullName ||
            record.updater?.username ||
            null;
        }
      }

      // Compute current day
      const dayNames = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ];
      const todayDay = dayNames[new Date().getDay()];
      const todayMenu = weekly[todayDay] || {
        BREAKFAST: null,
        LUNCH: null,
        DINNER: null,
      };

      const canEdit = ['WARDEN', 'ADMIN'].includes(user.role);

      res.json({
        success: true,
        data: {
          hostelBlock: {
            id: block.id,
            name: block.name,
            gender: block.gender,
            wardenName: block.wardenName,
          },
          availableBlocks: allBlocks.map((b) => ({
            id: b.id,
            name: b.name,
            gender: b.gender,
            wardenName: b.wardenName,
          })),
          today: todayDay,
          todayMenu,
          weekly,
          canEdit,
          lastUpdated,
          lastUpdatedBy,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT/POST /api/mess-menu
 * Create and update hostel mess menu entries for Monday through Sunday.
 * Access Control: Strictly Wardens and Admins.
 */
const handleUpdateMenu = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const body = req.body;

    let targetBlockId = body.hostelBlockId;

    if (!targetBlockId) {
      if (user.role === 'WARDEN') {
        const wardenBlock = await getWardenHostelBlock(user);
        targetBlockId = wardenBlock?.id;
      }
      if (!targetBlockId) {
        const firstBlock = await prisma.hostelBlock.findFirst({
          orderBy: { name: 'asc' },
        });
        targetBlockId = firstBlock?.id;
      }
    }

    if (!targetBlockId) {
      throw new AppError('Hostel block could not be resolved', 400);
    }

    const block = await prisma.hostelBlock.findUnique({
      where: { id: targetBlockId },
    });

    if (!block) {
      throw new AppError(`Hostel block with id '${targetBlockId}' not found`, 404);
    }

    // Determine updates list
    const updatesList =
      body.updates && body.updates.length > 0
        ? body.updates
        : [
            {
              day: body.day,
              meal: body.meal,
              items: body.items,
              timings: body.timings,
              specialNotes: body.specialNotes,
            },
          ];

    // Execute database mutations in a transaction
    const upserted = await prisma.$transaction(
      updatesList.map((u: any) =>
        prisma.messMenu.upsert({
          where: {
            hostelBlockId_day_meal: {
              hostelBlockId: block.id,
              day: u.day,
              meal: u.meal,
            },
          },
          update: {
            items: u.items,
            timings: u.timings !== undefined ? u.timings : undefined,
            specialNotes: u.specialNotes !== undefined ? u.specialNotes : undefined,
            updatedBy: user.id,
          },
          create: {
            hostelBlockId: block.id,
            day: u.day,
            meal: u.meal,
            items: u.items,
            timings: u.timings || null,
            specialNotes: u.specialNotes || null,
            updatedBy: user.id,
          },
        })
      )
    );

    // Record immutable audit log entry
    await AuditService.log({
      actorId: user.id,
      action: 'MESS_MENU_UPDATED',
      entityType: 'MESS_MENU',
      entityId: block.id,
      newValues: {
        hostelBlockName: block.name,
        updatedEntriesCount: updatesList.length,
        entries: updatesList.map((u: any) => ({
          day: u.day,
          meal: u.meal,
          items: u.items,
        })),
      },
    });

    res.json({
      success: true,
      message: `Hostel mess menu for ${block.name} updated successfully.`,
      data: {
        hostelBlock: {
          id: block.id,
          name: block.name,
        },
        updatedCount: upserted.length,
        entries: upserted,
      },
    });
  } catch (err) {
    next(err);
  }
};

router.put(
  '/',
  authenticate,
  requireRole('WARDEN', 'ADMIN'),
  validateBody(updateMessMenuSchema),
  handleUpdateMenu
);

router.post(
  '/',
  authenticate,
  requireRole('WARDEN', 'ADMIN'),
  validateBody(updateMessMenuSchema),
  handleUpdateMenu
);

export default router;
