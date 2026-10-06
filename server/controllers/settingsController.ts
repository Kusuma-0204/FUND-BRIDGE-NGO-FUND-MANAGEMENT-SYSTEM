import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { getPool, isMySQL, store } from '../../database/db.js';
import { logAudit } from './authController.js';

let defaultSettings = {
  ngo_name: 'Fund Bridge NGO Global Foundation',
  reg_number: 'NGO-2018-NY-98442',
  tax_80g: '80G-EXEMPT-2026-B94',
  currency: '₹',
  upi_id: '9391514815@pthdfc',
  enable_upi: 1,
  enable_card: 1,
  auto_80g: 1
};

export async function getSettings(req: Request, res: Response) {
  try {
    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM system_settings WHERE id = 1');
      if (rows && rows.length > 0) {
        const row = rows[0];
        if (row.upi_id === 'ngofunds@sbi') row.upi_id = '9391514815@pthdfc';
        return res.json({ success: true, data: row });
      }
    }
    return res.json({ success: true, data: defaultSettings });
  } catch (err) {
    return res.json({ success: true, data: defaultSettings });
  }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const { ngo_name, reg_number, tax_80g, currency, upi_id, enable_upi, enable_card, auto_80g } = req.body;

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        `UPDATE system_settings SET 
         ngo_name = COALESCE(?, ngo_name),
         reg_number = COALESCE(?, reg_number),
         tax_80g = COALESCE(?, tax_80g),
         currency = COALESCE(?, currency),
         upi_id = COALESCE(?, upi_id),
         enable_upi = COALESCE(?, enable_upi),
         enable_card = COALESCE(?, enable_card),
         auto_80g = COALESCE(?, auto_80g)
         WHERE id = 1`,
        [ngo_name, reg_number, tax_80g, currency, upi_id, enable_upi, enable_card, auto_80g]
      );
    }

    defaultSettings = {
      ...defaultSettings,
      ...(ngo_name ? { ngo_name } : {}),
      ...(reg_number ? { reg_number } : {}),
      ...(tax_80g ? { tax_80g } : {}),
      ...(currency ? { currency } : {}),
      ...(upi_id ? { upi_id } : {})
    };

    await logAudit(req.user?.id || null, 'SETTINGS_UPDATED', 'System settings updated by administrator', req);

    return res.json({ success: true, message: 'System settings saved successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update system settings.' });
  }
}

export async function resetDemoData(req: AuthRequest, res: Response) {
  try {
    store.seed();
    await logAudit(req.user?.id || null, 'DATA_RESET', 'Demo database records re-seeded', req);
    return res.json({ success: true, message: 'Demo dataset successfully reset to baseline.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to reset demo data.' });
  }
}
