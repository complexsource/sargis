import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sargis";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });
}

// Reuse pool across hot-reloads in Next.js dev mode
export const db: Pool = globalThis.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__pgPool = db;
