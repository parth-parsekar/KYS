import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  preferredCurrency: string;
  timezone: string;
  monthlyBudget: number;
  alertThreshold: number; // percentage 1-100, default 80
  notifyOnThreshold: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    preferredCurrency: { type: String, default: 'USD', uppercase: true, trim: true },
    timezone: { type: String, default: 'America/Los_Angeles', trim: true },
    monthlyBudget: { type: Number, default: 300, min: 0 },
    alertThreshold: { type: Number, default: 80, min: 1, max: 100 },
    notifyOnThreshold: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
