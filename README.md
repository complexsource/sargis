# TPVD-Style GIS Plot Analyzer

A production-ready Next.js 14 App Router project for a TPVD-style GIS and land/plot analysis platform. It includes a map-first analyzer, TPVD-inspired layer manager, typed mock APIs, plot feasibility scoring, and PDF-ready report pages.

## Features

- Premium civic-tech landing page.
- Full-screen GIS analyzer with OpenStreetMap base map through MapLibre GL.
- Collapsible search/filter sidebar, floating map tools, floating legend, layer opacity controls, right plot detail drawer, and bottom result tables.
- TPVD-style layers including plot boundaries, TPS/village/survey lines, roads, water bodies, Gamtal, HT lines, rail, reservations, labels, and more.
- TPS listing and plot search with professional filters.
- Zoning/feasibility module with score, pass/warning/fail checklist, FSI, setbacks, height, and constraint impacts.
- Printable report route at `/report/[plotId]`.
- Mock Next API routes with Zod validation and simple replacement path for real APIs.
- Live TPVD service integration for WMS tiles, WMS legend graphics, WFS final-plot autocomplete, WFS nearby final-plot lookup, and district TPS listing.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=
```

Leave the value empty to use the bundled mock Next API routes. Set it to a backend origin when TPVD or another live GIS API becomes available.

## API Integration Notes

The app already calls these endpoints through wrappers in `lib/api/client.ts`:

- `GET /api/tps`
- `GET /api/tps/search`
- `GET /api/tps/:id`
- `GET /api/plots/search`
- `GET /api/plots/:id`
- `GET /api/plots/:id/feasibility`
- `GET /api/layers`
- `GET /api/layers/:layerName/geojson`
- `GET /api/legend`
- `GET /api/report/:plotId`
- `GET /api/tpvd/tps?district=Ahmedabad`
- `GET /api/tpvd/tps-extent?tpsId=236`
- `GET /api/tpvd/fp-search?query=gota`
- `GET /api/tpvd/feature-nearby?lng=72.5&lat=23.07`
- `GET /api/tpvd/wms?layer=ctp:final_plot_boundary&bbox=...`
- `GET /api/tpvd/legend-image?layer=ctp:final_plot_boundary`

TODO comments are placed where a live TPVD API or spatial service should replace mock data.

See `TPVD_DEEP_AUDIT.md` for the reference-system audit and implementation checklist.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Deployment

The project is Vercel-ready. Configure `NEXT_PUBLIC_API_BASE_URL` in Vercel only when using a real backend. The mock API routes work without secrets.
