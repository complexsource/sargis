import { NextResponse } from "next/server";
import { gisLayers, getLayerGeoJson } from "@/lib/mock-data";

type Params = {
  params: {
    layerName: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const layer = gisLayers.find((record) => record.id === params.layerName || record.name === params.layerName);

  if (!layer) {
    return NextResponse.json({ message: "Layer not found" }, { status: 404 });
  }

  // TODO: Replace with live vector-tile or GeoJSON service for each TPVD layer.
  return NextResponse.json(getLayerGeoJson(layer.id));
}
