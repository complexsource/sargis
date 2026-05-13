"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Building,
  CalendarClock,
  CheckCircle2,
  FileText,
  Layers3,
  LocateFixed,
  MapPin,
  Ruler
} from "lucide-react";
import { useFeasibility, usePlot } from "@/lib/api/hooks";
import { cn, formatArea, formatDate } from "@/lib/utils";
import { useMapStore } from "@/store/map-store";
import { useSelectionStore } from "@/store/selection-store";
import { FeasibilityCard } from "@/components/feasibility/feasibility-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const restrictionBadge = {
  Clear: "success",
  Watch: "warning",
  Restricted: "danger"
} as const;

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="min-w-0 font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function PlotDetailDrawer({ className }: { className?: string }) {
  const selectedPlotId = useSelectionStore((state) => state.selectedPlotId);
  const runCommand = useMapStore((state) => state.runCommand);
  const { data: plot, isLoading, isError } = usePlot(selectedPlotId);
  const { data: feasibility } = useFeasibility(selectedPlotId);

  return (
    <aside className={cn("flex h-full flex-col overflow-hidden border-l border-slate-200 bg-white/96 shadow-panel backdrop-blur", className)}>
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MapPin className="h-4 w-4 text-primary" />
              Plot Intelligence
            </div>
            <p className="mt-1 text-xs text-slate-500">Verified attributes, intersections, and a concise feasibility read.</p>
          </div>
          {plot ? <Badge variant={restrictionBadge[plot.restrictionStatus]}>{plot.restrictionStatus}</Badge> : null}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto p-4">
        {!selectedPlotId ? (
          <div className="rounded-lg border border-dashed bg-slate-50 p-6 text-center">
            <MapPin className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No plot selected</h3>
            <p className="mt-1 text-sm text-slate-500">
              Search a live TPVD final plot for official GIS context, or choose a result row to open feasibility details.
            </p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
            <Skeleton className="h-56" />
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Plot details could not be loaded.</div>
        ) : null}

        {plot ? (
          <div className="space-y-4">
            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{plot.plotId}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      {plot.tpsName} - TPS {plot.tpsNumber}
                    </p>
                  </div>
                  <Badge variant="outline">{plot.finalPlotNumber}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <dl className="divide-y divide-slate-100">
                  <DetailRow label="Village" value={plot.village} />
                  <DetailRow label="Survey no" value={plot.surveyNumber} />
                  <DetailRow label="Original plot" value={plot.originalPlotNumber} />
                  <DetailRow label="Final plot" value={plot.finalPlotNumber} />
                  <DetailRow label="Area" value={formatArea(plot.areaSqM)} />
                  <DetailRow label="Boundary" value={plot.boundaryType} />
                  <DetailRow label="Coordinates" value={`${plot.coordinates[1].toFixed(5)}, ${plot.coordinates[0].toFixed(5)}`} />
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-emerald-700" />
                  Zoning + Access
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <dl className="divide-y divide-slate-100">
                  <DetailRow label="Land use" value={`${plot.landUse} / ${plot.zone}`} />
                  <DetailRow label="Reservation" value={plot.reservationType ?? "None detected"} />
                  <DetailRow label="Road access" value={plot.roadAccess} />
                  <DetailRow label="Road width" value={`${plot.nearbyRoadWidthM} m`} />
                  <DetailRow label="FSI" value={plot.fsi.toFixed(2)} />
                  <DetailRow label="Built-up" value={formatArea(plot.permissibleBuiltUpAreaSqM)} />
                  <DetailRow label="Height" value={`${plot.heightLimitM} m`} />
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers3 className="h-4 w-4 text-primary" />
                  Intersecting GIS Layers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["Water body", plot.intersections.waterBody],
                    ["Gamthal/Gamtal", plot.intersections.gamthal],
                    ["DP reservation", plot.intersections.dpReservation],
                    ["Railway", plot.intersections.railway],
                    ["HT line", plot.intersections.htLine],
                    ["Road boundary", plot.intersections.roadBoundary]
                  ] as Array<[string, boolean]>).map(([label, active]) => (
                    <div key={String(label)} className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-2 text-xs">
                      {active ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      <span className="font-medium text-slate-700">{label}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {plot.relatedLayers.map((layer) => (
                    <Badge key={layer} variant="outline">
                      {layer}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-indigo-700" />
                  Setbacks + Warnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-slate-50 p-2 text-center">
                    <div className="text-xs text-slate-500">Front</div>
                    <div className="font-semibold">{plot.setbacks.frontM} m</div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2 text-center">
                    <div className="text-xs text-slate-500">Side</div>
                    <div className="font-semibold">{plot.setbacks.sideM} m</div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2 text-center">
                    <div className="text-xs text-slate-500">Rear</div>
                    <div className="font-semibold">{plot.setbacks.rearM} m</div>
                  </div>
                </div>
                {plot.restrictions.map((warning) => (
                  <div key={warning} className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {feasibility ? <FeasibilityCard feasibility={feasibility} compact /> : null}

            <Card className="shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CalendarClock className="h-4 w-4 text-slate-600" />
                  Source Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0 text-sm text-slate-600">
                <p>{plot.sourceMetadata}</p>
                <p className="text-xs">Last updated {formatDate(plot.lastUpdated)}</p>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 grid grid-cols-2 gap-2 bg-white pt-2">
              <Button asChild variant="premium">
                <Link href={`/report/${plot.id}`}>
                  <FileText />
                  Report
                </Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => runCommand("fit-selected")}>
                <LocateFixed />
                Fit map
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
