import { LoanCalculation } from '@/types';

const INTEREST_RATE = 12; // 12% p.a. fixed

/**
 * Simple Interest: SI = (P × R × T) / (365 × 100)
 * Total Repayment = P + SI
 */
export function calculateLoan(loanAmount: number, tenureDays: number): LoanCalculation {
  const simpleInterest = parseFloat(
    ((loanAmount * INTEREST_RATE * tenureDays) / (365 * 100)).toFixed(2)
  );
  const totalRepayment = parseFloat((loanAmount + simpleInterest).toFixed(2));

  return {
    loanAmount,
    tenureDays,
    interestRate: INTEREST_RATE,
    simpleInterest,
    totalRepayment,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
