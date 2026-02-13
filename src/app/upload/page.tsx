"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/receipt/dropzone";
import { ReceiptForm } from "@/components/receipt/receipt-form";
import { Loader2 } from "lucide-react";
import type { ExtractedReceiptData } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedReceiptData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleFileSelected(selectedFile: File) {
    setFile(selectedFile);

    // Read file as base64
    const buffer = await selectedFile.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    setFileData(base64);

    // Try AI extraction
    setExtracting(true);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64,
          mimeType: selectedFile.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setExtracted(data);
      }
    } catch {
      // AI extraction failed, user fills manually
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        router.push("/receipts");
      } else {
        const errorData = await res.json().catch(() => null);
        setSaveError(errorData?.error || "Failed to save receipt. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Receipt</h1>
        <p className="text-muted-foreground">
          Upload a receipt image or PDF to get started
        </p>
      </div>

      {saveError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          {saveError}
        </div>
      )}

      {!file ? (
        <Dropzone onFileSelected={handleFileSelected} />
      ) : extracting ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Analyzing receipt...</p>
          <p className="text-sm text-muted-foreground">
            Gemini AI is extracting receipt data
          </p>
        </div>
      ) : (
        <ReceiptForm
          initialData={
            extracted
              ? {
                  vendorName: extracted.vendorName,
                  date: extracted.date,
                  lineItems: extracted.lineItems,
                  subtotal: extracted.subtotal,
                  tax: extracted.tax,
                  total: extracted.total,
                  originalCurrency: extracted.currency,
                  suggestedCategory: extracted.suggestedCategory,
                }
              : undefined
          }
          fileData={fileData}
          fileName={file.name}
          fileType={file.type}
          filePreview={file.type.startsWith("image/") ? fileData : undefined}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
