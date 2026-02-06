import { NextRequest, NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/exchange-rate";

export async function GET(request: NextRequest) {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch rate" },
      { status: 500 }
    );
  }
}
