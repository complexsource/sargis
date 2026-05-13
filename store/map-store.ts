import { create } from "zustand";
import { gisLayers } from "@/lib/mock-data";

export type MapCommand = "zoom-in" | "zoom-out" | "locate" | "fit-selected" | "reset" | "measure-distance" | "measure-area" | "fullscreen" | "print";

type LayerState = Record<string, boolean>;
type OpacityState = Record<string, number>;

type MapState = {
  layerVisibility: LayerState;
  layerOpacity: OpacityState;
  baseMap: "osm" | "light" | "contrast";
  command: MapCommand | null;
  activeMeasureMode: "distance" | "area" | null;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setBaseMap: (baseMap: MapState["baseMap"]) => void;
  resetLayers: () => void;
  runCommand: (command: MapCommand) => void;
  clearCommand: () => void;
};

const defaultVisibility = Object.fromEntries(gisLayers.map((layer) => [layer.id, layer.enabledByDefault]));
const defaultOpacity = Object.fromEntries(gisLayers.map((layer) => [layer.id, layer.opacity]));

export const useMapStore = create<MapState>((set) => ({
  layerVisibility: defaultVisibility,
  layerOpacity: defaultOpacity,
  baseMap: "osm",
  command: null,
  activeMeasureMode: null,
  toggleLayer: (layerId) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layerId]: !state.layerVisibility[layerId]
      }
    })),
  setLayerOpacity: (layerId, opacity) =>
    set((state) => ({
      layerOpacity: {
        ...state.layerOpacity,
        [layerId]: opacity
      }
    })),
  setBaseMap: (baseMap) => set({ baseMap }),
  resetLayers: () =>
    set({
      layerVisibility: defaultVisibility,
      layerOpacity: defaultOpacity,
      baseMap: "osm"
    }),
  runCommand: (command) =>
    set((state) => ({
      command,
      activeMeasureMode:
        command === "measure-distance"
          ? "distance"
          : command === "measure-area"
            ? "area"
            : command === "reset"
              ? null
              : state.activeMeasureMode
    })),
  clearCommand: () => set({ command: null })
}));
