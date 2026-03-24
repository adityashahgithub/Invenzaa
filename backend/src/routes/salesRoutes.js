import express from 'express';
import { param } from 'express-validator';
import { createSale, listSales, getSaleById } from '../controllers/salesController.js';
import { saleValidation } from '../utils/inventoryValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  requirePermission('sales'),
  saleValidation,
  validate,
  createSale
);

router.get('/', requirePermission('sales'), listSales);

router.get('/:id', requirePermission('sales'), param('id').isMongoId().withMessage('Invalid sale ID'), validate, getSaleById);

export default router;
