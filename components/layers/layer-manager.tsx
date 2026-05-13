"use client";

import { Layers3, Map, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { useLayers } from "@/lib/api/hooks";
import { buildTpvdLegendUrl } from "@/lib/tpvd/service";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/store/map-store";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function LayerManager({ className }: { className?: string }) {
  const { data: layers = [], isLoading, isError } = useLayers();
  const layerVisibility = useMapStore((state) => state.layerVisibility);
  const layerOpacity = useMapStore((state) => state.layerOpacity);
  const toggleLayer = useMapStore((state) => state.toggleLayer);
  const setLayerOpacity = useMapStore((state) => state.setLayerOpacity);
  const baseMap = useMapStore((state) => state.baseMap);
  const setBaseMap = useMapStore((state) => state.setBaseMap);
  const resetLayers = useMapStore((state) => state.resetLayers);

  const groupedLayers = useMemo(() => {
    return layers.reduce<Record<string, typeof layers>>((groups, layer) => {
      groups[layer.category] = groups[layer.category] ?? [];
      groups[layer.category].push(layer);
      return groups;
    }, {});
  }, [layers]);

  return (
    <section className={cn("w-80 overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-panel backdrop-blur", className)}>
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Layers3 className="h-4 w-4 text-primary" />
            TPVD Layers
          </div>
          <p className="text-xs text-slate-500">Visibility, opacity, and base map</p>
        </div>
        <Badge variant="slate">{layers.length || "..."} layers</Badge>
      </div>

      <div className="max-h-[46vh] overflow-y-auto p-3">
        <div className="mb-3 rounded-md border bg-slate-50 p-3">
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
            <Map className="h-3.5 w-3.5" />
            Base map switcher
          </label>
          <Select value={baseMap} onChange={(event) => setBaseMap(event.target.value as typeof baseMap)}>
            <option value="osm">OpenStreetMap</option>
            <option value="light">Light planning base</option>
            <option value="contrast">High contrast base</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Layer catalog could not be loaded.
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <Accordion type="multiple" defaultValue={["Plot", "Boundary", "Constraint", "Road"]}>
            {Object.entries(groupedLayers).map(([category, items]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    {category}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{items.length}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {items.map((layer) => {
                      const visible = Boolean(layerVisibility[layer.id]);
                      const opacity = layerOpacity[layer.id] ?? layer.opacity;
                      return (
                        <div key={layer.id} className="rounded-md border bg-white p-3">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={visible}
                              onClick={() => toggleLayer(layer.id)}
                              className={cn(
                                "mt-0.5 h-5 w-9 rounded-full border p-0.5 transition-colors",
                                visible ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-slate-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                                  visible ? "translate-x-4" : "translate-x-0"
                                )}
                              />
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: layer.color }} />
                                <span className="truncate text-sm font-semibold text-slate-900">{layer.displayName}</span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{layer.description}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Badge variant={layer.tpvdLayerName ? "secondary" : "outline"}>
                                  {layer.tpvdLayerName ? "TPVD WMS" : "Local vector"}
                                </Badge>
                                {layer.supportsFeatureInfo ? <Badge variant="success">Feature info</Badge> : null}
                                {layer.tpvdLayerName ? <Badge variant="outline">{layer.tpvdLayerName}</Badge> : null}
                              </div>
                            </div>
                          </div>
                          {visible && layer.tpvdLayerName ? (
                            <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 px-2 py-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={buildTpvdLegendUrl(layer.tpvdLayerName)}
                                alt={`${layer.displayName} TPVD legend`}
                                className="h-5 w-8 object-contain"
                              />
                              <span className="text-xs text-slate-500">Live GeoServer legend graphic</span>
                            </div>
                          ) : null}
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              aria-label={`${layer.displayName} opacity`}
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={opacity}
                              onChange={(event) => setLayerOpacity(layer.id, Number(event.target.value))}
                              className="h-2 flex-1 accent-blue-700"
                            />
                            <span className="w-9 text-right text-xs text-slate-500">{Math.round(opacity * 100)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : null}
      </div>

      <div className="border-t border-slate-200 p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={resetLayers}>
          <RotateCcw />
          Reset layer defaults
        </Button>
      </div>
    </section>
  );
}
