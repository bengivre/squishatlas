import type { ReactNode } from "react";

export function AuthFormShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-night-deep px-4">
      <div className="w-full max-w-md space-y-4 rounded-sheet bg-night-plum p-6">
        <div className="space-y-1">
          <h1 className="text-lg text-lamplight">{title}</h1>
          {description ? <p className="text-sm text-star-dim">{description}</p> : null}
        </div>
        {children}
        {footer ? <div className="pt-1 text-sm text-star-dim">{footer}</div> : null}
      </div>
    </main>
  );
}
