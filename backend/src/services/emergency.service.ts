import prisma from '../config/prisma';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

export interface EmergencyAlert {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  hostelBlock: string;
  roomNumber: string;
  phone: string;
  distressType: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'HARASSMENT' | 'GENERAL';
  description?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// In-memory cache for ultra-fast real-time retrieval & WebSocket-readiness
const activeAlerts: Map<string, EmergencyAlert> = new Map();

// Helper to generate emergency ID
function generateSosId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SOS-${new Date().getFullYear()}-${rand}`;
}

export class EmergencyService {
  /**
   * Trigger a new campus emergency SOS alert
   */
  static async trigger(params: {
    userId: string;
    studentName: string;
    rollNumber: string;
    hostelBlock?: string;
    roomNumber?: string;
    phone?: string;
    distressType: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'HARASSMENT' | 'GENERAL';
    description?: string;
  }): Promise<EmergencyAlert> {
    const alertId = generateSosId();
    const now = new Date();

    const alert: EmergencyAlert = {
      id: alertId,
      studentId: params.userId,
      studentName: params.studentName,
      rollNumber: params.rollNumber,
      hostelBlock: params.hostelBlock || 'Hostel Campus',
      roomNumber: params.roomNumber || 'Common Area',
      phone: params.phone || '+91 9876543210',
      distressType: params.distressType,
      description: params.description || 'Emergency SOS button triggered from student device.',
      status: 'ACTIVE',
      triggeredAt: now,
    };

    activeAlerts.set(alertId, alert);

    // Persist to database via IntegrationEvent for durability
    try {
      await prisma.integrationEvent.create({
        data: {
          source: 'EMERGENCY_SOS',
          payload: JSON.stringify(alert),
          status: 'PROCESSED',
          response: `Alert ${alertId} broadcasted to Security & Warden desks`,
        },
      });

      // Audit Log
      await AuditService.log({
        actorId: params.userId,
        action: 'EMERGENCY_SOS_TRIGGERED',
        entityType: 'EMERGENCY',
        entityId: alertId,
        newValues: {
          distressType: params.distressType,
          location: `${alert.hostelBlock} / Room ${alert.roomNumber}`,
          student: `${params.studentName} (${params.rollNumber})`,
        },
      });

      // Notify Security and Warden personnel
      const responders = await prisma.user.findMany({
        where: {
          role: {
            name: { in: ['SECURITY', 'WARDEN', 'ADMIN'] },
          },
        },
        select: { id: true, role: { select: { name: true } } },
      });

      for (const responder of responders) {
        await NotificationService.send({
          userId: responder.id,
          title: `🚨 EMERGENCY SOS: ${params.studentName} (${alert.distressType})`,
          message: `Location: ${alert.hostelBlock} - Room ${alert.roomNumber}. Phone: ${alert.phone}. Immediate response required!`,
          type: 'ALERT',
          referenceType: 'NOTICE',
          referenceId: alertId,
        });
      }
    } catch (err) {
      console.error('Failed to persist SOS alert to DB:', err);
    }

    return alert;
  }

  /**
   * Get all active (unresolved) emergency alerts
   */
  static getActive(): EmergencyAlert[] {
    return Array.from(activeAlerts.values())
      .filter((a) => a.status !== 'RESOLVED')
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Get all emergency alerts including resolved
   */
  static getAll(): EmergencyAlert[] {
    return Array.from(activeAlerts.values()).sort(
      (a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()
    );
  }

  /**
   * Acknowledge an emergency alert (Security dispatched)
   */
  static async acknowledge(
    id: string,
    responderName: string,
    responderId?: string
  ): Promise<EmergencyAlert | null> {
    const alert = activeAlerts.get(id);
    if (!alert) return null;

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = responderName;

    // Notify student that security has been dispatched
    try {
      await NotificationService.send({
        userId: alert.studentId,
        title: 'Security Dispatched to Your Location',
        message: `Security officer ${responderName} has acknowledged your SOS and is en route. Stay calm.`,
        type: 'INFO',
        referenceType: 'NOTICE',
        referenceId: alert.id,
      });

      if (responderId) {
        await AuditService.log({
          actorId: responderId,
          action: 'EMERGENCY_SOS_ACKNOWLEDGED',
          entityType: 'EMERGENCY',
          entityId: alert.id,
          newValues: { acknowledgedBy: responderName },
        });
      }
    } catch (err) {
      console.error('Failed to record SOS acknowledgement:', err);
    }

    return alert;
  }

  /**
   * Resolve an emergency alert
   */
  static async resolve(
    id: string,
    resolverName: string,
    resolutionNotes: string,
    resolverId?: string
  ): Promise<EmergencyAlert | null> {
    const alert = activeAlerts.get(id);
    if (!alert) return null;

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolverName;
    alert.resolutionNotes = resolutionNotes;

    // Update database log
    try {
      if (resolverId) {
        await AuditService.log({
          actorId: resolverId,
          action: 'EMERGENCY_SOS_RESOLVED',
          entityType: 'EMERGENCY',
          entityId: alert.id,
          newValues: {
            resolvedBy: resolverName,
            notes: resolutionNotes,
          },
        });
      }

      await NotificationService.send({
        userId: alert.studentId,
        title: 'Emergency SOS Marked Resolved',
        message: `Your emergency incident ${alert.id} has been marked resolved by ${resolverName}.`,
        type: 'SUCCESS',
        referenceType: 'NOTICE',
        referenceId: alert.id,
      });
    } catch (err) {
      console.error('Failed to record SOS resolution:', err);
    }

    return alert;
  }
}
