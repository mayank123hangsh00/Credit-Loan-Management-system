// Shared TypeScript types for the server

export type UserRole =
  | 'borrower'
  | 'admin'
  | 'sales'
  | 'sanction'
  | 'disbursement'
  | 'collection';

export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';

export type LoanStatus =
  | 'APPLIED'
  | 'SANCTIONED'
  | 'DISBURSED'
  | 'CLOSED'
  | 'REJECTED';

export interface BREResult {
  passed: boolean;
  failures: string[];
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        email: string;
      };
    }
  }
}
