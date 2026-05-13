import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { parseSearchParams } from "@/lib/mock-data/search";
import { fetchTpvdFinalPlots } from "@/lib/tpvd/live-data";
import type { Plot } from "@/lib/schemas";

async function queryFromDb(filters: ReturnType<typeof parseSearchParams>): Promise<Plot[] | null> {
  const { rows: countRows } = await db.query<{ count: string }>(
    "SELECT COUNT(*) FROM final_plots"
  );
  if (Number(countRows[0].count) === 0) return null;

  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  const addILike = (field: string, value: string | undefined) => {
    if (!value) return;
    clauses.push(`fp.${field} ILIKE $${i++}`);
    params.push(`%${value}%`);
  };
  const addEq = (field: string, value: string | undefined) => {
    if (!value) return;
    clauses.push(`fp.${field} = $${i++}`);
    params.push(value);
  };
  const addGte = (field: string, value: number | undefined) => {
    if (value === undefined) return;
    clauses.push(`fp.${field} >= $${i++}`);
    params.push(value);
  };
  const addLte = (field: string, value: number | undefined) => {
    if (value === undefined) return;
    clauses.push(`fp.${field} <= $${i++}`);
    params.push(value);
  };
  const addBool = (constraintField: string, value: boolean | undefined) => {
    if (value === undefined) return;
    clauses.push(`pc.${constraintField} = $${i++}`);
    params.push(value);
  };

  if (filters.query) {
    clauses.push(
      `(fp.fp_no ILIKE $${i} OR fp.tps_name ILIKE $${i} OR fp.city ILIKE $${i} OR fp.district ILIKE $${i})`
    );
    params.push(`%${filters.query}%`);
    i++;
  }
  if (filters.district) {
    clauses.push(`(fp.district ILIKE $${i} OR fp.city ILIKE $${i} OR fp.village ILIKE $${i})`);
    params.push(`%${filters.district}%`);
    i++;
  }
  addEq("city", filters.city);
  addEq("authority", filters.urbanAuthority);
  addILike("village", filters.village);
  addEq("tps_no", filters.tpsNumber);
  addILike("tps_name", filters.tpsName);
  addILike("fp_no", filters.finalPlotNumber);
  if (filters.plotId) {
    const numId = Number(filters.plotId);
    if (Number.isInteger(numId) && String(numId) === filters.plotId) {
      clauses.push(`(fp.gid = $${i} OR fp.fp_no ILIKE $${i + 1})`);
      params.push(numId, `%${filters.plotId}%`);
      i += 2;
    } else {
      clauses.push(`fp.fp_no ILIKE $${i++}`);
      params.push(`%${filters.plotId}%`);
    }
  }
  if (filters.reservationType) {
    clauses.push(`(fp.reser_type ILIKE $${i} OR fp.reser_use ILIKE $${i})`);
    params.push(`%${filters.reservationType}%`);
    i++;
  }
  addGte("fp_area_sqm", filters.minArea);
  addLte("fp_area_sqm", filters.maxArea);

  addBool("water_body_affected",     filters.waterBodyAffected);
  addBool("gamthal_affected",        filters.gamthalAffected);
  addBool("dp_reservation_affected", filters.dpReservationAffected);
  addBool("railway_affected",        filters.railwayAffected);
  addBool("ht_line_affected",        filters.htLineAffected);

  // Always join — every plot has a constraint row (1-to-1), and we always return constraint flags
  const joinClause = "LEFT JOIN plot_constraints pc ON pc.plot_gid = fp.gid";

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      fp.gid, fp.tps_id, fp.tps_name, fp.tps_no, fp.village, fp.city,
      fp.district, fp.authority, fp.fp_no, fp.reser_type, fp.reser_use,
      fp.fp_area_sqm,
      ST_X(ST_Centroid(fp.geom)) AS lng,
      ST_Y(ST_Centroid(fp.geom)) AS lat,
      COALESCE(pc.water_body_affected, false)     AS water_body_affected,
      COALESCE(pc.gamthal_affected, false)        AS gamthal_affected,
      COALESCE(pc.dp_reservation_affected, false) AS dp_reservation_affected,
      COALESCE(pc.railway_affected, false)        AS railway_affected,
      COALESCE(pc.ht_line_affected, false)        AS ht_line_affected
    FROM final_plots fp
    ${joinClause}
    ${where}
    ORDER BY fp.gid
    LIMIT 200
  `;

  const { rows } = await db.query<{
    gid: number; tps_id: string; tps_name: string; tps_no: string;
    village: string; city: string; district: string; authority: string;
    fp_no: string; reser_type: string | null; reser_use: string | null;
    fp_area_sqm: number | null; lng: number; lat: number;
    water_body_affected: boolean; gamthal_affected: boolean;
    dp_reservation_affected: boolean; railway_affected: boolean; ht_line_affected: boolean;
  }>(sql, params);

  const anyConstraint = (r: typeof rows[0]) =>
    r.water_body_affected || r.gamthal_affected || r.dp_reservation_affected ||
    r.railway_affected || r.ht_line_affected;

  return rows.map((row): Plot => ({
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
    restrictionStatus: anyConstraint(row) ? "Watch" : "Clear",
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
  }));
}

async function queryFromLive(filters: ReturnType<typeof parseSearchParams>): Promise<Plot[]> {
  const tpvdPlots = await fetchTpvdFinalPlots(filters, 200);
  return tpvdPlots.map((plot): Plot => ({
    id: String(plot.gid),
    plotId: plot.finalPlotNumber || String(plot.gid),
    tpsId: plot.tpsId,
    tpsName: plot.tpsName,
    tpsNumber: plot.tpsNumber,
    district: plot.district,
    city: plot.city,
    urbanAuthority: plot.authority,
    village: plot.village,
    surveyNumber: "",
    originalPlotNumber: "",
    finalPlotNumber: plot.finalPlotNumber,
    areaSqM: plot.areaSqM,
    boundaryType: "Final Plot Boundary",
    roadAccess: "",
    nearbyRoadWidthM: 0,
    roadName: "",
    landUse: plot.reservationUse ?? "",
    zone: "",
    reservationType: plot.reservationType,
    fsi: 0,
    permissibleBuiltUpAreaSqM: 0,
    setbacks: { frontM: 0, sideM: 0, rearM: 0 },
    heightLimitM: 0,
    restrictions: [],
    restrictionStatus: "Clear",
    intersections: {
      waterBody: false,
      gamthal: false,
      dpReservation: plot.reservationType !== null,
      railway: false,
      htLine: false,
      roadBoundary: false
    },
    coordinates: plot.center ?? [0, 0],
    relatedLayers: ["Final Plot Boundary"],
    sourceMetadata: "Live TPVD ctp:final_plot_boundary WFS",
    lastUpdated: new Date().toISOString().split("T")[0]
  }));
}

export async function GET(request: NextRequest) {
  const filters = parseSearchParams(request.nextUrl.searchParams);

  const hasAnyFilter = Object.values(filters).some((v) => v !== undefined && v !== null && v !== "");
  if (!hasAnyFilter) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }

  let records: Plot[];
  try {
    const dbResult = await queryFromDb(filters);
    records = dbResult ?? (await queryFromLive(filters));
  } catch {
    records = await queryFromLive(filters);
  }

  return NextResponse.json(records, { headers: { "Cache-Control": "no-store" } });
}
