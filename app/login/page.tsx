import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { auth } from "@/lib/auth";
import { getPostLoginRedirect } from "@/lib/auth/post-login-redirect";

function safeNextPath(raw: string | undefined): string | undefined {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return undefined;
  }
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect(nextPath ?? (await getPostLoginRedirect()));
  }

  return (
    <LoginForm
      nextPath={nextPath}
      resetSuccess={params.reset === "success"}
    />
  );
}
