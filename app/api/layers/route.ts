import { NextResponse } from "next/server";
import { gisLayers } from "@/lib/mock-data";

export async function GET() {
  // TODO: Replace with TPVD layer catalog endpoint.
  return NextResponse.json(gisLayers);
}
