import { NextResponse } from "next/server";
import { legendItems } from "@/lib/mock-data";

export async function GET() {
  // TODO: Replace with TPVD symbol/legend catalog when available.
  return NextResponse.json(legendItems);
}
