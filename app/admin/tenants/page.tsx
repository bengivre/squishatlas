import { TenantOpsPanel } from "@/components/admin/tenant-ops-panel";
import { listTenantsForAdmin } from "@/app/admin/actions";

export default async function AdminTenantsPage() {
  const tenants = await listTenantsForAdmin();

  return <TenantOpsPanel tenants={tenants} />;
}
