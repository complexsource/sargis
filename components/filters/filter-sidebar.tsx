"use client";

import { Building2, Filter, RotateCcw, X } from "lucide-react";
import type { SearchFilters } from "@/lib/schemas";
import { useTpvdCatalog, useTpvdFieldOptions } from "@/lib/api/hooks";
import { useFilterStore } from "@/store/filter-store";
import { AdvancedFilterDialog } from "@/components/filters/advanced-filter-dialog";
import { FilterCombobox } from "@/components/filters/filter-combobox";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { LiveTpvdPanel } from "@/components/tps/live-tpvd-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const unique = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

const str = (value: string) => (value ? value : undefined);
const num = (value: string) => (value ? Number(value) : undefined);
const textIncludes = (value: string | null | undefined, query: string | null | undefined) =>
  !query || String(value ?? "").toLowerCase().includes(query.toLowerCase());

const filterLabels: Partial<Record<keyof SearchFilters, string>> = {
  query: "Search",
  district: "Location",
  city: "City",
  urbanAuthority: "Authority",
  village: "Village",
  tpsName: "TPS name",
  tpsNumber: "TPS no",
  surveyNumber: "Survey",
  originalPlotNumber: "OP no",
  finalPlotNumber: "FP no",
  plotId: "Plot ID",
  landUse: "Zone",
  reservationType: "Reservation",
  minRoadWidth: "Road ≥",
  maxRoadWidth: "Road ≤",
  minArea: "Area ≥",
  maxArea: "Area ≤"
};

export function FilterSidebar() {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const catalogQuery = useTpvdCatalog();
  const catalog = catalogQuery.data;

  const scopedRecords = (catalog?.records ?? []).filter((record) => {
    const districtMatch = !filters.district
      ? true
      : [record.district, record.city, record.village, record.title, record.tpsName].some((v) =>
          textIncludes(v, filters.district)
        );
    return (
      districtMatch &&
      textIncludes(record.city, filters.city) &&
      textIncludes(record.authority, filters.urbanAuthority) &&
      textIncludes(record.village, filters.village) &&
      textIncludes(record.tpsNumber, filters.tpsNumber) &&
      [record.title, record.tpsName].some((v) => textIncludes(v, filters.tpsName))
    );
  });

  const districts = catalog?.options.districts ?? [];
  const cities = unique(scopedRecords.map((r) => r.city));
  const villages = unique(scopedRecords.map((r) => r.village));
  const tpsNumbers = unique(scopedRecords.map((r) => r.tpsNumber));
  const tpsNames = unique(scopedRecords.map((r) => r.title || r.tpsName));
  const authorities = unique(scopedRecords.map((r) => r.authority));

  const activeFilters = Object.entries(filters).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  const clearFilter = (key: keyof SearchFilters) =>
    setFilter(key, undefined as SearchFilters[typeof key]);

  const liveScope: SearchFilters = {
    district: filters.district,
    city: filters.city,
    urbanAuthority: filters.urbanAuthority,
    village: filters.village,
    tpsNumber: filters.tpsNumber,
    tpsName: filters.tpsName
  };
  const hasScope = Object.values(liveScope).some((v) => v !== undefined && v !== "");

  const fpOpts = useTpvdFieldOptions(
    "finalPlotNumber", liveScope, filters.finalPlotNumber ?? "",
    Boolean(catalog) && (hasScope || Boolean(filters.finalPlotNumber))
  );
  const opOpts = useTpvdFieldOptions(
    "originalPlotNumber", liveScope, filters.originalPlotNumber ?? "",
    Boolean(catalog) && (hasScope || Boolean(filters.originalPlotNumber))
  );
  const surveyOpts = useTpvdFieldOptions(
    "surveyNumber", liveScope, filters.surveyNumber ?? "",
    Boolean(catalog) && (hasScope || Boolean(filters.surveyNumber))
  );
  const plotIdOpts = useTpvdFieldOptions(
    "plotId", liveScope, filters.plotId ?? "",
    Boolean(catalog) && (hasScope || Boolean(filters.plotId))
  );
  const resOpts = useTpvdFieldOptions(
    "reservationType", liveScope, filters.reservationType ?? "",
    Boolean(catalog) && hasScope
  );
  const reservationSuggestions = resOpts.data?.options ?? [];

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-none border-r border-slate-200 bg-white/96 shadow-panel backdrop-blur">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Filter className="h-4 w-4 text-primary" />
              GIS Search
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Search or filter — map zooms automatically.
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={resetFilters} aria-label="Reset filters">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <SearchAutocomplete />

        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeFilters.slice(0, 7).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => clearFilter(key as keyof SearchFilters)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                aria-label={`Clear ${filterLabels[key as keyof SearchFilters] ?? key} filter`}
              >
                <span className="text-slate-400">{filterLabels[key as keyof SearchFilters] ?? key}:</span>{" "}
                {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                <X className="h-3 w-3 text-slate-400" />
              </button>
            ))}
            {activeFilters.length > 7 ? (
              <Badge variant="slate">+{activeFilters.length - 7}</Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Scrollable body */}
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">

        {/* ── Scheme Context ── */}
        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-emerald-700" />
              Scheme Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {/* Location (district + city combined) */}
            <div className="space-y-1.5">
              <Label htmlFor="district-filter">Location / Area</Label>
              <Select
                id="district-filter"
                value={filters.district ?? ""}
                onChange={(e) => setFilter("district", str(e.target.value))}
                disabled={catalogQuery.isLoading}
              >
                <option value="">{catalogQuery.isLoading ? "Loading…" : "All locations"}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </div>

            {/* City + Authority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city-filter">City</Label>
                <Select
                  id="city-filter"
                  value={filters.city ?? ""}
                  onChange={(e) => setFilter("city", str(e.target.value))}
                >
                  <option value="">All</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="authority-filter">Authority</Label>
                <Select
                  id="authority-filter"
                  value={filters.urbanAuthority ?? ""}
                  onChange={(e) => setFilter("urbanAuthority", str(e.target.value))}
                >
                  <option value="">All</option>
                  {authorities.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </div>
            </div>

            {/* Village (combobox — many options) */}
            <div className="space-y-1.5">
              <Label htmlFor="village-filter">Village</Label>
              <FilterCombobox
                id="village-filter"
                value={filters.village ?? ""}
                onChange={(v) => setFilter("village", str(v))}
                suggestions={villages}
                placeholder="Type or select village…"
                disabled={villages.length === 0 && !filters.district}
                emptyText={filters.district ? "No villages for this location" : "Select a location first"}
              />
            </div>

            {/* TPS No + TPS Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tps-no-filter">TPS no</Label>
                <Select
                  id="tps-no-filter"
                  value={filters.tpsNumber ?? ""}
                  onChange={(e) => setFilter("tpsNumber", str(e.target.value))}
                >
                  <option value="">Any</option>
                  {tpsNumbers.map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tps-name-filter">TPS name</Label>
                <FilterCombobox
                  id="tps-name-filter"
                  value={filters.tpsName ?? ""}
                  onChange={(v) => setFilter("tpsName", str(v))}
                  suggestions={tpsNames}
                  placeholder="e.g. Bhuj 1…"
                  emptyText="No TPS schemes found"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Plot Identifiers ── */}
        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Plot Identifiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <p className="text-[11px] leading-4 text-slate-400">
              {hasScope
                ? "Showing options for the selected location. Map zooms on selection."
                : "Select a location above to enable plot search."}
            </p>

            {/* Survey + Plot ID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="survey-filter">Survey no</Label>
                <FilterCombobox
                  id="survey-filter"
                  value={filters.surveyNumber ?? ""}
                  onChange={(v) => setFilter("surveyNumber", str(v))}
                  suggestions={surveyOpts.data?.options ?? []}
                  isLoading={surveyOpts.isFetching}
                  placeholder="e.g. 45"
                  disabled={!hasScope && !filters.surveyNumber}
                  emptyText="No survey numbers found"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plot-id-filter">Plot ID (GID)</Label>
                <FilterCombobox
                  id="plot-id-filter"
                  value={filters.plotId ?? ""}
                  onChange={(v) => setFilter("plotId", str(v))}
                  suggestions={plotIdOpts.data?.options ?? []}
                  isLoading={plotIdOpts.isFetching}
                  placeholder="e.g. 1234"
                  disabled={!hasScope && !filters.plotId}
                  emptyText="No plot IDs found"
                />
              </div>
            </div>

            {/* OP + FP */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="op-filter">Original plot</Label>
                <FilterCombobox
                  id="op-filter"
                  value={filters.originalPlotNumber ?? ""}
                  onChange={(v) => setFilter("originalPlotNumber", str(v))}
                  suggestions={opOpts.data?.options ?? []}
                  isLoading={opOpts.isFetching}
                  placeholder="OP no"
                  disabled={!hasScope && !filters.originalPlotNumber}
                  emptyText="No original plots found"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fp-filter">Final plot</Label>
                <FilterCombobox
                  id="fp-filter"
                  value={filters.finalPlotNumber ?? ""}
                  onChange={(v) => setFilter("finalPlotNumber", str(v))}
                  suggestions={fpOpts.data?.options ?? []}
                  isLoading={fpOpts.isFetching}
                  placeholder="FP no"
                  disabled={!hasScope && !filters.finalPlotNumber}
                  emptyText="No final plots found"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Development Constraints ── */}
        <Card className="shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Development Constraints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {/* Reservation */}
            <div className="space-y-1.5">
              <Label htmlFor="reservation-filter">Reservation type</Label>
              <FilterCombobox
                id="reservation-filter"
                value={filters.reservationType ?? ""}
                onChange={(v) => setFilter("reservationType", str(v))}
                suggestions={reservationSuggestions}
                isLoading={resOpts.isFetching}
                placeholder="e.g. Garden, Road…"
                emptyText={hasScope ? "No reservations in this area" : "Select a location first"}
              />
            </div>

            {/* Road width */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="road-min">Road width ≥ (m)</Label>
                <Input
                  id="road-min"
                  type="number"
                  value={filters.minRoadWidth ?? ""}
                  onChange={(e) => setFilter("minRoadWidth", num(e.target.value))}
                  placeholder="9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="road-max">Road width ≤ (m)</Label>
                <Input
                  id="road-max"
                  type="number"
                  value={filters.maxRoadWidth ?? ""}
                  onChange={(e) => setFilter("maxRoadWidth", num(e.target.value))}
                  placeholder="36"
                />
              </div>
            </div>

            {/* Area */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="area-min">Area ≥ (m²)</Label>
                <Input
                  id="area-min"
                  type="number"
                  value={filters.minArea ?? ""}
                  onChange={(e) => setFilter("minArea", num(e.target.value))}
                  placeholder="500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="area-max">Area ≤ (m²)</Label>
                <Input
                  id="area-max"
                  type="number"
                  value={filters.maxArea ?? ""}
                  onChange={(e) => setFilter("maxArea", num(e.target.value))}
                  placeholder="5000"
                />
              </div>
            </div>

            <AdvancedFilterDialog />
          </CardContent>
        </Card>

        {/* ── Browse TPS by Location ── */}
        <LiveTpvdPanel />
      </div>
    </aside>
  );
}
