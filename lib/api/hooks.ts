"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { SearchFilters } from "@/lib/schemas";
import type { TpvdFieldOptionsField } from "@/lib/tpvd/live-data";

export const queryKeys = {
  tps: ["tps"] as const,
  tpsSearch: (filters: SearchFilters) => ["tps-search", filters] as const,
  plotsSearch: (filters: SearchFilters) => ["plots-search", filters] as const,
  plot: (id?: string | null) => ["plot", id] as const,
  feasibility: (id?: string | null) => ["feasibility", id] as const,
  layers: ["layers"] as const,
  layerGeoJson: (id: string) => ["layer-geojson", id] as const,
  legend: ["legend"] as const,
  tpvdCatalog: ["tpvd-catalog"] as const,
  tpvdFilterBounds: (filters: SearchFilters) => ["tpvd-filter-bounds", filters] as const,
  tpvdFieldOptions: (field: TpvdFieldOptionsField, filters: SearchFilters, query: string) =>
    ["tpvd-field-options", field, filters, query] as const
};

export function useTpsSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: queryKeys.tpsSearch(filters),
    queryFn: () => api.searchTps(filters)
  });
}

export function usePlotSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: queryKeys.plotsSearch(filters),
    queryFn: () => api.searchPlots(filters)
  });
}

export function usePlot(plotId?: string | null) {
  return useQuery({
    queryKey: queryKeys.plot(plotId),
    queryFn: () => api.getPlotById(plotId as string),
    enabled: Boolean(plotId)
  });
}

export function useTps(tpsId?: string | null) {
  return useQuery({
    queryKey: ["tps", tpsId],
    queryFn: () => api.getTpsById(tpsId as string),
    enabled: Boolean(tpsId)
  });
}

export function useFeasibility(plotId?: string | null) {
  return useQuery({
    queryKey: queryKeys.feasibility(plotId),
    queryFn: () => api.getFeasibility(plotId as string),
    enabled: Boolean(plotId)
  });
}

export function useLayers() {
  return useQuery({
    queryKey: queryKeys.layers,
    queryFn: api.getLayers
  });
}

export function useLayerGeoJson(layerId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.layerGeoJson(layerId),
    queryFn: () => api.getLayerGeoJson(layerId),
    enabled
  });
}

export function useLegend() {
  return useQuery({
    queryKey: queryKeys.legend,
    queryFn: api.getLegend
  });
}

export function useTpvdCatalog() {
  return useQuery({
    queryKey: queryKeys.tpvdCatalog,
    queryFn: api.getTpvdCatalog,
    staleTime: 60 * 60 * 1000
  });
}

export function useTpvdFilterBounds(filters: SearchFilters, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tpvdFilterBounds(filters),
    queryFn: () => api.getTpvdFilterBounds(filters),
    enabled
  });
}

export function useTpvdFieldOptions(
  field: TpvdFieldOptionsField,
  filters: SearchFilters,
  query = "",
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.tpvdFieldOptions(field, filters, query),
    queryFn: () => api.getTpvdFieldOptions(field, filters, query),
    enabled,
    staleTime: 60_000
  });
}
