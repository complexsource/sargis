import { Pool } from "pg";

const isRemote = process.env.DATABASE_ENV === "production";

function stripSslMode(raw: string) {
  return raw.replace(/[?&]sslmode=[^&]*/g, (m) => (m.startsWith("?") ? "?" : "")).replace(/\?$/, "");
}

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  if (isRemote) {
    return new Pool({
      connectionString: stripSslMode(process.env.POSTGRES_URL ?? ""),
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sargis",
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });
}

// Reuse pool across hot-reloads in Next.js dev mode
export const db: Pool = globalThis.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__pgPool = db;
