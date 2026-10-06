import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = Router();

// Authenticated users can list and view expenses
router.get('/', authenticate, getExpenses);
router.get('/:id', authenticate, getExpenseById);

// Submit expense claim (Admin, Volunteer, Partner)
router.post('/', authenticate, authorizeRoles('Administrator', 'Volunteer Staff', 'Beneficiary Partner'), createExpense);

// Audit & verify expense (Administrator, Volunteer Staff)
router.put('/:id', authenticate, authorizeRoles('Administrator', 'Volunteer Staff'), updateExpense);

// Delete expense (Administrator only)
router.delete('/:id', authenticate, authorizeRoles('Administrator'), deleteExpense);

export default router;
