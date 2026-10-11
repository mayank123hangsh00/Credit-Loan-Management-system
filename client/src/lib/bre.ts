import { BREResult, EmploymentMode } from '@/types';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MIN_SALARY = 25000;
const MIN_AGE = 23;
const MAX_AGE = 50;

function calculateAge(dateOfBirth: string): number {
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
 * Client-side BRE — mirrors the server BRE for instant UI feedback.
 * NOTE: This is NOT authoritative. The server also runs these same checks.
 * We run on client ONLY to show real-time validation hints without a round trip.
 */
export function runClientBRE(params: {
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}): BREResult {
  const failures: string[] = [];

  const panUpper = params.pan.toUpperCase().trim();
  if (!PAN_REGEX.test(panUpper)) {
    failures.push('Invalid PAN format (e.g., ABCDE1234F)');
  }

  if (params.dateOfBirth) {
    const age = calculateAge(params.dateOfBirth);
    if (age < MIN_AGE || age > MAX_AGE) {
      failures.push(`Age must be between ${MIN_AGE} and ${MAX_AGE} years (current: ${age})`);
    }
  }

  if (params.monthlySalary < MIN_SALARY) {
    failures.push(`Monthly salary must be at least ₹${MIN_SALARY.toLocaleString('en-IN')}`);
  }

  if (params.employmentMode === 'unemployed') {
    failures.push('Unemployed applicants are not eligible');
  }

  return { passed: failures.length === 0, failures };
}

export { PAN_REGEX, MIN_SALARY, MIN_AGE, MAX_AGE };
