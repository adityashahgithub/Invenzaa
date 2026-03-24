import express from 'express';
import {
  getInventoryReport,
  getSalesReport,
  getPurchasesReport,
  getLowStockReport,
  getExpiryReport,
} from '../controllers/reportsController.js';
import { reportQueryValidation } from '../utils/reportValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);
router.use(requirePermission('reports'));

router.get('/inventory', getInventoryReport);
router.get('/sales', reportQueryValidation, validate, getSalesReport);
router.get('/purchases', reportQueryValidation, validate, getPurchasesReport);
router.get('/low-stock', getLowStockReport);
router.get('/expiry', reportQueryValidation, validate, getExpiryReport);

export default router;
