import puppeteer from "puppeteer";
import type { IReceipt } from "@/lib/models/receipt";
import type { ICategory } from "@/lib/models/category";

interface ReceiptWithCategory extends Omit<IReceipt, "category"> {
  category: ICategory;
}

interface ExpenseReportConfig {
  title: string;
  businessName?: string;
  businessAddress?: string;
  dateRange?: string;
  notes?: string;
}

export async function generateExpenseReport(
  receipts: ReceiptWithCategory[],
  config: ExpenseReportConfig
): Promise<Buffer> {
  // Group by category
  const grouped = new Map<string, ReceiptWithCategory[]>();
  for (const r of receipts) {
    const catName = r.category?.name || "Uncategorized";
    if (!grouped.has(catName)) grouped.set(catName, []);
    grouped.get(catName)!.push(r);
  }

  const grandTotal = receipts.reduce((sum, r) => sum + r.total, 0);
  const currency = receipts[0]?.originalCurrency || "USD";

  let categorySections = "";
  for (const [catName, catReceipts] of grouped) {
    const catTotal = catReceipts.reduce((sum, r) => sum + r.total, 0);
    const rows = catReceipts
      .map(
        (r) => `
      <tr>
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td>${r.vendorName}</td>
        <td style="text-align:right">${r.total.toFixed(2)} ${r.originalCurrency}</td>
      </tr>`
      )
      .join("");

    categorySections += `
      <h3 style="color:#6366f1;margin-top:24px">${catName}</h3>
      <table>
        <thead><tr><th>Date</th><th>Vendor</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2" style="font-weight:bold">Subtotal</td><td style="text-align:right;font-weight:bold">${catTotal.toFixed(2)} ${currency}</td></tr></tfoot>
      </table>`;
  }

  // Build receipt images section
  let receiptImages = "";
  for (const r of receipts) {
    if (r.fileData && r.fileType?.startsWith("image/")) {
      const b64 = Buffer.from(r.fileData).toString("base64");
      receiptImages += `
        <div style="page-break-inside:avoid;margin:16px 0">
          <p style="font-weight:bold;margin-bottom:4px">${r.vendorName} — ${new Date(r.date).toLocaleDateString()}</p>
          <img src="data:${r.fileType};base64,${b64}" style="max-width:100%;max-height:600px;border:1px solid #e5e5e5;border-radius:4px" />
        </div>`;
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; font-size: 14px; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h3 { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  tfoot td { border-top: 2px solid #1a1a1a; }
  .header { margin-bottom: 24px; }
  .grand-total { font-size: 18px; font-weight: bold; margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
  .meta { color: #737373; font-size: 12px; }
  .receipt-images { page-break-before: always; }
</style>
</head>
<body>
  <div class="header">
    <h1>${config.title}</h1>
    ${config.businessName ? `<p style="font-weight:600">${config.businessName}</p>` : ""}
    ${config.businessAddress ? `<p class="meta">${config.businessAddress}</p>` : ""}
    ${config.dateRange ? `<p class="meta">Period: ${config.dateRange}</p>` : ""}
    <p class="meta">Generated: ${new Date().toLocaleDateString()}</p>
  </div>

  ${categorySections}

  <div class="grand-total">
    Grand Total: ${grandTotal.toFixed(2)} ${currency}
  </div>

  ${config.notes ? `<p style="margin-top:16px;color:#737373">${config.notes}</p>` : ""}

  ${
    receiptImages
      ? `<div class="receipt-images"><h2>Receipt Images</h2>${receiptImages}</div>`
      : ""
  }
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    printBackground: true,
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
