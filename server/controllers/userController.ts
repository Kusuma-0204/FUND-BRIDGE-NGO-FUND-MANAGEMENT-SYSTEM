import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { store, getPool, isMySQL, DBUser } from '../../database/db.js';
import { logAudit } from './authController.js';

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let user: DBUser | null = null;

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (rows && rows.length > 0) user = rows[0];
    } else {
      user = store.users.find(u => u.id === req.user!.id) || null;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || user.full_name.substring(0, 2).toUpperCase(),
        kyc_verified: !!user.kyc_verified,
        status: user.status,
        member_since: user.member_since || '2026',
        audits_approved: user.audits_approved || 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { full_name, phone, bio } = req.body;
    let updatedUser: any = null;

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        'UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), bio = COALESCE(?, bio) WHERE id = ? OR email = ?',
        [full_name ? full_name.trim() : null, phone !== undefined ? phone : null, bio !== undefined ? bio : null, req.user.id, req.user.email]
      );
      const [rows]: any = await getPool()!.query('SELECT * FROM users WHERE id = ? OR email = ?', [req.user.id, req.user.email]);
      if (rows && rows.length > 0) updatedUser = rows[0];
    } else {
      const user = store.users.find(u => u.id === req.user!.id || u.email.toLowerCase() === req.user!.email.toLowerCase());
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      if (full_name && full_name.trim()) {
        user.full_name = full_name.trim();
        const parts = user.full_name.split(' ').filter(Boolean);
        user.avatar = (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].substring(0, 2)).toUpperCase();
      }
      if (phone !== undefined) user.phone = phone.trim();
      if (bio !== undefined) user.bio = bio.trim();

      // Persist permanently to JSON storage
      store.saveToDisk();
      updatedUser = user;
    }

    await logAudit(req.user.id, 'PROFILE_UPDATED', `User profile updated by ${req.user.email}`, req);

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser?.id || req.user.id,
        name: updatedUser?.full_name || full_name,
        email: updatedUser?.email || req.user.email,
        role: updatedUser?.role || req.user.role,
        phone: updatedUser?.phone || phone || '',
        bio: updatedUser?.bio || bio || '',
        avatar: updatedUser?.avatar || 'AD',
        kycVerified: Boolean(updatedUser?.kyc_verified ?? 1),
        status: updatedUser?.status || 'active',
        memberSince: updatedUser?.member_since || '2026',
        auditsApproved: updatedUser?.audits_approved || 0
      }
    });
  } catch (err: any) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

// -----------------------------------------------------------------------------
// Administrator User Management APIs
// -----------------------------------------------------------------------------
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    let users: DBUser[] = [];

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query(
        'SELECT id, full_name, email, role, phone, bio, avatar, kyc_verified, status, member_since, audits_approved, created_at FROM users ORDER BY created_at DESC'
      );
      users = rows || [];
    } else {
      users = store.users.map(u => ({ ...u, password_hash: '' }));
    }

    // Strip password hashes
    const sanitized = users.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    return res.json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    let user: DBUser | null = null;

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM users WHERE id = ?', [id]);
      if (rows && rows.length > 0) user = rows[0];
    } else {
      user = store.users.find(u => u.id === id) || null;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { password_hash, ...sanitized } = user;
    return res.json({ success: true, data: sanitized });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve user.' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { full_name, role, status, kyc_verified, phone } = req.body;

    if (role === 'Administrator') {
      const targetUser = store.users.find(u => u.id === id);
      if (targetUser && targetUser.email.toLowerCase() !== 'aadminngo@gmail.com') {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: Administrator role is restricted to authorized personnel.'
        });
      }
    }

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        'UPDATE users SET full_name = COALESCE(?, full_name), role = COALESCE(?, role), status = COALESCE(?, status), kyc_verified = COALESCE(?, kyc_verified), phone = COALESCE(?, phone) WHERE id = ?',
        [full_name, role, status, kyc_verified !== undefined ? (kyc_verified ? 1 : 0) : null, phone, id]
      );
    } else {
      const user = store.users.find(u => u.id === id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      if (full_name) user.full_name = full_name;
      if (role) user.role = role;
      if (status) user.status = status;
      if (kyc_verified !== undefined) user.kyc_verified = kyc_verified ? 1 : 0;
      if (phone !== undefined) user.phone = phone;
    }

    await logAudit(req.user?.id || null, 'USER_ADMIN_UPDATE', `User ${id} modified by administrator`, req);

    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'Administrators cannot delete their own active account.' });
    }

    if (isMySQL() && getPool()) {
      await getPool()!.query('DELETE FROM users WHERE id = ?', [id]);
    } else {
      const idx = store.users.findIndex(u => u.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'User not found.' });
      store.users.splice(idx, 1);
    }

    await logAudit(req.user?.id || null, 'USER_DELETED', `User ${id} removed by administrator`, req);

    return res.json({ success: true, message: 'User account deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}
