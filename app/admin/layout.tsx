import { AdminShell } from "@/components/admin/admin-shell";
import { requireSuperadmin } from "@/lib/admin/require-superadmin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperadmin();

  return <AdminShell>{children}</AdminShell>;
}
