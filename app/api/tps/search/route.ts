import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { parseSearchParams } from "@/lib/mock-data/search";
import { fetchTpvdCatalog, filterTpvdRecords } from "@/lib/tpvd/live-data";
import type { Tps } from "@/lib/schemas";

const STATUS_MAP: Record<string, Tps["status"]> = {
  sanctioned: "Sanctioned",
  "in force": "In force",
  draft: "Draft",
  "under revision": "Under revision"
};

function normalizeStatus(raw: string | null | undefined): Tps["status"] {
  return STATUS_MAP[(raw ?? "").toLowerCase().trim()] ?? "Sanctioned";
}

async function queryFromDb(filters: ReturnType<typeof parseSearchParams>): Promise<Tps[] | null> {
  const { rows: countRows } = await db.query<{ count: string }>(
    "SELECT COUNT(*) FROM tps_boundary"
  );
  if (Number(countRows[0].count) === 0) return null;

  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  const addILike = (field: string, value: string | undefined) => {
    if (!value) return;
    clauses.push(`${field} ILIKE $${i++}`);
    params.push(`%${value}%`);
  };
  const addEq = (field: string, value: string | undefined) => {
    if (!value) return;
    clauses.push(`${field} = $${i++}`);
    params.push(value);
  };

  if (filters.query) {
    clauses.push(
      `(district ILIKE $${i} OR city ILIKE $${i} OR authority ILIKE $${i} OR village ILIKE $${i} OR tps_name ILIKE $${i} OR title ILIKE $${i} OR tps_no ILIKE $${i})`
    );
    params.push(`%${filters.query}%`);
    i++;
  }
  if (filters.district) {
    clauses.push(
      `(district ILIKE $${i} OR city ILIKE $${i} OR village ILIKE $${i} OR tps_name ILIKE $${i} OR title ILIKE $${i})`
    );
    params.push(`%${filters.district}%`);
    i++;
  }
  addEq("city", filters.city);
  addEq("authority", filters.urbanAuthority);
  addILike("village", filters.village);
  addILike("tps_no", filters.tpsNumber);
  if (filters.tpsName) {
    clauses.push(`(tps_name ILIKE $${i} OR title ILIKE $${i})`);
    params.push(`%${filters.tpsName}%`);
    i++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `
    SELECT gid, tps_id, tps_name, title, tps_no, village, city, authority, district, status,
           ST_X(ST_Centroid(geom)) AS lng, ST_Y(ST_Centroid(geom)) AS lat
    FROM tps_boundary
    ${where}
    ORDER BY gid
    LIMIT 500
  `;

  const { rows } = await db.query<{
    gid: number; tps_name: string; title: string; tps_no: string;
    village: string; city: string; authority: string; district: string;
    status: string; lng: number; lat: number;
  }>(sql, params);

  return rows.map((row) => ({
    id: String(row.gid),
    name: row.title || row.tps_name,
    number: row.tps_no,
    district: row.district,
    city: row.city,
    urbanAuthority: row.authority,
    village: row.village,
    areaHa: 0,
    status: normalizeStatus(row.status),
    webLink: "https://tpvd.openprp.in/",
    centroid: [row.lng ?? 0, row.lat ?? 0] as [number, number],
    sourceMetadata: "Local PostGIS sargis.tps_boundary",
    lastUpdated: new Date().toISOString().split("T")[0]
  }));
}

async function queryFromLive(filters: ReturnType<typeof parseSearchParams>): Promise<Tps[]> {
  const catalog = await fetchTpvdCatalog();
  const filtered = filterTpvdRecords(catalog.records, filters);
  return filtered.map((record) => ({
    id: String(record.gid),
    name: record.title || record.tpsName,
    number: record.tpsNumber,
    district: record.district,
    city: record.city,
    urbanAuthority: record.authority,
    village: record.village,
    areaHa: 0,
    status: normalizeStatus(record.status),
    webLink: "https://tpvd.openprp.in/",
    centroid: record.center,
    sourceMetadata: "Live TPVD ctp:tps_boundary WFS",
    lastUpdated: new Date().toISOString().split("T")[0]
  }));
}

export async function GET(request: NextRequest) {
  const filters = parseSearchParams(request.nextUrl.searchParams);

  let records: Tps[];
  try {
    const dbResult = await queryFromDb(filters);
    records = dbResult ?? (await queryFromLive(filters));
  } catch {
    records = await queryFromLive(filters);
  }

  return NextResponse.json(records, { headers: { "Cache-Control": "no-store" } });
}
