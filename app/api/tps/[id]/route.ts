import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import type { Tps } from "@/lib/schemas";

const STATUS_MAP: Record<string, Tps["status"]> = {
  final: "In force", sanctioned: "Sanctioned", preliminary: "Draft", "under revision": "Under revision"
};

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const gid = Number(params.id);
  if (!Number.isFinite(gid) || gid <= 0) {
    return NextResponse.json({ message: "TPS not found" }, { status: 404 });
  }

  try {
    const { rows } = await db.query<{
      gid: number; tps_id: number; tps_name: string; title: string; tps_no: string;
      village: string; city: string; authority: string; district: string; status: string;
      lng: number; lat: number;
    }>(
      `SELECT gid, tps_id, tps_name, title, tps_no, village, city, authority, district, status,
         ST_X(ST_Centroid(geom)) AS lng, ST_Y(ST_Centroid(geom)) AS lat
       FROM tps_boundary WHERE gid = $1`,
      [gid]
    );

    if (!rows.length) return NextResponse.json({ message: "TPS not found" }, { status: 404 });
    const row = rows[0];

    const record: Tps = {
      id: String(row.gid),
      name: row.title || row.tps_name,
      number: row.tps_no,
      district: row.district,
      city: row.city,
      urbanAuthority: row.authority,
      village: row.village,
      areaHa: 0,
      status: STATUS_MAP[(row.status ?? "").toLowerCase().trim()] ?? "Sanctioned",
      webLink: "https://tpvd.openprp.in/",
      centroid: [row.lng ?? 0, row.lat ?? 0],
      sourceMetadata: "Local PostGIS sargis.tps_boundary",
      lastUpdated: new Date().toISOString().split("T")[0]
    };

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
