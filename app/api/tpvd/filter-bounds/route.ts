import { NextRequest, NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/mock-data/search";
import { fetchTpvdFilterBounds } from "@/lib/tpvd/live-data";

export async function GET(request: NextRequest) {
  try {
    const filters = parseSearchParams(request.nextUrl.searchParams);
    return NextResponse.json(await fetchTpvdFilterBounds(filters));
  } catch (error) {
    return NextResponse.json(
      {
        source: "TPVD WFS filtered feature bounds",
        count: 0,
        bounds: null,
        center: null,
        points: [],
        error: error instanceof Error ? error.message : "Unknown TPVD filter bounds error"
      },
      { status: 502 }
    );
  }
}
