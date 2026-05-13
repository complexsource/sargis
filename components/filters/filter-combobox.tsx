"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
};

export function FilterCombobox({
  id,
  value,
  onChange,
  suggestions,
  isLoading = false,
  placeholder = "Type to search…",
  disabled = false,
  emptyText = "No matches"
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return suggestions.slice(0, 25);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 25);
  }, [suggestions, query]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
    onChange(next);
    setOpen(true);
  };

  const select = (item: string) => {
    setQuery(item);
    onChange(item);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery("");
    onChange("");
    setOpen(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
  };

  const showDropdown = open && !disabled && (filtered.length > 0 || isLoading);

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={disabled ? "Select location first" : placeholder}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : query ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
              className="pointer-events-auto rounded text-slate-400 hover:text-slate-700"
              tabIndex={-1}
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </span>
      </div>

      {showDropdown ? (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {isLoading && filtered.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">{emptyText}</div>
          ) : (
            filtered.map((item) => {
              const active = item === value;
              return (
                <button
                  key={item}
                  type="button"
                  tabIndex={0}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(item)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                    active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-900"
                  )}
                >
                  {active ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="min-w-0 truncate">{item}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
