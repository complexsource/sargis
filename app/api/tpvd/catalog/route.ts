import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { fetchTpvdDistrictPoints } from "@/lib/tpvd/live-data";
import type { TpvdCatalog, TpvdTpsBoundaryRecord } from "@/lib/tpvd/live-data";

const uniqueSorted = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.map((v) => (v ?? "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

export async function GET() {
  try {
    const [{ rows }, districtPoints] = await Promise.all([
      db.query<{
        gid: number; tps_id: number; tps_name: string; title: string; tps_no: string;
        village: string; city: string; authority: string; district: string; status: string;
        min_lng: number; min_lat: number; max_lng: number; max_lat: number; lng: number; lat: number;
      }>(`
        SELECT
          gid, tps_id, tps_name, title, tps_no, village, city, authority, district, status,
          ST_XMin(ST_Envelope(geom)) AS min_lng,
          ST_YMin(ST_Envelope(geom)) AS min_lat,
          ST_XMax(ST_Envelope(geom)) AS max_lng,
          ST_YMax(ST_Envelope(geom)) AS max_lat,
          ST_X(ST_Centroid(geom))    AS lng,
          ST_Y(ST_Centroid(geom))    AS lat
        FROM tps_boundary
        ORDER BY gid
      `),
      fetchTpvdDistrictPoints().catch(() => [])
    ]);

    const records: TpvdTpsBoundaryRecord[] = rows.map((row) => ({
      gid: row.gid,
      tpsId: row.tps_id,
      tpsName: row.tps_name,
      title: row.title,
      tpsNumber: row.tps_no,
      village: row.village,
      city: row.city,
      authority: row.authority,
      district: row.district,
      status: row.status,
      bounds: [row.min_lng, row.min_lat, row.max_lng, row.max_lat],
      center: [row.lng, row.lat]
    }));

    const publicDistricts = uniqueSorted(districtPoints.map((p) => p.name));
    const administrativeDistricts = uniqueSorted(records.map((r) => r.district));

    const catalog: TpvdCatalog = {
      source: "Local PostGIS sargis.tps_boundary",
      updatedAt: new Date().toISOString(),
      records,
      districtPoints,
      options: {
        districts: uniqueSorted([...publicDistricts, ...administrativeDistricts, ...records.map((r) => r.city)]),
        publicDistricts,
        administrativeDistricts,
        cities: uniqueSorted(records.map((r) => r.city)),
        authorities: uniqueSorted(records.map((r) => r.authority)),
        villages: uniqueSorted(records.map((r) => r.village)),
        tpsNumbers: uniqueSorted(records.map((r) => r.tpsNumber)),
        tpsNames: uniqueSorted(records.map((r) => r.title || r.tpsName)),
        statuses: uniqueSorted(records.map((r) => r.status))
      }
    };

    return NextResponse.json(catalog, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" }
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "DB catalog", records: [], districtPoints: [],
        options: { districts: [], publicDistricts: [], administrativeDistricts: [], cities: [], authorities: [], villages: [], tpsNumbers: [], tpsNames: [], statuses: [] },
        error: error instanceof Error ? error.message : "DB error"
      },
      { status: 502 }
    );
  }
}
