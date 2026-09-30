"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = require("../config/env");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    usernameOrEmail: zod_1.z.string().trim().min(1, 'Username or email is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const switchPersonaSchema = zod_1.z.object({
    persona: zod_1.z.enum(['aryan', 'ramesh', 'suresh', 'warden', 'security', 'academic', 'admin']),
});
const registerStudentSchema = zod_1.z
    .object({
    fullName: zod_1.z
        .string()
        .trim()
        .min(2, 'Full Name must be at least 2 characters'),
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .email('Please enter a valid campus email address'),
    rollNumber: zod_1.z
        .string()
        .trim()
        .min(3, 'Student ID / Roll Number must be at least 3 characters'),
    department: zod_1.z
        .string()
        .trim()
        .min(1, 'Department is required'),
    year: zod_1.z
        .union([zod_1.z.number().int(), zod_1.z.string().trim()])
        .refine((val) => {
        const num = typeof val === 'number' ? val : parseInt(val.replace(/\D/g, ''), 10);
        return !isNaN(num) && num >= 1 && num <= 8;
    }, { message: 'Please provide a valid semester (1-8) or academic year (1-4)' })
        .transform((val) => {
        const num = typeof val === 'number' ? val : parseInt(val.replace(/\D/g, ''), 10);
        if (num > 4 && num <= 8) {
            return Math.ceil(num / 2); // Map semester 1-8 to year 1-4
        }
        return num;
    }),
    hostel: zod_1.z.string().trim().optional(),
    roomNumber: zod_1.z.string().trim().optional(),
    phone: zod_1.z.string().trim().optional(),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: zod_1.z
        .string()
        .min(1, 'Please confirm your password'),
    role: zod_1.z.string().optional(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
// GET /api/auth/register-options - Provide departments, hostel options, and year choices
router.get('/register-options', async (req, res, next) => {
    try {
        const [branches, blocks] = await Promise.all([
            prisma_1.default.branch.findMany({ orderBy: { code: 'asc' } }),
            prisma_1.default.hostelBlock.findMany({ orderBy: { name: 'asc' } }),
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
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/register - Self-registration for Students only
router.post('/register', (0, validate_middleware_1.validateBody)(registerStudentSchema), async (req, res, next) => {
    try {
        const { fullName, email, rollNumber, department, year, hostel, roomNumber, phone, password, role, } = req.body;
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
        const existingUserByEmail = await prisma_1.default.user.findFirst({
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
        const existingStudentByRoll = await prisma_1.default.student.findFirst({
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
        const studentRole = await prisma_1.default.role.findUnique({
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
        let branch = await prisma_1.default.branch.findFirst({
            where: {
                OR: [
                    { code: department.toUpperCase() },
                    { name: { contains: department } },
                    { id: department },
                ],
            },
        });
        if (!branch) {
            const allBranches = await prisma_1.default.branch.findMany();
            branch = allBranches.find((b) => department.toLowerCase().includes(b.code.toLowerCase()) ||
                b.name.toLowerCase().includes(department.toLowerCase())) || null;
            if (!branch) {
                if (allBranches.length > 0) {
                    branch = allBranches[0];
                }
                else {
                    branch = await prisma_1.default.branch.create({
                        data: {
                            code: department.slice(0, 5).toUpperCase(),
                            name: department,
                        },
                    });
                }
            }
        }
        // 5. Resolve Hostel & Room if applicable
        let hostelRoomId = null;
        const isDayScholar = !hostel ||
            ['day scholar', 'dayscholar', 'day-scholar', 'non-resident', 'none', 'n/a'].includes(hostel.toLowerCase());
        if (!isDayScholar) {
            const block = await prisma_1.default.hostelBlock.findFirst({
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
                    room = await prisma_1.default.room.findFirst({
                        where: {
                            hostelBlockId: block.id,
                            roomNumber: roomNumber.trim(),
                        },
                    });
                }
                if (!room) {
                    // Pick an available room or first room in the block
                    room = await prisma_1.default.room.findFirst({
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
        while (await prisma_1.default.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${suffix++}`;
        }
        // 7. Secure password hashing
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // 8. Atomic Database Transaction: Create User + Student Profile
        const { createdUser, createdStudent } = await prisma_1.default.$transaction(async (tx) => {
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
                    branchId: branch.id,
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
        const token = jsonwebtoken_1.default.sign({ userId: createdUser.id }, env_1.config.jwtSecret, {
            expiresIn: '7d',
        });
        res.cookie('token', token, {
            httpOnly: true,
            secure: env_1.config.nodeEnv === 'production',
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
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/login
router.post('/login', (0, validate_middleware_1.validateBody)(loginSchema), async (req, res, next) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const cleanIdentifier = usernameOrEmail.trim();
        const user = await prisma_1.default.user.findFirst({
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
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
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
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Sign JWT Token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.config.jwtSecret, {
            expiresIn: '7d',
        });
        // Set HTTP-Only Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: env_1.config.nodeEnv === 'production',
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
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/auth/me
router.get('/me', auth_middleware_1.authenticate, async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user,
        },
    });
});
// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    (0, auth_middleware_1.clearAuthSessionCache)();
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
// GET /api/auth/personas (Development Quick Switcher options)
router.get('/personas', (req, res) => {
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
                description: 'Academic Officer & Certificates',
                email: 'academic@nexora.edu',
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
router.post('/switch-persona', (0, validate_middleware_1.validateBody)(switchPersonaSchema), async (req, res, next) => {
    try {
        const emailMap = {
            aryan: 'aryan@nexora.edu',
            ramesh: 'ramesh@nexora.edu',
            suresh: 'suresh@nexora.edu',
            warden: 'warden.b@nexora.edu',
            security: 'security.gate1@nexora.edu',
            academic: 'academic@nexora.edu',
            admin: 'admin@nexora.edu',
        };
        const targetEmail = emailMap[req.body.persona];
        const user = await prisma_1.default.user.findUnique({
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
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.config.jwtSecret, {
            expiresIn: '7d',
        });
        res.cookie('token', token, {
            httpOnly: true,
            secure: env_1.config.nodeEnv === 'production',
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
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
