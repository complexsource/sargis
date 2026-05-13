import { NextRequest, NextResponse } from "next/server";
import { fetchTpvdTpsByDistrict } from "@/lib/tpvd/service";

export async function GET(request: NextRequest) {
  const district = request.nextUrl.searchParams.get("district") || "Ahmedabad";

  try {
    const records = await fetchTpvdTpsByDistrict(district);
    return NextResponse.json({
      source: "TPVD get_autho.php",
      district,
      count: records.length,
      records
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "TPVD get_autho.php",
        district,
        count: 0,
        records: [],
        error: error instanceof Error ? error.message : "Unknown TPVD TPS request error"
      },
      { status: 502 }
    );
  }
}
