"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { COMMON_CURRENCIES } from "@/lib/constants";
import { Save, Plus, Trash2, Key, Globe, Building2, Tags, Loader2 } from "lucide-react";
import type { SettingsData, CategoryData } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");

  const loadData = useCallback(async () => {
    const [settingsRes, categoriesRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/categories"),
    ]);
    const settingsData = await settingsRes.json();
    const categoriesData = await categoriesRes.json();
    setSettings(settingsData.settings);
    setCategories(categoriesData.categories);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function saveSettings(updates: Partial<SettingsData>) {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    setSettings(data.settings);
    setSaving(false);
  }

  async function saveApiKey() {
    if (!newApiKey) return;
    await saveSettings({ geminiApiKey: newApiKey } as Partial<SettingsData>);
    setNewApiKey("");
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim(), color: newCategoryColor }),
    });
    if (res.ok) {
      setNewCategoryName("");
      loadData();
    }
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    loadData();
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
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your API keys, currency, and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gemini API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              Gemini API Key
            </CardTitle>
            <CardDescription>Required for AI receipt extraction and voice input</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Current: {settings?.geminiApiKey || "Not set"}
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter new API key..."
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
              <Button onClick={saveApiKey} disabled={saving || !newApiKey}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Default Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Default Currency
            </CardTitle>
            <CardDescription>Your home currency for exchange rate conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings?.defaultCurrency || "USD"}
              onChange={(e) => saveSettings({ defaultCurrency: e.target.value })}
              options={COMMON_CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Used on generated invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <Input
                value={settings?.businessName || ""}
                onChange={(e) => setSettings((s) => s ? { ...s, businessName: e.target.value } : s)}
                onBlur={() => settings && saveSettings({ businessName: settings.businessName })}
                placeholder="Your Business Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Textarea
                value={settings?.businessAddress || ""}
                onChange={(e) => setSettings((s) => s ? { ...s, businessAddress: e.target.value } : s)}
                onBlur={() => settings && saveSettings({ businessAddress: settings.businessAddress })}
                placeholder="123 Main St, City, Country"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Invoice Prefix</label>
                <Input
                  value={settings?.invoiceNumberPrefix || "INV-"}
                  onChange={(e) => setSettings((s) => s ? { ...s, invoiceNumberPrefix: e.target.value } : s)}
                  onBlur={() => settings && saveSettings({ invoiceNumberPrefix: settings.invoiceNumberPrefix })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Next Invoice #</label>
                <Input
                  type="number"
                  value={settings?.nextInvoiceNumber || 1}
                  onChange={(e) => setSettings((s) => s ? { ...s, nextInvoiceNumber: parseInt(e.target.value) || 1 } : s)}
                  onBlur={() => settings && saveSettings({ nextInvoiceNumber: settings.nextInvoiceNumber })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Google Drive
            </CardTitle>
            <CardDescription>Store receipt files in your Google Drive</CardDescription>
          </CardHeader>
          <CardContent>
            {settings?.googleDriveConnected ? (
              <div className="space-y-2">
                <Badge variant="secondary">Connected</Badge>
                <p className="text-sm text-muted-foreground">
                  Receipts will be uploaded to Google Drive automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="outline">Not connected</Badge>
                <p className="text-sm text-muted-foreground">
                  Connect your Google Drive to automatically store receipt files.
                </p>
                <Button variant="outline" onClick={() => window.location.href = "/api/drive/auth"}>
                  Connect Google Drive
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tags className="h-5 w-5" />
            Categories
          </CardTitle>
          <CardDescription>Manage expense categories for receipt classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
                {!cat.isDefault && (
                  <button
                    onClick={() => deleteCategory(cat._id!)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              className="max-w-xs"
            />
            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded border"
            />
            <Button onClick={addCategory} variant="outline" disabled={!newCategoryName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
