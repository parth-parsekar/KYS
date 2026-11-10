import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  serviceName: string;
  category: 'Entertainment' | 'Work tools' | 'Productivity' | 'Storage' | 'Utilities' | 'Other';
  amount: number;
  currency: string;
  billingFrequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  startDate: Date;
  nextRenewalDate: Date;
  status: 'Active' | 'Paused' | 'Cancelled' | 'Expired';
  customService: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  getMonthlyEquivalent(): number;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'ServiceCatalog' },
    serviceName: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Entertainment', 'Work tools', 'Productivity', 'Storage', 'Utilities', 'Other'],
      default: 'Productivity',
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    billingFrequency: {
      type: String,
      required: true,
      enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'],
      default: 'Monthly',
    },
    startDate: { type: Date, required: true },
    nextRenewalDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Cancelled', 'Expired'],
      default: 'Active',
      index: true,
    },
    customService: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Helper method to compute monthly equivalent according to PRD formula:
// yearly / 12, quarterly / 3, weekly * 52 / 12, monthly
SubscriptionSchema.methods.getMonthlyEquivalent = function (): number {
  const amt = this.amount;
  switch (this.billingFrequency) {
    case 'Weekly':
      return (amt * 52) / 12;
    case 'Quarterly':
      return amt / 3;
    case 'Yearly':
      return amt / 12;
    case 'Monthly':
    default:
      return amt;
  }
};

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
