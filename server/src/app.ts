import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import borrowerRoutes from './routes/borrower.routes';
import loanRoutes from './routes/loan.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files statically ─────────────────────────
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/borrower', borrowerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 Server running at http://localhost:${config.port}`);
    console.log(`📁 Uploads served at http://localhost:${config.port}/uploads`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
  });
};

start();

export default app;
