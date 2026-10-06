import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { store, getPool, isMySQL, DBAuditLog } from '../../database/db.js';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    let logs: DBAuditLog[] = [];

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
      logs = rows || [];
    } else {
      logs = [...store.auditLogs];
    }

    return res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
}
