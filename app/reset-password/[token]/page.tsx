import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token.trim()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night-deep px-4">
        <div className="w-full max-w-sm rounded-sheet bg-night-plum p-6 text-center">
          <h1 className="text-lg text-lamplight">Reset link unavailable</h1>
          <p className="mt-2 text-sm text-blush">
            This reset link is missing its token. Request a new reset email and
            try again.
          </p>
        </div>
      </main>
    );
  }

  return <ResetPasswordForm token={token} />;
}
