import type { Plot, SearchFilters, Tps } from "@/lib/schemas";
import { plotRecords } from "./plots";
import { tpsRecords } from "./tps";

const includes = (value: string | number | null | undefined, query: string) =>
  String(value ?? "")
    .toLowerCase()
    .includes(query.trim().toLowerCase());

export function parseSearchParams(params: URLSearchParams): SearchFilters {
  const booleanParam = (name: string) => {
    const value = params.get(name);
    if (value === null || value === "") return undefined;
    return value === "true";
  };

  const numberParam = (name: string) => {
    const value = params.get(name);
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const stringParam = (name: string) => params.get(name) || undefined;

  return {
    query: stringParam("query"),
    district: stringParam("district"),
    city: stringParam("city"),
    urbanAuthority: stringParam("urbanAuthority"),
    village: stringParam("village"),
    tpsName: stringParam("tpsName"),
    tpsNumber: stringParam("tpsNumber"),
    surveyNumber: stringParam("surveyNumber"),
    originalPlotNumber: stringParam("originalPlotNumber"),
    finalPlotNumber: stringParam("finalPlotNumber"),
    plotId: stringParam("plotId"),
    roadName: stringParam("roadName"),
    landUse: stringParam("landUse"),
    reservationType: stringParam("reservationType"),
    waterBodyAffected: booleanParam("waterBodyAffected"),
    gamthalAffected: booleanParam("gamthalAffected"),
    dpReservationAffected: booleanParam("dpReservationAffected"),
    railwayAffected: booleanParam("railwayAffected"),
    htLineAffected: booleanParam("htLineAffected"),
    minRoadWidth: numberParam("minRoadWidth"),
    maxRoadWidth: numberParam("maxRoadWidth"),
    minArea: numberParam("minArea"),
    maxArea: numberParam("maxArea"),
    minFsi: numberParam("minFsi"),
    maxFsi: numberParam("maxFsi"),
    boundaryType: stringParam("boundaryType") as SearchFilters["boundaryType"],
    restrictionStatus: stringParam("restrictionStatus") as SearchFilters["restrictionStatus"]
  };
}

export function searchTps(filters: SearchFilters = {}): Tps[] {
  const query = filters.query?.trim();

  return tpsRecords.filter((tps) => {
    const matchesQuery = !query
      ? true
      : [tps.name, tps.number, tps.district, tps.city, tps.urbanAuthority, tps.village].some((value) =>
          includes(value, query)
        );

    return (
      matchesQuery &&
      (!filters.district || includes(tps.district, filters.district)) &&
      (!filters.city || includes(tps.city, filters.city)) &&
      (!filters.urbanAuthority || includes(tps.urbanAuthority, filters.urbanAuthority)) &&
      (!filters.village || includes(tps.village, filters.village)) &&
      (!filters.tpsName || includes(tps.name, filters.tpsName)) &&
      (!filters.tpsNumber || includes(tps.number, filters.tpsNumber))
    );
  });
}

export function searchPlots(filters: SearchFilters = {}): Plot[] {
  const query = filters.query?.trim();

  return plotRecords.filter((plot) => {
    const matchesQuery = !query
      ? true
      : [
          plot.plotId,
          plot.tpsName,
          plot.tpsNumber,
          plot.village,
          plot.surveyNumber,
          plot.originalPlotNumber,
          plot.finalPlotNumber,
          plot.roadName,
          plot.landUse,
          plot.zone,
          plot.reservationType
        ].some((value) => includes(value, query));

    return (
      matchesQuery &&
      (!filters.district || includes(plot.district, filters.district)) &&
      (!filters.city || includes(plot.city, filters.city)) &&
      (!filters.urbanAuthority || includes(plot.urbanAuthority, filters.urbanAuthority)) &&
      (!filters.village || includes(plot.village, filters.village)) &&
      (!filters.tpsName || includes(plot.tpsName, filters.tpsName)) &&
      (!filters.tpsNumber || includes(plot.tpsNumber, filters.tpsNumber)) &&
      (!filters.surveyNumber || includes(plot.surveyNumber, filters.surveyNumber)) &&
      (!filters.originalPlotNumber || includes(plot.originalPlotNumber, filters.originalPlotNumber)) &&
      (!filters.finalPlotNumber || includes(plot.finalPlotNumber, filters.finalPlotNumber)) &&
      (!filters.plotId || includes(plot.plotId, filters.plotId)) &&
      (!filters.roadName || includes(plot.roadName, filters.roadName)) &&
      (!filters.landUse || includes(plot.landUse, filters.landUse)) &&
      (!filters.reservationType || includes(plot.reservationType, filters.reservationType)) &&
      (filters.waterBodyAffected === undefined || plot.intersections.waterBody === filters.waterBodyAffected) &&
      (filters.gamthalAffected === undefined || plot.intersections.gamthal === filters.gamthalAffected) &&
      (filters.dpReservationAffected === undefined || plot.intersections.dpReservation === filters.dpReservationAffected) &&
      (filters.railwayAffected === undefined || plot.intersections.railway === filters.railwayAffected) &&
      (filters.htLineAffected === undefined || plot.intersections.htLine === filters.htLineAffected) &&
      (filters.minRoadWidth === undefined || plot.nearbyRoadWidthM >= filters.minRoadWidth) &&
      (filters.maxRoadWidth === undefined || plot.nearbyRoadWidthM <= filters.maxRoadWidth) &&
      (filters.minArea === undefined || plot.areaSqM >= filters.minArea) &&
      (filters.maxArea === undefined || plot.areaSqM <= filters.maxArea) &&
      (filters.minFsi === undefined || plot.fsi >= filters.minFsi) &&
      (filters.maxFsi === undefined || plot.fsi <= filters.maxFsi) &&
      (!filters.boundaryType || plot.boundaryType === filters.boundaryType) &&
      (!filters.restrictionStatus || plot.restrictionStatus === filters.restrictionStatus)
    );
  });
}
