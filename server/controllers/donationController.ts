import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { store, getPool, isMySQL, DBDonation } from '../../database/db.js';
import { logAudit } from './authController.js';

export async function getDonations(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    const { category, search } = req.query;

    let donations: DBDonation[] = [];

    if (isMySQL() && getPool()) {
      let query = 'SELECT * FROM donations WHERE 1=1';
      const params: any[] = [];

      // If Donor Member, restrict to own donations unless scope=all is requested
      if (user && user.role === 'Donor Member' && req.query.scope !== 'all') {
        query += ' AND (donor_id = ? OR donor_email = ?)';
        params.push(user.id, user.email);
      }

      if (category && category !== 'All') {
        query += ' AND category = ?';
        params.push(category);
      }

      if (search) {
        query += ' AND (donor_name LIKE ? OR id LIKE ? OR donor_email LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      query += ' ORDER BY created_at DESC';
      const [rows]: any = await getPool()!.query(query, params);
      donations = rows || [];
    } else {
      donations = [...store.donations];

      if (user && user.role === 'Donor Member' && req.query.scope !== 'all') {
        donations = donations.filter(d => d.donor_id === user.id || d.donor_email.toLowerCase() === user.email.toLowerCase());
      }

      if (category && category !== 'All') {
        donations = donations.filter(d => d.category === category);
      }

      if (search) {
        const term = (search as string).toLowerCase();
        donations = donations.filter(d =>
          d.donor_name.toLowerCase().includes(term) ||
          d.id.toLowerCase().includes(term) ||
          d.donor_email.toLowerCase().includes(term)
        );
      }

      donations.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }

    return res.json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (err: any) {
    console.error('[Get Donations Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve donations.' });
  }
}

export async function getDonationById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    let donation: DBDonation | null = null;

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM donations WHERE id = ?', [id]);
      if (rows && rows.length > 0) donation = rows[0];
    } else {
      donation = store.donations.find(d => d.id === id) || null;
    }

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' });
    }

    // Role check: Donors cannot view others' private donation records
    if (req.user && req.user.role === 'Donor Member' && donation.donor_email !== req.user.email && donation.donor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this receipt.' });
    }

    return res.json({ success: true, data: donation });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve donation.' });
  }
}

export async function createDonation(req: AuthRequest, res: Response) {
  try {
    const {
      id: customId,
      donor_name,
      donor_email,
      amount,
      category,
      payment_method,
      payment_reference,
      tax_exemption_80g,
      is_anonymous,
      notes,
      donation_date
    } = req.body;

    if (!donor_name || !donor_email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Donor name, email, and amount are required.'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid donation amount is required.' });
    }

    const now = new Date();
    const dateStr = donation_date || now.toISOString().split('T')[0];
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const donationId = customId || `DON-2026-${randSuffix}`;
    const donorId = req.user ? req.user.id : null;
    const pRef = payment_reference || (payment_method === 'UPI / QR Code' ? `UPI-TXN-${Date.now().toString().slice(-6)}` : `CARD-TXN-${Date.now().toString().slice(-6)}`);

    const newDonation: DBDonation = {
      id: donationId,
      donor_id: donorId,
      donor_name: donor_name.trim(),
      donor_email: donor_email.trim().toLowerCase(),
      amount: numAmount,
      category: category || 'General Fund',
      payment_method: payment_method || 'UPI / QR Code',
      payment_reference: pRef,
      tax_exemption_80g: tax_exemption_80g !== undefined ? (tax_exemption_80g ? 1 : 0) : 1,
      is_anonymous: is_anonymous ? 1 : 0,
      status: 'Completed',
      donation_date: dateStr,
      notes: notes || '',
      created_at: now.toISOString()
    };

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        `INSERT INTO donations (id, donor_id, donor_name, donor_email, amount, category, payment_method, payment_reference, tax_exemption_80g, is_anonymous, status, donation_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), category = VALUES(category), status = VALUES(status)`,
        [
          newDonation.id, newDonation.donor_id, newDonation.donor_name, newDonation.donor_email,
          newDonation.amount, newDonation.category, newDonation.payment_method, newDonation.payment_reference,
          newDonation.tax_exemption_80g, newDonation.is_anonymous, newDonation.status, newDonation.donation_date, newDonation.notes
        ]
      );
    } else {
      const existingIdx = store.donations.findIndex(d => d.id === newDonation.id);
      if (existingIdx >= 0) {
        store.donations[existingIdx] = newDonation;
      } else {
        store.donations.unshift(newDonation);
      }
      store.saveToDisk();
    }

    await logAudit(donorId, 'DONATION_RECORDED', `Donation ${donationId} of $${numAmount} recorded by ${donor_name}`, req);

    return res.status(201).json({
      success: true,
      message: 'Donation successfully recorded. 80G tax exemption receipt generated.',
      data: newDonation
    });
  } catch (err: any) {
    console.error('[Create Donation Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to record donation.' });
  }
}

export async function updateDonation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes, category } = req.body;

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        'UPDATE donations SET status = COALESCE(?, status), notes = COALESCE(?, notes), category = COALESCE(?, category) WHERE id = ?',
        [status, notes, category, id]
      );
    } else {
      const donation = store.donations.find(d => d.id === id);
      if (!donation) return res.status(404).json({ success: false, message: 'Donation not found.' });
      if (status) donation.status = status;
      if (notes !== undefined) donation.notes = notes;
      if (category) donation.category = category;
    }

    await logAudit(req.user?.id || null, 'DONATION_UPDATED', `Donation ${id} status updated to ${status}`, req);

    return res.json({ success: true, message: 'Donation updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update donation.' });
  }
}

export async function deleteDonation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (isMySQL() && getPool()) {
      await getPool()!.query('DELETE FROM donations WHERE id = ?', [id]);
    } else {
      const idx = store.donations.findIndex(d => d.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Donation not found.' });
      store.donations.splice(idx, 1);
    }

    await logAudit(req.user?.id || null, 'DONATION_DELETED', `Donation ${id} removed by admin`, req);

    return res.json({ success: true, message: 'Donation record deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete donation.' });
  }
}
