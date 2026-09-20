import { UserDirectory } from "@/components/admin/user-directory";
import { listUsersForAdminAction } from "@/app/admin/users/actions";
import { requireSuperadmin } from "@/lib/admin/require-superadmin";

export default async function AdminUsersPage() {
  const session = await requireSuperadmin();
  const users = await listUsersForAdminAction();

  return (
    <UserDirectory users={users} currentUserId={session.user.id} />
  );
}
