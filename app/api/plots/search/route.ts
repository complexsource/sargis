import { NextRequest, NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/mock-data/search";
import { fetchTpvdFinalPlots } from "@/lib/tpvd/live-data";
import type { Plot } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const filters = parseSearchParams(request.nextUrl.searchParams);

  // Only query TPVD when there's at least some filter scope, else return empty
  // (fetching all plots with no filter would be too large and slow)
  const hasAnyFilter = Object.values(filters).some((v) => v !== undefined && v !== null && v !== "");
  if (!hasAnyFilter) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }

  const tpvdPlots = await fetchTpvdFinalPlots(filters, 200);

  const records: Plot[] = tpvdPlots.map((plot) => ({
    id: String(plot.gid),
    plotId: plot.finalPlotNumber || String(plot.gid),
    tpsId: plot.tpsId,
    tpsName: plot.tpsName,
    tpsNumber: plot.tpsNumber,
    district: plot.district,
    city: plot.city,
    urbanAuthority: plot.authority,
    village: plot.village,
    surveyNumber: "",
    originalPlotNumber: "",
    finalPlotNumber: plot.finalPlotNumber,
    areaSqM: plot.areaSqM,
    boundaryType: "Final Plot Boundary",
    roadAccess: "",
    nearbyRoadWidthM: 0,
    roadName: "",
    landUse: plot.reservationUse ?? "",
    zone: "",
    reservationType: plot.reservationType,
    fsi: 0,
    permissibleBuiltUpAreaSqM: 0,
    setbacks: { frontM: 0, sideM: 0, rearM: 0 },
    heightLimitM: 0,
    restrictions: [],
    restrictionStatus: "Clear",
    intersections: {
      waterBody: false,
      gamthal: false,
      dpReservation: plot.reservationType !== null,
      railway: false,
      htLine: false,
      roadBoundary: false
    },
    coordinates: plot.center ?? [0, 0],
    relatedLayers: ["Final Plot Boundary"],
    sourceMetadata: "Live TPVD ctp:final_plot_boundary WFS",
    lastUpdated: new Date().toISOString().split("T")[0]
  }));

  return NextResponse.json(records, {
    headers: { "Cache-Control": "no-store" }
  });
}
