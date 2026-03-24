import { AppError } from './errorHandler.js';
import { Role } from '../models/Role.js';

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

export const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Not authorized.', 401));
      }

      const orgId = req.user.organization?._id ?? req.user.organization;
      const roleName = req.user.role;

      const role = await Role.findOne({ organization: orgId, name: roleName })
        .select('permissions')
        .lean();

      // Owner/Admin fallback for legacy records where role doc may be missing.
      if (!role) {
        if (roleName === 'Owner' || roleName === 'Admin') return next();
        return next(new AppError('Role configuration not found for this organization.', 403));
      }

      const permissions = role.permissions || [];
      if (permissions.includes('*')) return next();

      const hasPermission = requiredPermissions.some((permission) =>
        permissions.includes(permission)
      );

      if (!hasPermission) {
        return next(new AppError('Insufficient permissions.', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
