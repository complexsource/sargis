import { create } from "zustand";
import type { SearchFilters } from "@/lib/schemas";

type FilterState = {
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
};

export const defaultFilters: SearchFilters = {
  query: "",
  district: "",
  city: "",
  urbanAuthority: "",
  village: "",
  tpsName: "",
  tpsNumber: "",
  surveyNumber: "",
  originalPlotNumber: "",
  finalPlotNumber: "",
  plotId: "",
  roadName: "",
  landUse: "",
  reservationType: "",
  minRoadWidth: undefined,
  maxRoadWidth: undefined,
  minArea: undefined,
  maxArea: undefined,
  minFsi: undefined,
  maxFsi: undefined,
  boundaryType: undefined,
  restrictionStatus: undefined,
  waterBodyAffected: undefined,
  gamthalAffected: undefined,
  dpReservationAffected: undefined,
  railwayAffected: undefined,
  htLineAffected: undefined
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters
      }
    })),
  resetFilters: () => set({ filters: defaultFilters })
}));
