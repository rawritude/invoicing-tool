"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Check } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CategoryData } from "@/lib/types";

interface ReceiptListItem {
  _id: string;
  vendorName: string;
  date: string;
  total: number;
  originalCurrency: string;
  category: CategoryData;
}

function InvoicesContent() {
  const searchParams = useSearchParams();
  const preselectedReportId = searchParams.get("reportId");

  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [invoiceType, setInvoiceType] = useState<"expense-report" | "client-invoice">("expense-report");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Config fields
  const [title, setTitle] = useState("Expense Report");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const receiptsRes = await fetch(
          preselectedReportId ? `/api/receipts?reportId=${preselectedReportId}` : "/api/receipts?limit=100"
        );
        if (!receiptsRes.ok) throw new Error("Failed to load receipts");
        const receiptsData = await receiptsRes.json();
        setReceipts(receiptsData.receipts || []);

        // Pre-select all receipts if coming from a report
        if (preselectedReportId && receiptsData.receipts) {
          setSelectedIds(new Set(receiptsData.receipts.map((r: ReceiptListItem) => r._id)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [preselectedReportId]);

  function toggleReceipt(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === receipts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(receipts.map((r) => r._id)));
    }
  }

  async function generateInvoice() {
    if (selectedIds.size === 0) return;
    setGenerating(true);

    try {
      const config: Record<string, string> = {};
      if (invoiceType === "expense-report") {
        config.title = title;
      } else {
        config.clientName = clientName;
        config.clientAddress = clientAddress;
        if (dueDate) config.dueDate = dueDate;
      }
      if (notes) config.notes = notes;

      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: invoiceType,
          receiptIds: Array.from(selectedIds),
          config,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoiceType}-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Invoice</h1>
        <p className="text-muted-foreground">Select receipts and generate a PDF</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Receipt selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Select Receipts ({selectedIds.size} selected)
            </h2>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedIds.size === receipts.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {receipts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No receipts available.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {receipts.map((r) => {
                const isSelected = selectedIds.has(r._id);
                return (
                  <Card
                    key={r._id}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => toggleReceipt(r._id)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            toggleReceipt(r._id);
                          }
                        }}
                        className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-input"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{r.vendorName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                      </div>
                      <span className="font-semibold shrink-0">
                        {formatCurrency(r.total, r.originalCurrency)}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice config */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={invoiceType === "expense-report" ? "default" : "outline"}
                  onClick={() => setInvoiceType("expense-report")}
                  className="h-auto py-3"
                >
                  <div className="text-center">
                    <FileText className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">Expense Report</span>
                  </div>
                </Button>
                <Button
                  variant={invoiceType === "client-invoice" ? "default" : "outline"}
                  onClick={() => setInvoiceType("client-invoice")}
                  className="h-auto py-3"
                >
                  <div className="text-center">
                    <FileText className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">Client Invoice</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
              <CardDescription>
                {invoiceType === "expense-report"
                  ? "Configure your expense report"
                  : "Enter client billing details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoiceType === "expense-report" ? (
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Expense Report"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Client Name</label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Client Address</label>
                    <Textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Client address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={generateInvoice}
            disabled={selectedIds.size === 0 || generating}
          >
            {generating ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            Generate PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <InvoicesContent />
    </Suspense>
  );
}
