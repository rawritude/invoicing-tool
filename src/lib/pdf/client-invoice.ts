import puppeteer from "puppeteer";
import type { IReceipt } from "@/lib/models/receipt";
import type { ICategory } from "@/lib/models/category";
import { escapeHtml } from "@/lib/sanitize";

interface ReceiptWithCategory extends Omit<IReceipt, "category"> {
  category: ICategory;
}

interface ClientInvoiceConfig {
  invoiceNumber: string;
  clientName: string;
  clientAddress?: string;
  businessName?: string;
  businessAddress?: string;
  dueDate?: string;
  notes?: string;
}

export async function generateClientInvoice(
  receipts: ReceiptWithCategory[],
  config: ClientInvoiceConfig
): Promise<Buffer> {
  const grandTotal = receipts.reduce((sum, r) => (r.convertedTotal ?? r.total) + sum, 0);
  const currency = receipts[0]?.convertedCurrency || receipts[0]?.originalCurrency || "USD";

  const rows = receipts
    .map(
      (r) => {
        const displayTotal = r.convertedTotal ?? r.total;
        const displayCurrency = r.convertedCurrency || r.originalCurrency;
        return `
    <tr>
      <td>${escapeHtml(new Date(r.date).toLocaleDateString())}</td>
      <td>${escapeHtml(r.vendorName)}</td>
      <td>${escapeHtml(r.category?.name || "")}</td>
      <td style="text-align:right">${displayTotal.toFixed(2)} ${escapeHtml(displayCurrency)}</td>
    </tr>`;
      }
    )
    .join("");

  // Receipt images
  let receiptImages = "";
  for (const r of receipts) {
    if (r.fileData && r.fileType?.startsWith("image/")) {
      const b64 = Buffer.from(r.fileData).toString("base64");
      receiptImages += `
        <div style="page-break-inside:avoid;margin:16px 0">
          <p style="font-weight:bold;margin-bottom:4px">${escapeHtml(r.vendorName)} — ${escapeHtml(new Date(r.date).toLocaleDateString())}</p>
          <img src="data:${r.fileType};base64,${b64}" style="max-width:100%;max-height:600px;border:1px solid #e5e5e5;border-radius:4px" />
        </div>`;
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: left; }
  th { background: #1a1a2e; color: white; font-weight: 600; }
  tfoot td { border-top: 2px solid #1a1a1a; font-weight: bold; font-size: 16px; }
  .invoice-header { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .invoice-title { font-size: 32px; font-weight: bold; color: #6366f1; }
  .invoice-meta { text-align: right; }
  .addresses { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .address-block { flex: 1; }
  .address-block h4 { margin-bottom: 4px; color: #737373; font-size: 12px; text-transform: uppercase; }
  .total-box { text-align: right; font-size: 20px; font-weight: bold; padding: 16px; background: #f5f5f5; border-radius: 8px; margin-top: 16px; }
  .receipt-images { page-break-before: always; }
</style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <div class="invoice-title">INVOICE</div>
      ${config.businessName ? `<p style="font-weight:600;margin-top:4px">${escapeHtml(config.businessName)}</p>` : ""}
      ${config.businessAddress ? `<p style="color:#737373">${escapeHtml(config.businessAddress).replace(/\n/g, "<br>")}</p>` : ""}
    </div>
    <div class="invoice-meta">
      <p style="font-size:16px;font-weight:bold">${escapeHtml(config.invoiceNumber)}</p>
      <p style="color:#737373">Date: ${new Date().toLocaleDateString()}</p>
      ${config.dueDate ? `<p style="color:#737373">Due: ${escapeHtml(new Date(config.dueDate).toLocaleDateString())}</p>` : ""}
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h4>Bill To</h4>
      <p style="font-weight:600">${escapeHtml(config.clientName)}</p>
      ${config.clientAddress ? `<p style="color:#737373">${escapeHtml(config.clientAddress).replace(/\n/g, "<br>")}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right">Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total</td>
        <td style="text-align:right">${grandTotal.toFixed(2)} ${escapeHtml(currency)}</td>
      </tr>
    </tfoot>
  </table>

  ${config.notes ? `<p style="margin-top:16px;color:#737373">Notes: ${escapeHtml(config.notes)}</p>` : ""}

  ${
    receiptImages
      ? `<div class="receipt-images"><h2>Supporting Receipts</h2>${receiptImages}</div>`
      : ""
  }
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
