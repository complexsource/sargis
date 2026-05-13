import { z } from "zod";

export const TpsStatusSchema = z.enum(["Draft", "Sanctioned", "In force", "Under revision"]);

export const TpsSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.string(),
  district: z.string(),
  city: z.string(),
  urbanAuthority: z.string(),
  village: z.string(),
  areaHa: z.number(),
  status: TpsStatusSchema,
  webLink: z.string().url(),
  centroid: z.tuple([z.number(), z.number()]),
  sourceMetadata: z.string(),
  lastUpdated: z.string()
});

export const TpsListSchema = z.array(TpsSchema);

export type Tps = z.infer<typeof TpsSchema>;
export type TpsStatus = z.infer<typeof TpsStatusSchema>;
