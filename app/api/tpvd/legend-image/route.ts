import { NextRequest, NextResponse } from "next/server";
import { isPng, transparentPngResponse } from "@/lib/tpvd/image-response";
import { TPVD_SERVER_ORIGIN } from "@/lib/tpvd/service";

export async function GET(request: NextRequest) {
  const layer = request.nextUrl.searchParams.get("layer");

  if (!layer) {
    return NextResponse.json({ message: "layer is required" }, { status: 400 });
  }

  const url = new URL(`${TPVD_SERVER_ORIGIN}/geoserver/wms`);
  url.searchParams.set("REQUEST", "GetLegendGraphic");
  url.searchParams.set("VERSION", "1.0.0");
  url.searchParams.set("FORMAT", "image/png");
  url.searchParams.set("WIDTH", "20");
  url.searchParams.set("HEIGHT", "20");
  url.searchParams.set("LAYER", layer);
  url.searchParams.set("LEGEND_OPTIONS", "forceRule:True;forceLabels:on;");

  const response = await fetch(url, {
    next: {
      revalidate: 3600
    }
  }).catch(() => null);

  if (!response?.ok) {
    return transparentPngResponse();
  }

  const body = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("image") || !isPng(body)) {
    return transparentPngResponse();
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
