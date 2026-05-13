import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { parseSearchParams } from "@/lib/mock-data/search";
import { QB, buildTpsWhere, buildPlotWhere, usesFinalPlots } from "@/lib/db/query-builder";

function parseBox(box: string | null): [number, number, number, number] | null {
  if (!box) return null;
  const m = /BOX\(([^ ]+) ([^,]+),([^ ]+) ([^)]+)\)/.exec(box);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
}

export async function GET(request: NextRequest) {
  const filters = parseSearchParams(request.nextUrl.searchParams);

  try {
    const usePlots = usesFinalPlots(filters);
    const source = usePlots ? "Local PostGIS sargis.final_plots" : "Local PostGIS sargis.tps_boundary";

    const qb = new QB();
    if (usePlots) {
      buildPlotWhere(qb, filters);
    } else {
      buildTpsWhere(qb, filters);
    }

    const fromClause = usePlots
      ? "final_plots fp LEFT JOIN plot_constraints pc ON pc.plot_gid = fp.gid"
      : "tps_boundary";
    const geomField = usePlots ? "fp.geom" : "geom";
    const w = qb.where();

    const [extentResult, centroidResult] = await Promise.all([
      db.query<{ extent: string | null; total: string }>(
        `SELECT ST_Extent(${geomField})::text AS extent, COUNT(*) AS total FROM ${fromClause} ${w}`,
        qb.params
      ),
      db.query<{ lng: number; lat: number }>(
        `SELECT ST_X(ST_Centroid(${geomField})) AS lng, ST_Y(ST_Centroid(${geomField})) AS lat FROM ${fromClause} ${w} LIMIT 300`,
        qb.params
      )
    ]);

    const bounds = parseBox(extentResult.rows[0]?.extent ?? null);
    const center = bounds ? ([(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2] as [number, number]) : null;
    const points = centroidResult.rows
      .filter((r) => r.lng != null && r.lat != null)
      .map((r) => [r.lng, r.lat] as [number, number]);

    return NextResponse.json({
      source,
      layerName: usePlots ? "ctp:final_plot_boundary" : "ctp:tps_boundary",
      count: points.length,
      totalFeatures: Number(extentResult.rows[0]?.total ?? 0),
      bounds,
      center,
      points
    });
  } catch (error) {
    return NextResponse.json(
      { source: "DB filter-bounds", count: 0, bounds: null, center: null, points: [], error: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
