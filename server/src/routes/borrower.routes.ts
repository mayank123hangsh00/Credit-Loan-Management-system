import { Router } from 'express';
import {
  submitPersonalDetails,
  uploadSalarySlip,
  getBorrowerStatus,
} from '../controllers/borrower.controller';
import { authMiddleware } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// All borrower routes require authentication and borrower role
router.use(authMiddleware);
router.use(rbacMiddleware(['borrower']));

router.put('/details', submitPersonalDetails);
router.post('/salary-slip', uploadMiddleware.single('salarySlip'), uploadSalarySlip);
router.get('/status', getBorrowerStatus);

export default router;
