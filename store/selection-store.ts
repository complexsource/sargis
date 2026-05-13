import { create } from "zustand";

type SelectionState = {
  selectedPlotId: string | null;
  selectedTpsId: string | null;
  tpvdSearchTarget: {
    gid: number;
    label: string;
    coordinates3857: [number, number];
  } | null;
  tpvdExtentTarget: {
    label: string;
    extent3857: [number, number, number, number];
  } | null;
  detailsOpen: boolean;
  selectPlot: (plotId: string | null) => void;
  selectTps: (tpsId: string | null) => void;
  selectTpvdSearchTarget: (target: SelectionState["tpvdSearchTarget"]) => void;
  selectTpvdExtentTarget: (target: SelectionState["tpvdExtentTarget"]) => void;
  clearSelection: () => void;
  setDetailsOpen: (open: boolean) => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedPlotId: null,
  selectedTpsId: null,
  tpvdSearchTarget: null,
  tpvdExtentTarget: null,
  detailsOpen: false,
  selectPlot: (plotId) =>
    set({
      selectedPlotId: plotId,
      selectedTpsId: null,
      tpvdSearchTarget: null,
      detailsOpen: Boolean(plotId)
    }),
  selectTps: (tpsId) =>
    set({
      selectedTpsId: tpsId,
      selectedPlotId: null,
      tpvdSearchTarget: null,
      tpvdExtentTarget: null,
      detailsOpen: false
    }),
  selectTpvdSearchTarget: (tpvdSearchTarget) =>
    set({
      tpvdSearchTarget,
      selectedPlotId: null,
      detailsOpen: false
    }),
  selectTpvdExtentTarget: (tpvdExtentTarget) =>
    set({
      tpvdExtentTarget,
      selectedPlotId: null,
      detailsOpen: false
    }),
  clearSelection: () =>
    set({
      selectedPlotId: null,
      selectedTpsId: null,
      tpvdSearchTarget: null,
      tpvdExtentTarget: null,
      detailsOpen: false
    }),
  setDetailsOpen: (detailsOpen) => set({ detailsOpen })
}));
