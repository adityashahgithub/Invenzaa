import { body, param } from 'express-validator';

export const createRequestValidation = [
  body('toOrganizationId').isMongoId().withMessage('Valid organization ID required'),
  body('medicineId').isMongoId().withMessage('Valid medicine ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('message').optional().trim().isLength({ max: 500 }),
];

export const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid request ID'),
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),
];

export const createResponseValidation = [
  body('requestId').isMongoId().withMessage('Valid request ID required'),
  body('status').isIn(['accepted', 'declined']).withMessage('Status must be accepted or declined'),
  body('message').optional().trim().isLength({ max: 500 }),
  body('quantityOffered').optional().isInt({ min: 0 }),
];

export const idParamValidation = [param('id').isMongoId().withMessage('Invalid ID')];

export const requestIdParamValidation = [
  param('requestId').isMongoId().withMessage('Invalid request ID'),
];
