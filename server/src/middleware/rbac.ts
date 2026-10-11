import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

/**
 * RBAC middleware factory.
 * Usage: rbacMiddleware(['sales', 'admin'])
 * Returns 403 if the authenticated user's role is not in the allowed list.
 */
export const rbacMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
};
