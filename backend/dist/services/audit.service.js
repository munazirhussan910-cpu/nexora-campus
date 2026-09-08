"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class AuditService {
    static async log(params) {
        try {
            const client = params.tx || prisma_1.default;
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
        }
        catch (err) {
            console.error('Failed to create audit log:', err);
            return null;
        }
    }
    static async getLogs(limit = 50, offset = 0, entityType, action) {
        return prisma_1.default.auditLog.findMany({
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
exports.AuditService = AuditService;
