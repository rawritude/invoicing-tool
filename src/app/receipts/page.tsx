"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Upload, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CategoryData } from "@/lib/types";

interface ReceiptListItem {
  _id: string;
  vendorName: string;
  date: string;
  total: number;
  originalCurrency: string;
  convertedTotal?: number;
  convertedCurrency?: string;
  category: CategoryData;
  reportId?: { _id: string; name: string };
  aiExtracted: boolean;
  createdAt: string;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<CategoryData[]>([]);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);

    const res = await fetch(`/api/receipts?${params}`);
    const data = await res.json();
    setReceipts(data.receipts || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  async function deleteReceipt(id: string) {
    if (!confirm("Delete this receipt?")) return;
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    loadReceipts();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">{total} receipt{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((c) => ({ value: c._id!, label: c.name })),
          ]}
          className="max-w-xs"
        />
      </div>

      {/* Receipt list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : receipts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No receipts found.{" "}
              <Link href="/upload" className="text-primary hover:underline">
                Upload your first receipt
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {receipts.map((receipt) => (
            <Card key={receipt._id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/receipts/${receipt._id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{receipt.vendorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(receipt.date)}
                          {receipt.reportId && (
                            <span className="ml-2">
                              <Badge variant="outline" className="text-xs">
                                {receipt.reportId.name}
                              </Badge>
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">
                          {formatCurrency(receipt.total, receipt.originalCurrency)}
                        </p>
                        {receipt.convertedTotal && receipt.convertedCurrency && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(receipt.convertedTotal, receipt.convertedCurrency)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {receipt.category && (
                      <Badge
                        variant="secondary"
                        className="hidden sm:inline-flex text-xs"
                        style={{
                          backgroundColor: receipt.category.color ? `${receipt.category.color}20` : undefined,
                          color: receipt.category.color,
                        }}
                      >
                        {receipt.category.name}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReceipt(receipt._id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
