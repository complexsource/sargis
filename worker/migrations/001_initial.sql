-- ─────────────────────────────────────────────
-- SARGIS — initial schema
-- ─────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── TPS boundaries ──────────────────────────
CREATE TABLE IF NOT EXISTS tps_boundary (
  gid         INTEGER PRIMARY KEY,
  tps_id      INTEGER,
  tps_name    TEXT,
  title       TEXT,
  tps_no      TEXT,
  village     TEXT,
  city        TEXT,
  authority   TEXT,
  district    TEXT,
  status      TEXT,
  geom        GEOMETRY(GEOMETRY, 4326),
  synced_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tps_geom         ON tps_boundary USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_tps_district     ON tps_boundary (district);
CREATE INDEX IF NOT EXISTS idx_tps_city         ON tps_boundary (city);
CREATE INDEX IF NOT EXISTS idx_tps_tps_no       ON tps_boundary (tps_no);
CREATE INDEX IF NOT EXISTS idx_tps_authority    ON tps_boundary (authority);
CREATE INDEX IF NOT EXISTS idx_tps_trgm_name    ON tps_boundary USING GIN (tps_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tps_trgm_title   ON tps_boundary USING GIN (title   gin_trgm_ops);

-- ── Final plot boundaries ───────────────────
CREATE TABLE IF NOT EXISTS final_plots (
  gid           INTEGER PRIMARY KEY,
  tps_id        TEXT,
  tps_name      TEXT,
  tps_no        TEXT,
  village       TEXT,
  city          TEXT,
  district      TEXT,
  authority     TEXT,
  fp_no         TEXT,
  reser_type    TEXT,
  reser_use     TEXT,
  fp_area_sqm   NUMERIC,
  geom          GEOMETRY(GEOMETRY, 4326),
  synced_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fp_geom        ON final_plots USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_fp_district    ON final_plots (district);
CREATE INDEX IF NOT EXISTS idx_fp_city        ON final_plots (city);
CREATE INDEX IF NOT EXISTS idx_fp_tps_no      ON final_plots (tps_no);
CREATE INDEX IF NOT EXISTS idx_fp_fp_no       ON final_plots (fp_no);
CREATE INDEX IF NOT EXISTS idx_fp_reser_type  ON final_plots (reser_type);
CREATE INDEX IF NOT EXISTS idx_fp_area        ON final_plots (fp_area_sqm);
CREATE INDEX IF NOT EXISTS idx_fp_trgm_fp_no  ON final_plots USING GIN (fp_no gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fp_trgm_name   ON final_plots USING GIN (tps_name gin_trgm_ops);

-- ── Constraint layers (for spatial join) ────
CREATE TABLE IF NOT EXISTS constraint_water_body (
  gid   INTEGER PRIMARY KEY,
  geom  GEOMETRY(GEOMETRY, 4326),
  synced_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wb_geom ON constraint_water_body USING GIST (geom);

CREATE TABLE IF NOT EXISTS constraint_gamtal (
  gid   INTEGER PRIMARY KEY,
  geom  GEOMETRY(GEOMETRY, 4326),
  synced_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gt_geom ON constraint_gamtal USING GIST (geom);

CREATE TABLE IF NOT EXISTS constraint_dp_reservation (
  gid   INTEGER PRIMARY KEY,
  geom  GEOMETRY(GEOMETRY, 4326),
  synced_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dp_geom ON constraint_dp_reservation USING GIST (geom);

CREATE TABLE IF NOT EXISTS constraint_railway (
  gid   INTEGER PRIMARY KEY,
  geom  GEOMETRY(GEOMETRY, 4326),
  synced_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rw_geom ON constraint_railway USING GIST (geom);

CREATE TABLE IF NOT EXISTS constraint_ht_line (
  gid   INTEGER PRIMARY KEY,
  geom  GEOMETRY(GEOMETRY, 4326),
  synced_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ht_geom ON constraint_ht_line USING GIST (geom);

-- ── Pre-computed plot constraints ───────────
CREATE TABLE IF NOT EXISTS plot_constraints (
  plot_gid                  INTEGER PRIMARY KEY REFERENCES final_plots(gid) ON DELETE CASCADE,
  water_body_affected       BOOLEAN NOT NULL DEFAULT FALSE,
  gamthal_affected          BOOLEAN NOT NULL DEFAULT FALSE,
  dp_reservation_affected   BOOLEAN NOT NULL DEFAULT FALSE,
  railway_affected          BOOLEAN NOT NULL DEFAULT FALSE,
  ht_line_affected          BOOLEAN NOT NULL DEFAULT FALSE,
  computed_at               TIMESTAMPTZ DEFAULT now()
);

-- ── Sync progress log ───────────────────────
CREATE TABLE IF NOT EXISTS sync_log (
  id              SERIAL PRIMARY KEY,
  table_name      TEXT NOT NULL,
  last_gid_synced INTEGER,
  total_synced    INTEGER DEFAULT 0,
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'running'   -- running | done | failed
);
