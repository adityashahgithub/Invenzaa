import { body, param, query } from 'express-validator';

export const createMedicineValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
  body('genericName').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('category').optional().trim().isLength({ max: 100 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('unit').optional().trim().isLength({ max: 20 }),
  body('minStockLevel').optional().isInt({ min: 0 }).withMessage('Min stock must be ≥ 0'),
  body('prescriptionRequired').optional().isBoolean(),
];

export const updateMedicineValidation = [
  param('id').isMongoId().withMessage('Invalid medicine ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('genericName').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('category').optional().trim().isLength({ max: 100 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('unit').optional().trim().isLength({ max: 20 }),
  body('minStockLevel').optional().isInt({ min: 0 }),
  body('prescriptionRequired').optional().isBoolean(),
];

export const idParamValidation = [
  param('id').isMongoId().withMessage('Invalid medicine ID'),
];

export const listValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('category').optional().trim(),
];

export const searchValidation = [
  query('q').trim().notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
];
