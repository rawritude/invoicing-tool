import mongoose, { Schema, type Document } from "mongoose";

export interface ILineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface IReceipt extends Document {
  vendorName: string;
  date: Date;
  lineItems: ILineItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  originalCurrency: string;
  convertedCurrency?: string;
  convertedTotal?: number;
  exchangeRate?: number;
  category: mongoose.Types.ObjectId;
  notes?: string;
  fileName: string;
  fileType: string;
  fileData: Buffer;
  driveFileId?: string;
  reportId?: mongoose.Types.ObjectId;
  aiExtracted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>({
  description: { type: String, required: true },
  quantity: { type: Number },
  unitPrice: { type: Number },
  amount: { type: Number, required: true },
});

const ReceiptSchema = new Schema<IReceipt>(
  {
    vendorName: { type: String, required: true },
    date: { type: Date, required: true },
    lineItems: { type: [LineItemSchema], default: [] },
    subtotal: { type: Number },
    tax: { type: Number },
    total: { type: Number, required: true },
    originalCurrency: { type: String, required: true, default: "USD" },
    convertedCurrency: { type: String },
    convertedTotal: { type: Number },
    exchangeRate: { type: Number },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    notes: { type: String },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileData: { type: Buffer, required: true },
    driveFileId: { type: String },
    reportId: { type: Schema.Types.ObjectId, ref: "Report" },
    aiExtracted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReceiptSchema.index({ date: -1 });
ReceiptSchema.index({ category: 1 });
ReceiptSchema.index({ reportId: 1 });
ReceiptSchema.index({ vendorName: "text" });

export default mongoose.models.Receipt ||
  mongoose.model<IReceipt>("Receipt", ReceiptSchema);
