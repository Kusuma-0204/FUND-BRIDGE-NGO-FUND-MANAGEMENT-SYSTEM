import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { store, getPool, isMySQL, DBNotification } from '../../database/db.js';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const userId = req.user ? req.user.id : null;
    let notifications: DBNotification[] = [];

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query(
        'SELECT * FROM notifications WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC LIMIT 20',
        [userId]
      );
      notifications = rows || [];
    } else {
      notifications = store.notifications.filter(n => !n.user_id || n.user_id === userId);
    }

    return res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (isMySQL() && getPool()) {
      await getPool()!.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    } else {
      const notif = store.notifications.find(n => n.id === id);
      if (notif) notif.is_read = 1;
    }

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}
