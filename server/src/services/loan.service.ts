/**
 * Loan calculation service.
 * Simple Interest: SI = (P × R × T) / (365 × 100)
 * Total Repayment = P + SI
 * Where:
 *   P = Principal (loan amount)
 *   R = Interest rate (12% p.a.)
 *   T = Tenure in days
 */

const INTEREST_RATE = 12; // 12% per annum (fixed)

export interface LoanCalculation {
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

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
