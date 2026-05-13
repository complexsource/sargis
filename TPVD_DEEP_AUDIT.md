# TPVD Deep Feature, Layer, API, UI, and GIS Interaction Audit

Primary references audited:

- Public district/TPS landing map: `https://tpvd.openprp.in/pro/main/modules/role_public/map/index.php`
- TPS map viewer: `https://tpvd.openprp.in/ctpvd/index.html?geo_extent=277BOX(...)`
- Public JavaScript and service endpoints loaded by those pages.

The TPVD system is an OpenLayers 3 + GeoServer GIS application. It uses WMS tiled overlays for most visible map layers, WFS for autocomplete/search, GeoServer `GetFeatureInfo` for plot click details, PHP endpoints for district/TPS lookup, and static/file endpoints for plot-related documents.

## 1. TPVD Feature Audit

- Public landing map shows Gujarat district/town points from `gujarat_district.geojson`.
- Clicking a district point calls `src/select/get_autho.php` and returns authority-grouped TPS records.
- A modal TPS grid displays `TPS Name`, `TPS No`, and a `View TPS` button.
- `View TPS` posts `tps_id` to `src/select/get_tps_id.php`, receives a `BOX(minx miny,maxx maxy)` extent, then redirects into `/ctpvd/index.html?geo_extent=...`.
- TPS map is a full-screen OpenLayers map with:
  - left layer panel,
  - right toolbar/legend panel,
  - floating search bar,
  - map popup,
  - collapsible layer/legend buttons,
  - admin login shortcut,
  - footer attribution.
- TPS map URL `geo_extent` is parsed client-side and used to fit the map to the selected TPS extent.
- Plot click behavior queries the final plot boundary WMS layer and renders a tabular popup.
- Popup actions include:
  - `View Details`, posting to `f_form_tab.php`,
  - `Print this Plot` PDF,
  - conditional document links for Mapani Sheet, B.U. Permission, Rajachithi, Layout Plan, Site Photograph, and DWG file.

## 2. Layer/Data Audit

TPVD declares primary, other, default/extra, base, and legend-only layers.

Primary TPS layers from `1app.js`:

- `ctp:india_state_layer`
- `ctp:hissa_line`
- `ctp:village_boundary`
- `ctp:survey_line`
- `ctp:water_bodies`
- `ctp:gamtal_boundary`
- `ctp:original_plot_boundary`
- `ctp:survey_no`
- `ctp:road`
- `ctp:final_plot_boundary`
- `ctp:tps_boundary`

Other/default groups:

- `ctp:extra_layer`
- `ctp:general_text`
- `ctp:railway_group`

Legend list entries in `index.html`:

- `ctp:final_plot_boundary` - Final Plot Boundary
- `ctp:original_plot_boundary` - Original Plot Boundary
- `ctp:canal` - Canal
- `ctp:tps_boundary` - TPS Boundary
- `ctp:river` - River
- `ctp:building_structure` - Building Structure
- `ctp:gamtal_boundary` - Gamtal Boundary
- `ctp:building_structure_line` - Building Structure Line
- `ctp:ht_line` - HT Line
- `ctp:compound_wall` - Compound Wall
- `ctp:dp_reservation_line` - DP Reservation Line
- `ctp:flood_embankment` - Flood Embankment
- `ctp:ongc_pipeline` - ONGC Pipeline
- `ctp:hissa_line` - Hissa Line
- `ctp:railway_boundary` - Railway Boundary
- `ctp:railway_line` - Railway Line
- `ctp:road` - Road
- `ctp:survey_line` - Survey Line
- `ctp:village_boundary` - Village Boundary
- `ctp:water_body` / `ctp:water_bodies` - Water Body

Base/imagery layers:

- OpenStreetMap
- Google hybrid/satellite tile layer
- TPVD tile-server city imagery for Ahmedabad, Anand, Anjar, Bavala, Bharuch, Bhavnagar, Bhuj, Gandhinagar, Jamnagar, Nadiad, Navsari, Rajkot, Surat, Una, Unjha, and Vadodara.

GeoServer WFS capabilities publicly expose at least:

- `ctp:final_plot_boundary`
- `ctp:tps_boundary`
- `ctp:fort_wall`

`ctp:final_plot_boundary` schema fields:

- `gid`
- `tps_name`
- `tps_no`
- `village`
- `city`
- `authority`
- `district`
- `state`
- `status`
- `fp_no`
- `reser_use`
- `reser_type`
- `tps_id`
- `the_geom`
- `show_hide`
- `fp_area`
- `fp_area_final`
- `temp`
- `search`
- `dxf_access`
- `epsg_code`

`ctp:tps_boundary` schema fields:

- `gid`
- `tps_name`
- `tps_no`
- `village`
- `city`
- `authority`
- `district`
- `state`
- `status`
- `tps_id`
- `tp_name`
- `the_geom`
- `show_hide`
- `dxf_access`
- `epsg_code`

`ctp:fp_search` schema fields:

- `gid`
- `search`
- `the_geom`

## 3. API Structure Audit

TPVD public endpoints observed:

- WMS: `http://tpvd.openprp.in/geoserver/wms`
- WFS: `http://tpvd.openprp.in/geoserver/wfs`
- WMS legend: `/geoserver/wms?REQUEST=GetLegendGraphic&...&LAYER=ctp:<layer>`
- WFS autocomplete:
  - service: `WFS`
  - version: `2.0.0`
  - request: `GetFeature`
  - typeName: `ctp:fp_search`
  - outputFormat: `application/json`
  - srsname: `EPSG:3857`
  - viewparams: `query:<text>`
- Feature info:
  - `LayerSourceArray[12].getGetFeatureInfoUrl(...)`
  - index 12 corresponds to `ctp:final_plot_boundary`
  - `INFO_FORMAT=application/json`
- District-to-TPS:
  - POST `src/select/get_autho.php`
  - body: `name=<district>`
  - returns TPS rows with `tps_name`, `tps_no`, `tps_authority`, `tps_id`, `title_tps_name`
- TPS-to-extent:
  - POST `src/select/get_tps_id.php`
  - body: `tps_name=<tps_id>`
  - returns `BOX(minx miny,maxx maxy)`

Implementation decision:

- Use the live TPVD public endpoints through app API routes where practical.
- Keep mock data for reliable fallback and for enhanced feasibility fields that TPVD does not expose publicly.
- Use tiled WMS raster overlays for large TPVD layers to avoid downloading huge WFS datasets.
- Use WFS only for search, selected/nearby features, and targeted metadata.

## 4. UI Flow Audit

Landing map flow:

1. User opens public map.
2. Gujarat district/town points are visible.
3. User clicks a district point.
4. Authority options appear.
5. User selects authority.
6. Modal table lists TPS records.
7. User clicks `View TPS`.
8. App redirects to TPS viewer with `geo_extent`.

TPS viewer flow:

1. User opens a TPS map extent.
2. Left layer list is open by default.
3. Right toolbar contains legend list.
4. Search accepts `District TpsName TpsNo FpNo...`.
5. Autocomplete queries `ctp:fp_search`.
6. Selecting a suggestion centers/zooms to feature and adds a marker.
7. Clicking a final plot queries `ctp:final_plot_boundary`.
8. Popup shows plot details and document/action links.

## 5. GIS Interaction Checklist

- Layer grouping with base/background, primary TPS layers, other layers, and extra layers.
- Layer toggle controls.
- Tiled WMS rendering for heavy GIS layers.
- WMS legend graphic URLs.
- Feature highlight on search/click.
- Search autocomplete backed by WFS.
- Zoom to selected feature.
- Fit to TPS extent.
- Popup details from final plot fields.
- Right-side detail panel for selected plot.
- Bottom result grid for TPS and plot search.
- Scale line and coordinate readout equivalent.
- Loading/progress feedback for layer loads.
- Error and empty states.
- Measure distance/area tools.
- Print/export/report pathway.

## 6. Current App Gap Analysis

The first app version had a professional shell but behaved too much like a mock dashboard:

- It used mostly hand-built mock GeoJSON instead of TPVD WMS/WFS service behavior.
- It lacked TPVD-specific public endpoints such as `get_autho.php`, `get_tps_id.php`, `ctp:fp_search`, WMS legends, and `GetFeatureInfo` style feature data.
- It did not expose city imagery/base layer choices from TPVD.
- It did not represent all TPVD legend layers such as Canal, River, Flood Embankment, ONGC Pipeline, General Text, Railway Group, Building Structure, and DP Reservation Line.
- It needed richer popup behavior, layer load status, selected feature metadata, and live TPS data visibility.

## 7. Upgrade Implementation Checklist

- Add TPVD service metadata to layer definitions.
- Render TPVD WMS layers as tiled raster overlays in MapLibre with opacity controls.
- Preserve mock vector layers as fallback/enhanced local intelligence.
- Add API routes for live TPVD TPS-by-district, TPS extent, WFS plot autocomplete, and nearby final plot lookup.
- Add WFS autocomplete results to the search box.
- Add click-to-query fallback against live `ctp:final_plot_boundary`.
- Add map popup card and feature highlight.
- Add live TPS district panel.
- Add actual TPVD field names in plot detail/source panels.
- Add real legend URLs and legend status for each layer.
