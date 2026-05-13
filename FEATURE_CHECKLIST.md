# TPVD GIS + Plot/Zoning Analyzer Feature Checklist

This checklist is based primarily on the public TPVD reference at `https://tpvd.openprp.in/`. The direct app is JavaScript-heavy, but public crawl output exposes the core user surface: a GIS map, layer panel, toolbar, legend list, District/TpsName/TpsNo/FpNo search inputs, and TPS listing table with `TPS Name`, `TPS No`, and `TPS Web Link`. NeoCheck is used only as conceptual inspiration for feasibility, risk scoring, and report workflows.

## TPVD GIS Features

- Map-first public GIS viewer with a visible toolbar.
- TPS listing/data view with `TPS Name`, `TPS No`, and web link/action.
- District, TPS name, TPS number, and final plot number search pattern.
- GIS legend list associated with active layers.
- Public-sector attribution/source metadata and browser-ready presentation.
- Feature selection flow from search/table/map into details.
- Mock data is clearly labelled and structured for live TPVD API replacement.

## Search/Filter Features

- Search by TPS name, TPS number, village, survey number, original plot number, final plot number, plot ID, road name, and road width.
- Filters for district, city/urban authority, village, TPS scheme, TPS number, land use/zone, reservation type, water body affected, Gamthal/Gamtal affected, DP reservation affected, railway affected, HT line affected, road width range, plot area range, FSI range, boundary type, and development restriction status.
- Autocomplete command-style search experience.
- Advanced filter modal for dense civic/GIS filters.
- Empty states when no TPS/plot results match.
- Loading and error states around API-backed searches.
- Sort-ready, paginated TPS/plot tables.

## Map/Layer Features

- OpenStreetMap base layer through MapLibre GL.
- Zoom controls, current location, fit to selected plot, reset map, measurement placeholders, fullscreen map, and print/export placeholder.
- TPVD-style layer manager with toggle, opacity, legend, loading/error affordances, and style metadata.
- Layers included: Hissa Line, Village Boundary, Survey Line, Water Body, Gamthal/Gamtal Boundary, Original Plot Boundary, Final Plot Boundary, Survey Number, Road Boundary, Road/Road Network, Building Structure Line, HT Line, Compound Wall, DP Reservation, Railway Boundary, Railway Line, TPS Boundary, Plot Labels, and Survey Labels.
- Base map switcher placeholder for future imagery/satellite providers.
- Floating legend panel and map tools.
- Mobile behavior keeps map primary while moving filters/details into sheets.

## Plot Detail Features

- Plot ID, TPS name, TPS number, village, survey number, original plot number, final plot number, plot area, and boundary type.
- Road access and nearby road width.
- Land use/zoning and reservation details.
- Water body, Gamthal/Gamtal, railway, HT line, and DP reservation intersections.
- Coordinates, related layers, source metadata, and last updated date.
- Compliance warnings and source caveat for non-authoritative mock data.

## Feasibility/Report Features

- Plot summary and development potential.
- Permissible FSI and estimated buildable area.
- Road-width impact, setback requirements, height restriction, reservation impact, water body impact, railway/HT impact.
- Compliance warnings, risk indicators, feasibility score, and pass/warning/fail checklist.
- Print-ready report page with plot overview, TPS details, map snapshot placeholder, layer intersection summary, zoning/land-use summary, calculations, warnings, disclaimer, and print button.
- API-ready report endpoint for generated report payloads.

## Production Engineering Features

- Next.js App Router with TypeScript strict mode.
- Tailwind CSS and shadcn-style reusable UI primitives.
- TanStack Query for server state.
- Zustand stores for filters, map command/layer state, and selection.
- Zod schemas shared across mock routes and client parsing.
- Mock Next API routes for `/api/tps`, `/api/tps/search`, `/api/tps/:id`, `/api/plots/search`, `/api/plots/:id`, `/api/plots/:id/feasibility`, `/api/layers`, `/api/layers/:layerName/geojson`, `/api/legend`, and `/api/report/:plotId`.
- `NEXT_PUBLIC_API_BASE_URL` for live backend swap.
- SEO metadata, accessibility labels, keyboard-friendly controls, `.env.example`, README, and Vercel-ready scripts.

## UI/UX Requirements

- Original civic-tech dashboard visual direction, not a TPVD or NeoCheck clone.
- Premium, professional, clean, map-first interface.
- White/neutral surfaces with deep blue, slate, emerald, amber, and indigo accents.
- Clear hierarchy for public planning users, architects, developers, government staff, and citizens.
- Soft cards, crisp borders, compact data density, smooth drawers/panels, professional icons, and clear status badges.
- No copied branding, imagery, colors, copy, or assets from reference sites.
