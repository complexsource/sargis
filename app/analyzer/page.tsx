import type { Metadata } from "next";
import { AnalyzerDashboard } from "@/components/map/analyzer-dashboard";

export const metadata: Metadata = {
  title: "GIS Analyzer",
  description: "Map-first TPVD-style TPS and plot analyzer with layers, filters, feasibility scoring, and reports."
};

export default function AnalyzerPage() {
  return <AnalyzerDashboard />;
}
