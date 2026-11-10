import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceCatalog extends Document {
  name: string;
  category: 'Entertainment' | 'Work tools' | 'Productivity' | 'Storage' | 'Utilities' | 'Other';
  suggestedPrice: number;
  currency: string;
  billingFrequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceCatalogSchema = new Schema<IServiceCatalog>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Entertainment', 'Work tools', 'Productivity', 'Storage', 'Utilities', 'Other'],
      default: 'Productivity',
    },
    suggestedPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    billingFrequency: {
      type: String,
      required: true,
      enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'],
      default: 'Monthly',
    },
    logoUrl: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const ServiceCatalog = mongoose.model<IServiceCatalog>('ServiceCatalog', ServiceCatalogSchema);

