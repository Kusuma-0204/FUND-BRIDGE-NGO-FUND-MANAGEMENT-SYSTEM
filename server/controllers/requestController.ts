import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { store, getPool, isMySQL, DBRequest } from '../../database/db.js';
import { logAudit } from './authController.js';

export async function getRequests(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    const { status, category, search } = req.query;
    let requests: DBRequest[] = [];

    if (isMySQL() && getPool()) {
      let query = 'SELECT * FROM requests WHERE 1=1';
      const params: any[] = [];

      if (user && user.role === 'Beneficiary Partner') {
        query += ' AND requester_id = ?';
        params.push(user.id);
      }

      if (status && status !== 'All') {
        query += ' AND status = ?';
        params.push(status);
      }

      if (category && category !== 'All') {
        query += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (applicant_name LIKE ? OR tracking_code LIKE ? OR organization LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      query += ' ORDER BY created_at DESC';
      const [rows]: any = await getPool()!.query(query, params);
      requests = rows || [];
    } else {
      requests = [...store.requests];

      if (user && user.role === 'Beneficiary Partner') {
        requests = requests.filter(r => r.requester_id === user.id);
      }

      if (status && status !== 'All') {
        requests = requests.filter(r => r.status === status);
      }

      if (category && category !== 'All') {
        requests = requests.filter(r => r.category === category);
      }

      if (search) {
        const term = (search as string).toLowerCase();
        requests = requests.filter(r =>
          r.applicant_name.toLowerCase().includes(term) ||
          r.tracking_code.toLowerCase().includes(term) ||
          (r.organization && r.organization.toLowerCase().includes(term))
        );
      }

      requests.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }

    return res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err: any) {
    console.error('[Get Requests Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve aid requests.' });
  }
}

export async function getRequestById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    let requestItem: DBRequest | null = null;

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM requests WHERE id = ? OR tracking_code = ?', [id, id]);
      if (rows && rows.length > 0) requestItem = rows[0];
    } else {
      requestItem = store.requests.find(r => r.id === id || r.tracking_code === id) || null;
    }

    if (!requestItem) {
      return res.status(404).json({ success: false, message: 'Application request not found.' });
    }

    return res.json({ success: true, data: requestItem });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve request.' });
  }
}

// PUBLIC status tracker by tracking code e.g. REQ-2026-8941
export async function trackRequest(req: Request, res: Response) {
  try {
    const code = req.params.code.trim().toUpperCase();
    let requestItem: DBRequest | null = null;

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM requests WHERE UPPER(tracking_code) = ?', [code]);
      if (rows && rows.length > 0) requestItem = rows[0];
    } else {
      requestItem = store.requests.find(r => r.tracking_code.toUpperCase() === code) || null;
    }

    if (!requestItem) {
      return res.status(404).json({
        success: false,
        message: `No application found with tracking reference "${code}". Please verify your code.`
      });
    }

    return res.json({
      success: true,
      data: {
        tracking_code: requestItem.tracking_code,
        applicant_name: requestItem.applicant_name,
        organization: requestItem.organization,
        category: requestItem.category,
        urgency: requestItem.urgency,
        amount: requestItem.amount,
        status: requestItem.status,
        reviewed_by: requestItem.reviewed_by || 'Pending Review Desk',
        audit_remarks: requestItem.audit_remarks || 'Initial documentation submitted; volunteer audit in progress.',
        created_at: requestItem.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to track request.' });
  }
}

export async function createRequest(req: AuthRequest, res: Response) {
  try {
    const { applicant_name, organization, category, urgency, amount, purpose } = req.body;

    if (!applicant_name || !category || !amount || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Applicant name, category, amount, and purpose description are required.'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid grant request amount is required.' });
    }

    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `REQ-2026-${randSuffix}`;
    const requesterId = req.user ? req.user.id : null;
    const now = new Date().toISOString();

    const newRequest: DBRequest = {
      id: trackingCode,
      requester_id: requesterId,
      tracking_code: trackingCode,
      applicant_name: applicant_name.trim(),
      organization: organization ? organization.trim() : '',
      category: category.trim(),
      urgency: urgency || 'Normal',
      amount: numAmount,
      purpose: purpose.trim(),
      status: 'Pending Review',
      audit_remarks: 'Application received and queued for volunteer field verification.',
      created_at: now
    };

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        `INSERT INTO requests (id, requester_id, tracking_code, applicant_name, organization, category, urgency, amount, purpose, status, audit_remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newRequest.id, newRequest.requester_id, newRequest.tracking_code,
          newRequest.applicant_name, newRequest.organization, newRequest.category,
          newRequest.urgency, newRequest.amount, newRequest.purpose,
          newRequest.status, newRequest.audit_remarks
        ]
      );
    } else {
      store.requests.unshift(newRequest);
    }

    // Add notification for admins
    store.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: null,
      title: `New Aid Request: ${trackingCode}`,
      message: `${applicant_name} submitted a $${numAmount} request for ${category}.`,
      type: 'warning',
      is_read: 0,
      created_at: now
    });

    await logAudit(requesterId, 'REQUEST_SUBMITTED', `Grant request ${trackingCode} of $${numAmount} by ${applicant_name}`, req);

    return res.status(201).json({
      success: true,
      message: 'Grant application submitted successfully! Your tracking code has been generated.',
      tracking_code: trackingCode,
      data: newRequest
    });
  } catch (err: any) {
    console.error('[Create Request Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to submit grant application.' });
  }
}

export async function updateRequest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reviewed_by, audit_remarks } = req.body;

    const reviewer = reviewed_by || req.user?.full_name || 'Internal Audit Desk';

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        'UPDATE requests SET status = COALESCE(?, status), reviewed_by = ?, audit_remarks = COALESCE(?, audit_remarks) WHERE id = ? OR tracking_code = ?',
        [status, reviewer, audit_remarks, id, id]
      );
    } else {
      const item = store.requests.find(r => r.id === id || r.tracking_code === id);
      if (!item) return res.status(404).json({ success: false, message: 'Request not found.' });
      if (status) item.status = status;
      item.reviewed_by = reviewer;
      if (audit_remarks !== undefined) item.audit_remarks = audit_remarks;
    }

    await logAudit(req.user?.id || null, 'REQUEST_AUDITED', `Grant request ${id} updated to ${status} by ${reviewer}`, req);

    return res.json({ success: true, message: 'Application status updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update request.' });
  }
}

export async function deleteRequest(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (isMySQL() && getPool()) {
      await getPool()!.query('DELETE FROM requests WHERE id = ? OR tracking_code = ?', [id, id]);
    } else {
      const idx = store.requests.findIndex(r => r.id === id || r.tracking_code === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Request not found.' });
      store.requests.splice(idx, 1);
    }

    await logAudit(req.user?.id || null, 'REQUEST_DELETED', `Grant request ${id} deleted by administrator`, req);

    return res.json({ success: true, message: 'Request deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete request.' });
  }
}
