export const TPVD_BROWSER_ORIGIN = "https://tpvd.openprp.in";
export const TPVD_SERVER_ORIGIN = "http://tpvd.openprp.in";
export const TPVD_WMS_URL = `${TPVD_BROWSER_ORIGIN}/geoserver/wms`;
export const TPVD_WFS_URL = `${TPVD_SERVER_ORIGIN}/geoserver/wfs`;
export const TPVD_PUBLIC_MAP_URL = `${TPVD_SERVER_ORIGIN}/pro/main/modules/role_public/map`;

export type TpvdTpsRecord = {
  tps_name: string;
  tps_no: string;
  tps_authority: string;
  tps_id: number;
  title_tps_name: string;
};

export type TpvdSearchFeature = {
  gid: number;
  search: string;
  coordinates: [number, number];
};

export type TpvdFinalPlotProperties = {
  gid?: number;
  tps_name?: string | null;
  title_tps_name?: string | null;
  tps_no?: string | null;
  village?: string | null;
  city?: string | null;
  authority?: string | null;
  district?: string | null;
  state?: string | null;
  status?: string | null;
  fp_no?: string | null;
  reser_use?: string | null;
  reser_type?: string | null;
  tps_id?: number | string | null;
  fp_area?: string | null;
  fp_area_final?: number | null;
  search?: string | null;
  click_distance_m?: number | null;
  dxf_access?: number | null;
  epsg_code?: string | null;
};

function tpvdQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
  });
  return query.toString();
}

export function buildTpvdWmsTileUrl(layerName: string) {
  return `/api/tpvd/wms?layer=${encodeURIComponent(layerName)}&bbox={bbox-epsg-3857}`;
}

export function buildTpvdLegendUrl(layerName: string) {
  return `/api/tpvd/legend-image?layer=${encodeURIComponent(layerName)}`;
}

export function buildTpvdSearchUrl(queryText: string) {
  const cleanQuery = queryText.replace(/[^0-9a-zA-Z ]/g, "");
  const query = tpvdQuery({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeName: "ctp:fp_search",
    outputFormat: "application/json",
    srsname: "EPSG:3857",
    viewparams: `query:${cleanQuery}`
  });

  return `${TPVD_WFS_URL}?${query}`;
}

export function buildTpvdNearbyFinalPlotUrl(lng: number, lat: number, buffer = 0.00045, count = 30) {
  const bbox = [lng - buffer, lat - buffer, lng + buffer, lat + buffer, "EPSG:4326"].join(",");
  const query = tpvdQuery({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeName: "ctp:final_plot_boundary",
    outputFormat: "application/json",
    srsname: "EPSG:4326",
    bbox,
    count
  });

  return `${TPVD_WFS_URL}?${query}`;
}

export async function fetchTpvdTpsByDistrict(district: string): Promise<TpvdTpsRecord[]> {
  const response = await fetch(`${TPVD_PUBLIC_MAP_URL}/src/select/get_autho.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ name: district }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`TPVD TPS request failed: ${response.status}`);
  }

  return (await response.json()) as TpvdTpsRecord[];
}

export async function fetchTpvdTpsExtent(tpsId: string) {
  const response = await fetch(`${TPVD_PUBLIC_MAP_URL}/src/select/get_tps_id.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ tps_name: tpsId }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`TPVD extent request failed: ${response.status}`);
  }

  return response.text();
}

export function parseTpvdBox(box: string) {
  const match = /BOX\(([^ ]+) ([^,]+),([^ ]+) ([^)]+)\)/.exec(box.trim());
  if (!match) return null;
  return {
    raw: box.trim(),
    minX: Number(match[1]),
    minY: Number(match[2]),
    maxX: Number(match[3]),
    maxY: Number(match[4])
  };
}
