import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// User profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Admin-only user management
router.get('/', authenticate, authorizeRoles('Administrator'), getAllUsers);
router.get('/:id', authenticate, authorizeRoles('Administrator'), getUserById);
router.put('/:id', authenticate, authorizeRoles('Administrator'), updateUser);
router.delete('/:id', authenticate, authorizeRoles('Administrator'), deleteUser);

export default router;
