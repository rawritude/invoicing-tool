"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, FolderOpen, Upload, Loader2, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CategoryBreakdown {
  _id: string;
  total: number;
  count: number;
  color: string;
}

interface RecentReceipt {
  _id: string;
  vendorName: string;
  date: string;
  total: number;
  originalCurrency: string;
  category: { name: string; color: string };
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    totalReceipts: number;
    draftReports: number;
    recentReceipts: RecentReceipt[];
    categoryBreakdown: CategoryBreakdown[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalSpending = data.categoryBreakdown.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your expenses and receipts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/upload">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upload Receipt</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Drag & drop or browse files</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalReceipts}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.draftReports}</div>
            <p className="text-xs text-muted-foreground">Draft reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSpending > 0 ? formatCurrency(totalSpending, "USD") : "--"}
            </div>
            <p className="text-xs text-muted-foreground">All categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentReceipts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No receipts yet.{" "}
                <Link href="/upload" className="text-primary hover:underline">
                  Upload your first receipt
                </Link>{" "}
                to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentReceipts.map((r) => (
                  <Link
                    key={r._id}
                    href={`/receipts/${r._id}`}
                    className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{r.vendorName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.date)}
                        </span>
                        {r.category && (
                          <Badge
                            variant="secondary"
                            className="text-xs py-0"
                            style={{
                              backgroundColor: r.category.color ? `${r.category.color}20` : undefined,
                              color: r.category.color,
                            }}
                          >
                            {r.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatCurrency(r.total, r.originalCurrency)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Charts will appear once you have receipts.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryBreakdown} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="_id"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, "Total"]}
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color || "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
