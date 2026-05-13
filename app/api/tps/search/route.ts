import { NextRequest, NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/mock-data/search";
import { fetchTpvdCatalog, filterTpvdRecords } from "@/lib/tpvd/live-data";
import type { Tps } from "@/lib/schemas";

const STATUS_MAP: Record<string, Tps["status"]> = {
  sanctioned: "Sanctioned",
  "in force": "In force",
  draft: "Draft",
  "under revision": "Under revision"
};

function normalizeStatus(raw: string): Tps["status"] {
  return STATUS_MAP[raw.toLowerCase().trim()] ?? "Sanctioned";
}

export async function GET(request: NextRequest) {
  const filters = parseSearchParams(request.nextUrl.searchParams);
  const catalog = await fetchTpvdCatalog();
  const filtered = filterTpvdRecords(catalog.records, filters);

  const records: Tps[] = filtered.map((record) => ({
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

  return NextResponse.json(records, {
    headers: { "Cache-Control": "no-store" }
  });
}
