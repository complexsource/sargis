import { NextResponse } from "next/server";
import { tpsRecords } from "@/lib/mock-data";

export async function GET() {
  // TODO: Replace with live TPVD TPS service when an authenticated/official endpoint is available.
  return NextResponse.json(tpsRecords);
}
