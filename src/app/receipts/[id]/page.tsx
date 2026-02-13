"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ReceiptForm } from "@/components/receipt/receipt-form";
import { Loader2 } from "lucide-react";
import type { LineItem, CategoryData } from "@/lib/types";

interface ReceiptDetail {
  _id: string;
  vendorName: string;
  date: string;
  lineItems: LineItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  originalCurrency: string;
  notes?: string;
  reportId?: { _id: string; name: string };
  fileData?: string;
  fileName?: string;
  fileType?: string;
  category?: CategoryData;
}

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load receipt");
        return r.json();
      })
      .then((data) => {
        setReceipt(data.receipt);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load receipt");
        setLoading(false);
      });
  }, [id]);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    const payload = { ...data };
    delete payload.fileData;
    delete payload.fileName;
    delete payload.fileType;

    try {
      await fetch(`/api/receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.push("/receipts");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (!receipt) {
    return <p className="text-muted-foreground">Receipt not found.</p>;
  }

  const r = receipt;
  const dateStr = r.date ? new Date(r.date).toISOString().split("T")[0] : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Receipt</h1>
        <p className="text-muted-foreground">{r.vendorName}</p>
      </div>

      <ReceiptForm
        initialData={{
          vendorName: r.vendorName,
          date: dateStr,
          lineItems: r.lineItems,
          subtotal: r.subtotal,
          tax: r.tax,
          total: r.total,
          originalCurrency: r.originalCurrency,
          notes: r.notes,
          reportId: r.reportId?._id,
        }}
        fileData={r.fileData || ""}
        fileName={r.fileName || "receipt"}
        fileType={r.fileType || "image/jpeg"}
        filePreview={r.fileType?.startsWith("image/") ? r.fileData : undefined}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
