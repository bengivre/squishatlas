import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenantInvite } from "@/db/schema/tenant";

export type InviteWithTenant = NonNullable<
  Awaited<ReturnType<typeof getInviteByToken>>
>;

export async function getInviteByToken(token: string) {
  return db.query.tenantInvite.findFirst({
    where: eq(tenantInvite.token, token),
    with: {
      tenant: true,
    },
  });
}

export function getInviteValidationError(
  invite: InviteWithTenant | null | undefined,
): string | null {
  if (!invite) {
    return "This invite link is invalid.";
  }

  if (invite.usedAt) {
    return "This invite has already been used.";
  }

  if (invite.expiresAt <= new Date()) {
    return "This invite has expired.";
  }

  return null;
}
