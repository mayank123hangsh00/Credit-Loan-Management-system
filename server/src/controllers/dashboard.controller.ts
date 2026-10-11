import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { User } from '../models/User';
import { Payment } from '../models/Payment';

// ── SALES MODULE ──────────────────────────────────────────────────────────────

// GET /api/dashboard/sales/leads
// Returns registered borrowers who haven't applied for any loan yet
export const getSalesLeads = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Find all borrowers who have at least one loan
    const borrowersWithLoans = await Loan.distinct('borrower');

    const leads = await User.find({
      role: 'borrower',
      _id: { $nin: borrowersWithLoans },
    }).select('fullName email applicationStep breCleared createdAt monthlySalary employmentMode');

    res.status(200).json({ leads, total: leads.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leads.' });
  }
};

// ── SANCTION MODULE ───────────────────────────────────────────────────────────

// GET /api/dashboard/sanction/loans
export const getSanctionLoans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'APPLIED' })
      .populate('borrower', 'fullName email pan monthlySalary employmentMode salarySlipUrl dateOfBirth')
      .sort({ createdAt: -1 });

    res.status(200).json({ loans, total: loans.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loans for sanction.' });
  }
};

// PUT /api/dashboard/sanction/:loanId/approve
export const approveLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.loanId);

    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'APPLIED') {
      res.status(400).json({
        message: `Cannot approve a loan with status: ${loan.status}. Only APPLIED loans can be approved.`,
      });
      return;
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.loanId,
      {
        status: 'SANCTIONED',
        sanctionedBy: req.user!.userId,
        sanctionedAt: new Date(),
      },
      { new: true }
    ).populate('borrower', 'fullName email');

    res.status(200).json({
      message: 'Loan sanctioned successfully.',
      loan: updatedLoan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve loan.' });
  }
};

// PUT /api/dashboard/sanction/:loanId/reject
export const rejectLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      res.status(400).json({ message: 'A rejection reason is required.' });
      return;
    }

    const loan = await Loan.findById(req.params.loanId);

    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'APPLIED') {
      res.status(400).json({
        message: `Cannot reject a loan with status: ${loan.status}. Only APPLIED loans can be rejected.`,
      });
      return;
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.loanId,
      {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
      },
      { new: true }
    ).populate('borrower', 'fullName email');

    res.status(200).json({
      message: 'Loan rejected.',
      loan: updatedLoan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject loan.' });
  }
};

// ── DISBURSEMENT MODULE ───────────────────────────────────────────────────────

// GET /api/dashboard/disbursement/loans
export const getDisbursementLoans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'SANCTIONED' })
      .populate('borrower', 'fullName email pan')
      .populate('sanctionedBy', 'fullName email')
      .sort({ sanctionedAt: -1 });

    res.status(200).json({ loans, total: loans.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loans for disbursement.' });
  }
};

// PUT /api/dashboard/disbursement/:loanId/disburse
export const disburseLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.loanId);

    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'SANCTIONED') {
      res.status(400).json({
        message: `Cannot disburse a loan with status: ${loan.status}. Only SANCTIONED loans can be disbursed.`,
      });
      return;
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.loanId,
      {
        status: 'DISBURSED',
        disbursedBy: req.user!.userId,
        disbursedAt: new Date(),
      },
      { new: true }
    ).populate('borrower', 'fullName email');

    res.status(200).json({
      message: 'Loan disbursed successfully. Funds released.',
      loan: updatedLoan,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disburse loan.' });
  }
};

// ── COLLECTION MODULE ─────────────────────────────────────────────────────────

// GET /api/dashboard/collection/loans
export const getCollectionLoans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: { $in: ['DISBURSED', 'CLOSED'] } })
      .populate('borrower', 'fullName email pan')
      .populate('disbursedBy', 'fullName email')
      .sort({ disbursedAt: -1 });

    res.status(200).json({ loans, total: loans.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loans for collection.' });
  }
};

// POST /api/dashboard/collection/:loanId/payment
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { utrNumber, amount, date } = req.body;

    if (!utrNumber || !amount || !date) {
      res.status(400).json({ message: 'UTR number, amount, and date are required.' });
      return;
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({ message: 'Payment amount must be a positive number.' });
      return;
    }

    const paymentDate = new Date(date);
    if (isNaN(paymentDate.getTime())) {
      res.status(400).json({ message: 'Invalid payment date.' });
      return;
    }

    const loan = await Loan.findById(req.params.loanId);

    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'DISBURSED') {
      res.status(400).json({
        message: `Cannot record payment for a loan with status: ${loan.status}. Only DISBURSED loans accept payments.`,
      });
      return;
    }

    // Validate payment amount doesn't exceed outstanding balance
    if (paymentAmount > loan.outstandingBalance) {
      res.status(400).json({
        message: `Payment amount (₹${paymentAmount.toLocaleString('en-IN')}) exceeds outstanding balance (₹${loan.outstandingBalance.toLocaleString('en-IN')}).`,
      });
      return;
    }

    // Check UTR uniqueness (DB index also ensures this, but give a friendly message)
    const existingPayment = await Payment.findOne({
      utrNumber: utrNumber.toString().toUpperCase().trim(),
    });
    if (existingPayment) {
      res.status(409).json({
        message: 'A payment with this UTR number already exists. UTR must be unique.',
      });
      return;
    }

    // Create payment record
    const payment = await Payment.create({
      loan: loan._id,
      borrower: loan.borrower,
      utrNumber: utrNumber.toString().toUpperCase().trim(),
      amount: paymentAmount,
      date: paymentDate,
      recordedBy: req.user!.userId,
    });

    // Update outstanding balance
    const newBalance = parseFloat(
      (loan.outstandingBalance - paymentAmount).toFixed(2)
    );

    const updateData: Record<string, unknown> = { outstandingBalance: newBalance };

    // Auto-close loan if fully paid
    if (newBalance <= 0) {
      updateData.status = 'CLOSED';
      updateData.closedAt = new Date();
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.loanId,
      updateData,
      { new: true }
    );

    res.status(201).json({
      message: newBalance <= 0
        ? '🎉 Payment recorded. Loan fully repaid and CLOSED!'
        : 'Payment recorded successfully.',
      payment,
      loan: updatedLoan,
      loanClosed: newBalance <= 0,
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      res.status(409).json({
        message: 'A payment with this UTR number already exists. UTR must be unique.',
      });
      return;
    }
    res.status(500).json({ message: 'Failed to record payment.' });
  }
};

// GET /api/dashboard/collection/:loanId/payments
export const getLoanPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ loan: req.params.loanId })
      .populate('recordedBy', 'fullName email')
      .sort({ date: -1 });

    const loan = await Loan.findById(req.params.loanId)
      .populate('borrower', 'fullName email');

    res.status(200).json({ payments, loan });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payments.' });
  }
};

// ── ADMIN STATS ───────────────────────────────────────────────────────────────

// GET /api/dashboard/stats
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalBorrowers,
      totalLoans,
      appliedCount,
      sanctionedCount,
      disbursedCount,
      closedCount,
      rejectedCount,
      totalDisbursedAmount,
    ] = await Promise.all([
      User.countDocuments({ role: 'borrower' }),
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'APPLIED' }),
      Loan.countDocuments({ status: 'SANCTIONED' }),
      Loan.countDocuments({ status: 'DISBURSED' }),
      Loan.countDocuments({ status: 'CLOSED' }),
      Loan.countDocuments({ status: 'REJECTED' }),
      Loan.aggregate([
        { $match: { status: { $in: ['DISBURSED', 'CLOSED'] } } },
        { $group: { _id: null, total: { $sum: '$loanAmount' } } },
      ]),
    ]);

    res.status(200).json({
      stats: {
        totalBorrowers,
        totalLoans,
        byStatus: {
          applied: appliedCount,
          sanctioned: sanctionedCount,
          disbursed: disbursedCount,
          closed: closedCount,
          rejected: rejectedCount,
        },
        totalDisbursedAmount: totalDisbursedAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
};
