import mongoose, { Document, Schema } from 'mongoose';
import { LoanStatus } from '../types';

export interface ILoan extends Document {
  borrower: mongoose.Types.ObjectId;
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  disbursedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },
    tenureDays: {
      type: Number,
      required: true,
      min: 30,
      max: 365,
    },
    interestRate: {
      type: Number,
      default: 12, // 12% p.a. fixed
    },
    simpleInterest: {
      type: Number,
      required: true,
    },
    totalRepayment: {
      type: Number,
      required: true,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED', 'REJECTED'],
      default: 'APPLIED',
    },
    rejectionReason: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for common queries
LoanSchema.index({ borrower: 1, status: 1 });
LoanSchema.index({ status: 1 });

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);
