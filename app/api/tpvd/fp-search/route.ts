import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import type { TpvdSearchFeature } from "@/lib/tpvd/service";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? "";

  if (query.trim().length < 1) {
    return NextResponse.json({ source: "Local PostGIS sargis.final_plots", count: 0, records: [] });
  }

  try {
    const clean = query.replace(/[^0-9a-zA-Z ]/g, "");
    const { rows } = await db.query<{ gid: number; fp_no: string; lng: number; lat: number }>(
      `SELECT gid, fp_no, ST_X(ST_Centroid(geom)) AS lng, ST_Y(ST_Centroid(geom)) AS lat
       FROM final_plots
       WHERE fp_no ILIKE $1 OR gid::text = $2
       ORDER BY gid LIMIT 100`,
      [`%${clean}%`, clean]
    );

    const records: TpvdSearchFeature[] = rows.map((r) => ({
      gid: r.gid,
      search: r.fp_no,
      coordinates: [r.lng ?? 0, r.lat ?? 0]
    }));

    return NextResponse.json({
      source: "Local PostGIS sargis.final_plots",
      count: records.length,
      totalFeatures: records.length,
      records
    });
  } catch (error) {
    return NextResponse.json(
      { source: "DB fp-search", count: 0, records: [], error: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
