import { Router } from 'express';
import { getSettings, updateSettings, resetDemoData } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', getSettings);
router.put('/', authenticate, authorizeRoles('Administrator'), updateSettings);
router.post('/reset-demo-data', authenticate, authorizeRoles('Administrator'), resetDemoData);

export default router;
