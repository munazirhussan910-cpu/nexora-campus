import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../config/prisma';
import { AuthenticatedRequest, AuthUser } from '../types/auth';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        student: {
          include: {
            hostelRoom: {
              include: {
                hostelBlock: true,
              },
            },
          },
        },
        staff: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or inactive user account',
        },
      });
      return;
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.code);

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.name,
      roleId: user.role.id,
      permissions,
      studentId: user.student?.id,
      staffId: user.staff?.id,
      rollNumber: user.student?.rollNumber,
      fullName: user.student?.fullName || user.staff?.fullName,
      department: user.staff?.department,
      hostelBlock: user.student?.hostelRoom?.hostelBlock.name,
      roomNumber: user.student?.hostelRoom?.roomNumber,
    };

    req.user = authUser;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication session',
      },
    });
  }
};
