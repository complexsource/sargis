import { db } from "@/lib/db/client";
import { buildFeasibility } from "@/lib/mock-data/feasibility";
import type { Plot, ReportPayload, Tps } from "@/lib/schemas";

const TPS_STATUS_MAP: Record<string, Tps["status"]> = {
  final: "In force", sanctioned: "Sanctioned", preliminary: "Draft", "under revision": "Under revision"
};

export async function getReportPayload(plotId: string): Promise<ReportPayload | null> {
  const gid = Number(plotId);
  if (!Number.isFinite(gid) || gid <= 0) return null;

  const { rows: plotRows } = await db.query<{
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

  if (!plotRows.length) return null;
  const pr = plotRows[0];

  const anyConstraint = pr.water_body_affected || pr.gamthal_affected ||
    pr.dp_reservation_affected || pr.railway_affected || pr.ht_line_affected;

  const plot: Plot = {
    id: String(pr.gid),
    plotId: pr.fp_no || String(pr.gid),
    tpsId: pr.tps_id ?? "",
    tpsName: pr.tps_name ?? "",
    tpsNumber: pr.tps_no ?? "",
    district: pr.district ?? "",
    city: pr.city ?? "",
    urbanAuthority: pr.authority ?? "",
    village: pr.village ?? "",
    surveyNumber: "",
    originalPlotNumber: "",
    finalPlotNumber: pr.fp_no ?? "",
    areaSqM: pr.fp_area_sqm ?? 0,
    boundaryType: "Final Plot Boundary",
    roadAccess: "",
    nearbyRoadWidthM: 0,
    roadName: "",
    landUse: pr.reser_use ?? "",
    zone: "",
    reservationType: pr.reser_type,
    fsi: 0,
    permissibleBuiltUpAreaSqM: 0,
    setbacks: { frontM: 0, sideM: 0, rearM: 0 },
    heightLimitM: 0,
    restrictions: [],
    restrictionStatus: anyConstraint ? "Watch" : "Clear",
    intersections: {
      waterBody: pr.water_body_affected,
      gamthal: pr.gamthal_affected,
      dpReservation: pr.dp_reservation_affected || pr.reser_type !== null,
      railway: pr.railway_affected,
      htLine: pr.ht_line_affected,
      roadBoundary: false
    },
    coordinates: [pr.lng ?? 0, pr.lat ?? 0],
    relatedLayers: ["Final Plot Boundary"],
    sourceMetadata: "Local PostGIS sargis.final_plots",
    lastUpdated: new Date().toISOString().split("T")[0]
  };

  const tpsId = Number(pr.tps_id);
  let tps: Tps | null = null;

  if (Number.isFinite(tpsId) && tpsId > 0) {
    const { rows: tpsRows } = await db.query<{
      gid: number; tps_name: string; title: string; tps_no: string;
      village: string; city: string; authority: string; district: string; status: string;
      lng: number; lat: number;
    }>(
      `SELECT gid, tps_name, title, tps_no, village, city, authority, district, status,
         ST_X(ST_Centroid(geom)) AS lng, ST_Y(ST_Centroid(geom)) AS lat
       FROM tps_boundary WHERE tps_id = $1 LIMIT 1`,
      [tpsId]
    );

    if (tpsRows.length) {
      const tr = tpsRows[0];
      tps = {
        id: String(tr.gid),
        name: tr.title || tr.tps_name,
        number: tr.tps_no,
        district: tr.district,
        city: tr.city,
        urbanAuthority: tr.authority,
        village: tr.village,
        areaHa: 0,
        status: TPS_STATUS_MAP[(tr.status ?? "").toLowerCase().trim()] ?? "Sanctioned",
        webLink: "https://tpvd.openprp.in/",
        centroid: [tr.lng ?? 0, tr.lat ?? 0],
        sourceMetadata: "Local PostGIS sargis.tps_boundary",
        lastUpdated: new Date().toISOString().split("T")[0]
      };
    }
  }

  if (!tps) return null;

  return {
    id: `report-${plot.id}`,
    generatedAt: new Date().toISOString(),
    title: `Planning Feasibility Snapshot - ${plot.plotId}`,
    plot,
    tps,
    feasibility: buildFeasibility(plot),
    disclaimer:
      "This report uses TPVD-style data from a local PostGIS database. It is not a legal planning opinion, sanctioned town-planning extract, property card, survey record, or substitute for authority verification."
  };
}
