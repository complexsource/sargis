import { NextRequest, NextResponse } from "next/server";
import { isPng, transparentPngResponse } from "@/lib/tpvd/image-response";
import { TPVD_SERVER_ORIGIN } from "@/lib/tpvd/service";

export async function GET(request: NextRequest) {
  const layer = request.nextUrl.searchParams.get("layer");
  const bbox = request.nextUrl.searchParams.get("bbox");

  if (!layer || !bbox) {
    return NextResponse.json({ message: "layer and bbox are required" }, { status: 400 });
  }

  const url = new URL(`${TPVD_SERVER_ORIGIN}/geoserver/wms`);
  url.searchParams.set("SERVICE", "WMS");
  url.searchParams.set("VERSION", "1.1.1");
  url.searchParams.set("REQUEST", "GetMap");
  url.searchParams.set("FORMAT", "image/png");
  url.searchParams.set("TRANSPARENT", "true");
  url.searchParams.set("LAYERS", layer);
  url.searchParams.set("STYLES", "");
  url.searchParams.set("SRS", "EPSG:3857");
  url.searchParams.set("WIDTH", "256");
  url.searchParams.set("HEIGHT", "256");
  url.searchParams.set("BBOX", bbox);

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
