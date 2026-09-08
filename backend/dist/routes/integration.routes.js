"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const request_service_1 = require("../services/request.service");
const routing_service_1 = require("../services/routing.service");
const qr_service_1 = require("../services/qr.service");
const router = (0, express_1.Router)();
// POST /api/integrations/sms/inbound - SMS Inbound Gateway
router.post('/sms/inbound', async (req, res, next) => {
    try {
        const { from, message, senderPhone } = req.body;
        const rawText = (message || req.body.body || '').trim();
        const phone = senderPhone || from || '+91 9876543210';
        // Record raw integration event
        const event = await prisma_1.default.integrationEvent.create({
            data: {
                source: 'SMS',
                payload: JSON.stringify({ phone, message: rawText }),
                status: 'RECEIVED',
            },
        });
        // Find student by phone number or default to Aryan for demo
        let student = await prisma_1.default.student.findFirst({
            where: {
                OR: [{ phone }, { parentPhone: phone }],
            },
            include: { hostelRoom: { include: { hostelBlock: true } } },
        });
        if (!student) {
            student = await prisma_1.default.student.findFirst({
                include: { hostelRoom: { include: { hostelBlock: true } } },
            });
        }
        if (!student) {
            await prisma_1.default.integrationEvent.update({
                where: { id: event.id },
                data: { status: 'FAILED', response: 'No student found' },
            });
            res.status(400).json({
                success: false,
                error: { message: 'No registered student matching this phone number' },
            });
            return;
        }
        // Parse message format: e.g. "TICKET B204 TAP LEAKING" or "GATEPASS MARKET"
        const upper = rawText.toUpperCase();
        if (upper.startsWith('GATEPASS') || upper.startsWith('PASS')) {
            const destination = rawText.replace(/GATEPASS|PASS/i, '').trim() || 'City Center';
            const passPin = qr_service_1.QrService.generatePin();
            const request = await request_service_1.RequestService.createRequest({
                requesterId: student.userId,
                requestTypeCode: 'GATE_PASS',
                title: `SMS Gate Pass: ${destination}`,
                description: `Gate Pass applied via SMS Gateway: "${rawText}"`,
                location: student.hostelRoom?.hostelBlock.name || 'Hostel',
                priority: 'NORMAL',
                initialStatus: 'PENDING_APPROVAL',
            }, student.userId);
            await prisma_1.default.gatePass.create({
                data: {
                    requestId: request.id,
                    destination,
                    reason: rawText,
                    departureTime: new Date(),
                    expectedReturnTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
                    passPin,
                    gateStatus: 'PENDING_APPROVAL',
                },
            });
            const reply = `Gate Pass ${request.requestNumber} submitted for approval. PIN: ${passPin}.`;
            await prisma_1.default.integrationEvent.update({
                where: { id: event.id },
                data: { status: 'PROCESSED', response: reply },
            });
            res.json({
                success: true,
                message: reply,
                data: { requestNumber: request.requestNumber, passPin },
            });
            return;
        }
        // Default: Complaint / Ticket creation: e.g. "TICKET B204 TAP LEAKING"
        let cleanText = rawText.replace(/^TICKET\s+/i, '');
        const parts = cleanText.split(' ');
        let location = student.hostelRoom
            ? `${student.hostelRoom.hostelBlock.name} / Room ${student.hostelRoom.roomNumber}`
            : 'Campus Hostel';
        // Check if first word is a room code like B204
        if (parts[0] && /^([A-Z]\d{3}|\d{3})$/i.test(parts[0])) {
            location = `Hostel ${parts[0].toUpperCase()}`;
            cleanText = parts.slice(1).join(' ');
        }
        const route = await routing_service_1.RoutingService.routeComplaint('SMS Maintenance Request', cleanText);
        const pin = qr_service_1.QrService.generatePin();
        const request = await request_service_1.RequestService.createRequest({
            requesterId: student.userId,
            requestTypeCode: 'COMPLAINT',
            title: cleanText.slice(0, 50) || 'SMS Maintenance Complaint',
            description: `Logged via SMS gateway: "${rawText}"`,
            location,
            priority: 'NORMAL',
            category: route.category,
            assignedTo: route.assignedStaffUserId,
            initialStatus: route.assignedStaffUserId ? 'ASSIGNED' : 'ROUTED',
        }, student.userId);
        await prisma_1.default.complaint.create({
            data: {
                requestId: request.id,
                category: route.category,
                issueType: route.specialization,
            },
        });
        const reply = `Ticket ${request.requestNumber} created. Routed to ${route.category}. Verification PIN: ${pin}`;
        await prisma_1.default.integrationEvent.update({
            where: { id: event.id },
            data: { status: 'PROCESSED', response: reply },
        });
        res.json({
            success: true,
            message: reply,
            data: {
                requestNumber: request.requestNumber,
                category: route.category,
                assignedTo: route.assignedStaffName,
                pin,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
