import mongoose, { Schema, type Document } from "mongoose";

export interface IReport extends Document {
  name: string;
  description?: string;
  status: "draft" | "finalized";
  dateFrom?: Date;
  dateTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["draft", "finalized"], default: "draft" },
    dateFrom: { type: Date },
    dateTo: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Report ||
  mongoose.model<IReport>("Report", ReportSchema);
