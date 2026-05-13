import { NextRequest, NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/mock-data/search";
import { fetchTpvdFieldOptions, type TpvdFieldOptionsField } from "@/lib/tpvd/live-data";

const fields = new Set<TpvdFieldOptionsField>([
  "plotId",
  "surveyNumber",
  "originalPlotNumber",
  "finalPlotNumber",
  "reservationType"
]);

export async function GET(request: NextRequest) {
  const field = request.nextUrl.searchParams.get("field") as TpvdFieldOptionsField | null;
  if (!field || !fields.has(field)) {
    return NextResponse.json({ message: "Valid field is required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams(request.nextUrl.searchParams);
    params.delete("field");
    const query = params.get("optionQuery") ?? "";
    params.delete("optionQuery");
    const filters = parseSearchParams(params);
    return NextResponse.json(await fetchTpvdFieldOptions(field, filters, query));
  } catch (error) {
    return NextResponse.json(
      {
        source: "TPVD WFS field options",
        field,
        options: [],
        error: error instanceof Error ? error.message : "Unknown TPVD field options error"
      },
      { status: 502 }
    );
  }
}
