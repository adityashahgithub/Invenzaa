import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  refreshTokenValidation,
} from '../utils/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);
router.post('/refresh', refreshTokenValidation, validate, refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
