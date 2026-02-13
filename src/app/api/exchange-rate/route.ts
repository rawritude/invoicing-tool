import { NextRequest, NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/exchange-rate";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!date || !from || !to) {
    return NextResponse.json(
      { error: "Missing required params: date, from, to" },
      { status: 400 }
    );
  }

  try {
    const rate = await getExchangeRate(date, from, to);
    return NextResponse.json({ rate, from, to, date });
  } catch (error) {
    console.error("Exchange rate error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
});
