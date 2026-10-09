import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { config } from '../config/env';
import { authenticate, clearAuthSessionCache } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AuthenticatedRequest } from '../types/auth';
import { resolveStudentYear } from './mentor.routes';
import { AuditService } from '../services/audit.service';
import { AppError } from '../middleware/error.middleware';
import { StorageService } from '../services/storage.service';

const router = Router();

const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

const switchPersonaSchema = z.object({
  persona: z.enum(['aryan', 'ramesh', 'suresh', 'warden', 'security', 'academic', 'admin', 'faculty']),
});

const registerStudentSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full Name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid campus email address'),
    rollNumber: z
      .string()
      .trim()
      .min(3, 'Student ID / Roll Number must be at least 3 characters'),
    department: z
      .string()
      .trim()
      .min(1, 'Department is required'),
    year: z
      .union([z.number().int(), z.string().trim()])
      .refine(
        (val) => {
          const y = resolveStudentYear({ year: val });
          return y >= 1 && y <= 4;
        },
        { message: 'Please provide a valid semester (1-8) or academic year (1-4)' }
      )
      .transform((val) => resolveStudentYear({ year: val })),
    hostel: z.string().trim().optional(),
    roomNumber: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
    role: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// GET /api/auth/register-options - Provide departments, hostel options, and year choices
router.get('/register-options', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [branches, blocks] = await Promise.all([
      prisma.branch.findMany({ orderBy: { code: 'asc' } }),
      prisma.hostelBlock.findMany({ orderBy: { name: 'asc' } }),
    ]);

    res.json({
      success: true,
      data: {
        departments: branches.map((b) => ({
          id: b.id,
          code: b.code,
          name: b.name,
        })),
        hostels: [
          ...blocks.map((hb) => ({
            id: hb.id,
            name: hb.name,
            gender: hb.gender,
          })),
          { id: 'day-scholar', name: 'Day Scholar (Non-Resident)', gender: 'COED' },
        ],
        years: [
          { value: 1, label: '1st Year (Semester 1 & 2)' },
          { value: 2, label: '2nd Year (Semester 3 & 4)' },
          { value: 3, label: '3rd Year (Semester 5 & 6)' },
          { value: 4, label: '4th Year (Semester 7 & 8)' },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register - Self-registration for Students only
router.post(
  '/register',
  validateBody(registerStudentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        fullName,
        email,
        rollNumber,
        department,
        year,
        hostel,
        roomNumber,
        phone,
        password,
        role,
      } = req.body;

      // STRICT SECURITY ENFORCEMENT: Never trust privileged role input from frontend
      if (role && String(role).trim().toUpperCase() !== 'STUDENT') {
        res.status(400).json({
          success: false,
          error: {
            code: 'PRIVILEGED_ROLE_FORBIDDEN',
            message: 'Privileged accounts cannot be self-registered. Only student registration is permitted.',
          },
        });
        return;
      }

      // 1. Check duplicate email
      const existingUserByEmail = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });
      if (existingUserByEmail) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'An account with this campus email already exists.',
          },
        });
        return;
      }

      // 2. Check duplicate roll number (Student ID)
      const existingStudentByRoll = await prisma.student.findFirst({
        where: { rollNumber: rollNumber.trim() },
      });
      if (existingStudentByRoll) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_STUDENT_ID',
            message: 'This Student ID is already registered.',
          },
        });
        return;
      }

      // 3. Authoritatively fetch STUDENT role from database
      const studentRole = await prisma.role.findUnique({
        where: { name: 'STUDENT' },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      if (!studentRole) {
        res.status(500).json({
          success: false,
          error: {
            code: 'SYSTEM_ERROR',
            message: 'Student role is not configured in the campus database',
          },
        });
        return;
      }

      // 4. Resolve Department / Branch
      let branch = await prisma.branch.findFirst({
        where: {
          OR: [
            { code: department.toUpperCase() },
            { name: { contains: department } },
            { id: department },
          ],
        },
      });

      if (!branch) {
        const allBranches = await prisma.branch.findMany();
        branch = allBranches.find(
          (b) =>
            department.toLowerCase().includes(b.code.toLowerCase()) ||
            b.name.toLowerCase().includes(department.toLowerCase())
        ) || null;

        if (!branch) {
          if (allBranches.length > 0) {
            branch = allBranches[0];
          } else {
            branch = await prisma.branch.create({
              data: {
                code: department.slice(0, 5).toUpperCase(),
                name: department,
              },
            });
          }
        }
      }

      // 5. Resolve Hostel & Room if applicable
      let hostelRoomId: string | null = null;
      const isDayScholar =
        !hostel ||
        ['day scholar', 'dayscholar', 'day-scholar', 'non-resident', 'none', 'n/a'].includes(
          hostel.toLowerCase()
        );

      if (!isDayScholar) {
        const block = await prisma.hostelBlock.findFirst({
          where: {
            OR: [
              { name: { contains: hostel } },
              { id: hostel },
            ],
          },
        });

        if (block) {
          let room = null;
          if (roomNumber) {
            room = await prisma.room.findFirst({
              where: {
                hostelBlockId: block.id,
                roomNumber: roomNumber.trim(),
              },
            });
          }
          if (!room) {
            // Pick an available room or first room in the block
            room = await prisma.room.findFirst({
              where: { hostelBlockId: block.id },
            });
          }
          if (room) {
            hostelRoomId = room.id;
          }
        }
      }

      // 6. Generate unique base username
      let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!baseUsername || baseUsername.length < 2) {
        baseUsername = `student_${rollNumber.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
      }
      let username = baseUsername;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix++}`;
      }

      // 7. Secure password hashing
      const passwordHash = await bcrypt.hash(password, 10);

      // 8. Atomic Database Transaction: Create User + Student Profile
      const { createdUser, createdStudent } = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            email: email.toLowerCase(),
            passwordHash,
            roleId: studentRole.id, // Strictly assigned STUDENT role
            isActive: true,
            lastLoginAt: new Date(),
          },
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            rollNumber: rollNumber.trim(),
            fullName: fullName.trim(),
            branchId: branch!.id,
            year: Number(year),
            phone: phone ? phone.trim() : null,
            hostelRoomId,
            admissionYear: 2026 - Number(year) + 1,
          },
          include: {
            branch: true,
            hostelRoom: { include: { hostelBlock: true } },
          },
        });

        return { createdUser: user, createdStudent: student };
      });

      // 9. Sign JWT Token & Set HTTP-Only Cookie
      const token = jwt.sign({ userId: createdUser.id }, config.jwtSecret, {
        expiresIn: '7d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const permissions = studentRole.permissions.map((rp) => rp.permission.code);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: createdUser.id,
            username: createdUser.username,
            email: createdUser.email,
            role: 'STUDENT',
            permissions,
            fullName: createdStudent.fullName,
            rollNumber: createdStudent.rollNumber,
            department: createdStudent.branch?.name,
            branch: createdStudent.branch?.code,
            year: createdStudent.year,
            hostelBlock: createdStudent.hostelRoom?.hostelBlock.name,
            roomNumber: createdStudent.hostelRoom?.roomNumber,
            profilePhotoUrl: null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { usernameOrEmail, password } = req.body;
      const cleanIdentifier = usernameOrEmail.trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanIdentifier.toLowerCase() },
            { username: cleanIdentifier.toLowerCase() },
            { student: { rollNumber: cleanIdentifier } },
          ],
        },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
          student: {
            include: {
              branch: true,
              hostelRoom: { include: { hostelBlock: true } },
            },
          },
          staff: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username/email or password.' },
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username/email or password.' },
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_DISABLED', message: 'This account has been deactivated.' },
        });
        return;
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Sign JWT Token
      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: '7d',
      });

      // Set HTTP-Only Cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const permissions = user.role.permissions.map((rp) => rp.permission.code);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name,
            permissions,
            fullName: user.student?.fullName || user.staff?.fullName,
            rollNumber: user.student?.rollNumber,
            employeeId: user.staff?.employeeId,
            department: user.staff?.department || user.student?.branch?.name,
            specialization: user.staff?.specialization,
            branch: user.student?.branch?.code,
            year: user.student?.year,
            hostelBlock: user.student?.hostelRoom?.hostelBlock.name,
            roomNumber: user.student?.hostelRoom?.roomNumber,
            profilePhotoUrl: user.profilePhotoUrl || null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full Name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().max(20, 'Phone number cannot exceed 20 characters').optional().nullable(),
  parentPhone: z.string().trim().max(20).optional().nullable(),
  department: z.string().trim().min(1).max(100).optional().nullable(),
  designation: z.string().trim().min(1).max(100).optional().nullable(),
  specialization: z.string().trim().max(100).optional().nullable(),
  bio: z.string().trim().max(1000, 'Bio cannot exceed 1000 characters').optional().nullable(),
  profilePhotoUrl: z.string().trim().max(10 * 1024 * 1024, 'Profile photo data too large').optional().nullable(),
});

/**
 * PUT /api/auth/profile
 * Allows any authenticated user (Student, Staff, Faculty, Warden, Security, Academic Officer, Admin)
 * to update their own profile information.
 * Role escalation, email modification, and user ID tampering are strictly prohibited.
 */
router.put(
  ['/profile', '/me'],
  authenticate,
  validateBody(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { fullName, phone, parentPhone, department, designation, specialization, bio, profilePhotoUrl } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { student: true, staff: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Handle profile photo processing if provided in the update
      let resolvedPhotoUrl: string | null | undefined = undefined;
      if (profilePhotoUrl !== undefined) {
        if (!profilePhotoUrl || profilePhotoUrl.trim() === '') {
          StorageService.safeDeleteDiskFile(user.profilePhotoUrl || '');
          resolvedPhotoUrl = null;
        } else {
          const processed = await StorageService.processAndSaveAvatar(userId, profilePhotoUrl, user.profilePhotoUrl);
          resolvedPhotoUrl = processed.profilePhotoUrl;
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Update User level fields (bio, profilePhotoUrl)
        const userUpdateData: { bio?: string | null; profilePhotoUrl?: string | null } = {};
        if (bio !== undefined) {
          userUpdateData.bio = bio ? String(bio).trim() : null;
        }
        if (resolvedPhotoUrl !== undefined) {
          userUpdateData.profilePhotoUrl = resolvedPhotoUrl;
        }
        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: userUpdateData,
          });
        }

        // 2. If user is Student, update Student record
        if (user.student) {
          let branchId = user.student.branchId;
          if (department) {
            const trimmedDept = String(department).trim();
            const branch = await tx.branch.findFirst({
              where: {
                OR: [
                  { code: trimmedDept.toUpperCase() },
                  { name: { contains: trimmedDept } },
                ],
              },
            });
            if (branch) branchId = branch.id;
          }

          await tx.student.update({
            where: { id: user.student.id },
            data: {
              ...(fullName ? { fullName: String(fullName).trim() } : {}),
              ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
              ...(parentPhone !== undefined ? { parentPhone: parentPhone ? String(parentPhone).trim() : null } : {}),
              branchId,
            },
          });
        }

        // 3. If user is Staff (STAFF, FACULTY, WARDEN, SECURITY, ACADEMIC_OFFICER, ADMIN), update Staff record
        if (user.staff) {
          await tx.staff.update({
            where: { id: user.staff.id },
            data: {
              ...(fullName ? { fullName: String(fullName).trim() } : {}),
              ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
              ...(department ? { department: String(department).trim() } : {}),
              ...(designation ? { designation: String(designation).trim() } : {}),
              ...(specialization !== undefined ? { specialization: specialization ? String(specialization).trim() : null } : {}),
            },
          });
        }

        return tx.user.findUnique({
          where: { id: userId },
          include: {
            role: true,
            student: { include: { branch: true } },
            staff: true,
          },
        });
      });

      // Invalidate the session cache so subsequent queries immediately return updated data
      clearAuthSessionCache(userId);

      await AuditService.log({
        actorId: userId,
        action: 'PROFILE_UPDATED',
        entityType: 'USER',
        entityId: userId,
        newValues: { fullName, phone, department, designation, bio, profilePhotoUpdated: resolvedPhotoUrl !== undefined },
      });

      res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: {
          user: {
            id: updated!.id,
            username: updated!.username,
            email: updated!.email,
            role: updated!.role.name,
            fullName: updated!.student?.fullName || updated!.staff?.fullName || updated!.username,
            phone: updated!.student?.phone || updated!.staff?.phone || null,
            parentPhone: updated!.student?.parentPhone || null,
            department: updated!.staff?.department || (updated!.student?.branch ? updated!.student.branch.name : null),
            branch: updated!.student?.branch?.code || null,
            designation: updated!.staff?.designation || (updated!.student ? 'Student' : null),
            specialization: updated!.staff?.specialization || null,
            rollNumber: updated!.student?.rollNumber || null,
            employeeId: updated!.staff?.employeeId || null,
            year: updated!.student?.year || null,
            bio: updated!.bio || null,
            profilePhotoUrl: updated!.profilePhotoUrl || null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/profile/photo
 * Direct upload/update endpoint for user's profile photo
 */
router.post(
  ['/profile/photo', '/photo'],
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const photoPayload = req.body?.photo || req.body?.photoData || req.body?.profilePhotoUrl;

      if (!photoPayload || typeof photoPayload !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PHOTO_PAYLOAD',
            message: 'A valid image file or data payload is required.',
          },
        });
        return;
      }

      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!currentUser) {
        throw new AppError('User not found', 404);
      }

      const processed = await StorageService.processAndSaveAvatar(
        userId,
        photoPayload,
        currentUser.profilePhotoUrl
      );

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { profilePhotoUrl: processed.profilePhotoUrl },
        include: {
          role: true,
          student: { include: { branch: true } },
          staff: true,
        },
      });

      clearAuthSessionCache(userId);

      await AuditService.log({
        actorId: userId,
        action: 'PROFILE_PHOTO_UPDATED',
        entityType: 'USER',
        entityId: userId,
      });

      res.json({
        success: true,
        message: 'Profile photo updated successfully.',
        data: {
          profilePhotoUrl: updated.profilePhotoUrl,
          user: {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            role: updated.role.name,
            fullName: updated.student?.fullName || updated.staff?.fullName || updated.username,
            phone: updated.student?.phone || updated.staff?.phone || null,
            parentPhone: updated.student?.parentPhone || null,
            department: updated.staff?.department || (updated.student?.branch ? updated.student.branch.name : null),
            branch: updated.student?.branch?.code || null,
            designation: updated.staff?.designation || (updated.student ? 'Student' : null),
            specialization: updated.staff?.specialization || null,
            rollNumber: updated.student?.rollNumber || null,
            employeeId: updated.staff?.employeeId || null,
            year: updated.student?.year || null,
            bio: updated.bio || null,
            profilePhotoUrl: updated.profilePhotoUrl || null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/auth/profile/photo
 * Direct endpoint to remove user profile photo
 */
router.delete(
  ['/profile/photo', '/photo'],
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!currentUser) {
        throw new AppError('User not found', 404);
      }

      if (currentUser.profilePhotoUrl) {
        StorageService.safeDeleteDiskFile(currentUser.profilePhotoUrl);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { profilePhotoUrl: null },
        include: {
          role: true,
          student: { include: { branch: true } },
          staff: true,
        },
      });

      clearAuthSessionCache(userId);

      await AuditService.log({
        actorId: userId,
        action: 'PROFILE_PHOTO_REMOVED',
        entityType: 'USER',
        entityId: userId,
      });

      res.json({
        success: true,
        message: 'Profile photo removed successfully.',
        data: {
          profilePhotoUrl: null,
          user: {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            role: updated.role.name,
            fullName: updated.student?.fullName || updated.staff?.fullName || updated.username,
            phone: updated.student?.phone || updated.staff?.phone || null,
            parentPhone: updated.student?.parentPhone || null,
            department: updated.staff?.department || (updated.student?.branch ? updated.student.branch.name : null),
            branch: updated.student?.branch?.code || null,
            designation: updated.staff?.designation || (updated.student ? 'Student' : null),
            specialization: updated.staff?.specialization || null,
            rollNumber: updated.student?.rollNumber || null,
            employeeId: updated.staff?.employeeId || null,
            year: updated.student?.year || null,
            bio: updated.bio || null,
            profilePhotoUrl: null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token');
  clearAuthSessionCache();
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/personas (Development Quick Switcher options)
router.get('/personas', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: [
      {
        key: 'aryan',
        name: 'Aryan Khan',
        role: 'STUDENT',
        description: 'B.Tech CSE, 2nd Year, Hostel B / Room 204',
        email: 'aryan@nexora.edu',
      },
      {
        key: 'ramesh',
        name: 'Ramesh Kumar',
        role: 'STAFF',
        description: 'Senior Maintenance Plumber',
        email: 'ramesh@nexora.edu',
      },
      {
        key: 'suresh',
        name: 'Suresh Verma',
        role: 'STAFF',
        description: 'Senior Electrician',
        email: 'suresh@nexora.edu',
      },
      {
        key: 'warden',
        name: 'Dr. S. K. Mohapatra',
        role: 'WARDEN',
        description: 'Chief Warden, Hostel Block B',
        email: 'warden.b@nexora.edu',
      },
      {
        key: 'security',
        name: 'Vikram Singh',
        role: 'SECURITY',
        description: 'Gate Operations Officer, Main Gate',
        email: 'security.gate1@nexora.edu',
      },
      {
        key: 'academic',
        name: 'Prof. Sanjeev Mohanty',
        role: 'ACADEMIC_OFFICER',
        description: 'Academic Officer & Course Administration',
        email: 'academic@nexora.edu',
      },
      {
        key: 'faculty',
        name: 'Dr. P. K. Tripathy',
        role: 'STAFF',
        description: 'Professor & Faculty (CSE)',
        email: 'faculty@nexora.edu',
      },
      {
        key: 'admin',
        name: 'Dr. Ananya Ray',
        role: 'ADMIN',
        description: 'Chief Campus Operations Director',
        email: 'admin@nexora.edu',
      },
    ],
  });
});

// POST /api/auth/switch-persona (Development Quick Switcher)
router.post(
  '/switch-persona',
  validateBody(switchPersonaSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const emailMap: Record<string, string> = {
        aryan: 'aryan@nexora.edu',
        ramesh: 'ramesh@nexora.edu',
        suresh: 'suresh@nexora.edu',
        warden: 'warden.b@nexora.edu',
        security: 'security.gate1@nexora.edu',
        academic: 'academic@nexora.edu',
        admin: 'admin@nexora.edu',
        faculty: 'faculty@nexora.edu',
      };

      const targetEmail = emailMap[req.body.persona];
      const user = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
          student: {
            include: {
              branch: true,
              hostelRoom: { include: { hostelBlock: true } },
            },
          },
          staff: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Demo persona not found in database' },
        });
        return;
      }

      const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
        expiresIn: '7d',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const permissions = user.role.permissions.map((rp) => rp.permission.code);

      res.json({
        success: true,
        message: `Switched to persona: ${user.username}`,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name,
            permissions,
            fullName: user.student?.fullName || user.staff?.fullName,
            rollNumber: user.student?.rollNumber,
            employeeId: user.staff?.employeeId,
            department: user.staff?.department || user.student?.branch?.name,
            specialization: user.staff?.specialization,
            branch: user.student?.branch?.code,
            year: user.student?.year,
            hostelBlock: user.student?.hostelRoom?.hostelBlock.name,
            roomNumber: user.student?.hostelRoom?.roomNumber,
            profilePhotoUrl: user.profilePhotoUrl || null,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
