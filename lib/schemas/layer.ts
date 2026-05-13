import { z } from "zod";

export const LayerGeometrySchema = z.enum(["fill", "line", "symbol", "circle"]);

export const LayerCategorySchema = z.enum([
  "Boundary",
  "Plot",
  "Road",
  "Constraint",
  "Utility",
  "Label",
  "Base"
]);

export const GisLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  category: LayerCategorySchema,
  geometryType: LayerGeometrySchema,
  description: z.string(),
  color: z.string(),
  opacity: z.number().min(0).max(1),
  enabledByDefault: z.boolean(),
  legendLabel: z.string(),
  source: z.string(),
  tpvdLayerName: z.string().optional(),
  serviceMode: z.enum(["mock-vector", "tpvd-wms", "hybrid"]).default("mock-vector"),
  supportsFeatureInfo: z.boolean().default(false),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional()
});

export const GisLayerListSchema = z.array(GisLayerSchema);

export const LegendItemSchema = z.object({
  layerId: z.string(),
  label: z.string(),
  color: z.string(),
  geometryType: LayerGeometrySchema
});

export const LegendSchema = z.array(LegendItemSchema);

export type GisLayer = z.infer<typeof GisLayerSchema>;
export type LegendItem = z.infer<typeof LegendItemSchema>;
export type LayerGeometry = z.infer<typeof LayerGeometrySchema>;
