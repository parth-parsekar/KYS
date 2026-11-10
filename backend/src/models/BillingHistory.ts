import mongoose, { Document, Schema } from 'mongoose';

export interface IBillingHistory extends Document {
  user: mongoose.Types.ObjectId;
  subscription: mongoose.Types.ObjectId;
  billingAmount: number;
  currency: string;
  billingDate: Date;
  billingStatus: 'Paid' | 'Pending' | 'Failed';
  eventType: 'Renewal' | 'Initial' | 'Adjustment' | 'Manual';
  dataSource: 'user-entered' | 'simulated';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillingHistorySchema = new Schema<IBillingHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    billingAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    billingDate: { type: Date, required: true, index: true },
    billingStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed'],
      default: 'Paid',
    },
    eventType: {
      type: String,
      enum: ['Renewal', 'Initial', 'Adjustment', 'Manual'],
      default: 'Renewal',
    },
    dataSource: {
      type: String,
      enum: ['user-entered', 'simulated'],
      default: 'simulated',
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const BillingHistory = mongoose.model<IBillingHistory>('BillingHistory', BillingHistorySchema);

