import { redirect } from "next/navigation";

import type { Session } from "@/lib/auth";

/** Redirect seeded superadmins (and similar) until they set a real password. */
export function requirePasswordChanged(session: Session): void {
  if (
    session.user &&
    "mustChangePassword" in session.user &&
    session.user.mustChangePassword
  ) {
    redirect("/change-password");
  }
}
