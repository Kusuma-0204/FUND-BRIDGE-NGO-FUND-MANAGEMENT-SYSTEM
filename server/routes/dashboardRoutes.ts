import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = Router();

// Dashboard financial analytics
router.get('/stats', getDashboardStats);

export default router;
