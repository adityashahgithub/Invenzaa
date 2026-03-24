import { AppError } from './errorHandler.js';

const ROLE_HIERARCHY = ['Viewer', 'Staff', 'Pharmacist', 'Admin', 'Owner'];

const hasMinimumRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel && userLevel !== -1;
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized.', 401));
    }

    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    next(new AppError('Insufficient permissions.', 403));
  };
};

export const requireAdmin = requireRole('Admin', 'Owner');
export const requireOwner = requireRole('Owner');
