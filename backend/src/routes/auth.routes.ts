import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { config } from '../config/env';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

const switchPersonaSchema = z.object({
  persona: z.enum(['aryan', 'ramesh', 'suresh', 'warden', 'security', 'admin']),
});

// POST /api/auth/login
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { usernameOrEmail, password } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: usernameOrEmail.toLowerCase() },
            { username: usernameOrEmail.toLowerCase() },
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
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_DISABLED', message: 'This account has been deactivated' },
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
            department: user.staff?.department,
            specialization: user.staff?.specialization,
            hostelBlock: user.student?.hostelRoom?.hostelBlock.name,
            roomNumber: user.student?.hostelRoom?.roomNumber,
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

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token');
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
        admin: 'admin@nexora.edu',
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
            department: user.staff?.department,
            specialization: user.staff?.specialization,
            hostelBlock: user.student?.hostelRoom?.hostelBlock.name,
            roomNumber: user.student?.hostelRoom?.roomNumber,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
