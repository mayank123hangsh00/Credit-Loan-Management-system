import { BREResult, EmploymentMode } from '../types';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MIN_SALARY = 25000;
const MIN_AGE = 23;
const MAX_AGE = 50;

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Business Rule Engine — runs 4 checks for loan eligibility.
 * All rules must pass for breCleared to be set to true.
 *
 * WHY server-only (authoritative):
 *   Client-side BRE runs for instant UX feedback.
 *   Server-side BRE is the actual gate — we never trust client data alone.
 *   A user could bypass client validation via direct API calls.
 */
export function runBRE(params: {
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}): BREResult {
  const failures: string[] = [];

  // Rule 1: PAN format
  const panUpper = params.pan.toUpperCase().trim();
  if (!PAN_REGEX.test(panUpper)) {
    failures.push(
      'Invalid PAN format. PAN must be in format: AAAAA0000A (5 letters, 4 digits, 1 letter).'
    );
  }

  // Rule 2: Age between 23 and 50
  const age = calculateAge(params.dateOfBirth);
  if (age < MIN_AGE || age > MAX_AGE) {
    failures.push(
      `Age must be between ${MIN_AGE} and ${MAX_AGE} years. Your age: ${age} years.`
    );
  }

  // Rule 3: Monthly salary >= ₹25,000
  if (params.monthlySalary < MIN_SALARY) {
    failures.push(
      `Monthly salary must be at least ₹${MIN_SALARY.toLocaleString('en-IN')}. Provided: ₹${params.monthlySalary.toLocaleString('en-IN')}.`
    );
  }

  // Rule 4: Not unemployed
  if (params.employmentMode === 'unemployed') {
    failures.push('Unemployed applicants are not eligible for a loan.');
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
