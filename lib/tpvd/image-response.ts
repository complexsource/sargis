import { NextResponse } from "next/server";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

export function isPng(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

export function transparentPngResponse(status = 200) {
  return new NextResponse(transparentPng, {
    status,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
    }
  });
}
