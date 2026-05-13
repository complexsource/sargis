import { NextResponse } from "next/server";
import { getReportPayload } from "@/lib/api/server";

type Params = {
  params: {
    plotId: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const report = getReportPayload(params.plotId);

  if (!report) {
    return NextResponse.json({ message: "Report plot not found" }, { status: 404 });
  }

  // TODO: Attach generated PDF URL once a server-side renderer is connected.
  return NextResponse.json(report);
}
