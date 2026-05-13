import fs from "fs";
import path from "path";
import { Pool } from "pg";

const db = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/sargis"
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
