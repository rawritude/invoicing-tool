"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { COMMON_CURRENCIES } from "@/lib/constants";
import type { LineItem, CategoryData, ReportData } from "@/lib/types";
import { VoiceInput } from "@/components/receipt/voice-input";
import { Plus, Trash2, Save, Loader2, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LineItemWithId extends LineItem {
  id: string;
}

interface ReceiptFormProps {
  initialData?: {
    vendorName?: string;
    date?: string;
    lineItems?: LineItem[];
    subtotal?: number;
    tax?: number;
    total?: number;
    originalCurrency?: string;
    suggestedCategory?: string;
    notes?: string;
    reportId?: string;
  };
  fileData: string; // base64
  fileName: string;
  fileType: string;
  filePreview?: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
}

function withIds(items: LineItem[]): LineItemWithId[] {
  return items.map((item) => ({ ...item, id: crypto.randomUUID() }));
}

export function ReceiptForm({
  initialData,
  fileData,
  fileName,
  fileType,
  filePreview,
  onSave,
  saving,
}: ReceiptFormProps) {
  const [vendorName, setVendorName] = useState(initialData?.vendorName || "");
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = useState<LineItemWithId[]>(withIds(initialData?.lineItems || []));
  const [subtotal, setSubtotal] = useState<number | undefined>(initialData?.subtotal);
  const [tax, setTax] = useState<number | undefined>(initialData?.tax);
  const [total, setTotal] = useState<number>(initialData?.total || 0);
  const [originalCurrency, setOriginalCurrency] = useState(initialData?.originalCurrency || "USD");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [category, setCategory] = useState(initialData?.suggestedCategory || "");
  const [reportId, setReportId] = useState(initialData?.reportId || "");

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  const initialCategoryRef = useRef(initialData?.suggestedCategory);
  const prevInitialDataRef = useRef(initialData);

  // Load categories, reports, and settings
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/reports").then((r) => r.json()).catch(() => ({ reports: [] })),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([catData, reportData, settingsData]) => {
      setCategories(catData.categories || []);
      setReports(reportData.reports || []);
      setDefaultCurrency(settingsData.settings?.defaultCurrency || "USD");

      // Auto-select category if suggested
      const suggested = initialCategoryRef.current;
      if (suggested && catData.categories) {
        const match = catData.categories.find(
          (c: CategoryData) =>
            c.name.toLowerCase() === suggested.toLowerCase()
        );
        if (match) {
          setCategory(match._id!);
          return;
        }
      }
      if (catData.categories?.length > 0) {
        const misc = catData.categories.find((c: CategoryData) => c.name === "Miscellaneous");
        if (misc) setCategory(misc._id!);
        else setCategory(catData.categories[0]._id!);
      }
    });
  }, []);

  // Update form when initialData changes (e.g., after AI extraction or voice update)
  useEffect(() => {
    if (initialData === prevInitialDataRef.current) return;
    prevInitialDataRef.current = initialData;

    if (initialData?.vendorName) setVendorName(initialData.vendorName);
    if (initialData?.date) setDate(initialData.date);
    if (initialData?.lineItems) setLineItems(withIds(initialData.lineItems));
    if (initialData?.subtotal !== undefined) setSubtotal(initialData.subtotal);
    if (initialData?.tax !== undefined) setTax(initialData.tax);
    if (initialData?.total !== undefined) setTotal(initialData.total);
    if (initialData?.originalCurrency) setOriginalCurrency(initialData.originalCurrency);
    if (initialData?.notes) setNotes(initialData.notes);
  }, [initialData]);

  // Fetch exchange rate when currency or date changes
  useEffect(() => {
    if (originalCurrency === defaultCurrency) {
      setExchangeRate(null);
      return;
    }
    setLoadingRate(true);
    fetch(`/api/exchange-rate?date=${date}&from=${originalCurrency}&to=${defaultCurrency}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rate) setExchangeRate(data.rate);
        else setExchangeRate(null);
      })
      .catch(() => setExchangeRate(null))
      .finally(() => setLoadingRate(false));
  }, [originalCurrency, defaultCurrency, date]);

  function addLineItem() {
    setLineItems([...lineItems, { description: "", amount: 0, id: crypto.randomUUID() }]);
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const data: Record<string, unknown> = {
      vendorName,
      date,
      lineItems: lineItems.map(({ id: _id, ...rest }) => rest),
      subtotal,
      tax,
      total,
      originalCurrency,
      category,
      notes,
      fileName,
      fileType,
      fileData,
      reportId: reportId || undefined,
      aiExtracted: !!initialData?.vendorName,
    };

    if (exchangeRate && originalCurrency !== defaultCurrency) {
      data.convertedCurrency = defaultCurrency;
      data.convertedTotal = Math.round(total * exchangeRate * 100) / 100;
      data.exchangeRate = exchangeRate;
    }

    await onSave(data);
  }

  const convertedTotal = exchangeRate ? Math.round(total * exchangeRate * 100) / 100 : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* File preview */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Receipt Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {filePreview && fileType.startsWith("image/") ? (
            <img
              src={`data:${fileType};base64,${filePreview}`}
              alt="Receipt"
              className="w-full rounded-md border"
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Receipt Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vendor & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Vendor Name</label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Store or business name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Currency & Exchange Rate */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Currency</label>
              <Select
                value={originalCurrency}
                onChange={(e) => setOriginalCurrency(e.target.value)}
                options={COMMON_CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            {originalCurrency !== defaultCurrency && (
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  {loadingRate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exchangeRate ? (
                    <span>
                      1 {originalCurrency} = {exchangeRate.toFixed(4)} {defaultCurrency}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Rate unavailable</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Amounts */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Subtotal</label>
              <Input
                type="number"
                step="0.01"
                value={subtotal ?? ""}
                onChange={(e) => setSubtotal(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tax</label>
              <Input
                type="number"
                step="0.01"
                value={tax ?? ""}
                onChange={(e) => setTax(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Total</label>
              <Input
                type="number"
                step="0.01"
                value={total || ""}
                onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="font-semibold"
              />
            </div>
          </div>

          {/* Converted total */}
          {convertedTotal !== null && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Badge variant="secondary">{originalCurrency}</Badge>
              <span className="font-medium">{formatCurrency(total, originalCurrency)}</span>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground mx-1" />
              <Badge variant="default">{defaultCurrency}</Badge>
              <span className="font-semibold">{formatCurrency(convertedTotal, defaultCurrency)}</span>
            </div>
          )}

          {/* Category & Report */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categories.map((c) => ({ value: c._id!, label: c.name }))}
                placeholder="Select category"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Report (optional)</label>
              <Select
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                options={[
                  { value: "", label: "None" },
                  ...reports.map((r) => ({ value: r._id!, label: r.name })),
                ]}
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Line Items</label>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>
            {lineItems.length > 0 ? (
              <div className="space-y-2">
                {lineItems.map((item, i) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity ?? ""}
                      onChange={(e) => updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount || ""}
                      onChange={(e) => updateLineItem(i, "amount", parseFloat(e.target.value) || 0)}
                      className="w-28"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeLineItem(i)} aria-label="Remove line item">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No line items added.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Voice input */}
          <VoiceInput
            currentFields={{
              vendorName,
              date,
              subtotal,
              tax,
              total,
              currency: originalCurrency,
              suggestedCategory: categories.find((c) => c._id === category)?.name || "",
              notes,
            }}
            onFieldsUpdated={(fields) => {
              if (fields.vendorName !== undefined) setVendorName(fields.vendorName as string);
              if (fields.date !== undefined) setDate(fields.date as string);
              if (fields.subtotal !== undefined) setSubtotal(fields.subtotal as number);
              if (fields.tax !== undefined) setTax(fields.tax as number);
              if (fields.total !== undefined) setTotal(fields.total as number);
              if (fields.currency !== undefined) setOriginalCurrency(fields.currency as string);
              if (fields.notes !== undefined) setNotes(fields.notes as string);
              if (fields.suggestedCategory !== undefined) {
                const match = categories.find(
                  (c) => c.name.toLowerCase() === (fields.suggestedCategory as string).toLowerCase()
                );
                if (match) setCategory(match._id!);
              }
            }}
          />

          {/* Save */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving || !vendorName || !total}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
