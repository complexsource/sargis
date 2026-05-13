import { NextResponse } from "next/server";
import { plotRecords } from "@/lib/mock-data";
import { fetchTpvdFinalPlots } from "@/lib/tpvd/live-data";
import type { Plot } from "@/lib/schemas";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const { id } = params;

  // Try mock records first (legacy mock ids like "plot-ahm-42-fp-118")
  const mock = plotRecords.find((record) => record.id === id || record.plotId === id);
  if (mock) return NextResponse.json(mock);

  // For numeric GIDs from real TPVD data
  const gid = Number(id);
  if (!Number.isFinite(gid) || gid <= 0) {
    return NextResponse.json({ message: "Plot not found" }, { status: 404 });
  }

  const results = await fetchTpvdFinalPlots({ plotId: id }, 1);
  const plot = results.find((r) => r.gid === gid) ?? results[0];
  if (!plot) {
    return NextResponse.json({ message: "Plot not found" }, { status: 404 });
  }

  const record: Plot = {
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
  };

  return NextResponse.json(record);
}
