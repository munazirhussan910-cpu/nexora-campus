import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../config/prisma';
import { AuthenticatedRequest, AuthUser } from '../types/auth';

interface CachedSession {
  user: AuthUser;
  expiresAt: number;
}

// 45-second in-memory session cache to eliminate redundant auth queries on Slow 3G waterfalls
const sessionCache = new Map<string, CachedSession>();
const SESSION_TTL_MS = 45 * 1000;

export const clearAuthSessionCache = (userId?: string): void => {
  if (userId) {
    sessionCache.delete(userId);
  } else {
    sessionCache.clear();
  }
};

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

    // Cryptographic JWT signature and expiration verification
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    // Check fast in-memory session cache
    const cached = sessionCache.get(decoded.userId);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      return next();
    }

    // High-performance single SQL query replacing the 9-query nested relation cascade
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        username: string;
        email: string;
        isActive: boolean | number;
        bio: string | null;
        profilePhotoUrl: string | null;
        roleId: string;
        roleName: string;
        studentId: string | null;
        rollNumber: string | null;
        studentName: string | null;
        year: number | null;
        studentPhone: string | null;
        studentParentPhone: string | null;
        branchCode: string | null;
        roomNumber: string | null;
        hostelBlockName: string | null;
        staffId: string | null;
        staffEmployeeId: string | null;
        staffName: string | null;
        staffDept: string | null;
        staffDesignation: string | null;
        staffSpecialization: string | null;
        staffPhone: string | null;
        permissionsCsv: string | null;
      }>
    >`
      SELECT 
        u.id, u.username, u.email, u.isActive, u.bio, u.profilePhotoUrl,
        r.id as roleId, r.name as roleName,
        st.id as studentId, st.rollNumber, st.fullName as studentName, st.year, st.phone as studentPhone, st.parentPhone as studentParentPhone,
        b.code as branchCode,
        rm.roomNumber,
        hb.name as hostelBlockName,
        sf.id as staffId, sf.employeeId as staffEmployeeId, sf.fullName as staffName, sf.department as staffDept, sf.designation as staffDesignation, sf.specialization as staffSpecialization, sf.phone as staffPhone,
        (
          SELECT GROUP_CONCAT(p.code, ',')
          FROM RolePermission rp
          JOIN Permission p ON rp.permissionId = p.id
          WHERE rp.roleId = u.roleId
        ) as permissionsCsv
      FROM User u
      JOIN Role r ON u.roleId = r.id
      LEFT JOIN Student st ON st.userId = u.id
      LEFT JOIN Branch b ON st.branchId = b.id
      LEFT JOIN Room rm ON st.hostelRoomId = rm.id
      LEFT JOIN HostelBlock hb ON rm.hostelBlockId = hb.id
      LEFT JOIN Staff sf ON sf.userId = u.id
      WHERE u.id = ${decoded.userId}
      LIMIT 1
    `;

    const user = rows[0];

    if (!user || !user.isActive) {
      sessionCache.delete(decoded.userId);
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or inactive user account',
        },
      });
      return;
    }

    const permissions = user.permissionsCsv
      ? user.permissionsCsv.split(',').filter(Boolean)
      : [];

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.roleName,
      roleId: user.roleId,
      permissions,
      studentId: user.studentId || undefined,
      staffId: user.staffId || undefined,
      rollNumber: user.rollNumber || undefined,
      employeeId: user.staffEmployeeId || undefined,
      fullName: user.studentName || user.staffName || undefined,
      department: user.staffDept || (user.branchCode ? `Department of ${user.branchCode}` : undefined),
      designation: user.staffDesignation || (user.studentId ? 'Student' : undefined),
      specialization: user.staffSpecialization || undefined,
      branch: user.branchCode || undefined,
      year: user.year || undefined,
      hostelBlock: user.hostelBlockName || undefined,
      roomNumber: user.roomNumber || undefined,
      phone: user.studentPhone || user.staffPhone || undefined,
      parentPhone: user.studentParentPhone || undefined,
      bio: user.bio || undefined,
      profilePhotoUrl: user.profilePhotoUrl || undefined,
    };

    // Store in short-lived session cache
    sessionCache.set(decoded.userId, {
      user: authUser,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

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
