import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Receipt from "@/lib/models/receipt";
import { getSettings } from "@/lib/models/settings";
import { generateExpenseReport } from "@/lib/pdf/expense-report";
import { generateClientInvoice } from "@/lib/pdf/client-invoice";

export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();
  const { type, receiptIds, config } = body;

  if (!type || !receiptIds?.length) {
    return NextResponse.json(
      { error: "Missing type or receiptIds" },
      { status: 400 }
    );
  }

  // Fetch receipts with file data
  const receipts = await Receipt.find({ _id: { $in: receiptIds } })
    .populate("category")
    .sort({ date: -1 });

  if (receipts.length === 0) {
    return NextResponse.json({ error: "No receipts found" }, { status: 404 });
  }

  const settings = await getSettings();

  try {
    let pdfBuffer: Buffer;

    if (type === "expense-report") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await generateExpenseReport(receipts as any, {
        title: config?.title || "Expense Report",
        businessName: settings.businessName,
        businessAddress: settings.businessAddress,
        dateRange: config?.dateRange,
        notes: config?.notes,
      });
    } else if (type === "client-invoice") {
      // Auto-generate invoice number
      const invoiceNumber = `${settings.invoiceNumberPrefix}${String(settings.nextInvoiceNumber).padStart(4, "0")}`;
      settings.nextInvoiceNumber = (settings.nextInvoiceNumber || 1) + 1;
      await settings.save();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfBuffer = await generateClientInvoice(receipts as any, {
        invoiceNumber,
        clientName: config?.clientName || "Client",
        clientAddress: config?.clientAddress,
        businessName: settings.businessName,
        businessAddress: settings.businessAddress,
        dueDate: config?.dueDate,
        notes: config?.notes,
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
