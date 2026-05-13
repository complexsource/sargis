"use client";

import { useQuery } from "@tanstack/react-query";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
import type { Feature, FeatureCollection, Geometry, LineString, Point, Polygon } from "geojson";
import { api } from "@/lib/api/client";
import { useLayers, usePlot, useTps, useTpvdFilterBounds } from "@/lib/api/hooks";
import { getMapLibreLayer, getSourceLayerId } from "@/lib/map/layer-style";
import type { GisLayer, SearchFilters } from "@/lib/schemas";
import { buildTpvdWmsTileUrl, type TpvdFinalPlotProperties } from "@/lib/tpvd/service";
import { cn, formatNumber } from "@/lib/utils";
import { useFilterStore } from "@/store/filter-store";
import { useMapStore, type MapCommand } from "@/store/map-store";
import { useSelectionStore } from "@/store/selection-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const center: [number, number] = [72.15, 22.65];

const wmsSourceId = (id: string) => `tpvd-wms-source-${id}`;
const wmsLayerId = (id: string) => `tpvd-wms-${id}`;
const filterHighlightSourceId = "filter-results-highlight";

function baseStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors"
      }
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
        paint: {
          "raster-saturation": -0.25,
          "raster-contrast": 0,
          "raster-brightness-min": 0,
          "raster-brightness-max": 1
        }
      }
    ]
  };
}

const haversine = (a: [number, number], b: [number, number]) => {
  const earthRadiusM = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusM * Math.asin(Math.sqrt(h));
};

const polygonArea = (points: Array<[number, number]>) => {
  if (points.length < 3) return 0;
  const meters = points.map(([lng, lat]) => {
    const x = (lng * 111320 * Math.cos((lat * Math.PI) / 180));
    const y = lat * 110540;
    return [x, y] as [number, number];
  });
  const area = meters.reduce((sum, point, index) => {
    const next = meters[(index + 1) % meters.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
  return Math.abs(area / 2);
};

const webMercatorToLngLat = ([x, y]: [number, number]): [number, number] => {
  const lng = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) * 360) / Math.PI - 90;
  return [lng, lat];
};

const filterValueIsActive = (value: unknown) => value !== undefined && value !== null && value !== "";

const liveSpatialFilterKeys: Array<keyof SearchFilters> = [
  "district",
  "city",
  "urbanAuthority",
  "village",
  "tpsName",
  "tpsNumber",
  "plotId",
  "surveyNumber",
  "originalPlotNumber",
  "finalPlotNumber",
  "reservationType",
  "minArea",
  "maxArea"
];

const hasActiveSpatialFilter = (filters: SearchFilters) =>
  liveSpatialFilterKeys.some((key) => filterValueIsActive(filters[key]));

const coordinateCollection = (coordinates: Array<[number, number]>): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: coordinates.map((coordinate, index) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: coordinate
    },
    properties: { index }
  }))
});

const measureGeoJson = (points: Array<[number, number]>, mode: "distance" | "area" | null): FeatureCollection => {
  const features: Array<Feature<Point | LineString | Polygon>> = points.map((coordinate, index) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: coordinate },
    properties: { index: index + 1 }
  }));

  if (points.length > 1) {
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: points },
      properties: { kind: "measure-line" }
    });
  }

  if (mode === "area" && points.length > 2) {
    features.push({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [[...points, points[0]]] },
      properties: { kind: "measure-area" }
    });
  }

  return { type: "FeatureCollection", features };
};

function applyBasePaint(map: MapLibreMap, baseMap: "osm" | "light" | "contrast") {
  if (!map.getLayer("osm")) return;

  if (baseMap === "light") {
    map.setPaintProperty("osm", "raster-saturation", -0.85);
    map.setPaintProperty("osm", "raster-contrast", -0.15);
    map.setPaintProperty("osm", "raster-brightness-min", 0.18);
    map.setPaintProperty("osm", "raster-brightness-max", 0.98);
  } else if (baseMap === "contrast") {
    map.setPaintProperty("osm", "raster-saturation", -0.35);
    map.setPaintProperty("osm", "raster-contrast", 0.35);
    map.setPaintProperty("osm", "raster-brightness-min", 0);
    map.setPaintProperty("osm", "raster-brightness-max", 0.88);
  } else {
    map.setPaintProperty("osm", "raster-saturation", -0.25);
    map.setPaintProperty("osm", "raster-contrast", 0);
    map.setPaintProperty("osm", "raster-brightness-min", 0);
    map.setPaintProperty("osm", "raster-brightness-max", 1);
  }
}

const plotSpecificFilterKeys: Array<keyof SearchFilters> = ["plotId", "finalPlotNumber", "originalPlotNumber", "surveyNumber"];

const hasPlotSpecificFilter = (filters: SearchFilters) =>
  plotSpecificFilterKeys.some((key) => filterValueIsActive(filters[key]));

export function GisMap({ className, panelLeftWidth = 0, panelRightWidth = 0 }: { className?: string; panelLeftWidth?: number; panelRightWidth?: number }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const measureModeRef = useRef<"distance" | "area" | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<Array<[number, number]>>([]);
  const [tpvdPopup, setTpvdPopup] = useState<{
    coordinate: [number, number];
    properties?: TpvdFinalPlotProperties;
    label?: string;
    sourceLabel?: string;
  } | null>(null);

  const { data: layers = [], isLoading: layersLoading, isError: layersError } = useLayers();
  const filters = useFilterStore((state) => state.filters);
  const selectedPlotId = useSelectionStore((state) => state.selectedPlotId);
  const selectedTpsId = useSelectionStore((state) => state.selectedTpsId);
  const selectPlot = useSelectionStore((state) => state.selectPlot);
  const tpvdSearchTarget = useSelectionStore((state) => state.tpvdSearchTarget);
  const tpvdExtentTarget = useSelectionStore((state) => state.tpvdExtentTarget);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const { data: selectedPlot } = usePlot(selectedPlotId);
  const { data: selectedTps } = useTps(selectedTpsId);
  const layerVisibility = useMapStore((state) => state.layerVisibility);
  const layerOpacity = useMapStore((state) => state.layerOpacity);
  const baseMap = useMapStore((state) => state.baseMap);
  const command = useMapStore((state) => state.command);
  const clearCommand = useMapStore((state) => state.clearCommand);
  const activeMeasureMode = useMapStore((state) => state.activeMeasureMode);

  const activeLayers = useMemo(() => layers.filter((layer) => layerVisibility[layer.id]), [layers, layerVisibility]);
  const activeVectorLayers = useMemo(() => activeLayers.filter((layer) => layer.serviceMode === "mock-vector"), [activeLayers]);
  const activeVectorLayerIds = useMemo(() => activeVectorLayers.map((layer) => layer.id).sort(), [activeVectorLayers]);
  const activeWmsCount = useMemo(() => activeLayers.filter((layer) => layer.tpvdLayerName).length, [activeLayers]);
  const activeMockCount = activeVectorLayerIds.length;
  const debouncedFilters = useDebouncedValue(filters, 450);
  const filterFocusKey = useMemo(() => JSON.stringify(debouncedFilters), [debouncedFilters]);
  const hasLiveSpatialFilter = useMemo(() => hasActiveSpatialFilter(debouncedFilters), [debouncedFilters]);
  const tpvdFilterBoundsQuery = useTpvdFilterBounds(debouncedFilters, loaded && hasLiveSpatialFilter);

  const geoJsonQuery = useQuery({
    queryKey: ["active-layer-bundle", activeVectorLayerIds],
    enabled: loaded && activeVectorLayerIds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(activeVectorLayerIds.map(async (id) => [id, await api.getLayerGeoJson(id)] as const));
      return Object.fromEntries(entries) as Record<string, FeatureCollection>;
    }
  });

  useEffect(() => {
    measureModeRef.current = activeMeasureMode;
    if (activeMeasureMode) setMeasurePoints([]);
  }, [activeMeasureMode]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: baseStyle(),
      center,
      zoom: 6.1,
      minZoom: 5,
      maxZoom: 19,
      attributionControl: false
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    mapRef.current = map;

    map.on("load", () => setLoaded(true));
    map.on("mousemove", (event) => {
      const featureIds = ["gis-final-plot-boundary", "gis-original-plot-boundary"].filter((id) => map.getLayer(id));
      const features = featureIds.length ? map.queryRenderedFeatures(event.point, { layers: featureIds }) : [];
      map.getCanvas().style.cursor = features.length || measureModeRef.current ? "crosshair" : "";
    });
    map.on("click", (event) => {
      const mode = measureModeRef.current;
      if (mode) {
        setMeasurePoints((current) => [...current, [event.lngLat.lng, event.lngLat.lat]]);
        return;
      }

      const featureIds = ["gis-final-plot-boundary", "gis-original-plot-boundary"].filter((id) => map.getLayer(id));
      const features = featureIds.length ? map.queryRenderedFeatures(event.point, { layers: featureIds }) : [];
      const first = features.find((feature) => feature.properties?.id);
      if (first?.properties?.id) {
        selectPlot(String(first.properties.id));
        return;
      }

      void api.getTpvdNearbyFeature(event.lngLat.lng, event.lngLat.lat).then((feature) => {
        if (!feature?.properties) {
          setTpvdPopup(null);
          const highlightSource = map.getSource("tpvd-live-highlight") as GeoJSONSource | undefined;
          highlightSource?.setData({ type: "FeatureCollection", features: [] });
          return;
        }
        setTpvdPopup({
          coordinate: [event.lngLat.lng, event.lngLat.lat],
          properties: feature.properties
        });

        const highlightSource = map.getSource("tpvd-live-highlight") as GeoJSONSource | undefined;
        if (highlightSource && feature.geometry) {
          highlightSource.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: feature.geometry as Geometry,
                properties: feature.properties
              }
            ]
          });
        }
      });
    });

    return () => {
      selectedMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [selectPlot]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    applyBasePaint(map, baseMap);
  }, [baseMap, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const activeWmsSet = new Set(activeLayers.filter((layer) => layer.tpvdLayerName).map((layer) => layer.id));

    layers.forEach((layer) => {
      const layerId = wmsLayerId(layer.id);
      const sourceId = wmsSourceId(layer.id);
      if (!activeWmsSet.has(layer.id)) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    });

    activeLayers.forEach((layer) => {
      if (!layer.tpvdLayerName) return;
      const sourceId = wmsSourceId(layer.id);
      const layerId = wmsLayerId(layer.id);
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "raster",
          tiles: [buildTpvdWmsTileUrl(layer.tpvdLayerName)],
          tileSize: 256,
          attribution: "TPVD GeoServer WMS"
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "raster",
          source: sourceId,
          minzoom: layer.minZoom,
          maxzoom: layer.maxZoom,
          paint: {
            "raster-opacity": layerOpacity[layer.id] ?? layer.opacity
          }
        });
      } else {
        map.setPaintProperty(layerId, "raster-opacity", layerOpacity[layer.id] ?? layer.opacity);
      }
    });
  }, [activeLayers, layerOpacity, layers, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    const layerData = geoJsonQuery.data;
    if (!map || !loaded || !layerData) return;

    const activeSet = new Set(activeVectorLayerIds);
    layers.forEach((layer) => {
      const mapLayerId = getSourceLayerId(layer.id);
      if (!activeSet.has(layer.id)) {
        if (map.getLayer(mapLayerId)) map.removeLayer(mapLayerId);
        if (map.getSource(layer.id)) map.removeSource(layer.id);
      }
    });

    activeVectorLayers.forEach((layer: GisLayer) => {
      const sourceData = layerData[layer.id];
      if (!sourceData) return;

      const source = map.getSource(layer.id) as GeoJSONSource | undefined;
      if (source) {
        source.setData(sourceData);
      } else {
        map.addSource(layer.id, {
          type: "geojson",
          data: sourceData
        });
      }

      const mapLayerId = getSourceLayerId(layer.id);
      const layerSpec = getMapLibreLayer(layer, layerOpacity[layer.id] ?? layer.opacity);
      if (!map.getLayer(mapLayerId)) {
        map.addLayer(layerSpec);
      } else if (layer.geometryType === "fill") {
        map.setPaintProperty(mapLayerId, "fill-opacity", layerOpacity[layer.id] ?? layer.opacity);
      } else if (layer.geometryType === "symbol") {
        map.setPaintProperty(mapLayerId, "text-opacity", layerOpacity[layer.id] ?? layer.opacity);
      } else {
        map.setPaintProperty(mapLayerId, "line-opacity", layerOpacity[layer.id] ?? layer.opacity);
      }
    });
  }, [activeVectorLayerIds, activeVectorLayers, geoJsonQuery.data, layerOpacity, layers, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    if (!map.getSource("tpvd-live-highlight")) {
      map.addSource("tpvd-live-highlight", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
      map.addLayer({
        id: "tpvd-live-highlight-fill",
        type: "fill",
        source: "tpvd-live-highlight",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: {
          "fill-color": "#22d3ee",
          "fill-opacity": 0.18
        }
      });
      map.addLayer({
        id: "tpvd-live-highlight-line",
        type: "line",
        source: "tpvd-live-highlight",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 4
        }
      });
      map.addLayer({
        id: "tpvd-live-search-point",
        type: "circle",
        source: "tpvd-live-highlight",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 8,
          "circle-color": "#06b6d4",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      });
    }

    if (!map.getSource(filterHighlightSourceId)) {
      map.addSource(filterHighlightSourceId, {
        type: "geojson",
        data: coordinateCollection([])
      });
      map.addLayer({
        id: "filter-results-highlight-halo",
        type: "circle",
        source: filterHighlightSourceId,
        paint: {
          "circle-radius": 18,
          "circle-color": "#2563eb",
          "circle-opacity": 0.14
        }
      });
      map.addLayer({
        id: "filter-results-highlight-point",
        type: "circle",
        source: filterHighlightSourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      });
    }
  }, [loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const source = map.getSource(filterHighlightSourceId) as GeoJSONSource | undefined;

    if (!hasLiveSpatialFilter) {
      source?.setData(coordinateCollection([]));
      return;
    }

    const payload = tpvdFilterBoundsQuery.data;

    if (!payload?.bounds) {
      source?.setData(coordinateCollection([]));
      return;
    }

    if (selectedPlotId) selectPlot(null);

    setTpvdPopup(null);
    const showDots = hasPlotSpecificFilter(debouncedFilters);
    source?.setData(showDots ? coordinateCollection(payload.points) : coordinateCollection([]));

    const padLeft = panelLeftWidth + 60;
    const padRight = panelRightWidth + 60;
    map.fitBounds(
      [
        [payload.bounds[0], payload.bounds[1]],
        [payload.bounds[2], payload.bounds[3]]
      ],
      {
        padding: { top: 80, right: padRight, bottom: 80, left: padLeft },
        maxZoom: payload.layerName === "ctp:tps_boundary" ? 14 : 17,
        essential: true
      }
    );
  }, [filterFocusKey, hasLiveSpatialFilter, loaded, selectPlot, selectedPlotId, tpvdFilterBoundsQuery.data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const data = measureGeoJson(measurePoints, activeMeasureMode);
    const source = map.getSource("measure-source") as GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
    } else {
      map.addSource("measure-source", { type: "geojson", data });
      map.addLayer({
        id: "measure-area-fill",
        type: "fill",
        source: "measure-source",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: {
          "fill-color": "#2563eb",
          "fill-opacity": 0.12
        }
      });
      map.addLayer({
        id: "measure-line",
        type: "line",
        source: "measure-source",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": "#2563eb",
          "line-width": 3,
          "line-dasharray": [2, 1]
        }
      });
      map.addLayer({
        id: "measure-points",
        type: "circle",
        source: "measure-source",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffffff",
          "circle-stroke-color": "#2563eb",
          "circle-stroke-width": 2
        }
      });
    }
  }, [activeMeasureMode, loaded, measurePoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    if (!selectedPlotId || !selectedPlot) {
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;
      return;
    }

    const marker = selectedMarkerRef.current ?? new maplibregl.Marker({ color: "#0f766e" });
    marker.setLngLat(selectedPlot.coordinates).addTo(map);
    selectedMarkerRef.current = marker;
    map.flyTo({ center: selectedPlot.coordinates, zoom: 16, essential: true });
  }, [loaded, selectedPlot, selectedPlotId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !selectedTps) return;
    map.flyTo({ center: selectedTps.centroid, zoom: 13, essential: true });
    setTpvdPopup({
      coordinate: selectedTps.centroid,
      label: `${selectedTps.name} - TPS ${selectedTps.number}`,
      sourceLabel: "TPS result",
      properties: {
        search: `${selectedTps.name} - TPS ${selectedTps.number}`,
        village: selectedTps.village,
        authority: selectedTps.urbanAuthority,
        district: selectedTps.district,
        status: selectedTps.status
      }
    });
  }, [loaded, selectedTps]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tpvdSearchTarget) return;
    const coordinate = webMercatorToLngLat(tpvdSearchTarget.coordinates3857);
    setTpvdPopup({
      coordinate,
      label: tpvdSearchTarget.label,
      sourceLabel: "Live TPVD search",
      properties: {
        gid: tpvdSearchTarget.gid,
        search: tpvdSearchTarget.label
      }
    });

    const highlightSource = map.getSource("tpvd-live-highlight") as GeoJSONSource | undefined;
    if (highlightSource) {
      highlightSource.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: coordinate },
            properties: {
              gid: tpvdSearchTarget.gid,
              search: tpvdSearchTarget.label
            }
          }
        ]
      });
    }
    map.flyTo({ center: coordinate, zoom: 17, essential: true });
  }, [tpvdSearchTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tpvdExtentTarget) return;
    const [minX, minY, maxX, maxY] = tpvdExtentTarget.extent3857;
    const sw = webMercatorToLngLat([minX, minY]);
    const ne = webMercatorToLngLat([maxX, maxY]);
    map.fitBounds([sw, ne], {
      padding: { top: 80, right: panelRightWidth + 80, bottom: 80, left: panelLeftWidth + 80 },
      maxZoom: 17,
      essential: true
    });
    setTpvdPopup({
      coordinate: [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2],
      label: tpvdExtentTarget.label,
      sourceLabel: "TPS extent",
      properties: {
        search: tpvdExtentTarget.label
      }
    });
  }, [tpvdExtentTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !command) return;

    const execute = async (nextCommand: MapCommand) => {
      if (nextCommand === "zoom-in") map.zoomIn();
      if (nextCommand === "zoom-out") map.zoomOut();
      if (nextCommand === "reset") {
        setMeasurePoints([]);
        setTpvdPopup(null);
        const highlightSource = map.getSource("tpvd-live-highlight") as GeoJSONSource | undefined;
        highlightSource?.setData({ type: "FeatureCollection", features: [] });
        selectedMarkerRef.current?.remove();
        selectedMarkerRef.current = null;
        clearSelection();
        map.flyTo({ center, zoom: 6.1, essential: true });
      }
      if (nextCommand === "fit-selected" && selectedPlot) {
        map.flyTo({ center: selectedPlot.coordinates, zoom: 16, essential: true });
      }
      if (nextCommand === "fit-selected" && !selectedPlot && tpvdPopup) {
        map.flyTo({ center: tpvdPopup.coordinate, zoom: 17, essential: true });
      }
      if (nextCommand === "locate" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 15,
            essential: true
          });
        });
      }
      if (nextCommand === "fullscreen") {
        await frameRef.current?.requestFullscreen?.();
      }
      if (nextCommand === "print") {
        window.print();
      }
    };

    void execute(command).finally(clearCommand);
  }, [clearCommand, clearSelection, command, selectedPlot, tpvdPopup]);

  const measureDistance = measurePoints.reduce((sum, point, index) => {
    if (index === 0) return 0;
    return sum + haversine(measurePoints[index - 1], point);
  }, 0);
  const measuredArea = polygonArea(measurePoints);

  return (
    <div ref={frameRef} className={cn("relative h-full w-full overflow-hidden bg-slate-200", className)}>
      <div ref={mapContainerRef} className="absolute inset-0" />
      {!loaded ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/80">
          <div className="w-80 rounded-lg border bg-white p-4 shadow-panel">
            <Skeleton className="mb-3 h-5 w-40" />
            <Skeleton className="h-28 w-full" />
            <p className="mt-3 text-sm text-slate-500">Preparing OpenStreetMap and TPVD-style layers...</p>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold shadow-panel backdrop-blur">
        <Badge variant={layersError ? "danger" : "success"}>{layersError ? "Layer error" : "GIS ready"}</Badge>
        <span className="text-slate-500">
          {geoJsonQuery.isFetching || layersLoading ? "Loading layers" : `${activeWmsCount} TPVD layers`}
        </span>
        <span className="hidden text-slate-400 sm:inline">
          {activeMockCount ? `+ ${activeMockCount} local overlay${activeMockCount === 1 ? "" : "s"}` : "official overlays only"}
        </span>
      </div>

      {tpvdPopup ? (
        <div className="absolute right-4 top-16 z-30 w-[min(92vw,360px)] rounded-lg border border-cyan-200 bg-white/95 p-3 shadow-panel backdrop-blur" style={{ right: panelRightWidth > 0 ? panelRightWidth + 12 : 16 }}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-950">{tpvdPopup.sourceLabel ?? "TPVD Live Feature"}</div>
              <div className="text-xs text-slate-500">
                {tpvdPopup.properties?.gid ? "ctp:final_plot_boundary / fp_search" : "Selected TPS and search context"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTpvdPopup(null);
                const highlightSource = mapRef.current?.getSource("tpvd-live-highlight") as GeoJSONSource | undefined;
                highlightSource?.setData({ type: "FeatureCollection", features: [] });
              }}
              className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Search", tpvdPopup.properties?.search ?? tpvdPopup.label],
              ["TPS Name", tpvdPopup.properties?.title_tps_name ?? tpvdPopup.properties?.tps_name],
              ["TPS No", tpvdPopup.properties?.tps_no],
              ["Final Plot", tpvdPopup.properties?.fp_no],
              ["Village", tpvdPopup.properties?.village],
              ["Authority", tpvdPopup.properties?.authority],
              ["District", tpvdPopup.properties?.district],
              ["Status", tpvdPopup.properties?.status],
              ["Reservation", tpvdPopup.properties?.reser_type ?? tpvdPopup.properties?.reser_use],
              ["Area", tpvdPopup.properties?.fp_area_final ?? tpvdPopup.properties?.fp_area]
            ].map(([label, value]) =>
              value ? (
                <div key={String(label)} className="rounded-md bg-slate-50 p-2">
                  <div className="font-semibold uppercase text-slate-500">{label}</div>
                  <div className="mt-0.5 font-medium text-slate-900">{String(value)}</div>
                </div>
              ) : null
            )}
          </div>
          <div className="mt-3 rounded-md bg-cyan-50 p-2 text-xs leading-5 text-cyan-900">
            Click another plot on the live WMS overlay to refresh this card. Mock feasibility details remain available in
            the right drawer for enriched planning analysis.
          </div>
          {tpvdPopup.properties?.gid ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`https://tpvd.openprp.in/ctpvd/data/pdf/ctpvd_${tpvdPopup.properties.gid}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                Print plot PDF
              </a>
              <a
                href="https://tpvd.openprp.in/pro/main/modules/f_form/f_form_tab.php"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                F-form endpoint
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeMeasureMode ? (
        <div className="absolute bottom-32 left-1/2 z-20 w-[min(92vw,420px)] -translate-x-1/2 rounded-lg border border-blue-200 bg-white/95 p-3 text-sm shadow-panel backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">
              {activeMeasureMode === "distance" ? "Distance measurement" : "Area measurement"}
            </span>
            <Badge variant="secondary">{measurePoints.length} point{measurePoints.length === 1 ? "" : "s"}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Click the map to add measurement vertices. Reset map clears the sketch.</p>
          <div className="mt-2 text-sm font-semibold text-blue-800">
            {activeMeasureMode === "distance"
              ? `${formatNumber(measureDistance, 1)} m`
              : `${formatNumber(measuredArea, 0)} sq m`}
          </div>
        </div>
      ) : null}
    </div>
  );
}
