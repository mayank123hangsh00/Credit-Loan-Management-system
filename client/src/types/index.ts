// Shared TypeScript types for the frontend

export type UserRole =
  | 'borrower'
  | 'admin'
  | 'sales'
  | 'sanction'
  | 'disbursement'
  | 'collection';

export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';

export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'DISBURSED' | 'CLOSED' | 'REJECTED';

export interface User {
  id: string;
  _id?: string;
  email: string;
  role: UserRole;
  fullName?: string;
  pan?: string;
  dateOfBirth?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  breCleared: boolean;
  salarySlipUrl?: string;
  applicationStep: number;
  createdAt?: string;
}

export interface Loan {
  _id: string;
  borrower: User | string;
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: User | string;
  disbursedBy?: User | string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loan: string;
  borrower: string;
  utrNumber: string;
  amount: number;
  date: string;
  recordedBy: User | string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface ApiError {
  message: string;
  breFailures?: string[];
}

// BRE types (mirrored on client for instant feedback)
export interface BREResult {
  passed: boolean;
  failures: string[];
}

export interface LoanCalculation {
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

export interface DashboardStats {
  totalBorrowers: number;
  totalLoans: number;
  byStatus: {
    applied: number;
    sanctioned: number;
    disbursed: number;
    closed: number;
    rejected: number;
  };
  totalDisbursedAmount: number;
}
