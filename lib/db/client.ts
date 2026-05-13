import { Pool } from "pg";

const isRemote = process.env.DATABASE_ENV === "production";

function buildConnectionString(raw: string) {
  // Strip sslmode from the URL so pg-connection-string doesn't override our ssl option
  return raw.replace(/[?&]sslmode=[^&]*/g, (m) => (m.startsWith("?") ? "?" : "")).replace(/\?$/, "");
}

const connectionString = isRemote
  ? buildConnectionString(process.env.POSTGRES_URL ?? "")
  : (process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sargis");

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
    max: isRemote ? 5 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });
}

// Reuse pool across hot-reloads in Next.js dev mode
export const db: Pool = globalThis.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__pgPool = db;
