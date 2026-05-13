"use client";

import { ExternalLink, LocateFixed, SearchCheck } from "lucide-react";
import Link from "next/link";
import type { Plot, Tps } from "@/lib/schemas";
import { formatArea, formatHa } from "@/lib/utils";
import { useSelectionStore } from "@/store/selection-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ResultsTableProps = {
  plots: Plot[];
  tps: Tps[];
  isLoading?: boolean;
  isError?: boolean;
};

const statusVariant = {
  Draft: "warning",
  Sanctioned: "success",
  "In force": "success",
  "Under revision": "warning"
} as const;

const restrictionVariant = {
  Clear: "success",
  Watch: "warning",
  Restricted: "danger"
} as const;

export function ResultsTable({ plots, tps, isLoading, isError }: ResultsTableProps) {
  const selectPlot = useSelectionStore((state) => state.selectPlot);
  const selectTps = useSelectionStore((state) => state.selectTps);

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-sm text-red-700">Search results could not be loaded.</div>;
  }

  return (
    <Tabs defaultValue="plots" className="h-full">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-3">
        <TabsList>
          <TabsTrigger value="plots">Plots ({plots.length})</TabsTrigger>
          <TabsTrigger value="tps">TPS ({tps.length})</TabsTrigger>
        </TabsList>
        <div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
          <SearchCheck className="h-4 w-4 text-emerald-700" />
          Filter records, view on map, or open a report.
        </div>
      </div>

      <TabsContent value="plots" className="m-0 h-[calc(100%-61px)] overflow-auto">
        {plots.length ? (
          <>
            <div className="grid gap-3 p-3 md:hidden">
              {plots.map((plot) => (
                <div key={plot.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-950">{plot.plotId}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        TPS {plot.tpsNumber} - {plot.village} - Survey {plot.surveyNumber}
                      </div>
                    </div>
                    <Badge variant={restrictionVariant[plot.restrictionStatus]}>{plot.restrictionStatus}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-slate-50 p-2">
                      <div className="text-slate-500">Area</div>
                      <div className="font-semibold text-slate-900">{plot.areaSqM > 0 ? formatArea(plot.areaSqM) : "—"}</div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2">
                      <div className="text-slate-500">Road</div>
                      <div className="font-semibold text-slate-900">{plot.nearbyRoadWidthM > 0 ? `${plot.nearbyRoadWidthM} m` : "—"}</div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2">
                      <div className="text-slate-500">Zone</div>
                      <div className="font-semibold text-slate-900">{plot.landUse || "—"}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectPlot(plot.id)}>
                      <LocateFixed />
                      View
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/report/${plot.id}`}>Report</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plot</TableHead>
                    <TableHead>TPS</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Survey</TableHead>
                    <TableHead>OP / FP</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Road</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plots.map((plot) => (
                    <TableRow key={plot.id}>
                      <TableCell className="font-semibold">{plot.plotId}</TableCell>
                      <TableCell>TPS {plot.tpsNumber}</TableCell>
                      <TableCell>{plot.village}</TableCell>
                      <TableCell>{plot.surveyNumber}</TableCell>
                      <TableCell>{plot.originalPlotNumber} / {plot.finalPlotNumber}</TableCell>
                      <TableCell>{plot.areaSqM > 0 ? formatArea(plot.areaSqM) : "—"}</TableCell>
                      <TableCell>{plot.nearbyRoadWidthM > 0 ? `${plot.nearbyRoadWidthM} m` : "—"}</TableCell>
                      <TableCell>{plot.landUse || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={restrictionVariant[plot.restrictionStatus]}>{plot.restrictionStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => selectPlot(plot.id)}>
                            <LocateFixed />
                            View
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/report/${plot.id}`}>Report</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                <SearchCheck className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900">No plots match these filters</h3>
              <p className="mt-1 text-sm text-slate-500">Select a location or plot filter to load live TPVD plots.</p>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="tps" className="m-0 h-[calc(100%-61px)] overflow-auto">
        {tps.length ? (
          <>
            <div className="grid gap-3 p-3 md:hidden">
              {tps.map((record) => (
                <div key={record.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-950">{record.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        TPS {record.number} - {record.urbanAuthority} - {record.village}
                      </div>
                    </div>
                    <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-slate-50 p-2">
                      <div className="text-slate-500">Area</div>
                      <div className="font-semibold text-slate-900">{record.areaHa > 0 ? formatHa(record.areaHa) : "—"}</div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-2">
                      <div className="text-slate-500">District</div>
                      <div className="font-semibold text-slate-900">{record.district}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectTps(record.id)}>
                      <LocateFixed />
                      View
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <a href={record.webLink} target="_blank" rel="noreferrer">
                        TPVD
                        <ExternalLink />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TPS Name</TableHead>
                    <TableHead>TPS No</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Authority</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Web link</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tps.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-semibold">{record.name}</TableCell>
                      <TableCell>{record.number}</TableCell>
                      <TableCell>{record.village}</TableCell>
                      <TableCell>{record.urbanAuthority}</TableCell>
                      <TableCell>{record.areaHa > 0 ? formatHa(record.areaHa) : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <a href={record.webLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                          TPVD
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              selectTps(record.id);
                            }}
                          >
                            <LocateFixed />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <h3 className="font-semibold text-slate-900">No TPS records found</h3>
              <p className="mt-1 text-sm text-slate-500">Adjust district, authority, village, or TPS number filters.</p>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
