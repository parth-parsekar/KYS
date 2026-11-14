import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  eventDate: Date;
  category: 'Platform Update' | 'Maintenance' | 'Special Offer' | 'Community' | 'Billing';
  priority: 'low' | 'medium' | 'high';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true },
    category: {
      type: String,
      enum: ['Platform Update', 'Maintenance', 'Special Offer', 'Community', 'Billing'],
      default: 'Platform Update',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

export const Event = mongoose.model<IEvent>('Event', EventSchema);
