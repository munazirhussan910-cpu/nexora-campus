"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.clearAuthSessionCache = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const prisma_1 = __importDefault(require("../config/prisma"));
// 45-second in-memory session cache to eliminate redundant auth queries on Slow 3G waterfalls
const sessionCache = new Map();
const SESSION_TTL_MS = 45 * 1000;
const clearAuthSessionCache = (userId) => {
    if (userId) {
        sessionCache.delete(userId);
    }
    else {
        sessionCache.clear();
    }
};
exports.clearAuthSessionCache = clearAuthSessionCache;
const authenticate = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
        // Check fast in-memory session cache
        const cached = sessionCache.get(decoded.userId);
        if (cached && cached.expiresAt > Date.now()) {
            req.user = cached.user;
            return next();
        }
        // High-performance single SQL query replacing the 9-query nested relation cascade
        const rows = await prisma_1.default.$queryRaw `
      SELECT 
        u.id, u.username, u.email, u.isActive,
        r.id as roleId, r.name as roleName,
        st.id as studentId, st.rollNumber, st.fullName as studentName, st.year,
        b.code as branchCode,
        rm.roomNumber,
        hb.name as hostelBlockName,
        sf.id as staffId, sf.fullName as staffName, sf.department as staffDept,
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
        const authUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.roleName,
            roleId: user.roleId,
            permissions,
            studentId: user.studentId || undefined,
            staffId: user.staffId || undefined,
            rollNumber: user.rollNumber || undefined,
            fullName: user.studentName || user.staffName || undefined,
            department: user.staffDept || undefined,
            branch: user.branchCode || undefined,
            year: user.year || undefined,
            hostelBlock: user.hostelBlockName || undefined,
            roomNumber: user.roomNumber || undefined,
        };
        // Store in short-lived session cache
        sessionCache.set(decoded.userId, {
            user: authUser,
            expiresAt: Date.now() + SESSION_TTL_MS,
        });
        req.user = authUser;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid or expired authentication session',
            },
        });
    }
};
exports.authenticate = authenticate;
