import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReportPayload } from "@/lib/api/server";
import { ReportDocument } from "@/components/report/report-document";

type PageProps = { params: { plotId: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const report = await getReportPayload(params.plotId);
  return {
    title: report ? `Report ${report.plot.plotId}` : "Report",
    description: report
      ? `Printable planning feasibility report for ${report.plot.plotId}.`
      : "Printable planning feasibility report."
  };
}

export default async function ReportPage({ params }: PageProps) {
  const report = await getReportPayload(params.plotId);

  if (!report) {
    notFound();
  }

  return <ReportDocument report={report} />;
}
