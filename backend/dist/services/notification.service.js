"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class NotificationService {
    static async send(params) {
        try {
            return await prisma_1.default.notification.create({
                data: {
                    userId: params.userId,
                    title: params.title,
                    message: params.message,
                    type: params.type || 'INFO',
                    referenceType: params.referenceType,
                    referenceId: params.referenceId,
                },
            });
        }
        catch (err) {
            console.error('Failed to send notification:', err);
            return null;
        }
    }
    static async getUserNotifications(userId, limit = 20) {
        return prisma_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    static async getUnreadCount(userId) {
        return prisma_1.default.notification.count({
            where: { userId, isRead: false },
        });
    }
    static async markAsRead(notificationId, userId) {
        return prisma_1.default.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    static async markAllAsRead(userId) {
        return prisma_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
}
exports.NotificationService = NotificationService;
