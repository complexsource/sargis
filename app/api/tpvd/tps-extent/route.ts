import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const tpsId = request.nextUrl.searchParams.get("tpsId");

  if (!tpsId) {
    return NextResponse.json({ message: "tpsId is required" }, { status: 400 });
  }

  try {
    const { rows } = await db.query<{ extent: string | null }>(
      "SELECT ST_Extent(geom)::text AS extent FROM tps_boundary WHERE tps_id = $1",
      [Number(tpsId)]
    );
    const raw = rows[0]?.extent ?? null;
    const m = raw ? /BOX\(([^ ]+) ([^,]+),([^ ]+) ([^)]+)\)/.exec(raw) : null;
    const extent = m
      ? { minX: Number(m[1]), minY: Number(m[2]), maxX: Number(m[3]), maxY: Number(m[4]), raw }
      : null;

    return NextResponse.json({ source: "Local PostGIS sargis.tps_boundary", tpsId, extent, raw });
  } catch (error) {
    return NextResponse.json(
      { source: "DB tps-extent", tpsId, error: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
