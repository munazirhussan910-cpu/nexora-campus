import prisma from '../config/prisma';

export interface AuditParams {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  tx?: any;
}

export class AuditService {
  static async log(params: AuditParams) {
    try {
      const client = params.tx || prisma;
      return await client.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
          newValues: params.newValues ? JSON.stringify(params.newValues) : null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
      return null;
    }
  }

  static async getLogs(limit = 50, offset = 0, entityType?: string, action?: string) {
    return prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
        ...(action ? { action } : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            email: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
