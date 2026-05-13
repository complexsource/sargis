import type { LayerSpecification } from "maplibre-gl";
import type { GisLayer } from "@/lib/schemas";

const layerId = (id: string) => `gis-${id}`;

export function getMapLibreLayer(layer: GisLayer, opacity: number): LayerSpecification {
  const id = layerId(layer.id);

  if (layer.geometryType === "fill") {
    return {
      id,
      type: "fill",
      source: layer.id,
      paint: {
        "fill-color": layer.color,
        "fill-opacity": opacity,
        "fill-outline-color": layer.color
      }
    };
  }

  if (layer.geometryType === "symbol") {
    return {
      id,
      type: "symbol",
      source: layer.id,
      layout: {
        "text-field": ["coalesce", ["get", "label"], ["get", "finalPlotNumber"], ["get", "surveyNumber"], ""],
        "text-font": ["Open Sans Regular"],
        "text-size": 12,
        "text-anchor": "center",
        "text-allow-overlap": false
      },
      paint: {
        "text-color": layer.color,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
        "text-opacity": opacity
      }
    };
  }

  const paint: Record<string, unknown> = {
    "line-color": layer.color,
    "line-width": layer.id.includes("boundary") || layer.id.includes("plot") ? 2.2 : 1.6,
    "line-opacity": opacity
  };

  if (layer.id.includes("railway") || layer.id.includes("hissa")) {
    paint["line-dasharray"] = [2, 2];
  }

  return {
    id,
    type: "line",
    source: layer.id,
    paint
  } as LayerSpecification;
}

export function getSourceLayerId(id: string) {
  return layerId(id);
}
