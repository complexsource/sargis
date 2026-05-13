import type { Geometry } from "geojson";
import type { SearchFilters } from "@/lib/schemas";
import { TPVD_PUBLIC_MAP_URL, TPVD_WFS_URL } from "@/lib/tpvd/service";

export type TpvdTpsBoundaryRecord = {
  gid: number;
  tpsId: number;
  tpsName: string;
  title: string;
  tpsNumber: string;
  village: string;
  city: string;
  authority: string;
  district: string;
  status: string;
  bounds: [number, number, number, number];
  center: [number, number];
};

export type TpvdDistrictPoint = {
  name: string;
  coordinates3857: [number, number];
  coordinates: [number, number];
};

export type TpvdCatalog = {
  source: string;
  updatedAt: string;
  records: TpvdTpsBoundaryRecord[];
  districtPoints: TpvdDistrictPoint[];
  options: {
    districts: string[];
    publicDistricts: string[];
    administrativeDistricts: string[];
    cities: string[];
    authorities: string[];
    villages: string[];
    tpsNumbers: string[];
    tpsNames: string[];
    statuses: string[];
  };
};

export type TpvdFilterBounds = {
  source: string;
  layerName: string;
  count: number;
  totalFeatures?: number | string;
  bounds: [number, number, number, number] | null;
  center: [number, number] | null;
  points: Array<[number, number]>;
};

export type TpvdFieldOptionsField = "plotId" | "surveyNumber" | "originalPlotNumber" | "finalPlotNumber" | "reservationType";

type GeoJsonFeature = {
  geometry?: Geometry | null;
  properties?: Record<string, unknown>;
};

const uniqueSorted = (values: Array<string | number | null | undefined>) =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

const webMercatorToLngLat = ([x, y]: [number, number]): [number, number] => {
  const lng = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360) / Math.PI - 90;
  return [lng, lat];
};

const cqlString = (value: string | number) => String(value).replace(/'/g, "''");

const textMatch = (value: string | null | undefined, query: string | null | undefined) => {
  if (!query) return true;
  return String(value ?? "").toLowerCase().includes(query.toLowerCase());
};

function collectCoordinates(coordinates: unknown, output: Array<[number, number]>) {
  if (!Array.isArray(coordinates)) return;
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    output.push([coordinates[0], coordinates[1]]);
    return;
  }
  coordinates.forEach((child) => collectCoordinates(child, output));
}

function collectGeometryCoordinates(geometry: Geometry | null | undefined, output: Array<[number, number]>) {
  if (!geometry) return;
  if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((child) => collectGeometryCoordinates(child, output));
    return;
  }
  collectCoordinates(geometry.coordinates, output);
}

export function geometryBounds(geometry: Geometry | null | undefined): [number, number, number, number] | null {
  const coordinates: Array<[number, number]> = [];
  collectGeometryCoordinates(geometry, coordinates);
  if (!coordinates.length) return null;

  return coordinates.reduce(
    (bounds, [lng, lat]) => [
      Math.min(bounds[0], lng),
      Math.min(bounds[1], lat),
      Math.max(bounds[2], lng),
      Math.max(bounds[3], lat)
    ],
    [coordinates[0][0], coordinates[0][1], coordinates[0][0], coordinates[0][1]] as [number, number, number, number]
  );
}

export function mergeBounds(boundsList: Array<[number, number, number, number]>) {
  if (!boundsList.length) return null;
  return boundsList.reduce(
    (merged, bounds) => [
      Math.min(merged[0], bounds[0]),
      Math.min(merged[1], bounds[1]),
      Math.max(merged[2], bounds[2]),
      Math.max(merged[3], bounds[3])
    ],
    boundsList[0]
  );
}

export const boundsCenter = (bounds: [number, number, number, number]): [number, number] => [
  (bounds[0] + bounds[2]) / 2,
  (bounds[1] + bounds[3]) / 2
];

function wfsUrl(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature"
  });
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });
  return `${TPVD_WFS_URL}?${search}`;
}

export function matchesTpvdRecord(record: TpvdTpsBoundaryRecord, filters: SearchFilters) {
  const districtMatch = !filters.district
    ? true
    : [record.district, record.city, record.village, record.title, record.tpsName].some((value) =>
        textMatch(value, filters.district)
      );
  const queryMatch = !filters.query
    ? true
    : [record.district, record.city, record.authority, record.village, record.title, record.tpsName, record.tpsNumber].some(
        (value) => textMatch(value, filters.query)
      );

  return (
    queryMatch &&
    districtMatch &&
    textMatch(record.city, filters.city) &&
    textMatch(record.authority, filters.urbanAuthority) &&
    textMatch(record.village, filters.village) &&
    textMatch(record.tpsNumber, filters.tpsNumber) &&
    [record.title, record.tpsName].some((value) => textMatch(value, filters.tpsName))
  );
}

export function filterTpvdRecords(records: TpvdTpsBoundaryRecord[], filters: SearchFilters) {
  return records.filter((record) => matchesTpvdRecord(record, filters));
}

export async function fetchTpvdDistrictPoints(): Promise<TpvdDistrictPoint[]> {
  const response = await fetch(`${TPVD_PUBLIC_MAP_URL}/gujarat_district.geojson`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`TPVD district GeoJSON failed: ${response.status}`);

  const payload = (await response.json()) as { features?: GeoJsonFeature[] };
  return (payload.features ?? [])
    .map((feature) => {
      const raw = feature.geometry?.type === "Point" ? feature.geometry.coordinates : null;
      const name = String(feature.properties?.name_dist ?? "").trim();
      if (!name || !Array.isArray(raw) || typeof raw[0] !== "number" || typeof raw[1] !== "number") return null;
      const coordinates3857: [number, number] = [raw[0], raw[1]];
      return {
        name,
        coordinates3857,
        coordinates: webMercatorToLngLat(coordinates3857)
      };
    })
    .filter(Boolean) as TpvdDistrictPoint[];
}

export async function fetchTpvdTpsBoundaryRecords(): Promise<TpvdTpsBoundaryRecord[]> {
  const response = await fetch(
    wfsUrl({
      typeName: "ctp:tps_boundary",
      outputFormat: "application/json",
      srsname: "EPSG:4326",
      count: 1_000_000
    }),
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(`TPVD TPS boundary WFS failed: ${response.status}`);

  const payload = (await response.json()) as { features?: GeoJsonFeature[] };
  return (payload.features ?? [])
    .map((feature) => {
      const properties = feature.properties ?? {};
      const bounds = geometryBounds(feature.geometry);
      const tpsId = Number(properties.tps_id);
      if (!bounds || !Number.isFinite(tpsId)) return null;
      return {
        gid: Number(properties.gid),
        tpsId,
        tpsName: String(properties.tps_name ?? ""),
        title: String(properties.tp_name ?? properties.tps_name ?? ""),
        tpsNumber: String(properties.tps_no ?? ""),
        village: String(properties.village ?? ""),
        city: String(properties.city ?? ""),
        authority: String(properties.authority ?? ""),
        district: String(properties.district ?? ""),
        status: String(properties.status ?? ""),
        bounds,
        center: boundsCenter(bounds)
      };
    })
    .filter(Boolean) as TpvdTpsBoundaryRecord[];
}

export async function fetchTpvdCatalog(): Promise<TpvdCatalog> {
  const [recordsResult, districtPointsResult] = await Promise.allSettled([
    fetchTpvdTpsBoundaryRecords(),
    fetchTpvdDistrictPoints()
  ]);

  const records = recordsResult.status === "fulfilled" ? recordsResult.value : [];
  const districtPoints = districtPointsResult.status === "fulfilled" ? districtPointsResult.value : [];
  const publicDistricts = uniqueSorted(districtPoints.map((point) => point.name));
  const administrativeDistricts = uniqueSorted(records.map((record) => record.district));
  const cities = uniqueSorted(records.map((record) => record.city));

  return {
    source: "TPVD ctp:tps_boundary WFS + public gujarat_district.geojson",
    updatedAt: new Date().toISOString(),
    records,
    districtPoints,
    options: {
      districts: uniqueSorted([...publicDistricts, ...administrativeDistricts, ...cities]),
      publicDistricts,
      administrativeDistricts,
      cities,
      authorities: uniqueSorted(records.map((record) => record.authority)),
      villages: uniqueSorted(records.map((record) => record.village)),
      tpsNumbers: uniqueSorted(records.map((record) => record.tpsNumber)),
      tpsNames: uniqueSorted(records.map((record) => record.title || record.tpsName)),
      statuses: uniqueSorted(records.map((record) => record.status))
    }
  };
}

function cqlLike(field: string, value: string | number) {
  return `${field} ILIKE '%${cqlString(value)}%'`;
}

function plotIdClause(value: string | number) {
  const cleanValue = String(value).trim();
  const numericId = Number(cleanValue);
  const searchClause = cqlLike("search", cleanValue);
  if (Number.isInteger(numericId) && String(numericId) === cleanValue) {
    return `(gid=${numericId} OR ${searchClause})`;
  }
  return searchClause;
}

function buildCqlForLayer(layerName: string, filters: SearchFilters, targetField?: TpvdFieldOptionsField) {
  const clauses: string[] = [];
  if (filters.district) {
    const value = cqlString(filters.district);
    clauses.push(`(district='${value}' OR city='${value}' OR village='${value}' OR tps_name ILIKE '%${value}%')`);
  }
  if (filters.city) clauses.push(`city='${cqlString(filters.city)}'`);
  if (filters.urbanAuthority) clauses.push(`authority='${cqlString(filters.urbanAuthority)}'`);
  if (filters.village) clauses.push(`village='${cqlString(filters.village)}'`);
  if (filters.tpsNumber) clauses.push(`tps_no='${cqlString(filters.tpsNumber)}'`);
  if (filters.tpsName) {
    if (layerName === "ctp:tps_boundary") {
      clauses.push(`(${cqlLike("tps_name", filters.tpsName)} OR ${cqlLike("tp_name", filters.tpsName)})`);
    } else {
      clauses.push(cqlLike("tps_name", filters.tpsName));
    }
  }
  if (layerName === "ctp:final_plot_boundary" && filters.plotId && targetField !== "plotId") {
    clauses.push(plotIdClause(filters.plotId));
  }
  if (layerName === "ctp:final_plot_boundary" && filters.finalPlotNumber && targetField !== "finalPlotNumber") {
    clauses.push(`fp_no='${cqlString(filters.finalPlotNumber)}'`);
  }
  if (layerName === "ctp:original_plot_boundary" && filters.originalPlotNumber && targetField !== "originalPlotNumber") {
    clauses.push(`op_no='${cqlString(filters.originalPlotNumber)}'`);
  }
  if (layerName === "ctp:survey_no" && filters.surveyNumber && targetField !== "surveyNumber") {
    clauses.push(`survey_no='${cqlString(filters.surveyNumber)}'`);
  }
  if (layerName === "ctp:final_plot_boundary" && filters.reservationType && targetField !== "reservationType") {
    const value = cqlString(filters.reservationType);
    clauses.push(`(reser_type ILIKE '%${value}%' OR reser_use ILIKE '%${value}%')`);
  }
  // Area range — fp_area_final is a numeric property on ctp:final_plot_boundary
  if (layerName === "ctp:final_plot_boundary") {
    if (filters.minArea !== undefined && filters.minArea > 0) {
      clauses.push(`fp_area_final >= ${filters.minArea}`);
    }
    if (filters.maxArea !== undefined && filters.maxArea > 0) {
      clauses.push(`fp_area_final <= ${filters.maxArea}`);
    }
  }
  return clauses.join(" AND ");
}

export function getBoundsLayerForFilters(filters: SearchFilters) {
  if (
    filters.plotId ||
    filters.finalPlotNumber ||
    filters.reservationType ||
    (filters.minArea !== undefined && filters.minArea > 0) ||
    (filters.maxArea !== undefined && filters.maxArea > 0)
  ) return "ctp:final_plot_boundary";
  if (filters.originalPlotNumber) return "ctp:original_plot_boundary";
  if (filters.surveyNumber) return "ctp:survey_no";
  return "ctp:tps_boundary";
}

export async function fetchTpvdFilterBounds(filters: SearchFilters): Promise<TpvdFilterBounds> {
  const layerName = getBoundsLayerForFilters(filters);
  const cql = buildCqlForLayer(layerName, filters);
  const response = await fetch(
    wfsUrl({
      typeName: layerName,
      outputFormat: "application/json",
      srsname: "EPSG:4326",
      count: 5000,
      CQL_FILTER: cql || undefined
    }),
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(`TPVD filter bounds WFS failed: ${response.status}`);

  const payload = (await response.json()) as { features?: GeoJsonFeature[]; totalFeatures?: number | string };
  const boundsList = (payload.features ?? []).map((feature) => geometryBounds(feature.geometry)).filter(Boolean) as Array<
    [number, number, number, number]
  >;
  const bounds = mergeBounds(boundsList);

  return {
    source: "TPVD WFS filtered feature bounds",
    layerName,
    count: boundsList.length,
    totalFeatures: payload.totalFeatures,
    bounds,
    center: bounds ? boundsCenter(bounds) : null,
    points: boundsList.slice(0, 300).map(boundsCenter)
  };
}

export type TpvdFinalPlotRecord = {
  gid: number;
  tpsId: string;
  tpsName: string;
  tpsNumber: string;
  village: string;
  city: string;
  district: string;
  authority: string;
  finalPlotNumber: string;
  reservationType: string | null;
  reservationUse: string | null;
  areaSqM: number;
  center: [number, number] | null;
  bounds: [number, number, number, number] | null;
};

export async function fetchTpvdFinalPlots(filters: SearchFilters, limit = 200): Promise<TpvdFinalPlotRecord[]> {
  const cql = buildCqlForLayer("ctp:final_plot_boundary", filters);
  const response = await fetch(
    wfsUrl({
      typeName: "ctp:final_plot_boundary",
      outputFormat: "application/json",
      srsname: "EPSG:4326",
      count: limit,
      CQL_FILTER: cql || undefined
    }),
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(`TPVD final_plot_boundary WFS failed: ${response.status}`);

  const payload = (await response.json()) as { features?: GeoJsonFeature[] };
  return (payload.features ?? [])
    .map((feature) => {
      const p = feature.properties ?? {};
      const bounds = geometryBounds(feature.geometry);
      return {
        gid: Number(p.gid ?? 0),
        tpsId: String(p.tps_id ?? ""),
        tpsName: String(p.title_tps_name ?? p.tps_name ?? ""),
        tpsNumber: String(p.tps_no ?? ""),
        village: String(p.village ?? ""),
        city: String(p.city ?? ""),
        district: String(p.district ?? ""),
        authority: String(p.authority ?? ""),
        finalPlotNumber: String(p.fp_no ?? ""),
        reservationType: p.reser_type ? String(p.reser_type) : null,
        reservationUse: p.reser_use ? String(p.reser_use) : null,
        areaSqM: Number(p.fp_area_final ?? p.fp_area ?? 0),
        center: bounds ? boundsCenter(bounds) : null,
        bounds
      };
    })
    .filter((r) => r.gid > 0);
}

const fieldConfig: Record<TpvdFieldOptionsField, { layerName: string; properties: string[] }> = {
  plotId: { layerName: "ctp:final_plot_boundary", properties: ["gid", "search"] },
  surveyNumber: { layerName: "ctp:survey_no", properties: ["survey_no"] },
  originalPlotNumber: { layerName: "ctp:original_plot_boundary", properties: ["op_no"] },
  finalPlotNumber: { layerName: "ctp:final_plot_boundary", properties: ["fp_no"] },
  reservationType: { layerName: "ctp:final_plot_boundary", properties: ["reser_type", "reser_use"] }
};

export async function fetchTpvdFieldOptions(field: TpvdFieldOptionsField, filters: SearchFilters, query = "") {
  const config = fieldConfig[field];
  const clauses = [buildCqlForLayer(config.layerName, filters, field)].filter(Boolean);
  if (query) {
    clauses.push(`(${config.properties.map((property) => cqlLike(property, query)).join(" OR ")})`);
  }
  const response = await fetch(
    wfsUrl({
      typeName: config.layerName,
      outputFormat: "application/json",
      propertyName: config.properties.join(","),
      count: 5000,
      CQL_FILTER: clauses.join(" AND ") || undefined
    }),
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error(`TPVD field options WFS failed: ${response.status}`);

  const payload = (await response.json()) as { features?: GeoJsonFeature[]; totalFeatures?: number | string };
  const options = uniqueSorted(
    (payload.features ?? []).flatMap((feature) => config.properties.map((property) => feature.properties?.[property] as string | undefined))
  );

  return {
    source: `${config.layerName} WFS ${config.properties.join("/")}`,
    field,
    totalFeatures: payload.totalFeatures,
    truncated: Number(payload.totalFeatures ?? 0) > (payload.features?.length ?? 0),
    options
  };
}
