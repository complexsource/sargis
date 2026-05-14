import dotenv from "dotenv";
import path from "path";
import cron from "node-cron";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") }); // .env.local overrides if present

const isRemote = process.env.DATABASE_ENV === "production";

function stripSslMode(raw: string) {
  return raw.replace(/[?&]sslmode=[^&]*/g, (m) => (m.startsWith("?") ? "?" : "")).replace(/\?$/, "");
}

const db = new Pool(
  isRemote
    ? { connectionString: stripSslMode(process.env.POSTGRES_URL_NON_POOLING ?? ""), ssl: { rejectUnauthorized: false } }
    : { connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sargis" }
);

const TPVD_WFS = "http://tpvd.openprp.in/geoserver/wfs";
const BATCH = 500;

// ── helpers ──────────────────────────────────────────────────────────────────

function wfsUrl(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature"
  });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  return `${TPVD_WFS}?${q}`;
}

async function fetchFeatures(
  typeName: string,
  startIndex: number,
  count: number
): Promise<Array<{ properties: Record<string, unknown>; geometry: unknown }>> {
  const url = wfsUrl({ typeName, outputFormat: "application/json", srsname: "EPSG:4326", sortBy: "gid", startIndex, count });
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`WFS ${typeName} HTTP ${res.status}`);
  const payload = (await res.json()) as { features?: Array<{ properties?: Record<string, unknown>; geometry?: unknown }> };
  return (payload.features ?? []).map((f) => ({
    properties: f.properties ?? {},
    geometry: f.geometry ?? null
  }));
}

function str(v: unknown) { return v != null ? String(v) : null; }
function num(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : null; }

// ── sync progress tracking ───────────────────────────────────────────────────


async function startSyncLog(tableName: string): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    "INSERT INTO sync_log (table_name) VALUES ($1) RETURNING id",
    [tableName]
  );
  return rows[0].id;
}

async function updateSyncLog(logId: number, lastGid: number, total: number) {
  await db.query(
    "UPDATE sync_log SET last_gid_synced = $1, total_synced = $2 WHERE id = $3",
    [lastGid, total, logId]
  );
}

async function finishSyncLog(logId: number, status: "done" | "failed") {
  await db.query(
    "UPDATE sync_log SET status = $1, completed_at = now() WHERE id = $2",
    [status, logId]
  );
}

// ── TPS boundary sync ────────────────────────────────────────────────────────

async function syncTpsBoundary() {
  console.log("[tps_boundary] starting sync");
  const logId = await startSyncLog("tps_boundary");
  let total = 0;
  let startIndex = 0;

  try {
    while (true) {
      const features = await fetchFeatures("ctp:tps_boundary", startIndex, BATCH);
      if (!features.length) break;

      for (const f of features) {
        const p = f.properties;
        const gid = num(p.gid);
        if (!gid) continue;

        await db.query(
          `INSERT INTO tps_boundary (gid, tps_id, tps_name, title, tps_no, village, city, authority, district, status, geom, synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,ST_SetSRID(ST_GeomFromGeoJSON($11),4326),now())
           ON CONFLICT (gid) DO UPDATE SET
             tps_id=$2, tps_name=$3, title=$4, tps_no=$5, village=$6, city=$7,
             authority=$8, district=$9, status=$10,
             geom=ST_SetSRID(ST_GeomFromGeoJSON($11),4326), synced_at=now()`,
          [
            gid,
            num(p.tps_id),
            str(p.tps_name),
            str(p.tp_name) ?? str(p.tps_name),
            str(p.tps_no),
            str(p.village),
            str(p.city),
            str(p.authority),
            str(p.district),
            str(p.status),
            JSON.stringify(f.geometry)
          ]
        );
        total++;
      }

      await updateSyncLog(logId, num(features.at(-1)!.properties.gid) ?? 0, total);
      console.log(`[tps_boundary] upserted ${total} so far`);
      if (features.length < BATCH) break;
      startIndex += BATCH;
    }

    await finishSyncLog(logId, "done");
    console.log(`[tps_boundary] done — ${total} records`);
  } catch (err) {
    await finishSyncLog(logId, "failed");
    console.error("[tps_boundary] failed:", err);
  }
}

// ── Final plot boundary sync ─────────────────────────────────────────────────

async function syncFinalPlots() {
  console.log("[final_plots] starting sync");
  const logId = await startSyncLog("final_plots");
  let total = 0;
  let startIndex = 0;

  try {
    while (true) {
      const features = await fetchFeatures("ctp:final_plot_boundary", startIndex, BATCH);
      if (!features.length) break;

      for (const f of features) {
        const p = f.properties;
        const gid = num(p.gid);
        if (!gid) continue;

        await db.query(
          `INSERT INTO final_plots
             (gid, tps_id, tps_name, tps_no, village, city, district, authority,
              fp_no, reser_type, reser_use, fp_area_sqm, geom, synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,ST_SetSRID(ST_GeomFromGeoJSON($13),4326),now())
           ON CONFLICT (gid) DO UPDATE SET
             tps_id=$2, tps_name=$3, tps_no=$4, village=$5, city=$6, district=$7,
             authority=$8, fp_no=$9, reser_type=$10, reser_use=$11, fp_area_sqm=$12,
             geom=ST_SetSRID(ST_GeomFromGeoJSON($13),4326), synced_at=now()`,
          [
            gid,
            str(p.tps_id),
            str(p.title_tps_name) ?? str(p.tps_name),
            str(p.tps_no),
            str(p.village),
            str(p.city),
            str(p.district),
            str(p.authority),
            str(p.fp_no),
            str(p.reser_type),
            str(p.reser_use),
            num(p.fp_area_final) ?? num(p.fp_area),
            JSON.stringify(f.geometry)
          ]
        );
        total++;
      }

      await updateSyncLog(logId, num(features.at(-1)!.properties.gid) ?? 0, total);
      console.log(`[final_plots] upserted ${total} so far`);
      if (features.length < BATCH) break;
      startIndex += BATCH;
    }

    await finishSyncLog(logId, "done");
    console.log(`[final_plots] done — ${total} records`);
  } catch (err) {
    await finishSyncLog(logId, "failed");
    console.error("[final_plots] failed:", err);
  }
}

// ── Constraint layer sync (generic) ──────────────────────────────────────────

async function syncConstraintLayer(tpvdLayer: string, table: string) {
  console.log(`[${table}] starting sync`);
  const logId = await startSyncLog(table);
  let total = 0;
  let startIndex = 0;

  try {
    while (true) {
      const features = await fetchFeatures(tpvdLayer, startIndex, BATCH);
      if (!features.length) break;

      for (const f of features) {
        const gid = num(f.properties.gid);
        if (!gid) continue;

        await db.query(
          `INSERT INTO ${table} (gid, geom, synced_at)
           VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2),4326), now())
           ON CONFLICT (gid) DO UPDATE SET
             geom=ST_SetSRID(ST_GeomFromGeoJSON($2),4326), synced_at=now()`,
          [gid, JSON.stringify(f.geometry)]
        );
        total++;
      }

      await updateSyncLog(logId, num(features.at(-1)!.properties.gid) ?? 0, total);
      if (features.length < BATCH) break;
      startIndex += BATCH;
    }

    await finishSyncLog(logId, "done");
    console.log(`[${table}] done — ${total} records`);
  } catch (err) {
    await finishSyncLog(logId, "failed");
    console.error(`[${table}] failed:`, err);
  }
}

// ── Compute plot constraints (spatial join) ──────────────────────────────────

async function computeConstraints() {
  console.log("[plot_constraints] computing spatial joins...");
  const logId = await startSyncLog("plot_constraints");

  try {
    await db.query(`
      INSERT INTO plot_constraints (
        plot_gid,
        water_body_affected,
        gamthal_affected,
        dp_reservation_affected,
        railway_affected,
        ht_line_affected
      )
      SELECT
        fp.gid,
        EXISTS (SELECT 1 FROM constraint_water_body    w WHERE ST_Intersects(fp.geom, w.geom)),
        EXISTS (SELECT 1 FROM constraint_gamtal        g WHERE ST_Intersects(fp.geom, g.geom)),
        EXISTS (SELECT 1 FROM constraint_dp_reservation d WHERE ST_Intersects(fp.geom, d.geom)),
        EXISTS (SELECT 1 FROM constraint_railway        r WHERE ST_Intersects(fp.geom, r.geom)),
        EXISTS (SELECT 1 FROM constraint_ht_line        h WHERE ST_Intersects(fp.geom, h.geom))
      FROM final_plots fp
      ON CONFLICT (plot_gid) DO UPDATE SET
        water_body_affected       = EXCLUDED.water_body_affected,
        gamthal_affected          = EXCLUDED.gamthal_affected,
        dp_reservation_affected   = EXCLUDED.dp_reservation_affected,
        railway_affected          = EXCLUDED.railway_affected,
        ht_line_affected          = EXCLUDED.ht_line_affected,
        computed_at               = now()
    `);

    const { rows } = await db.query<{ count: string }>("SELECT COUNT(*) FROM plot_constraints");
    await finishSyncLog(logId, "done");
    console.log(`[plot_constraints] done — ${rows[0].count} plots`);
  } catch (err) {
    await finishSyncLog(logId, "failed");
    console.error("[plot_constraints] failed:", err);
  }
}

// ── Full sync orchestration ───────────────────────────────────────────────────

async function fullSync() {
  console.log("=== SARGIS full sync starting ===");
  await syncTpsBoundary();
  await syncFinalPlots();
  await syncConstraintLayer("ctp:water_body",          "constraint_water_body");
  await syncConstraintLayer("ctp:gamtal_boundary",     "constraint_gamtal");
  await syncConstraintLayer("ctp:dp_reservation_line", "constraint_dp_reservation");
  await syncConstraintLayer("ctp:railway_boundary",    "constraint_railway");
  await syncConstraintLayer("ctp:ht_line",             "constraint_ht_line");
  await computeConstraints();
  console.log("=== SARGIS full sync complete ===");
}

// ── Entry point ───────────────────────────────────────────────────────────────

const RUN_NOW = process.argv.includes("--now");

if (RUN_NOW) {
  fullSync().then(() => db.end()).catch((err) => { console.error(err); process.exit(1); });
} else {
  // Every day at 02:00
  cron.schedule("0 2 * * *", () => { fullSync().catch(console.error); });
  console.log("SARGIS sync worker started. Next run: 02:00 daily. Pass --now to run immediately.");
}
