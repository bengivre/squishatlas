import { AcceptInviteForm } from "./accept-invite-form";
import {
  getInviteByToken,
  getInviteValidationError,
} from "@/lib/invites/validate-invite";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  const validationError = getInviteValidationError(invite);

  if (validationError || !invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night-deep px-4">
        <div className="w-full max-w-sm rounded-sheet bg-night-plum p-6 text-center">
          <h1 className="text-lg text-lamplight">Invite unavailable</h1>
          <p className="mt-2 text-sm text-blush">{validationError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-night-deep px-4">
      <AcceptInviteForm
        token={token}
        email={invite.email}
        tenantDisplayName={invite.tenant.displayName}
        tenantSlug={invite.tenant.slug}
      />
    </main>
  );
}
