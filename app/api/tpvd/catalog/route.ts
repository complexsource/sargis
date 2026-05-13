import { NextResponse } from "next/server";
import { fetchTpvdCatalog } from "@/lib/tpvd/live-data";

export async function GET() {
  try {
    return NextResponse.json(await fetchTpvdCatalog(), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "TPVD live catalog",
        records: [],
        districtPoints: [],
        options: {
          districts: [],
          publicDistricts: [],
          administrativeDistricts: [],
          cities: [],
          authorities: [],
          villages: [],
          tpsNumbers: [],
          tpsNames: [],
          statuses: []
        },
        error: error instanceof Error ? error.message : "Unknown TPVD catalog error"
      },
      { status: 502 }
    );
  }
}
