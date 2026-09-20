import { sql } from "drizzle-orm";

import { db } from "@/db";

export async function GET() {
  try {
    await db.execute(sql`select 1 as ok`);
    return Response.json(
      { status: "ok", db: "connected" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      { status: "error", db: "disconnected" },
      { status: 503 },
    );
  }
}
