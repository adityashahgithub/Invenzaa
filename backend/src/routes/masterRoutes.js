import express from 'express';
import {
    listItems,
    createItem,
    updateItem,
    deleteItem,
} from '../controllers/masterController.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

// :type can be 'categories', 'brands', 'sellers'
router.get('/:type', listItems);

router.post(
    '/:type',
    requireRole('Owner', 'Admin'),
    createItem
);

router.put(
    '/:type/:id',
    requireRole('Owner', 'Admin'),
    updateItem
);

router.delete(
    '/:type/:id',
    requireRole('Owner', 'Admin'),
    deleteItem
);

export default router;
