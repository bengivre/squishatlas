import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { requirePasswordChanged } from "@/lib/auth/require-password-changed";

export async function requireSuperadmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?next=/admin");
  }

  requirePasswordChanged(session);

  if (!("isSuperadmin" in session.user) || !session.user.isSuperadmin) {
    // Authenticated non-admins: send home rather than a confusing 404.
    redirect("/");
  }

  return session;
}
