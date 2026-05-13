import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReportPayload } from "@/lib/api/server";
import { ReportDocument } from "@/components/report/report-document";

type PageProps = {
  params: {
    plotId: string;
  };
};

export function generateMetadata({ params }: PageProps): Metadata {
  const report = getReportPayload(params.plotId);
  return {
    title: report ? `Report ${report.plot.plotId}` : "Report",
    description: report
      ? `Printable planning feasibility report for ${report.plot.plotId}.`
      : "Printable planning feasibility report."
  };
}

export default function ReportPage({ params }: PageProps) {
  const report = getReportPayload(params.plotId);

  if (!report) {
    notFound();
  }

  return <ReportDocument report={report} />;
}
