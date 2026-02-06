"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ReceiptForm } from "@/components/receipt/receipt-form";
import { Loader2 } from "lucide-react";

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReceipt(data.receipt);
        setLoading(false);
      });
  }, [id]);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    // Don't re-send file data for updates
    delete data.fileData;
    delete data.fileName;
    delete data.fileType;

    try {
      await fetch(`/api/receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  if (!receipt) {
    return <p className="text-muted-foreground">Receipt not found.</p>;
  }

  const r = receipt;
  const dateStr = r.date ? new Date(r.date as string).toISOString().split("T")[0] : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Receipt</h1>
        <p className="text-muted-foreground">{r.vendorName as string}</p>
      </div>

      <ReceiptForm
        initialData={{
          vendorName: r.vendorName as string,
          date: dateStr,
          lineItems: r.lineItems as { description: string; amount: number }[],
          subtotal: r.subtotal as number | undefined,
          tax: r.tax as number | undefined,
          total: r.total as number,
          originalCurrency: r.originalCurrency as string,
          notes: r.notes as string | undefined,
          reportId: (r.reportId as Record<string, string>)?._id,
        }}
        fileData={r.fileData as string || ""}
        fileName={r.fileName as string || "receipt"}
        fileType={r.fileType as string || "image/jpeg"}
        filePreview={(r.fileType as string)?.startsWith("image/") ? (r.fileData as string) : undefined}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
