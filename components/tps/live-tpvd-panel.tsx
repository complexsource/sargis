"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ExternalLink, MapPinned, RefreshCw } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { useTpvdCatalog } from "@/lib/api/hooks";
import type { TpvdTpsRecord } from "@/lib/tpvd/service";
import { useSelectionStore } from "@/store/selection-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type ExtentPayload = {
  extent?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null;
};

const groupByAuthority = (records: TpvdTpsRecord[]) =>
  records.reduce<Record<string, TpvdTpsRecord[]>>((groups, record) => {
    groups[record.tps_authority] = groups[record.tps_authority] ?? [];
    groups[record.tps_authority].push(record);
    return groups;
  }, {});

export function LiveTpvdPanel() {
  const [expanded, setExpanded] = useState(false);
  const [location, setLocation] = useState("Ahmedabad");
  const catalogQuery = useTpvdCatalog();
  const locations = catalogQuery.data?.options.publicDistricts ?? ["Ahmedabad"];
  const selectTpvdExtentTarget = useSelectionStore((state) => state.selectTpvdExtentTarget);

  const query = useQuery({
    queryKey: ["tpvd-tps-live", location],
    queryFn: () => api.getTpvdTpsByDistrict(location),
    staleTime: 60_000,
    enabled: expanded
  });

  const groups = groupByAuthority(query.data ?? []);

  const zoomToTps = async (record: TpvdTpsRecord) => {
    const response = await fetch(`/api/tpvd/tps-extent?tpsId=${record.tps_id}`);
    if (!response.ok) return;
    const payload = (await response.json()) as ExtentPayload;
    const extent = payload.extent;
    if (!extent) return;
    selectTpvdExtentTarget({
      label: record.title_tps_name,
      extent3857: [extent.minX, extent.minY, extent.maxX, extent.maxY]
    });
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-primary" />
              Browse TPS by Location
            </span>
            {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
        </CardTitle>
      </CardHeader>

      {expanded ? (
        <CardContent className="space-y-3 p-4 pt-0">
          <Select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Select location">
            {locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          {query.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : null}

          {query.isError ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Live TPS service unavailable. WMS layers still work.
            </p>
          ) : null}

          {!query.isLoading && !query.isError && query.data ? (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {Object.entries(groups).map(([authority, records]) => (
                <div key={authority} className="rounded-md border bg-slate-50 p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-600">{authority}</span>
                    <Badge variant="outline">{records.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {records.slice(0, 10).map((record) => (
                      <div key={record.tps_id} className="flex items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-xs">
                        <div className="min-w-0 flex-1 truncate font-medium text-slate-900">{record.title_tps_name}</div>
                        <div className="shrink-0 text-slate-400">#{record.tps_no}</div>
                        <Button variant="ghost" size="sm" className="h-6 shrink-0 px-2" onClick={() => void zoomToTps(record)}>
                          <MapPinned className="h-3 w-3" />
                          Fit
                        </Button>
                      </div>
                    ))}
                    {records.length > 10 ? (
                      <p className="px-2 text-xs text-slate-400">+{records.length - 10} more schemes</p>
                    ) : null}
                  </div>
                </div>
              ))}
              {!query.data.length ? (
                <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No TPS records found for {location}.</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => void query.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="https://tpvd.openprp.in/pro/main/modules/role_public/map/index.php" target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                TPVD
              </a>
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
