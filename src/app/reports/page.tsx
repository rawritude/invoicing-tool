"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Trash2, Loader2, Receipt } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ReportData } from "@/lib/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const loadReports = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  async function createReport() {
    if (!newName.trim()) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() }),
    });
    setNewName("");
    setNewDescription("");
    setShowCreate(false);
    loadReports();
  }

  async function deleteReport(id: string) {
    if (!confirm("Delete this report? Receipts will be unassigned but not deleted.")) return;
    await fetch(`/api/reports/${id}`, { method: "DELETE" });
    loadReports();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Organize receipts into reports</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {showCreate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Report name (e.g. Berlin Trip Q1 2025)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createReport()}
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={createReport} disabled={!newName.trim()}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No reports yet. Create one to start organizing your receipts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report._id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Link href={`/reports/${report._id}`} className="flex-1">
                    <CardTitle className="text-lg hover:text-primary transition-colors">
                      {report.name}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Badge variant={report.status === "finalized" ? "default" : "secondary"}>
                      {report.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteReport(report._id!)} aria-label="Delete report">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {report.description && (
                  <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Receipt className="h-4 w-4" />
                    {report.receiptCount || 0} receipts
                  </span>
                  <span>Created {formatDate(report.createdAt!)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
