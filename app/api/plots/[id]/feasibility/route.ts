import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { buildFeasibility } from "@/lib/mock-data/feasibility";
import type { Plot } from "@/lib/schemas";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const gid = Number(params.id);
  if (!Number.isFinite(gid) || gid <= 0) {
    return NextResponse.json({ message: "Plot not found" }, { status: 404 });
  }

  try {
    const { rows } = await db.query<{
      gid: number; tps_id: string; tps_name: string; tps_no: string;
      village: string; city: string; district: string; authority: string;
      fp_no: string; reser_type: string | null; reser_use: string | null; fp_area_sqm: number | null;
      lng: number; lat: number;
      water_body_affected: boolean; gamthal_affected: boolean;
      dp_reservation_affected: boolean; railway_affected: boolean; ht_line_affected: boolean;
    }>(
      `SELECT
        fp.gid, fp.tps_id, fp.tps_name, fp.tps_no, fp.village, fp.city,
        fp.district, fp.authority, fp.fp_no, fp.reser_type, fp.reser_use, fp.fp_area_sqm,
        ST_X(ST_Centroid(fp.geom)) AS lng, ST_Y(ST_Centroid(fp.geom)) AS lat,
        COALESCE(pc.water_body_affected, false)     AS water_body_affected,
        COALESCE(pc.gamthal_affected, false)        AS gamthal_affected,
        COALESCE(pc.dp_reservation_affected, false) AS dp_reservation_affected,
        COALESCE(pc.railway_affected, false)        AS railway_affected,
        COALESCE(pc.ht_line_affected, false)        AS ht_line_affected
      FROM final_plots fp
      LEFT JOIN plot_constraints pc ON pc.plot_gid = fp.gid
      WHERE fp.gid = $1`,
      [gid]
    );

    if (!rows.length) return NextResponse.json({ message: "Plot not found" }, { status: 404 });
    const row = rows[0];

    const anyConstraint = row.water_body_affected || row.gamthal_affected ||
      row.dp_reservation_affected || row.railway_affected || row.ht_line_affected;

    const plot: Plot = {
      id: String(row.gid),
      plotId: row.fp_no || String(row.gid),
      tpsId: row.tps_id ?? "",
      tpsName: row.tps_name ?? "",
      tpsNumber: row.tps_no ?? "",
      district: row.district ?? "",
      city: row.city ?? "",
      urbanAuthority: row.authority ?? "",
      village: row.village ?? "",
      surveyNumber: "",
      originalPlotNumber: "",
      finalPlotNumber: row.fp_no ?? "",
      areaSqM: row.fp_area_sqm ?? 0,
      boundaryType: "Final Plot Boundary",
      roadAccess: "",
      nearbyRoadWidthM: 0,
      roadName: "",
      landUse: row.reser_use ?? "",
      zone: "",
      reservationType: row.reser_type,
      fsi: 0,
      permissibleBuiltUpAreaSqM: 0,
      setbacks: { frontM: 0, sideM: 0, rearM: 0 },
      heightLimitM: 0,
      restrictions: [],
      restrictionStatus: anyConstraint ? "Watch" : "Clear",
      intersections: {
        waterBody: row.water_body_affected,
        gamthal: row.gamthal_affected,
        dpReservation: row.dp_reservation_affected || row.reser_type !== null,
        railway: row.railway_affected,
        htLine: row.ht_line_affected,
        roadBoundary: false
      },
      coordinates: [row.lng ?? 0, row.lat ?? 0],
      relatedLayers: ["Final Plot Boundary"],
      sourceMetadata: "Local PostGIS sargis.final_plots",
      lastUpdated: new Date().toISOString().split("T")[0]
    };

    return NextResponse.json(buildFeasibility(plot));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
