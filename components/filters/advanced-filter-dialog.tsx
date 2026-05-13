"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTpvdCatalog, useTpvdFieldOptions } from "@/lib/api/hooks";
import { useFilterStore } from "@/store/filter-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const unique = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));

const stringOrUndefined = (value: string) => (value ? value : undefined);
const numberOrUndefined = (value: string) => (value ? Number(value) : undefined);
const textIncludes = (value: string | null | undefined, query: string | null | undefined) =>
  !query || String(value ?? "").toLowerCase().includes(query.toLowerCase());

type BooleanFilterKey =
  | "waterBodyAffected"
  | "gamthalAffected"
  | "dpReservationAffected"
  | "railwayAffected"
  | "htLineAffected";

const constraintFilters: Array<[BooleanFilterKey, string]> = [
  ["waterBodyAffected", "Water body affected"],
  ["gamthalAffected", "Gamthal/Gamtal"],
  ["dpReservationAffected", "DP reservation"],
  ["railwayAffected", "Railway affected"],
  ["htLineAffected", "HT line affected"]
];

export function AdvancedFilterDialog() {
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const catalogQuery = useTpvdCatalog();
  const catalog = catalogQuery.data;

  const scopedRecords = (catalog?.records ?? []).filter((record) => {
    const districtMatch = !filters.district
      ? true
      : [record.district, record.city, record.village, record.title, record.tpsName].some((value) =>
          textIncludes(value, filters.district)
        );
    return districtMatch && textIncludes(record.city, filters.city) && textIncludes(record.authority, filters.urbanAuthority);
  });
  const districts = catalog?.options.districts ?? [];
  const cities = unique(scopedRecords.map((record) => record.city));
  const authorities = unique(scopedRecords.map((record) => record.authority));
  const reservationOptions = useTpvdFieldOptions(
    "reservationType",
    {
      district: filters.district,
      city: filters.city,
      urbanAuthority: filters.urbanAuthority,
      village: filters.village,
      tpsNumber: filters.tpsNumber,
      tpsName: filters.tpsName
    },
    filters.reservationType ?? "",
    Boolean(catalog)
  );
  const reservationTypes = reservationOptions.data?.options ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <SlidersHorizontal />
          Advanced filters
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Advanced GIS Filters</DialogTitle>
          <DialogDescription>
            Combine TPVD-style plot, scheme, road, land-use, and constraint filters.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="district">District / TPVD town</Label>
            <Select id="district" value={filters.district ?? ""} onChange={(event) => setFilter("district", stringOrUndefined(event.target.value))}>
              <option value="">Any district</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select id="city" value={filters.city ?? ""} onChange={(event) => setFilter("city", stringOrUndefined(event.target.value))}>
              <option value="">Any city</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="authority">Urban authority</Label>
            <Select
              id="authority"
              value={filters.urbanAuthority ?? ""}
              onChange={(event) => setFilter("urbanAuthority", stringOrUndefined(event.target.value))}
            >
              <option value="">Any authority</option>
              {authorities.map((authority) => (
                <option key={authority} value={authority}>
                  {authority}
                </option>
              ))}
            </Select>
          </div>
          {catalogQuery.isLoading ? <p className="text-xs text-slate-500 md:col-span-3">Loading live TPVD filter catalog...</p> : null}
          <div className="space-y-2">
            <Label htmlFor="reservation">Reservation type</Label>
            <Select
              id="reservation"
              value={filters.reservationType ?? ""}
              onChange={(event) => setFilter("reservationType", stringOrUndefined(event.target.value))}
            >
              <option value="">Any reservation</option>
              {reservationTypes.map((reservation) => (
                <option key={reservation} value={reservation}>
                  {reservation}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="boundaryType">Boundary type</Label>
            <Select
              id="boundaryType"
              value={filters.boundaryType ?? ""}
              onChange={(event) => setFilter("boundaryType", stringOrUndefined(event.target.value) as typeof filters.boundaryType)}
            >
              <option value="">Any boundary</option>
              <option value="Final Plot Boundary">Final Plot Boundary</option>
              <option value="Original Plot Boundary">Original Plot Boundary</option>
              <option value="Survey Boundary">Survey Boundary</option>
              <option value="TPS Boundary">TPS Boundary</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restrictionStatus">Restriction status</Label>
            <Select
              id="restrictionStatus"
              value={filters.restrictionStatus ?? ""}
              onChange={(event) => setFilter("restrictionStatus", stringOrUndefined(event.target.value) as typeof filters.restrictionStatus)}
            >
              <option value="">Any status</option>
              <option value="Clear">Clear</option>
              <option value="Watch">Watch</option>
              <option value="Restricted">Restricted</option>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="roadName">Road name</Label>
            <Input
              id="roadName"
              value={filters.roadName ?? ""}
              onChange={(event) => setFilter("roadName", stringOrUndefined(event.target.value))}
              placeholder="SG Highway, Canal Road..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minRoad">Min road width</Label>
            <Input
              id="minRoad"
              type="number"
              inputMode="decimal"
              value={filters.minRoadWidth ?? ""}
              onChange={(event) => setFilter("minRoadWidth", numberOrUndefined(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxRoad">Max road width</Label>
            <Input
              id="maxRoad"
              type="number"
              inputMode="decimal"
              value={filters.maxRoadWidth ?? ""}
              onChange={(event) => setFilter("maxRoadWidth", numberOrUndefined(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minArea">Min plot area</Label>
            <Input
              id="minArea"
              type="number"
              inputMode="numeric"
              value={filters.minArea ?? ""}
              onChange={(event) => setFilter("minArea", numberOrUndefined(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxArea">Max plot area</Label>
            <Input
              id="maxArea"
              type="number"
              inputMode="numeric"
              value={filters.maxArea ?? ""}
              onChange={(event) => setFilter("maxArea", numberOrUndefined(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minFsi">Min FSI</Label>
            <Input
              id="minFsi"
              type="number"
              inputMode="decimal"
              value={filters.minFsi ?? ""}
              onChange={(event) => setFilter("minFsi", numberOrUndefined(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxFsi">Max FSI</Label>
            <Input
              id="maxFsi"
              type="number"
              inputMode="decimal"
              value={filters.maxFsi ?? ""}
              onChange={(event) => setFilter("maxFsi", numberOrUndefined(event.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {constraintFilters.map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Select
                id={key}
                value={filters[key] === undefined ? "" : String(filters[key])}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilter(key, value === "" ? undefined : value === "true");
                }}
              >
                <option value="">Any</option>
                <option value="true">Affected</option>
                <option value="false">Not affected</option>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={resetFilters}>
            Reset all
          </Button>
          <DialogClose asChild>
            <Button type="button">Apply filters</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
