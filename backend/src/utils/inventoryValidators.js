import { body } from 'express-validator';

export const purchaseValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.medicineId').isMongoId().withMessage('Valid medicine ID required'),
  body('items.*.batchNo').trim().notEmpty().withMessage('Batch number required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be ≥ 0'),
  body('items.*.manufactureDate').isISO8601().withMessage('Valid manufacture date required'),
  body('items.*.expiryDate').isISO8601().withMessage('Valid expiry date required'),
  body('items.*.allowExpiredBatchImport').optional().isBoolean().withMessage('allowExpiredBatchImport must be true/false'),
  body('supplierName').optional().trim().isLength({ max: 200 }),
];

export const saleValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.medicineId').isMongoId().withMessage('Valid medicine ID required'),
  body('items.*.batchId').isMongoId().withMessage('Valid batch ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be ≥ 0'),
  body('customerName').optional().trim().isLength({ max: 200 }),
];
