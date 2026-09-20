import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthFormShell } from "@/components/auth/auth-form-shell";

export default async function ResetPasswordIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;

  if (params.error === "INVALID_TOKEN") {
    return (
      <AuthFormShell
        title="Reset link expired"
        description="This password reset link is invalid or has expired."
        footer={
          <p>
            <Link href="/forgot-password" className="text-lamplight underline">
              Request a new reset link
            </Link>{" "}
            or{" "}
            <Link href="/login" className="text-lamplight underline">
              return to sign in
            </Link>
            .
          </p>
        }
      >
        <p className="text-sm text-star-dim">
          Reset links only work once and expire after one hour.
        </p>
      </AuthFormShell>
    );
  }

  if (params.token) {
    redirect(`/reset-password/${params.token}`);
  }

  redirect("/forgot-password");
}
