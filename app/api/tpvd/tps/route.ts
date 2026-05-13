import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const district = request.nextUrl.searchParams.get("district") || "Ahmedabad";

  try {
    const { rows } = await db.query<{ tps_id: number; tps_name: string; tps_no: string; authority: string; title: string }>(
      `SELECT tps_id, tps_name, tps_no, authority, title
       FROM tps_boundary
       WHERE district ILIKE $1 OR city ILIKE $1
       ORDER BY tps_name`,
      [`%${district}%`]
    );

    const records = rows.map((r) => ({
      tps_id: r.tps_id,
      tps_name: r.tps_name,
      tps_no: r.tps_no,
      tps_authority: r.authority,
      title_tps_name: r.title || r.tps_name
    }));

    return NextResponse.json({ source: "Local PostGIS sargis.tps_boundary", district, count: records.length, records });
  } catch (error) {
    return NextResponse.json(
      { source: "DB tps", district, count: 0, records: [], error: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
