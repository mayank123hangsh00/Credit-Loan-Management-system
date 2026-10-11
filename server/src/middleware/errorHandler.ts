import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export const errorHandler = (
  err: Error & { status?: number; code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error:', err.message);

  // Multer errors
  if (err.message.includes('Invalid file type')) {
    res.status(422).json({ message: err.message });
    return;
  }

  if (err.message.includes('File too large')) {
    res.status(413).json({ message: 'File too large. Maximum size is 5 MB.' });
    return;
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    res.status(409).json({ message: 'Duplicate entry. This record already exists.' });
    return;
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};
