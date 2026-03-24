import express from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
} from '../controllers/rolesController.js';
import {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  assignRoleValidation,
} from '../utils/roleValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/', getRoles);
router.post('/', createRoleValidation, validate, createRole);
router.put('/:id', updateRoleValidation, validate, updateRole);
router.delete('/:id', roleIdValidation, validate, deleteRole);
router.patch('/assign/:userId', assignRoleValidation, validate, assignRole);

export default router;
