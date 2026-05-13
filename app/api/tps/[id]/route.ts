import { NextResponse } from "next/server";
import { tpsRecords } from "@/lib/mock-data";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const tps = tpsRecords.find((record) => record.id === params.id || record.number === params.id);

  if (!tps) {
    return NextResponse.json({ message: "TPS not found" }, { status: 404 });
  }

  return NextResponse.json(tps);
}
