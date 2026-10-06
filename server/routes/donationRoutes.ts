import { Router } from 'express';
import {
  getDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation
} from '../controllers/donationController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// Public / Guest can record donation; Authenticated or public sync can view
router.post('/', optionalAuthenticate, createDonation);
router.get('/', optionalAuthenticate, getDonations);
router.get('/:id', optionalAuthenticate, getDonationById);

// Admin-only management
router.put('/:id', authenticate, authorizeRoles('Administrator'), updateDonation);
router.delete('/:id', authenticate, authorizeRoles('Administrator'), deleteDonation);

export default router;
