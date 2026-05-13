import { NextResponse } from "next/server";
import { buildFeasibility, plotRecords } from "@/lib/mock-data";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const plot = plotRecords.find((record) => record.id === params.id || record.plotId === params.id);

  if (!plot) {
    return NextResponse.json({ message: "Plot not found" }, { status: 404 });
  }

  // TODO: Replace with server-side zoning rule engine connected to official planning controls.
  return NextResponse.json(buildFeasibility(plot));
}
