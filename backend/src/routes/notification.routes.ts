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
      const notifications = await NotificationService.getUserNotifications(req.user!.id);
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

export default router;
