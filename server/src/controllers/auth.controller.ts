import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/env';
import { JWTPayload, UserRole } from '../types';

function generateToken(userId: string, role: UserRole, email: string): string {
  return jwt.sign(
    { userId, role, email } as JWTPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );
}

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    // Only allow borrower role on public registration
    const allowedPublicRoles: UserRole[] = ['borrower'];
    const userRole: UserRole = allowedPublicRoles.includes(role) ? role : 'borrower';

    const user = await User.create({ email, password, role: userRole });
    const token = generateToken(String(user._id), user.role, user.email);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        applicationStep: user.applicationStep,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(String(user._id), user.role, user.email);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        applicationStep: user.applicationStep,
        breCleared: user.breCleared,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// GET /api/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
};
