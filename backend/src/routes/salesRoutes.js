import express from 'express';
import { param } from 'express-validator';
import { createSale, listSales, getSaleById } from '../controllers/salesController.js';
import { saleValidation } from '../utils/inventoryValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  requireRole('Owner', 'Admin', 'Pharmacist', 'Staff'),
  saleValidation,
  validate,
  createSale
);

router.get('/', listSales);

router.get('/:id', param('id').isMongoId().withMessage('Invalid sale ID'), validate, getSaleById);

export default router;
