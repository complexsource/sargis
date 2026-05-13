"use client";

import { Loader2, MapPin, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useFilterStore } from "@/store/filter-store";
import { useSelectionStore } from "@/store/selection-store";

export function SearchAutocomplete({ compact = false }: { compact?: boolean }) {
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const selectTpvdSearchTarget = useSelectionStore((state) => state.selectTpvdSearchTarget);

  const rawQuery = filters.query ?? "";

  const liveQuery = useQuery({
    queryKey: ["tpvd-fp-search", rawQuery],
    queryFn: () => api.searchTpvdFinalPlots(rawQuery),
    enabled: rawQuery.trim().length >= 2,
    staleTime: 30_000
  });

  const suggestions = liveQuery.data ?? [];
  const showDropdown = focused && rawQuery.trim().length >= 2;
  const hasResults = suggestions.length > 0;

  const clearQuery = () => {
    setFilter("query", "");
    inputRef.current?.focus();
  };

  const choose = (gid: number, label: string, coordinates3857: [number, number]) => {
    setFilter("query", label);
    selectTpvdSearchTarget({ gid, label, coordinates3857 });
    setFocused(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setFocused(false);
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          aria-label="Search TPS name, final plot number, survey number"
          value={rawQuery}
          onFocus={() => setFocused(true)}
          onChange={(e) => setFilter("query", e.target.value)}
          placeholder={compact ? "Search plot, TPS…" : "Search TPS name, FP no, survey, village…"}
          className="flex h-11 w-full rounded-md border border-input bg-background py-1 pl-9 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {liveQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : rawQuery ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearQuery}
              className="rounded text-slate-400 hover:text-slate-700"
              tabIndex={-1}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </span>
      </div>

      {showDropdown ? (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg",
            compact ? "max-h-64" : "max-h-80"
          )}
        >
          {liveQuery.isLoading ? (
            <div className="flex items-center gap-2.5 px-4 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching TPVD…
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              {rawQuery.trim().length < 2
                ? "Type at least 2 characters to search."
                : "No results for this query. Try a TPS name, FP number, or village."}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {suggestions.slice(0, 10).map((item) => (
                <li key={item.gid}>
                  <button
                    type="button"
                    tabIndex={0}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(item.gid, item.search, item.coordinates)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {item.search}
                      </span>
                      <span className="block text-xs text-slate-500">
                        GID {item.gid} — click to zoom on map
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {suggestions.length > 10 ? (
                <li className="px-4 py-2 text-xs text-slate-400">
                  {suggestions.length - 10} more results — refine your query to narrow down.
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
