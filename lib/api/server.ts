import { buildFeasibility, plotRecords, tpsRecords } from "@/lib/mock-data";
import type { ReportPayload } from "@/lib/schemas";

export function getReportPayload(plotId: string): ReportPayload | null {
  const plot = plotRecords.find((record) => record.id === plotId || record.plotId === plotId);
  if (!plot) return null;

  const tps = tpsRecords.find((record) => record.id === plot.tpsId);
  if (!tps) return null;

  return {
    id: `report-${plot.id}`,
    generatedAt: new Date().toISOString(),
    title: `Planning Feasibility Snapshot - ${plot.plotId}`,
    plot,
    tps,
    feasibility: buildFeasibility(plot),
    disclaimer:
      "This report uses mock TPVD-style data for product demonstration. It is not a legal planning opinion, sanctioned town-planning extract, property card, survey record, or substitute for authority verification."
  };
}
