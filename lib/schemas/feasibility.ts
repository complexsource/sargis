import { z } from "zod";
import { PlotSchema } from "./plot";
import { TpsSchema } from "./tps";

export const ChecklistStatusSchema = z.enum(["pass", "warning", "fail"]);

export const ChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: ChecklistStatusSchema,
  note: z.string()
});

export const RiskIndicatorSchema = z.object({
  label: z.string(),
  level: z.enum(["low", "medium", "high"]),
  description: z.string()
});

export const FeasibilitySchema = z.object({
  plotId: z.string(),
  score: z.number().min(0).max(100),
  verdict: z.enum(["Strong potential", "Proceed with checks", "High constraint"]),
  developmentPotential: z.string(),
  permissibleFsi: z.number(),
  maxBuiltUpAreaSqM: z.number(),
  roadWidthImpact: z.string(),
  setbacks: z.object({
    frontM: z.number(),
    sideM: z.number(),
    rearM: z.number()
  }),
  heightLimitM: z.number(),
  reservationImpact: z.string(),
  waterBodyImpact: z.string(),
  railwayHtImpact: z.string(),
  warnings: z.array(z.string()),
  checklist: z.array(ChecklistItemSchema),
  risks: z.array(RiskIndicatorSchema)
});

export const ReportSchema = z.object({
  id: z.string(),
  generatedAt: z.string(),
  title: z.string(),
  plot: PlotSchema,
  tps: TpsSchema,
  feasibility: FeasibilitySchema,
  disclaimer: z.string()
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ChecklistStatus = z.infer<typeof ChecklistStatusSchema>;
export type Feasibility = z.infer<typeof FeasibilitySchema>;
export type ReportPayload = z.infer<typeof ReportSchema>;
