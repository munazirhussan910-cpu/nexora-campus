import prisma from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { SlaService } from './sla.service';

export interface CreateRequestInput {
  requesterId: string;
  requestTypeCode: 'COMPLAINT' | 'GATE_PASS' | 'BONAFIDE' | 'LEAVE';
  title: string;
  description: string;
  location?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: string;
  assignedTo?: string;
  initialStatus?: string;
}

export class RequestService {
  /**
   * Generates a unique human-readable request number (e.g. NX-10291)
   */
  static async generateRequestNumber(): Promise<string> {
    const count = await prisma.request.count();
    const nextNum = 10000 + count + Math.floor(Math.random() * 5) + 1;
    const candidate = `NX-${nextNum}`;

    const exists = await prisma.request.findUnique({
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
  private static validTransitions: Record<string, string[]> = {
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
  static isValidTransition(currentStatus: string, nextStatus: string): boolean {
    const allowed = this.validTransitions[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Creates a new Request through the Request Engine
   */
  static async createRequest(input: CreateRequestInput, actorId?: string) {
    const reqType = await prisma.requestType.findUnique({
      where: { code: input.requestTypeCode },
    });

    if (!reqType) {
      throw new AppError(`Invalid request type: ${input.requestTypeCode}`, 400, 'INVALID_REQUEST_TYPE');
    }

    const requestNumber = await this.generateRequestNumber();
    const priority = input.priority || 'NORMAL';
    const { dueAt } = await SlaService.calculateDueAt(input.requestTypeCode, priority, input.category);

    const status = input.initialStatus || (reqType.requiresApproval ? 'PENDING_APPROVAL' : 'SUBMITTED');

    const result = await prisma.$transaction(
      async (tx) => {
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
        await AuditService.log({
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
      },
      { maxWait: 15000, timeout: 30000 }
    );

    return result;
  }

  /**
   * Executes a validated state transition with status history, notification, and audit log
   */
  static async transitionStatus(
    requestId: string,
    newStatus: string,
    actorId: string,
    comment?: string
  ) {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { requester: true, assignedStaff: true, requestType: true },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'NOT_FOUND');
    }

    if (request.status === newStatus) {
      return request; // No-op
    }

    if (!this.isValidTransition(request.status, newStatus)) {
      throw new AppError(
        `Invalid status transition from '${request.status}' to '${newStatus}'`,
        422,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const isCompleted = ['RESOLVED', 'CONFIRMED', 'CLOSED', 'RETURNED'].includes(newStatus);

    const updated = await prisma.$transaction(
      async (tx) => {
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
        await AuditService.log({
          actorId,
          action: `REQUEST_STATUS_${newStatus}`,
          entityType: 'REQUEST',
          entityId: requestId,
          oldValues: { status: request.status },
          newValues: { status: newStatus, comment },
          tx,
        });

        return u;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Notification to Requester if someone else changed status (post-transaction)
    if (request.requesterId !== actorId) {
      await NotificationService.send({
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
  static async reassignRequest(
    requestId: string,
    newStaffUserId: string,
    assignedByActorId: string,
    comment?: string
  ) {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'NOT_FOUND');
    }

    const staffUser = await prisma.user.findUnique({
      where: { id: newStaffUserId },
      include: { staff: true },
    });

    if (!staffUser || !staffUser.staff) {
      throw new AppError('Target staff member not found', 404, 'STAFF_NOT_FOUND');
    }

    const updated = await prisma.$transaction(
      async (tx) => {
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
        await AuditService.log({
          actorId: assignedByActorId,
          action: 'REQUEST_REASSIGNED',
          entityType: 'REQUEST',
          entityId: requestId,
          oldValues: { assignedTo: request.assignedTo },
          newValues: { assignedTo: newStaffUserId, staffName: staffUser.staff?.fullName },
          tx,
        });

        return u;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Notify new staff member (post-transaction)
    await NotificationService.send({
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
   * Student self-cancellation of requests
   */
  static async cancelRequest(
    requestId: string,
    actorId: string,
    reason?: string
  ) {
    let request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
        assignedStaff: true,
        requestType: true,
        complaint: true,
        gatePass: true,
        leaveRequest: true,
        bonafide: true,
      },
    });

    if (!request) {
      // Check if requestId was actually a child entity ID
      const [gp, lr, bf, cp] = await Promise.all([
        prisma.gatePass.findUnique({ where: { id: requestId }, select: { requestId: true } }),
        prisma.leaveRequest.findUnique({ where: { id: requestId }, select: { requestId: true } }),
        prisma.bonafideRequest.findUnique({ where: { id: requestId }, select: { requestId: true } }),
        prisma.complaint.findUnique({ where: { id: requestId }, select: { requestId: true } }),
      ]);
      const matchedRequestId = gp?.requestId || lr?.requestId || bf?.requestId || cp?.requestId;
      if (matchedRequestId) {
        request = await prisma.request.findUnique({
          where: { id: matchedRequestId },
          include: {
            requester: true,
            assignedStaff: true,
            requestType: true,
            complaint: true,
            gatePass: true,
            leaveRequest: true,
            bonafide: true,
          },
        });
      }
    }

    if (!request) {
      throw new AppError('Request not found', 404, 'NOT_FOUND');
    }

    // 1. Authorization: Only the request owner can cancel it
    if (request.requesterId !== actorId) {
      throw new AppError('You can only cancel your own requests', 403, 'FORBIDDEN');
    }

    // 2. Already cancelled
    if (request.status === 'CANCELLED') {
      throw new AppError('Request is already cancelled', 422, 'ALREADY_CANCELLED');
    }

    // 3. Final / Non-cancellable states
    const finalStates = [
      'APPROVED',
      'REJECTED',
      'RESOLVED',
      'CONFIRMED',
      'CLOSED',
      'DEPARTED',
      'RETURNED',
      'EXPIRED',
    ];
    if (finalStates.includes(request.status)) {
      throw new AppError(
        `Cannot cancel a request that has already reached state: ${request.status}`,
        422,
        'CANNOT_CANCEL_FINAL_STATE'
      );
    }

    if (request.status === 'IN_PROGRESS') {
      throw new AppError(
        'Cannot cancel request while maintenance work is already in progress',
        422,
        'WORK_IN_PROGRESS'
      );
    }

    // 4. Specific child checks
    if (request.gatePass && request.gatePass.gateStatus !== 'PENDING_APPROVAL') {
      throw new AppError(
        `Cannot cancel gate pass with status: ${request.gatePass.gateStatus}`,
        422,
        'CANNOT_CANCEL_GATE_PASS'
      );
    }

    if (request.leaveRequest && request.leaveRequest.status !== 'PENDING_APPROVAL') {
      throw new AppError(
        `Cannot cancel leave request with status: ${request.leaveRequest.status}`,
        422,
        'CANNOT_CANCEL_LEAVE'
      );
    }

    if (request.bonafide && request.bonafide.certificateId) {
      throw new AppError(
        'Cannot cancel an already issued certificate',
        409,
        'CERTIFICATE_ALREADY_ISSUED'
      );
    }

    // Verify valid status transition
    if (!this.isValidTransition(request.status, 'CANCELLED')) {
      throw new AppError(
        `Invalid status transition from '${request.status}' to 'CANCELLED'`,
        422,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const cancelComment = reason ? `Cancelled by student: ${reason}` : 'Cancelled by student';

    const updated = await prisma.$transaction(
      async (tx) => {
        // 1. Update Request
        const u = await tx.request.update({
          where: { id: request.id },
          data: {
            status: 'CANCELLED',
            completedAt: new Date(),
          },
          include: {
            requestType: true,
            requester: true,
            assignedStaff: true,
            complaint: true,
            gatePass: true,
            leaveRequest: true,
            bonafide: true,
          },
        });

        // 2. Update child records if applicable
        if (request.gatePass) {
          await tx.gatePass.update({
            where: { id: request.gatePass.id },
            data: { gateStatus: 'CANCELLED' },
          });
        }

        if (request.leaveRequest) {
          await tx.leaveRequest.update({
            where: { id: request.leaveRequest.id },
            data: { status: 'CANCELLED' },
          });
        }

        // 3. Status History Entry
        await tx.requestStatusHistory.create({
          data: {
            requestId: request.id,
            oldStatus: request.status,
            newStatus: 'CANCELLED',
            changedBy: actorId,
            comment: cancelComment,
          },
        });

        // 4. Audit Log Entries
        await AuditService.log({
          actorId,
          action: 'REQUEST_CANCELLED',
          entityType: 'REQUEST',
          entityId: request.id,
          oldValues: { status: request.status },
          newValues: { status: 'CANCELLED', reason },
          tx,
        });

        await AuditService.log({
          actorId,
          action: 'REQUEST_STATUS_CANCELLED',
          entityType: 'REQUEST',
          entityId: request.id,
          oldValues: { status: request.status },
          newValues: { status: 'CANCELLED', reason },
          tx,
        });

        if (request.gatePass) {
          await AuditService.log({
            actorId,
            action: 'GATE_PASS_CANCELLED',
            entityType: 'GATE_PASS',
            entityId: request.gatePass.id,
            oldValues: { gateStatus: request.gatePass.gateStatus },
            newValues: { gateStatus: 'CANCELLED' },
            tx,
          });
        }

        if (request.leaveRequest) {
          await AuditService.log({
            actorId,
            action: 'LEAVE_CANCELLED',
            entityType: 'LEAVE',
            entityId: request.leaveRequest.id,
            oldValues: { status: request.leaveRequest.status },
            newValues: { status: 'CANCELLED' },
            tx,
          });
        }

        if (request.bonafide) {
          await AuditService.log({
            actorId,
            action: 'BONAFIDE_CANCELLED',
            entityType: 'BONAFIDE',
            entityId: request.bonafide.id,
            tx,
          });
        }

        if (request.complaint) {
          await AuditService.log({
            actorId,
            action: 'COMPLAINT_CANCELLED',
            entityType: 'COMPLAINT',
            entityId: request.complaint.id,
            tx,
          });
        }

        return u;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Notifications post-transaction
    if (request.assignedTo) {
      await NotificationService.send({
        userId: request.assignedTo,
        title: `Task ${request.requestNumber} Cancelled`,
        message: `Task "${request.title}" was cancelled by the requester.`,
        type: 'INFO',
        referenceType: request.requestType.code,
        referenceId: request.id,
      });
    }

    await NotificationService.send({
      userId: actorId,
      title: `Request ${request.requestNumber} Cancelled`,
      message: `Your request "${request.title}" has been successfully cancelled.`,
      type: 'INFO',
      referenceType: request.requestType.code,
      referenceId: request.id,
    });

    return updated;
  }

  /**
   * Fetches full timeline for a request
   */
  static async getRequestTimeline(requestId: string) {
    return prisma.requestStatusHistory.findMany({
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
