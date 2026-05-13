"use client";

import Link from "next/link";
import { FileText, Home, Layers3, ListTree, PanelLeftClose, PanelLeftOpen, Search, Table2 } from "lucide-react";
import { useState } from "react";
import { usePlotSearch, useTpsSearch } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { useFilterStore } from "@/store/filter-store";
import { useSelectionStore } from "@/store/selection-store";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { LayerManager } from "@/components/layers/layer-manager";
import { LegendPanel } from "@/components/layers/legend-panel";
import { GisMap } from "@/components/map/gis-map";
import { MapToolbar } from "@/components/map/map-toolbar";
import { PlotDetailDrawer } from "@/components/plot/plot-detail-drawer";
import { ResultsTable } from "@/components/tps/results-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AnalyzerDashboard() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const filters = useFilterStore((state) => state.filters);
  const setDetailsOpen = useSelectionStore((state) => state.setDetailsOpen);
  const detailsOpen = useSelectionStore((state) => state.detailsOpen);

  const plotQuery = usePlotSearch(filters);
  const tpsQuery = useTpsSearch(filters);

  return (
    <main className="h-screen overflow-hidden bg-slate-100 text-slate-950">
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm lg:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-label={filtersOpen ? "Collapse filters" : "Open filters"}
          >
            {filtersOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open filters">
                <Search />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Search and filters</SheetTitle>
              </SheetHeader>
              <FilterSidebar />
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-black text-white">
              S
            </div>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-black tracking-tight">
                <span className="text-slate-950">SAR</span><span className="text-blue-600">GIS</span>
              </span>
              <span className="block truncate text-[11px] text-slate-500">Spatial GIS Platform</span>
            </span>
          </Link>
          <Badge variant="secondary" className="hidden md:inline-flex">
            Live TPVD WMS + OSM
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile layers sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="xl:hidden">
                <Layers3 />
                Layers
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[94vw] max-w-sm p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Layer manager</SheetTitle>
              </SheetHeader>
              <LayerManager className="h-full w-full rounded-none border-0 shadow-none" />
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Table2 />
                Results
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[82vh] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Search results</SheetTitle>
              </SheetHeader>
              <ResultsTable
                plots={plotQuery.data ?? []}
                tps={tpsQuery.data ?? []}
                isLoading={plotQuery.isLoading || tpsQuery.isLoading}
                isError={plotQuery.isError || tpsQuery.isError}
              />
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => setResultsOpen((open) => !open)}>
            <Table2 />
            Results
          </Button>
          <Button variant="outline" size="sm" className="hidden lg:inline-flex" onClick={() => setDetailsOpen(!detailsOpen)}>
            <FileText />
            Details
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="premium" size="sm" className="lg:hidden">
                <FileText />
                Plot
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Selected plot details</SheetTitle>
              </SheetHeader>
              <PlotDetailDrawer />
            </SheetContent>
          </Sheet>
          <Button asChild variant="ghost" size="icon" aria-label="Home">
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative h-[calc(100vh-3.5rem)] overflow-hidden">
        <GisMap
          panelLeftWidth={filtersOpen ? 360 : 0}
          panelRightWidth={detailsOpen ? 390 : 0}
        />

        {filtersOpen ? (
          <div className="absolute inset-y-0 left-0 z-20 hidden w-[360px] lg:block">
            <FilterSidebar />
          </div>
        ) : null}

        <div className="absolute right-3 top-3 z-20" style={{ right: detailsOpen ? 402 : 12 }}>
          <MapToolbar />
        </div>

        {/* Bottom-left panel stack: Layers + Legend + toggle control bar */}
        <div
          className="absolute bottom-3 z-20 hidden xl:flex flex-col items-start gap-2"
          style={{ left: filtersOpen ? 372 : 12 }}
        >
          {layersOpen ? <LayerManager /> : null}
          {legendOpen ? <LegendPanel /> : null}

          {/* Persistent toggle control bar */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setLayersOpen((open) => !open)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition-colors",
                layersOpen
                  ? "border-slate-800 bg-slate-900 text-white"
                  : "border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50"
              )}
            >
              <Layers3 className="h-3.5 w-3.5" />
              Layers
            </button>
            <button
              type="button"
              onClick={() => setLegendOpen((open) => !open)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition-colors",
                legendOpen
                  ? "border-slate-800 bg-slate-900 text-white"
                  : "border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50"
              )}
            >
              <ListTree className="h-3.5 w-3.5" />
              Legend
            </button>
          </div>
        </div>

        {detailsOpen ? (
          <div className="absolute inset-y-0 right-0 z-20 hidden w-[390px] lg:block">
            <PlotDetailDrawer />
          </div>
        ) : null}

        {resultsOpen ? (
          <div
            className="absolute bottom-0 z-30 hidden h-[260px] rounded-t-lg border border-slate-200 bg-white/98 shadow-panel backdrop-blur md:block"
            style={{
              left: filtersOpen ? 360 : 0,
              right: detailsOpen ? 390 : 0
            }}
          >
            <ResultsTable
              plots={plotQuery.data ?? []}
              tps={tpsQuery.data ?? []}
              isLoading={plotQuery.isLoading || tpsQuery.isLoading}
              isError={plotQuery.isError || tpsQuery.isError}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
