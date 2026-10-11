import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { User } from '../models/User';
import { calculateLoan } from '../services/loan.service';

// POST /api/loans/apply
export const applyForLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loanAmount, tenureDays } = req.body;

    const amount = Number(loanAmount);
    const tenure = Number(tenureDays);

    // Validate range
    if (isNaN(amount) || amount < 50000 || amount > 500000) {
      res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000.' });
      return;
    }

    if (isNaN(tenure) || tenure < 30 || tenure > 365) {
      res.status(400).json({ message: 'Tenure must be between 30 and 365 days.' });
      return;
    }

    // Verify borrower has passed BRE and uploaded salary slip
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (!user.breCleared) {
      res.status(403).json({ message: 'Please complete the eligibility check first.' });
      return;
    }

    if (!user.salarySlipUrl) {
      res.status(403).json({ message: 'Please upload your salary slip first.' });
      return;
    }

    // Calculate loan
    const calc = calculateLoan(amount, tenure);

    const loan = await Loan.create({
      borrower: req.user!.userId,
      loanAmount: calc.loanAmount,
      tenureDays: calc.tenureDays,
      interestRate: calc.interestRate,
      simpleInterest: calc.simpleInterest,
      totalRepayment: calc.totalRepayment,
      outstandingBalance: calc.totalRepayment,
      status: 'APPLIED',
    });

    // Update user's application step
    await User.findByIdAndUpdate(req.user!.userId, { applicationStep: 4 });

    res.status(201).json({
      message: 'Loan application submitted successfully.',
      loan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit loan application.' });
  }
};

// GET /api/loans/my-loans
export const getMyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ borrower: req.user!.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({ loans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loans.' });
  }
};

// GET /api/loans/:id
export const getLoanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrower', 'fullName email pan monthlySalary employmentMode salarySlipUrl')
      .populate('sanctionedBy', 'fullName email')
      .populate('disbursedBy', 'fullName email');

    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    // Borrowers can only view their own loans
    if (
      req.user!.role === 'borrower' &&
      String(loan.borrower._id || loan.borrower) !== req.user!.userId
    ) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    res.status(200).json({ loan });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loan.' });
  }
};
