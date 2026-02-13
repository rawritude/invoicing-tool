import mongoose, { Schema, type Document } from "mongoose";

export interface ISettings extends Document {
  geminiApiKey?: string;
  defaultCurrency: string;
  googleDriveTokens?: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  };
  googleDriveFolderId?: string;
  invoiceNumberPrefix: string;
  nextInvoiceNumber: number;
  businessName?: string;
  businessAddress?: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    geminiApiKey: { type: String },
    defaultCurrency: { type: String, default: "USD" },
    googleDriveTokens: {
      accessToken: { type: String },
      refreshToken: { type: String },
      expiryDate: { type: Number },
    },
    googleDriveFolderId: { type: String },
    invoiceNumberPrefix: { type: String, default: "INV-" },
    nextInvoiceNumber: { type: Number, default: 1 },
    businessName: { type: String },
    businessAddress: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

export async function getSettings(): Promise<ISettings> {
  const Settings = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
  const settings = await Settings.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { upsert: true, new: true }
  );
  return settings;
}
