import express from 'express';
import { param } from 'express-validator';
import {
  createPurchase,
  listPurchases,
  getPurchaseById,
} from '../controllers/purchasesController.js';
import { purchaseValidation } from '../utils/inventoryValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  requireRole('Owner', 'Admin', 'Pharmacist'),
  purchaseValidation,
  validate,
  createPurchase
);

router.get('/', listPurchases);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid purchase ID'),
  validate,
  getPurchaseById
);

export default router;
