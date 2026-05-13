import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { parseSearchParams } from "@/lib/mock-data/search";
import { QB, buildPlotWhere } from "@/lib/db/query-builder";
import type { TpvdFieldOptionsField } from "@/lib/tpvd/live-data";

const fields = new Set<TpvdFieldOptionsField>(["plotId", "surveyNumber", "originalPlotNumber", "finalPlotNumber", "reservationType"]);

const uniqueSorted = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.map((v) => (v ?? "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

export async function GET(request: NextRequest) {
  const field = request.nextUrl.searchParams.get("field") as TpvdFieldOptionsField | null;
  if (!field || !fields.has(field)) {
    return NextResponse.json({ message: "Valid field is required" }, { status: 400 });
  }

  const params = new URLSearchParams(request.nextUrl.searchParams);
  params.delete("field");
  const optionQuery = params.get("optionQuery") ?? "";
  params.delete("optionQuery");
  const filters = parseSearchParams(params);

  try {
    const qb = new QB();
    buildPlotWhere(qb, filters, "fp");

    if (field === "finalPlotNumber") {
      if (optionQuery) qb.ilike("fp.fp_no", optionQuery);
      const { rows } = await db.query<{ fp_no: string }>(
        `SELECT DISTINCT fp.fp_no FROM final_plots fp ${qb.where()} ORDER BY fp.fp_no LIMIT 200`,
        qb.params
      );
      return NextResponse.json({ source: "Local PostGIS", field, options: uniqueSorted(rows.map((r) => r.fp_no)) });
    }

    if (field === "plotId") {
      if (optionQuery) qb.ilike("fp.fp_no", optionQuery);
      const { rows } = await db.query<{ gid: number; fp_no: string }>(
        `SELECT fp.gid, fp.fp_no FROM final_plots fp ${qb.where()} ORDER BY fp.gid LIMIT 200`,
        qb.params
      );
      const options = uniqueSorted(rows.flatMap((r) => [String(r.gid), r.fp_no]));
      return NextResponse.json({ source: "Local PostGIS", field, options });
    }

    if (field === "reservationType") {
      if (optionQuery) qb.push("(fp.reser_type ILIKE ? OR fp.reser_use ILIKE ?)", `%${optionQuery}%`, `%${optionQuery}%`);
      const { rows } = await db.query<{ reser_type: string | null; reser_use: string | null }>(
        `SELECT DISTINCT fp.reser_type, fp.reser_use FROM final_plots fp ${qb.where()} LIMIT 500`,
        qb.params
      );
      const options = uniqueSorted(rows.flatMap((r) => [r.reser_type, r.reser_use]));
      return NextResponse.json({ source: "Local PostGIS", field, options });
    }

    // surveyNumber and originalPlotNumber not in DB — return empty
    return NextResponse.json({ source: "Local PostGIS", field, options: [] });
  } catch (error) {
    return NextResponse.json(
      { source: "DB field-options", field, options: [], error: error instanceof Error ? error.message : "DB error" },
      { status: 502 }
    );
  }
}
