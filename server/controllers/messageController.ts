import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { store, getPool, isMySQL, DBMessage } from '../../database/db.js';

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    let messages: DBMessage[] = [];

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM messages ORDER BY created_at DESC');
      messages = rows || [];
    } else {
      messages = [...store.messages];
    }

    return res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
}

export async function createMessage(req: Request, res: Response) {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    const msgId = `msg-${Date.now()}`;
    const now = new Date().toISOString();

    const newMsg: DBMessage = {
      id: msgId,
      sender_name: name.trim(),
      sender_email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      subject: subject ? subject.trim() : 'General Inquiry',
      message: message.trim(),
      is_read: 0,
      created_at: now
    };

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        'INSERT INTO messages (id, sender_name, sender_email, subject, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
        [newMsg.id, newMsg.sender_name, newMsg.sender_email, newMsg.subject, newMsg.message, now]
      );
    } else {
      store.messages.unshift(newMsg);
      store.saveToDisk();
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received and routed to our administration inbox.',
      data: newMsg
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

export async function markMessageRead(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (isMySQL() && getPool()) {
      await getPool()!.query('UPDATE messages SET is_read = 1 WHERE id = ?', [id]);
    } else {
      const msg = store.messages.find(m => m.id === id);
      if (msg) {
        msg.is_read = 1;
        store.saveToDisk();
      }
    }

    return res.json({ success: true, message: 'Message marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update message.' });
  }
}

export async function deleteMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (isMySQL() && getPool()) {
      await getPool()!.query('DELETE FROM messages WHERE id = ?', [id]);
    } else {
      store.messages = store.messages.filter(m => m.id !== id);
      store.saveToDisk();
    }

    return res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
}
