import { NextRequest, NextResponse } from "next/server";
import { fetchTpvdTpsExtent, parseTpvdBox } from "@/lib/tpvd/service";

export async function GET(request: NextRequest) {
  const tpsId = request.nextUrl.searchParams.get("tpsId");

  if (!tpsId) {
    return NextResponse.json({ message: "tpsId is required" }, { status: 400 });
  }

  try {
    const box = await fetchTpvdTpsExtent(tpsId);
    return NextResponse.json({
      source: "TPVD get_tps_id.php",
      tpsId,
      extent: parseTpvdBox(box),
      raw: box
    });
  } catch (error) {
    return NextResponse.json(
      { source: "TPVD get_tps_id.php", tpsId, error: error instanceof Error ? error.message : "Unknown TPVD extent error" },
      { status: 502 }
    );
  }
}
