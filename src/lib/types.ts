export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface ReceiptData {
  _id?: string;
  vendorName: string;
  date: string;
  lineItems: LineItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  originalCurrency: string;
  convertedCurrency?: string;
  convertedTotal?: number;
  exchangeRate?: number;
  category: string;
  notes?: string;
  fileName: string;
  fileType: string;
  fileData?: string; // base64
  driveFileId?: string;
  reportId?: string;
  aiExtracted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportData {
  _id?: string;
  name: string;
  description?: string;
  status: "draft" | "finalized";
  dateFrom?: string;
  dateTo?: string;
  receiptCount?: number;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryData {
  _id?: string;
  name: string;
  color?: string;
  isDefault: boolean;
}

export interface SettingsData {
  geminiApiKey?: string;
  defaultCurrency: string;
  googleDriveConnected?: boolean;
  googleDriveFolderId?: string;
  invoiceNumberPrefix: string;
  nextInvoiceNumber: number;
  businessName?: string;
  businessAddress?: string;
}

export interface ExchangeRateResult {
  rate: number;
  from: string;
  to: string;
  date: string;
}

export interface ExtractedReceiptData {
  vendorName: string;
  date: string;
  lineItems: LineItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  currency: string;
  suggestedCategory: string;
}
