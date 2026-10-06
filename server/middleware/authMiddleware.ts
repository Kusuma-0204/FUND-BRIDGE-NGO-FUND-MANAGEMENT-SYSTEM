import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store, getPool, isMySQL, DBUser } from '../../database/db.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
}

export const JWT_SECRET = process.env.JWT_SECRET || 'fund_bridge_super_secret_jwt_key_2026_change_in_prod';

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    if (isMySQL() && getPool()) {
      const pool = getPool()!;
      const [rows]: any = await pool.query('SELECT id, full_name, email, role, status FROM users WHERE id = ?', [decoded.id]);
      if (!rows || rows.length === 0) {
        return res.status(401).json({ success: false, message: 'User account no longer exists.' });
      }
      const user = rows[0];
      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Account is suspended. Contact administrator.' });
      }
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      };
      return next();
    } else {
      const user = store.users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User account no longer exists.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Account is suspended. Contact administrator.' });
      }
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      };
      return next();
    }
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
}

export async function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-auth-token'] as string);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = store.users.find(u => u.id === decoded.id);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      };
    }
  } catch {}
  next();
}
