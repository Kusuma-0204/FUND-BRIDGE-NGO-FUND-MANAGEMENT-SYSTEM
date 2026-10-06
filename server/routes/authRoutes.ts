import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  logout
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public auth endpoints
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-otp', forgotPasswordLimiter, verifyOtp);
router.post('/reset-password', forgotPasswordLimiter, resetPassword);

// Authenticated auth endpoints
router.put('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);

export default router;
