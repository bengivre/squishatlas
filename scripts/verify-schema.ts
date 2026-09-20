import "dotenv/config";
import { Pool } from "pg";

const EXPECTED_TABLES = [
  "account",
  "membership",
  "family",
  "relationship",
  "session",
  "squish",
  "squish_photo",
  "tenant",
  "tenant_invite",
  "tenant_settings",
  "user",
  "verification",
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: url });
  try {
    const result = await pool.query<{ table_name: string }>(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and table_name != '__drizzle_migrations'
      order by table_name
    `);

    const found = result.rows.map((row) => row.table_name).sort();
    const missing = EXPECTED_TABLES.filter((name) => !found.includes(name));
    const extra = found.filter(
      (name) =>
        !EXPECTED_TABLES.includes(name as (typeof EXPECTED_TABLES)[number]),
    );

    if (missing.length > 0) {
      console.error("Schema mismatch. Missing:", missing.join(", "));
      process.exit(1);
    }

    if (extra.length > 0) {
      console.warn("Extra tables (ignored):", extra.join(", "));
    }

    console.log("Schema OK:", EXPECTED_TABLES.join(", "));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Schema verification failed:", error);
  process.exit(1);
});
