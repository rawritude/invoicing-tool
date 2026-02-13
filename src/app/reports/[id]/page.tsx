"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle, Receipt as ReceiptIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReportData, CategoryData } from "@/lib/types";

interface ReportReceipt {
  _id: string;
  vendorName: string;
  date: string;
  total: number;
  originalCurrency: string;
  convertedTotal?: number;
  convertedCurrency?: string;
  category: CategoryData;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<ReportData | null>(null);
  const [receipts, setReceipts] = useState<ReportReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load report");
        return r.json();
      })
      .then((data) => {
        setReport(data.report);
        setReceipts(data.receipts || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load report");
        setLoading(false);
      });
  }, [id]);

  async function toggleStatus() {
    if (!report) return;
    const newStatus = report.status === "draft" ? "finalized" : "draft";
    const res = await fetch(`/api/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setReport(data.report);
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

  if (!report) {
    return <p className="text-muted-foreground">Report not found.</p>;
  }

  // Group receipts by category
  const grouped = new Map<string, ReportReceipt[]>();
  for (const r of receipts) {
    const catName = r.category?.name || "Uncategorized";
    if (!grouped.has(catName)) grouped.set(catName, []);
    grouped.get(catName)!.push(r);
  }

  const totalAmount = receipts.reduce((sum, r) => sum + r.total, 0);
  const mainCurrency = receipts.length > 0 ? receipts[0].originalCurrency : "USD";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{report.name}</h1>
          {report.description && (
            <p className="text-muted-foreground">{report.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleStatus}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {report.status === "draft" ? "Finalize" : "Reopen"}
          </Button>
          <Link href={`/invoices?reportId=${id}`}>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={report.status === "finalized" ? "default" : "secondary"} className="mt-1">
              {report.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Receipts</p>
            <p className="text-2xl font-bold">{receipts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount, mainCurrency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts grouped by category */}
      {receipts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ReceiptIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No receipts in this report yet. Assign receipts from the{" "}
              <Link href="/receipts" className="text-primary hover:underline">
                Receipts
              </Link>{" "}
              page or when uploading.
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([catName, catReceipts]) => (
          <Card key={catName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{catName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {catReceipts.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <Link
                        href={`/receipts/${r._id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {r.vendorName}
                      </Link>
                      <p className="text-sm text-muted-foreground">{formatDate(r.date)}</p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(r.total, r.originalCurrency)}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-semibold text-sm">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrency(
                      catReceipts.reduce((sum, r) => sum + r.total, 0),
                      mainCurrency
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
