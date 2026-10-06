import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { store, getPool, isMySQL, DBExpense } from '../../database/db.js';
import { logAudit } from './authController.js';

export async function getExpenses(req: AuthRequest, res: Response) {
  try {
    const { category, status, search } = req.query;
    let expenses: DBExpense[] = [];

    if (isMySQL() && getPool()) {
      let query = 'SELECT * FROM expenses WHERE 1=1';
      const params: any[] = [];

      if (category && category !== 'All') {
        query += ' AND category = ?';
        params.push(category);
      }

      if (status && status !== 'All') {
        query += ' AND status = ?';
        params.push(status);
      }

      if (search) {
        query += ' AND (title LIKE ? OR vendor LIKE ? OR id LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      query += ' ORDER BY created_at DESC';
      const [rows]: any = await getPool()!.query(query, params);
      expenses = rows || [];
    } else {
      expenses = [...store.expenses];

      if (category && category !== 'All') {
        expenses = expenses.filter(e => e.category === category);
      }

      if (status && status !== 'All') {
        expenses = expenses.filter(e => e.status === status);
      }

      if (search) {
        const term = (search as string).toLowerCase();
        expenses = expenses.filter(e =>
          e.title.toLowerCase().includes(term) ||
          e.vendor.toLowerCase().includes(term) ||
          e.id.toLowerCase().includes(term)
        );
      }

      expenses.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }

    return res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err: any) {
    console.error('[Get Expenses Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve expenses.' });
  }
}

export async function getExpenseById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    let expense: DBExpense | null = null;

    if (isMySQL() && getPool()) {
      const [rows]: any = await getPool()!.query('SELECT * FROM expenses WHERE id = ?', [id]);
      if (rows && rows.length > 0) expense = rows[0];
    } else {
      expense = store.expenses.find(e => e.id === id) || null;
    }

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found.' });
    }

    return res.json({ success: true, data: expense });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve expense.' });
  }
}

export async function createExpense(req: AuthRequest, res: Response) {
  try {
    const { title, category, amount, vendor, notes } = req.body;

    if (!title || !category || !amount || !vendor) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, amount, and vendor are required.'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid expense amount is required.' });
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const expenseId = `EXP-2026-${randSuffix}`;
    const submitter = req.user ? req.user.id : null;
    const auditor = req.user?.role === 'Administrator' ? req.user.full_name : 'Internal Audit Desk';
    const status = req.user?.role === 'Administrator' ? 'Verified & Paid' : 'Pending Audit';

    const newExpense: DBExpense = {
      id: expenseId,
      title: title.trim(),
      category: category.trim(),
      amount: numAmount,
      vendor: vendor.trim(),
      expense_date: dateStr,
      submitted_by: submitter || undefined,
      audited_by: auditor,
      status,
      notes: notes || '',
      created_at: now.toISOString()
    };

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        `INSERT INTO expenses (id, title, category, amount, vendor, expense_date, submitted_by, audited_by, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newExpense.id, newExpense.title, newExpense.category, newExpense.amount,
          newExpense.vendor, newExpense.expense_date, newExpense.submitted_by || null,
          newExpense.audited_by, newExpense.status, newExpense.notes
        ]
      );
    } else {
      store.expenses.unshift(newExpense);
    }

    await logAudit(submitter, 'EXPENSE_SUBMITTED', `Expense claim ${expenseId} of $${numAmount} for ${vendor}`, req);

    return res.status(201).json({
      success: true,
      message: 'Expense claim recorded and dispatched for audit review.',
      data: newExpense
    });
  } catch (err: any) {
    console.error('[Create Expense Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to record expense.' });
  }
}

export async function updateExpense(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, audited_by, notes } = req.body;

    const auditor = audited_by || req.user?.full_name || 'Internal Audit Desk';

    if (isMySQL() && getPool()) {
      await getPool()!.query(
        'UPDATE expenses SET status = COALESCE(?, status), audited_by = ?, notes = COALESCE(?, notes) WHERE id = ?',
        [status, auditor, notes, id]
      );
    } else {
      const exp = store.expenses.find(e => e.id === id);
      if (!exp) return res.status(404).json({ success: false, message: 'Expense record not found.' });
      if (status) exp.status = status;
      exp.audited_by = auditor;
      if (notes !== undefined) exp.notes = notes;
    }

    await logAudit(req.user?.id || null, 'EXPENSE_AUDITED', `Expense ${id} status updated to ${status} by ${auditor}`, req);

    return res.json({ success: true, message: 'Expense status updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
}

export async function deleteExpense(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (isMySQL() && getPool()) {
      await getPool()!.query('DELETE FROM expenses WHERE id = ?', [id]);
    } else {
      const idx = store.expenses.findIndex(e => e.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Expense not found.' });
      store.expenses.splice(idx, 1);
    }

    await logAudit(req.user?.id || null, 'EXPENSE_DELETED', `Expense ${id} deleted`, req);

    return res.json({ success: true, message: 'Expense claim deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
}
