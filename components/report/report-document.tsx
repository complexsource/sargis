import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleX, FileText, Layers3, MapPinned, Ruler } from "lucide-react";
import type { ChecklistStatus, ReportPayload } from "@/lib/schemas";
import { formatArea, formatDate, formatNumber } from "@/lib/utils";
import { ReportActions } from "@/components/report/report-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const checklistIcon = {
  pass: CheckCircle2,
  warning: AlertTriangle,
  fail: CircleX
};

const checklistClass: Record<ChecklistStatus, string> = {
  pass: "text-emerald-700",
  warning: "text-amber-700",
  fail: "text-red-700"
};

function ReportSection({ title, icon: Icon, children }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <Card className="break-inside-avoid shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ReportDocument({ report }: { report: ReportPayload }) {
  const { plot, tps, feasibility } = report;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 print:bg-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="print-hidden mb-4 flex items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/analyzer">
              <ArrowLeft />
              Back to analyzer
            </Link>
          </Button>
          <ReportActions />
        </div>

        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel print:border-0 print:shadow-none md:p-10">
          <header className="border-b border-slate-200 pb-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <Badge variant="secondary">PDF-ready feasibility report</Badge>
                <h1 className="mt-4 text-3xl font-bold tracking-normal md:text-5xl">{report.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Generated {formatDate(report.generatedAt)} from mock TPVD-style plot, TPS, layer, and zoning data.
                </p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4 text-right">
                <div className="text-xs font-semibold uppercase text-slate-500">Feasibility score</div>
                <div className="text-4xl font-bold text-slate-950">{feasibility.score}</div>
                <Badge variant={feasibility.score >= 78 ? "success" : feasibility.score >= 56 ? "warning" : "danger"}>
                  {feasibility.verdict}
                </Badge>
              </div>
            </div>
          </header>

          <section className="grid gap-5 py-6 md:grid-cols-3">
            {[
              ["Plot ID", plot.plotId],
              ["TPS", `${tps.name} / ${tps.number}`],
              ["Village", plot.village],
              ["Area", formatArea(plot.areaSqM)],
              ["Land use", `${plot.landUse} / ${plot.zone}`],
              ["Road width", `${plot.nearbyRoadWidthM} m`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
                <div className="mt-1 font-semibold text-slate-950">{value}</div>
              </div>
            ))}
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <ReportSection title="Map Snapshot Placeholder" icon={MapPinned}>
              <div className="relative h-80 overflow-hidden rounded-lg border bg-slate-200">
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,23,42,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.11)_1px,transparent_1px)] bg-[size:34px_34px]" />
                <div className="absolute left-1/4 top-1/3 h-28 w-44 rotate-3 border-2 border-emerald-600 bg-emerald-400/20" />
                <div className="absolute left-1/2 top-1/2 h-3 w-72 -translate-x-1/2 rotate-[-8deg] bg-slate-700" />
                <div className="absolute right-6 top-6 rounded-md bg-white px-3 py-2 text-xs font-semibold shadow">
                  {plot.finalPlotNumber} / {plot.surveyNumber}
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                TODO: replace placeholder with server-rendered map snapshot from MapLibre or a GIS tile export service.
              </p>
            </ReportSection>

            <ReportSection title="Zoning Calculations" icon={Ruler}>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Development feasibility</span>
                    <span className="text-sm font-bold">{feasibility.score}/100</span>
                  </div>
                  <Progress value={feasibility.score} indicatorClassName={feasibility.score >= 78 ? "bg-emerald-600" : feasibility.score >= 56 ? "bg-amber-500" : "bg-red-600"} />
                </div>
                <Separator />
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Permissible FSI</dt>
                    <dd className="font-semibold">{feasibility.permissibleFsi.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Max built-up area</dt>
                    <dd className="font-semibold">{formatArea(feasibility.maxBuiltUpAreaSqM)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Height limit</dt>
                    <dd className="font-semibold">{feasibility.heightLimitM} m</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Setbacks</dt>
                    <dd className="font-semibold">
                      F {feasibility.setbacks.frontM}m / S {feasibility.setbacks.sideM}m / R {feasibility.setbacks.rearM}m
                    </dd>
                  </div>
                </dl>
              </div>
            </ReportSection>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ReportSection title="Layer Intersection Summary" icon={Layers3}>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ["Water body", plot.intersections.waterBody],
                  ["Gamthal/Gamtal", plot.intersections.gamthal],
                  ["DP reservation", plot.intersections.dpReservation],
                  ["Railway", plot.intersections.railway],
                  ["HT line", plot.intersections.htLine],
                  ["Road boundary", plot.intersections.roadBoundary]
                ] as Array<[string, boolean]>).map(([label, active]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-2 rounded-md border bg-slate-50 p-3 text-sm">
                    <span>{label}</span>
                    <Badge variant={active ? "warning" : "success"}>{active ? "Affected" : "Clear"}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {plot.relatedLayers.map((layer) => (
                  <Badge key={layer} variant="outline">
                    {layer}
                  </Badge>
                ))}
              </div>
            </ReportSection>

            <ReportSection title="Compliance Checklist" icon={FileText}>
              <div className="space-y-2">
                {feasibility.checklist.map((item) => {
                  const Icon = checklistIcon[item.status];
                  return (
                    <div key={item.id} className="flex gap-3 rounded-md border bg-white p-3">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${checklistClass[item.status]}`} />
                      <div>
                        <div className="text-sm font-semibold">{item.label}</div>
                        <div className="text-xs leading-5 text-slate-500">{item.note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ReportSection>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ReportSection title="Risk Warnings" icon={AlertTriangle}>
              <div className="space-y-3">
                <p className="text-sm leading-6 text-slate-600">{feasibility.roadWidthImpact}</p>
                <p className="text-sm leading-6 text-slate-600">{feasibility.reservationImpact}</p>
                <p className="text-sm leading-6 text-slate-600">{feasibility.waterBodyImpact}</p>
                <p className="text-sm leading-6 text-slate-600">{feasibility.railwayHtImpact}</p>
                {feasibility.warnings.length ? (
                  <div className="space-y-2">
                    {feasibility.warnings.map((warning) => (
                      <div key={warning} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {warning}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </ReportSection>

            <ReportSection title="Source + Disclaimer" icon={FileText}>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-slate-900">TPS source</dt>
                  <dd className="mt-1 text-slate-600">{tps.sourceMetadata}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Plot source</dt>
                  <dd className="mt-1 text-slate-600">{plot.sourceMetadata}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Last updated</dt>
                  <dd className="mt-1 text-slate-600">{formatDate(plot.lastUpdated)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Disclaimer</dt>
                  <dd className="mt-1 text-slate-600">{report.disclaimer}</dd>
                </div>
              </dl>
            </ReportSection>
          </div>

          <footer className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
            Report ID {report.id} - Buildable area rounded to {formatNumber(feasibility.maxBuiltUpAreaSqM)} sq m. Confirm all values with official authority records before acting.
          </footer>
        </article>
      </div>
    </main>
  );
}
