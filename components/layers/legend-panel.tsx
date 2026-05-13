"use client";

import { ListTree } from "lucide-react";
import { useLayers, useLegend } from "@/lib/api/hooks";
import { buildTpvdLegendUrl } from "@/lib/tpvd/service";
import { useMapStore } from "@/store/map-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function LegendPanel() {
  const { data: legend = [], isLoading } = useLegend();
  const { data: layers = [] } = useLayers();
  const layerVisibility = useMapStore((state) => state.layerVisibility);

  const visibleLegend = legend.filter((item) => layerVisibility[item.layerId]);
  const layerLookup = new Map(layers.map((layer) => [layer.id, layer]));

  return (
    <section className="w-72 rounded-lg border border-slate-200 bg-white/95 shadow-panel backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ListTree className="h-4 w-4 text-primary" />
          Legend
        </div>
        <Badge variant="outline">{visibleLegend.length}</Badge>
      </div>
      <div className="max-h-52 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : visibleLegend.length ? (
          <div className="space-y-2">
            {visibleLegend.map((item) => {
              const layer = layerLookup.get(item.layerId);
              return (
                <div key={item.layerId} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-2 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {layer?.tpvdLayerName ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={buildTpvdLegendUrl(layer.tpvdLayerName)}
                        alt={`${item.label} legend`}
                        className="h-4 w-7 object-contain"
                      />
                    ) : (
                      <span
                        className="h-3 w-6 rounded-sm border border-white shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <span className="truncate text-xs font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                    {layer?.geometryType ?? item.geometryType}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">Turn on layers to populate the legend.</div>
        )}
      </div>
    </section>
  );
}
