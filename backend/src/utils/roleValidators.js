import { body, param } from 'express-validator';

export const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ max: 50 })
    .withMessage('Role name must be at most 50 characters'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*')
    .optional()
    .isString()
    .trim(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be at most 200 characters'),
];

export const updateRoleValidation = [
  param('id').isMongoId().withMessage('Invalid role ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Role name must be at most 50 characters'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*')
    .optional()
    .isString()
    .trim(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be at most 200 characters'),
];

export const roleIdValidation = [
  param('id').isMongoId().withMessage('Invalid role ID'),
];

export const assignRoleValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required'),
];
