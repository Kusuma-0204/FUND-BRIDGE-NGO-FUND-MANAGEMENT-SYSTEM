import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markNotificationRead);

export default router;
