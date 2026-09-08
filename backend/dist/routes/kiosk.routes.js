"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const error_middleware_1 = require("../middleware/error.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const request_service_1 = require("../services/request.service");
const routing_service_1 = require("../services/routing.service");
const qr_service_1 = require("../services/qr.service");
const sla_service_1 = require("../services/sla.service");
const router = (0, express_1.Router)();
// GET /api/kiosk/student/:rollNumber
router.get('/student/:rollNumber', async (req, res, next) => {
    try {
        const rollNumber = String(req.params.rollNumber);
        const student = await prisma_1.default.student.findUnique({
            where: { rollNumber },
            include: {
                branch: true,
                hostelRoom: { include: { hostelBlock: true } },
                user: {
                    select: { id: true, username: true, email: true },
                },
            },
        });
        if (!student) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'STUDENT_NOT_FOUND',
                    message: `No student record found with Roll Number ${rollNumber}`,
                },
            });
            return;
        }
        // Fetch active requests for this student
        const recentRequests = await prisma_1.default.request.findMany({
            where: { requesterId: student.userId },
            include: {
                requestType: true,
                complaint: true,
                gatePass: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        res.json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    userId: student.userId,
                    rollNumber: student.rollNumber,
                    fullName: student.fullName,
                    branch: student.branch.name,
                    year: student.year,
                    hostelBlock: student.hostelRoom?.hostelBlock.name,
                    roomNumber: student.hostelRoom?.roomNumber,
                },
                recentRequests: recentRequests.map((r) => ({
                    ...r,
                    sla: sla_service_1.SlaService.computeSla(r),
                })),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/kiosk/requests
const kioskRequestSchema = zod_1.z.object({
    rollNumber: zod_1.z.string().min(1),
    type: zod_1.z.enum(['COMPLAINT', 'GATE_PASS', 'BONAFIDE', 'LEAVE']),
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(5),
    location: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    extraData: zod_1.z.record(zod_1.z.any()).optional(),
});
router.post('/requests', (0, validate_middleware_1.validateBody)(kioskRequestSchema), async (req, res, next) => {
    try {
        const { rollNumber, type, title, description, location, priority, extraData } = req.body;
        const student = await prisma_1.default.student.findUnique({
            where: { rollNumber },
            include: { hostelRoom: { include: { hostelBlock: true } } },
        });
        if (!student) {
            throw new error_middleware_1.AppError(`Student with roll number ${rollNumber} not found`, 404);
        }
        const finalLocation = location ||
            (student.hostelRoom
                ? `${student.hostelRoom.hostelBlock.name} / Room ${student.hostelRoom.roomNumber}`
                : 'Campus Hostel');
        if (type === 'COMPLAINT') {
            const route = await routing_service_1.RoutingService.routeComplaint(title, description);
            const reqRecord = await request_service_1.RequestService.createRequest({
                requesterId: student.userId,
                requestTypeCode: 'COMPLAINT',
                title,
                description,
                location: finalLocation,
                priority,
                category: route.category,
                assignedTo: route.assignedStaffUserId,
                initialStatus: route.assignedStaffUserId ? 'ASSIGNED' : 'ROUTED',
            }, student.userId);
            await prisma_1.default.complaint.create({
                data: {
                    requestId: reqRecord.id,
                    category: route.category,
                    issueType: route.specialization,
                },
            });
            res.status(201).json({
                success: true,
                message: `Complaint registered at Kiosk. Request: ${reqRecord.requestNumber}`,
                data: reqRecord,
            });
            return;
        }
        if (type === 'GATE_PASS') {
            const passPin = qr_service_1.QrService.generatePin();
            const reqRecord = await request_service_1.RequestService.createRequest({
                requesterId: student.userId,
                requestTypeCode: 'GATE_PASS',
                title: title || `Gate Pass (${extraData?.destination || 'City'})`,
                description,
                location: finalLocation,
                priority: 'NORMAL',
                initialStatus: 'PENDING_APPROVAL',
            }, student.userId);
            const departureTime = extraData?.departureTime ? new Date(extraData.departureTime) : new Date();
            const expectedReturnTime = extraData?.expectedReturnTime
                ? new Date(extraData.expectedReturnTime)
                : new Date(Date.now() + 4 * 60 * 60 * 1000);
            await prisma_1.default.gatePass.create({
                data: {
                    requestId: reqRecord.id,
                    destination: extraData?.destination || 'Market',
                    reason: description,
                    departureTime,
                    expectedReturnTime,
                    passPin,
                    gateStatus: 'PENDING_APPROVAL',
                },
            });
            res.status(201).json({
                success: true,
                message: `Gate pass registered at Kiosk. Request: ${reqRecord.requestNumber}. PIN: ${passPin}`,
                data: reqRecord,
            });
            return;
        }
        // Default generic kiosk request
        const reqRecord = await request_service_1.RequestService.createRequest({
            requesterId: student.userId,
            requestTypeCode: type,
            title,
            description,
            location: finalLocation,
            priority,
        }, student.userId);
        res.status(201).json({
            success: true,
            message: `Request registered at Kiosk: ${reqRecord.requestNumber}`,
            data: reqRecord,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
