import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const lat = Number(request.nextUrl.searchParams.get("lat"));

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return NextResponse.json({ message: "lng and lat are required" }, { status: 400 });
  }

  try {
    for (const radiusM of [150, 600]) {
      const { rows } = await db.query<{
        gid: number; fp_no: string; tps_name: string; tps_no: string;
        village: string; city: string; authority: string; district: string;
        reser_type: string | null; reser_use: string | null; fp_area_sqm: number | null;
        geometry: object; click_distance_m: number;
        water_body_affected: boolean; gamthal_affected: boolean;
        dp_reservation_affected: boolean; railway_affected: boolean; ht_line_affected: boolean;
      }>(
        `SELECT
          fp.gid, fp.fp_no, fp.tps_name, fp.tps_no, fp.village, fp.city,
          fp.authority, fp.district, fp.reser_type, fp.reser_use, fp.fp_area_sqm,
          ST_AsGeoJSON(fp.geom)::json AS geometry,
          ST_Distance(fp.geom::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS click_distance_m,
          COALESCE(pc.water_body_affected, false)     AS water_body_affected,
          COALESCE(pc.gamthal_affected, false)        AS gamthal_affected,
          COALESCE(pc.dp_reservation_affected, false) AS dp_reservation_affected,
          COALESCE(pc.railway_affected, false)        AS railway_affected,
          COALESCE(pc.ht_line_affected, false)        AS ht_line_affected
        FROM final_plots fp
        LEFT JOIN plot_constraints pc ON pc.plot_gid = fp.gid
        WHERE ST_DWithin(fp.geom::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
        ORDER BY fp.geom::geography <-> ST_SetSRID(ST_MakePoint($1,$2),4326)::geography
        LIMIT 30`,
        [lng, lat, radiusM]
      );

      if (!rows.length) continue;

      const features = rows.map((row) => ({
        id: `final_plot_boundary.${row.gid}`,
        geometry: row.geometry,
        properties: {
          gid: row.gid,
          fp_no: row.fp_no,
          tps_name: row.tps_name,
          title_tps_name: row.tps_name,
          tps_no: row.tps_no,
          village: row.village,
          city: row.city,
          authority: row.authority,
          district: row.district,
          reser_type: row.reser_type,
          reser_use: row.reser_use,
          fp_area_final: row.fp_area_sqm,
          click_distance_m: Math.max(0, row.click_distance_m),
          water_body_affected: row.water_body_affected,
          gamthal_affected: row.gamthal_affected,
          dp_reservation_affected: row.dp_reservation_affected,
          railway_affected: row.railway_affected,
          ht_line_affected: row.ht_line_affected
        }
      }));

      return NextResponse.json({
        source: "Local PostGIS sargis.final_plots KNN",
        count: features.length,
        totalFeatures: features.length,
        features
      });
    }

    return NextResponse.json({ source: "Local PostGIS sargis.final_plots KNN", count: 0, totalFeatures: 0, features: [] });
  } catch (error) {
    return NextResponse.json(
      { source: "DB feature-nearby", count: 0, features: [], error: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
