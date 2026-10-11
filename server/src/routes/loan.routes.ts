import { Router } from 'express';
import {
  applyForLoan,
  getMyLoans,
  getLoanById,
} from '../controllers/loan.controller';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';

const router = Router();

router.use(authMiddleware);

// Apply and list loans: borrowers only
router.post('/apply', rbacMiddleware(['borrower']), applyForLoan);
router.get('/my-loans', rbacMiddleware(['borrower']), getMyLoans);

// View single loan: borrowers (own), executives, and admin
router.get(
  '/:id',
  rbacMiddleware(['borrower', 'admin', 'sales', 'sanction', 'disbursement', 'collection']),
  getLoanById
);

export default router;
