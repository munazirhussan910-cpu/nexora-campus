import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' does not have permission for this resource.`,
        },
      });
      return;
    }

    next();
  };
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Admins bypass granular checks if role is ADMIN
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const hasAll = requiredPermissions.every((p) =>
      req.user!.permissions.includes(p)
    );

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Missing required permissions: ${requiredPermissions.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
};
