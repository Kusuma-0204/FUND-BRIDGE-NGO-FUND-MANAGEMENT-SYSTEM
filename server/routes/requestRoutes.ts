import { Router } from 'express';
import {
  getRequests,
  getRequestById,
  trackRequest,
  createRequest,
  updateRequest,
  deleteRequest
} from '../controllers/requestController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// Public grant submission & public reference tracking
router.post('/', createRequest);
router.get('/track/:code', trackRequest);

// Aid requests listing (with optional auth or token)
router.get('/', optionalAuthenticate, getRequests);
router.get('/:id', authenticate, getRequestById);

// Status review & auditing (Administrator, Volunteer Staff)
router.put('/:id', authenticate, authorizeRoles('Administrator', 'Volunteer Staff'), updateRequest);

// Delete application (Administrator only)
router.delete('/:id', authenticate, authorizeRoles('Administrator'), deleteRequest);

export default router;
