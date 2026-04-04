import express from 'express';
import {
  getStatus,
  getLowStock,
  getExpiryAlerts,
  getExpired,
  getLogs,
  getAvailableBatches,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);
router.use(requirePermission('inventory'));

router.get('/status', getStatus);
router.get('/batches', getAvailableBatches);
router.get('/low-stock', getLowStock);
router.get('/expiry-alerts', getExpiryAlerts);
router.get('/expired', getExpired);
router.get('/logs', getLogs);

export default router;
