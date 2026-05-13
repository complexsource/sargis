"use client";

import {
  LocateFixed,
  MapPinned,
  Maximize2,
  Minus,
  MoveHorizontal,
  Plus,
  Printer,
  Ruler,
  RotateCcw
} from "lucide-react";
import type { ComponentType } from "react";
import { useMapStore, type MapCommand } from "@/store/map-store";
import { Button } from "@/components/ui/button";

const tools: Array<{ command: MapCommand; label: string; icon: ComponentType<{ className?: string }> }> = [
  { command: "zoom-in", label: "Zoom in", icon: Plus },
  { command: "zoom-out", label: "Zoom out", icon: Minus },
  { command: "locate", label: "Current location", icon: LocateFixed },
  { command: "fit-selected", label: "Fit selected plot", icon: MapPinned },
  { command: "reset", label: "Reset map", icon: RotateCcw },
  { command: "measure-distance", label: "Measure distance", icon: MoveHorizontal },
  { command: "measure-area", label: "Measure area", icon: Ruler },
  { command: "fullscreen", label: "Fullscreen", icon: Maximize2 },
  { command: "print", label: "Print / export map", icon: Printer }
];

export function MapToolbar() {
  const runCommand = useMapStore((state) => state.runCommand);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-panel backdrop-blur">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Button key={tool.command} variant="ghost" size="icon" title={tool.label} aria-label={tool.label} onClick={() => runCommand(tool.command)}>
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
