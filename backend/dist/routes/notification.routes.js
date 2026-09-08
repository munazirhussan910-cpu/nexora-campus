"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
// GET /api/notifications
router.get('/', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const notifications = await notification_service_1.NotificationService.getUserNotifications(req.user.id);
        const unreadCount = await notification_service_1.NotificationService.getUnreadCount(req.user.id);
        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/notifications/:id/read
router.post('/:id/read', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        await notification_service_1.NotificationService.markAsRead(String(req.params.id), req.user.id);
        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/notifications/read-all
router.post('/read-all', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        await notification_service_1.NotificationService.markAllAsRead(req.user.id);
        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
