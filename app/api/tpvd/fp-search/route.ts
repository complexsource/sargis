import { NextRequest, NextResponse } from "next/server";
import { buildTpvdSearchUrl, type TpvdSearchFeature } from "@/lib/tpvd/service";

type WfsFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    gid?: number;
    search?: string;
  };
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? "";

  if (query.trim().length < 1) {
    return NextResponse.json({ source: "TPVD ctp:fp_search", count: 0, records: [] });
  }

  try {
    const response = await fetch(buildTpvdSearchUrl(query), { cache: "no-store" });
    if (!response.ok) throw new Error(`WFS request failed: ${response.status}`);

    const payload = (await response.json()) as { features?: WfsFeature[]; totalFeatures?: number };
    const records: TpvdSearchFeature[] = (payload.features ?? []).map((feature) => ({
      gid: Number(feature.properties?.gid ?? 0),
      search: feature.properties?.search ?? "",
      coordinates: feature.geometry?.coordinates ?? [0, 0]
    }));

    return NextResponse.json({
      source: "TPVD ctp:fp_search WFS",
      count: records.length,
      totalFeatures: payload.totalFeatures ?? records.length,
      records
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "TPVD ctp:fp_search WFS",
        count: 0,
        records: [],
        error: error instanceof Error ? error.message : "Unknown TPVD WFS search error"
      },
      { status: 502 }
    );
  }
}
