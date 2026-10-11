import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, EmploymentMode } from '../types';

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  // Personal details (filled in Step 2)
  fullName?: string;
  pan?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  // Application progress
  breCleared: boolean;
  salarySlipUrl?: string;
  applicationStep: number; // 1=registered, 2=details filled, 3=slip uploaded
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['borrower', 'admin', 'sales', 'sanction', 'disbursement', 'collection'],
      default: 'borrower',
    },
    fullName: { type: String, trim: true },
    pan: { type: String, uppercase: true, trim: true },
    dateOfBirth: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self-employed', 'unemployed'],
    },
    breCleared: { type: Boolean, default: false },
    salarySlipUrl: { type: String },
    applicationStep: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON responses
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).password;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
