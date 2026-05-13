import { z } from "zod";

export const BoundaryTypeSchema = z.enum([
  "Final Plot Boundary",
  "Original Plot Boundary",
  "Survey Boundary",
  "TPS Boundary"
]);

export const RestrictionStatusSchema = z.enum(["Clear", "Watch", "Restricted"]);

export const SetbackSchema = z.object({
  frontM: z.number(),
  sideM: z.number(),
  rearM: z.number()
});

export const IntersectionsSchema = z.object({
  waterBody: z.boolean(),
  gamthal: z.boolean(),
  dpReservation: z.boolean(),
  railway: z.boolean(),
  htLine: z.boolean(),
  roadBoundary: z.boolean()
});

export const PlotSchema = z.object({
  id: z.string(),
  plotId: z.string(),
  tpsId: z.string(),
  tpsName: z.string(),
  tpsNumber: z.string(),
  district: z.string(),
  city: z.string(),
  urbanAuthority: z.string(),
  village: z.string(),
  surveyNumber: z.string(),
  originalPlotNumber: z.string(),
  finalPlotNumber: z.string(),
  areaSqM: z.number(),
  boundaryType: BoundaryTypeSchema,
  roadAccess: z.string(),
  nearbyRoadWidthM: z.number(),
  roadName: z.string(),
  landUse: z.string(),
  zone: z.string(),
  reservationType: z.string().nullable(),
  fsi: z.number(),
  permissibleBuiltUpAreaSqM: z.number(),
  setbacks: SetbackSchema,
  heightLimitM: z.number(),
  restrictions: z.array(z.string()),
  restrictionStatus: RestrictionStatusSchema,
  intersections: IntersectionsSchema,
  coordinates: z.tuple([z.number(), z.number()]),
  relatedLayers: z.array(z.string()),
  sourceMetadata: z.string(),
  lastUpdated: z.string()
});

export const PlotListSchema = z.array(PlotSchema);

export const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  urbanAuthority: z.string().optional(),
  village: z.string().optional(),
  tpsName: z.string().optional(),
  tpsNumber: z.string().optional(),
  surveyNumber: z.string().optional(),
  originalPlotNumber: z.string().optional(),
  finalPlotNumber: z.string().optional(),
  plotId: z.string().optional(),
  roadName: z.string().optional(),
  landUse: z.string().optional(),
  reservationType: z.string().optional(),
  waterBodyAffected: z.boolean().optional(),
  gamthalAffected: z.boolean().optional(),
  dpReservationAffected: z.boolean().optional(),
  railwayAffected: z.boolean().optional(),
  htLineAffected: z.boolean().optional(),
  minRoadWidth: z.number().optional(),
  maxRoadWidth: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  minFsi: z.number().optional(),
  maxFsi: z.number().optional(),
  boundaryType: BoundaryTypeSchema.optional(),
  restrictionStatus: RestrictionStatusSchema.optional()
});

export type BoundaryType = z.infer<typeof BoundaryTypeSchema>;
export type Plot = z.infer<typeof PlotSchema>;
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type Setback = z.infer<typeof SetbackSchema>;
