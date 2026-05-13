import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") }); // .env.local overrides if present

const isRemote = process.env.DATABASE_ENV === "production";

function stripSslMode(raw: string) {
  return raw.replace(/[?&]sslmode=[^&]*/g, (m) => (m.startsWith("?") ? "?" : "")).replace(/\?$/, "");
}

const connectionString = isRemote
  ? stripSslMode(process.env.POSTGRES_URL_NON_POOLING ?? "")
  : (process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sargis");

const db = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : false
});

async function run() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Running migration: ${file}`);
    await db.query(sql);
    console.log(`  ✓ ${file}`);
  }

  await db.end();
  console.log("All migrations complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
