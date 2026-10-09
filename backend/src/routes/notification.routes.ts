import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

// GET /api/notifications
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Math.min(Math.max(parseInt(String(req.query.limit), 10) || 20, 1), 50) : 20;
      const notifications = await NotificationService.getUserNotifications(req.user!.id, limit);
      const unreadCount = await NotificationService.getUnreadCount(req.user!.id);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notifications/:id/read
router.post(
  '/:id/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await NotificationService.markAsRead(String(req.params.id), req.user!.id);
      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notifications/read-all
router.post(
  '/read-all',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/notifications/:id - Delete a specific notification owned by user
router.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await NotificationService.deleteNotification(String(req.params.id), req.user!.id);
      res.json({
        success: true,
        message: 'Notification removed',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
