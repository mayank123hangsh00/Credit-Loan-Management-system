import { Router } from 'express';
import {
  getSalesLeads,
  getSanctionLoans,
  approveLoan,
  rejectLoan,
  getDisbursementLoans,
  disburseLoan,
  getCollectionLoans,
  recordPayment,
  getLoanPayments,
  getDashboardStats,
} from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';

const router = Router();

router.use(authMiddleware);

// ── Sales ───────────────────────────────────────────────────
router.get('/sales/leads', rbacMiddleware(['sales', 'admin']), getSalesLeads);

// ── Sanction ────────────────────────────────────────────────
router.get('/sanction/loans', rbacMiddleware(['sanction', 'admin']), getSanctionLoans);
router.put('/sanction/:loanId/approve', rbacMiddleware(['sanction', 'admin']), approveLoan);
router.put('/sanction/:loanId/reject', rbacMiddleware(['sanction', 'admin']), rejectLoan);

// ── Disbursement ────────────────────────────────────────────
router.get('/disbursement/loans', rbacMiddleware(['disbursement', 'admin']), getDisbursementLoans);
router.put('/disbursement/:loanId/disburse', rbacMiddleware(['disbursement', 'admin']), disburseLoan);

// ── Collection ──────────────────────────────────────────────
router.get('/collection/loans', rbacMiddleware(['collection', 'admin']), getCollectionLoans);
router.post('/collection/:loanId/payment', rbacMiddleware(['collection', 'admin']), recordPayment);
router.get('/collection/:loanId/payments', rbacMiddleware(['collection', 'admin']), getLoanPayments);

// ── Executive & Operations Stats ─────────────────────────────
router.get(
  '/stats',
  rbacMiddleware(['admin', 'sales', 'sanction', 'disbursement', 'collection']),
  getDashboardStats
);

export default router;
