import "dotenv/config";

import { seedSuperadmin } from "../lib/seed/superadmin";

async function main() {
  const result = await seedSuperadmin();

  if (result.status === "created") {
    console.log(`Superadmin seeded: ${result.email}`);
    return;
  }

  if (result.reason === "env_not_configured") {
    console.log("Superadmin seed skipped: SUPERADMIN_EMAIL or SUPERADMIN_INITIAL_PASSWORD not set");
    return;
  }

  console.log("Superadmin seed skipped: a superadmin already exists");
}

main().catch((error: unknown) => {
  console.error("Superadmin seed failed:", error);
  process.exit(1);
});
