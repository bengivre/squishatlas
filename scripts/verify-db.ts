import "dotenv/config";
import { sql } from "drizzle-orm";

import { db } from "../db";

async function main() {
  const result = await db.execute(sql`select 1 as ok`);
  console.log("DB connection OK:", result.rows[0]);
}

main().catch((error: unknown) => {
  console.error("DB connection failed:", error);
  process.exit(1);
});
