import { Request, Response } from 'express';
import { User } from '../models/User';
import { runBRE } from '../services/bre.service';
import { EmploymentMode } from '../types';
import path from 'path';

// PUT /api/borrower/details
export const submitPersonalDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;

    // Basic validation
    if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      res.status(400).json({ message: 'All personal details are required.' });
      return;
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      res.status(400).json({ message: 'Invalid date of birth.' });
      return;
    }

    const salary = Number(monthlySalary);
    if (isNaN(salary) || salary <= 0) {
      res.status(400).json({ message: 'Monthly salary must be a positive number.' });
      return;
    }

    const validEmploymentModes: EmploymentMode[] = ['salaried', 'self-employed', 'unemployed'];
    if (!validEmploymentModes.includes(employmentMode)) {
      res.status(400).json({ message: 'Invalid employment mode.' });
      return;
    }

    // Run BRE — authoritative check on the server
    const breResult = runBRE({
      pan: pan.toString().toUpperCase().trim(),
      dateOfBirth: dob,
      monthlySalary: salary,
      employmentMode: employmentMode as EmploymentMode,
    });

    if (!breResult.passed) {
      res.status(400).json({
        message: 'Eligibility check failed.',
        breFailures: breResult.failures,
        breCleared: false,
      });
      return;
    }

    // Update user with personal details + mark BRE cleared
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        fullName: fullName.trim(),
        pan: pan.toString().toUpperCase().trim(),
        dateOfBirth: dob,
        monthlySalary: salary,
        employmentMode,
        breCleared: true,
        applicationStep: 2,
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Personal details saved. Eligibility check passed ✅',
      breCleared: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save personal details.' });
  }
};

// POST /api/borrower/salary-slip
export const uploadSalarySlip = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (!user.breCleared) {
      res.status(403).json({
        message: 'Please complete the eligibility check before uploading a salary slip.',
      });
      return;
    }

    const filePath = path.join('uploads', req.file.filename);

    await User.findByIdAndUpdate(req.user!.userId, {
      salarySlipUrl: filePath,
      applicationStep: 3,
    });

    res.status(200).json({
      message: 'Salary slip uploaded successfully.',
      salarySlipUrl: filePath,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload salary slip.' });
  }
};

// GET /api/borrower/status
export const getBorrowerStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({
      applicationStep: user.applicationStep,
      breCleared: user.breCleared,
      hasSalarySlip: !!user.salarySlipUrl,
      fullName: user.fullName,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status.' });
  }
};
