import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// Admin-only audit logs
router.get('/', authenticate, authorizeRoles('Administrator'), getAuditLogs);

export default router;
