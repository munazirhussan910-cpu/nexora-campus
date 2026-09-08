"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const error_middleware_1 = require("../middleware/error.middleware");
const audit_service_1 = require("./audit.service");
const notification_service_1 = require("./notification.service");
const sla_service_1 = require("./sla.service");
class RequestService {
    /**
     * Generates a unique human-readable request number (e.g. NX-10291)
     */
    static async generateRequestNumber() {
        const count = await prisma_1.default.request.count();
        const nextNum = 10000 + count + Math.floor(Math.random() * 5) + 1;
        const candidate = `NX-${nextNum}`;
        const exists = await prisma_1.default.request.findUnique({
            where: { requestNumber: candidate },
        });
        if (exists) {
            return `NX-${nextNum}-${Math.floor(100 + Math.random() * 900)}`;
        }
        return candidate;
    }
    /**
     * Status transition validation matrix
     */
    static validTransitions = {
        SUBMITTED: ['ROUTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'CANCELLED', 'REJECTED'],
        ROUTED: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'CANCELLED'],
        ASSIGNED: ['ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'REASSIGNED', 'CANCELLED'],
        ACCEPTED: ['IN_PROGRESS', 'RESOLVED', 'ASSIGNED', 'CANCELLED'],
        IN_PROGRESS: ['RESOLVED', 'ASSIGNED', 'CANCELLED'],
        RESOLVED: ['CONFIRMED', 'CLOSED', 'IN_PROGRESS'],
        CONFIRMED: ['CLOSED'],
        PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
        APPROVED: ['DEPARTED', 'COMPLETED', 'CLOSED', 'CANCELLED'],
        DEPARTED: ['RETURNED', 'CLOSED'],
        RETURNED: ['CLOSED'],
        CLOSED: [], // Terminal
        REJECTED: [], // Terminal
        CANCELLED: [], // Terminal
    };
    /**
     * Validates if a transition is legal
     */
    static isValidTransition(currentStatus, nextStatus) {
        const allowed = this.validTransitions[currentStatus] || [];
        return allowed.includes(nextStatus);
    }
    /**
     * Creates a new Request through the Request Engine
     */
    static async createRequest(input, actorId) {
        const reqType = await prisma_1.default.requestType.findUnique({
            where: { code: input.requestTypeCode },
        });
        if (!reqType) {
            throw new error_middleware_1.AppError(`Invalid request type: ${input.requestTypeCode}`, 400, 'INVALID_REQUEST_TYPE');
        }
        const requestNumber = await this.generateRequestNumber();
        const priority = input.priority || 'NORMAL';
        const { dueAt } = await sla_service_1.SlaService.calculateDueAt(input.requestTypeCode, priority, input.category);
        const status = input.initialStatus || (reqType.requiresApproval ? 'PENDING_APPROVAL' : 'SUBMITTED');
        const result = await prisma_1.default.$transaction(async (tx) => {
            const request = await tx.request.create({
                data: {
                    requestNumber,
                    requesterId: input.requesterId,
                    requestTypeId: reqType.id,
                    status,
                    priority,
                    title: input.title,
                    description: input.description,
                    location: input.location,
                    assignedTo: input.assignedTo,
                    dueAt,
                },
                include: {
                    requestType: true,
                    requester: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            student: {
                                include: { branch: true },
                            },
                        },
                    },
                },
            });
            // Status history entry
            await tx.requestStatusHistory.create({
                data: {
                    requestId: request.id,
                    oldStatus: null,
                    newStatus: status,
                    changedBy: actorId || input.requesterId,
                    comment: `Request created with initial status: ${status}`,
                },
            });
            // If initially assigned, create assignment record
            if (input.assignedTo) {
                await tx.requestAssignment.create({
                    data: {
                        requestId: request.id,
                        assignedTo: input.assignedTo,
                        assignedBy: actorId || input.requesterId,
                    },
                });
            }
            // Audit Log using tx to prevent SQLite lockup
            await audit_service_1.AuditService.log({
                actorId: actorId || input.requesterId,
                action: 'REQUEST_CREATED',
                entityType: 'REQUEST',
                entityId: request.id,
                newValues: {
                    requestNumber,
                    type: input.requestTypeCode,
                    priority,
                    status,
                },
                tx,
            });
            return request;
        }, { maxWait: 15000, timeout: 30000 });
        return result;
    }
    /**
     * Executes a validated state transition with status history, notification, and audit log
     */
    static async transitionStatus(requestId, newStatus, actorId, comment) {
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
            include: { requester: true, assignedStaff: true, requestType: true },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Request not found', 404, 'NOT_FOUND');
        }
        if (request.status === newStatus) {
            return request; // No-op
        }
        if (!this.isValidTransition(request.status, newStatus)) {
            throw new error_middleware_1.AppError(`Invalid status transition from '${request.status}' to '${newStatus}'`, 422, 'INVALID_STATUS_TRANSITION');
        }
        const isCompleted = ['RESOLVED', 'CONFIRMED', 'CLOSED', 'RETURNED'].includes(newStatus);
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const u = await tx.request.update({
                where: { id: requestId },
                data: {
                    status: newStatus,
                    completedAt: isCompleted && !request.completedAt ? new Date() : request.completedAt,
                },
                include: {
                    requestType: true,
                    requester: true,
                    assignedStaff: true,
                },
            });
            // Status history entry
            await tx.requestStatusHistory.create({
                data: {
                    requestId,
                    oldStatus: request.status,
                    newStatus,
                    changedBy: actorId,
                    comment: comment || `Status updated to ${newStatus}`,
                },
            });
            // Audit Log using tx
            await audit_service_1.AuditService.log({
                actorId,
                action: `REQUEST_STATUS_${newStatus}`,
                entityType: 'REQUEST',
                entityId: requestId,
                oldValues: { status: request.status },
                newValues: { status: newStatus, comment },
                tx,
            });
            return u;
        }, { maxWait: 15000, timeout: 30000 });
        // Notification to Requester if someone else changed status (post-transaction)
        if (request.requesterId !== actorId) {
            await notification_service_1.NotificationService.send({
                userId: request.requesterId,
                title: `Request ${request.requestNumber} Updated`,
                message: `Your request "${request.title}" status changed to ${newStatus}.`,
                type: newStatus === 'RESOLVED' || newStatus === 'APPROVED' ? 'SUCCESS' : 'INFO',
                referenceType: request.requestType.code,
                referenceId: request.id,
            });
        }
        return updated;
    }
    /**
     * Reassigns a request to another staff member
     */
    static async reassignRequest(requestId, newStaffUserId, assignedByActorId, comment) {
        const request = await prisma_1.default.request.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Request not found', 404, 'NOT_FOUND');
        }
        const staffUser = await prisma_1.default.user.findUnique({
            where: { id: newStaffUserId },
            include: { staff: true },
        });
        if (!staffUser || !staffUser.staff) {
            throw new error_middleware_1.AppError('Target staff member not found', 404, 'STAFF_NOT_FOUND');
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const u = await tx.request.update({
                where: { id: requestId },
                data: {
                    assignedTo: newStaffUserId,
                    status: 'ASSIGNED',
                },
            });
            // Create Assignment record
            await tx.requestAssignment.create({
                data: {
                    requestId,
                    assignedTo: newStaffUserId,
                    assignedBy: assignedByActorId,
                },
            });
            // Record History
            await tx.requestStatusHistory.create({
                data: {
                    requestId,
                    oldStatus: request.status,
                    newStatus: 'ASSIGNED',
                    changedBy: assignedByActorId,
                    comment: comment || `Reassigned to staff ${staffUser.staff?.fullName}`,
                },
            });
            // Audit Log using tx
            await audit_service_1.AuditService.log({
                actorId: assignedByActorId,
                action: 'REQUEST_REASSIGNED',
                entityType: 'REQUEST',
                entityId: requestId,
                oldValues: { assignedTo: request.assignedTo },
                newValues: { assignedTo: newStaffUserId, staffName: staffUser.staff?.fullName },
                tx,
            });
            return u;
        }, { maxWait: 15000, timeout: 30000 });
        // Notify new staff member (post-transaction)
        await notification_service_1.NotificationService.send({
            userId: newStaffUserId,
            title: 'New Task Assigned',
            message: `Task ${request.requestNumber} (${request.title}) has been assigned to you.`,
            type: 'INFO',
            referenceType: 'COMPLAINT',
            referenceId: requestId,
        });
        return updated;
    }
    /**
     * Fetches full timeline for a request
     */
    static async getRequestTimeline(requestId) {
        return prisma_1.default.requestStatusHistory.findMany({
            where: { requestId },
            include: {
                changer: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: { select: { name: true } },
                        student: { select: { fullName: true } },
                        staff: { select: { fullName: true, designation: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}
exports.RequestService = RequestService;
