import { NextRequest, NextResponse } from "next/server";
import type { Geometry } from "geojson";
import { buildTpvdNearbyFinalPlotUrl, type TpvdFinalPlotProperties } from "@/lib/tpvd/service";

type WfsFeature = {
  id?: string;
  geometry?: Geometry;
  properties?: TpvdFinalPlotProperties;
};

const metersPerDegree = 111_320;

const toPoint = (coordinates: unknown): [number, number] | null => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  return typeof lng === "number" && typeof lat === "number" ? [lng, lat] : null;
};

const pointInRing = (point: [number, number], ring: number[][]) => {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

const pointInPolygon = (point: [number, number], polygon: number[][][]) => {
  if (!polygon.length || !pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(point, hole));
};

const distanceToSegment = (point: [number, number], a: [number, number], b: [number, number]) => {
  const latScale = Math.cos((point[1] * Math.PI) / 180);
  const px = point[0] * metersPerDegree * latScale;
  const py = point[1] * metersPerDegree;
  const ax = a[0] * metersPerDegree * latScale;
  const ay = a[1] * metersPerDegree;
  const bx = b[0] * metersPerDegree * latScale;
  const by = b[1] * metersPerDegree;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const ringDistance = (point: [number, number], ring: number[][]) => {
  let min = Number.POSITIVE_INFINITY;
  for (let index = 1; index < ring.length; index++) {
    const a = toPoint(ring[index - 1]);
    const b = toPoint(ring[index]);
    if (!a || !b) continue;
    min = Math.min(min, distanceToSegment(point, a, b));
  }
  return min;
};

const geometryScore = (geometry: Geometry | undefined, point: [number, number]) => {
  if (!geometry) return Number.POSITIVE_INFINITY;

  if (geometry.type === "Polygon") {
    const polygon = geometry.coordinates as number[][][];
    const contains = pointInPolygon(point, polygon);
    const distance = Math.min(...polygon.map((ring) => ringDistance(point, ring)));
    return contains ? -1000 + distance : distance;
  }

  if (geometry.type === "MultiPolygon") {
    return Math.min(
      ...geometry.coordinates.map((polygon) => {
        const contains = pointInPolygon(point, polygon as number[][][]);
        const distance = Math.min(...(polygon as number[][][]).map((ring) => ringDistance(point, ring)));
        return contains ? -1000 + distance : distance;
      })
    );
  }

  if (geometry.type === "LineString") {
    return ringDistance(point, geometry.coordinates as number[][]);
  }

  if (geometry.type === "MultiLineString") {
    return Math.min(...geometry.coordinates.map((line) => ringDistance(point, line as number[][])));
  }

  if (geometry.type === "Point") {
    const coordinate = toPoint(geometry.coordinates);
    return coordinate ? distanceToSegment(point, coordinate, coordinate) : Number.POSITIVE_INFINITY;
  }

  return Number.POSITIVE_INFINITY;
};

async function fetchNearbyFeatures(lng: number, lat: number, buffer: number) {
  const response = await fetch(buildTpvdNearbyFinalPlotUrl(lng, lat, buffer, 30), { cache: "no-store" });
  if (!response.ok) throw new Error(`WFS nearby request failed: ${response.status}`);
  return (await response.json()) as { features?: WfsFeature[]; totalFeatures?: number };
}

export async function GET(request: NextRequest) {
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const lat = Number(request.nextUrl.searchParams.get("lat"));

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return NextResponse.json({ message: "lng and lat are required" }, { status: 400 });
  }

  try {
    const point: [number, number] = [lng, lat];
    let payload = await fetchNearbyFeatures(lng, lat, 0.00045);
    let features = payload.features ?? [];

    if (!features.length) {
      payload = await fetchNearbyFeatures(lng, lat, 0.0015);
      features = payload.features ?? [];
    }

    const rankedFeatures = features
      .map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          click_distance_m: Math.max(0, geometryScore(feature.geometry, point))
        } as TpvdFinalPlotProperties
      }))
      .sort((a, b) => geometryScore(a.geometry, point) - geometryScore(b.geometry, point));

    return NextResponse.json({
      source: "TPVD ctp:final_plot_boundary WFS nearest-feature lookup",
      count: rankedFeatures.length,
      totalFeatures: payload.totalFeatures ?? features.length,
      features: rankedFeatures
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "TPVD ctp:final_plot_boundary WFS BBOX lookup",
        count: 0,
        features: [],
        error: error instanceof Error ? error.message : "Unknown TPVD nearby feature error"
      },
      { status: 502 }
    );
  }
}
