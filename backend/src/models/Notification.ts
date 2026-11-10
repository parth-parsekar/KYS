import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  type: 'renewal_upcoming' | 'budget_threshold' | 'status_change' | 'system';
  title: string;
  message: string;
  renewalCycleIdentifier?: string; // e.g. "subId_2026-11-12" to prevent duplicate alerts
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
    type: {
      type: String,
      enum: ['renewal_upcoming', 'budget_threshold', 'status_change', 'system'],
      default: 'renewal_upcoming',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    renewalCycleIdentifier: { type: String, index: true },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of renewal notification per cycle
NotificationSchema.index(
  { user: 1, renewalCycleIdentifier: 1 },
  { unique: true, sparse: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
