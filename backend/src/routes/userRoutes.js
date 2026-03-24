import express from 'express';
import {
  getMe,
  updateMe,
  changePassword,
  getAllUsers,
  createUser,
  updateUserStatus,
} from '../controllers/userController.js';
import { changePasswordValidation, updateStatusValidation, createUserValidation, mongoIdParam } from '../utils/validators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/change-password', changePasswordValidation, validate, changePassword);

router.get('/', requireAdmin, getAllUsers);
router.post('/', requireAdmin, createUserValidation, validate, createUser);
router.patch('/:id/status', requireAdmin, ...mongoIdParam('id'), updateStatusValidation, validate, updateUserStatus);

export default router;
