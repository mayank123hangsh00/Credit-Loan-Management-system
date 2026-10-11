import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  loan: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loan: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true, // DB-level uniqueness guarantee
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for loan payment lookups
PaymentSchema.index({ loan: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
