import type { FeatureCollection, Geometry } from "geojson";
import {
  FeasibilitySchema,
  GisLayerListSchema,
  LegendSchema,
  PlotListSchema,
  PlotSchema,
  ReportSchema,
  TpsListSchema,
  TpsSchema,
  type Feasibility,
  type GisLayer,
  type LegendItem,
  type Plot,
  type ReportPayload,
  type SearchFilters,
  type Tps
} from "@/lib/schemas";
import type { TpvdCatalog, TpvdFieldOptionsField, TpvdFilterBounds } from "@/lib/tpvd/live-data";
import type { TpvdFinalPlotProperties, TpvdSearchFeature, TpvdTpsRecord } from "@/lib/tpvd/service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function toQueryString(params?: SearchFilters) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, schema: { parse: (value: unknown) => T }) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return schema.parse(json);
}

export const api = {
  getTps: (): Promise<Tps[]> => request("/api/tps", TpsListSchema),
  searchTps: (filters: SearchFilters): Promise<Tps[]> =>
    request(`/api/tps/search${toQueryString(filters)}`, TpsListSchema),
  getTpsById: (id: string): Promise<Tps> => request(`/api/tps/${id}`, TpsSchema),
  searchPlots: (filters: SearchFilters): Promise<Plot[]> =>
    request(`/api/plots/search${toQueryString(filters)}`, PlotListSchema),
  getPlotById: (id: string): Promise<Plot> => request(`/api/plots/${id}`, PlotSchema),
  getFeasibility: (plotId: string): Promise<Feasibility> =>
    request(`/api/plots/${plotId}/feasibility`, FeasibilitySchema),
  getLayers: (): Promise<GisLayer[]> => request("/api/layers", GisLayerListSchema),
  getLayerGeoJson: async (layerName: string): Promise<FeatureCollection> => {
    const response = await fetch(`${API_BASE_URL}/api/layers/${layerName}/geojson`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Layer request failed: ${response.status}`);
    return (await response.json()) as FeatureCollection;
  },
  getLegend: (): Promise<LegendItem[]> => request("/api/legend", LegendSchema),
  getReport: (plotId: string): Promise<ReportPayload> => request(`/api/report/${plotId}`, ReportSchema),
  searchTpvdFinalPlots: async (query: string): Promise<TpvdSearchFeature[]> => {
    const response = await fetch(`${API_BASE_URL}/api/tpvd/fp-search${toQueryString({ query } as SearchFilters)}`, {
      cache: "no-store"
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { records?: TpvdSearchFeature[] };
    return payload.records ?? [];
  },
  getTpvdTpsByDistrict: async (district: string): Promise<TpvdTpsRecord[]> => {
    const response = await fetch(`${API_BASE_URL}/api/tpvd/tps?district=${encodeURIComponent(district)}`, {
      cache: "no-store"
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { records?: TpvdTpsRecord[] };
    return payload.records ?? [];
  },
  getTpvdNearbyFeature: async (
    lng: number,
    lat: number
  ): Promise<{ properties?: TpvdFinalPlotProperties; geometry?: Geometry; id?: string } | null> => {
    const response = await fetch(`${API_BASE_URL}/api/tpvd/feature-nearby?lng=${lng}&lat=${lat}`, {
      cache: "no-store"
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      features?: Array<{ properties?: TpvdFinalPlotProperties; geometry?: Geometry; id?: string }>;
    };
    return payload.features?.[0] ?? null;
  },
  getTpvdCatalog: async (): Promise<TpvdCatalog> => {
    const response = await fetch(`${API_BASE_URL}/api/tpvd/catalog`, { cache: "no-store" });
    if (!response.ok) throw new Error(`TPVD catalog request failed: ${response.status}`);
    return (await response.json()) as TpvdCatalog;
  },
  getTpvdFilterBounds: async (filters: SearchFilters): Promise<TpvdFilterBounds> => {
    const response = await fetch(`${API_BASE_URL}/api/tpvd/filter-bounds${toQueryString(filters)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`TPVD filter bounds request failed: ${response.status}`);
    return (await response.json()) as TpvdFilterBounds;
  },
  getTpvdFieldOptions: async (
    field: TpvdFieldOptionsField,
    filters: SearchFilters,
    optionQuery = ""
  ): Promise<{ options: string[]; truncated?: boolean; totalFeatures?: number | string }> => {
    const search = new URLSearchParams();
    search.set("field", field);
    if (optionQuery) search.set("optionQuery", optionQuery);
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      search.set(key, String(value));
    });
    const response = await fetch(`${API_BASE_URL}/api/tpvd/field-options?${search}`, { cache: "no-store" });
    if (!response.ok) return { options: [] };
    return (await response.json()) as { options: string[]; truncated?: boolean; totalFeatures?: number | string };
  }
};
