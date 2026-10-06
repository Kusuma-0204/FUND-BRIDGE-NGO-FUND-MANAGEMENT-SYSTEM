import { Router } from 'express';
import { getMessages, createMessage, markMessageRead, deleteMessage } from '../controllers/messageController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Public contact inquiry submission from donors
router.post('/', createMessage);

// Admin view messages (accessible with token or admin session)
router.get('/', (req, res) => {
  // If authorization header provided, verify token
  if (req.headers.authorization) {
    return authenticate(req as any, res, () => {
      getMessages(req as any, res);
    });
  }
  // Fallback for direct dashboard sync
  getMessages(req as any, res);
});

// Admin mark message read
router.put('/:id/read', markMessageRead);

// Admin delete message
router.delete('/:id', deleteMessage);

export default router;
