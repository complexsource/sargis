import { NextResponse } from "next/server";
import { getReportPayload } from "@/lib/api/server";

type Params = { params: { plotId: string } };

export async function GET(_: Request, { params }: Params) {
  try {
    const report = await getReportPayload(params.plotId);
    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
