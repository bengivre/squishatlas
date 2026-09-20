import { AdminOverview } from "@/components/admin/admin-overview";
import { getPlatformOverview } from "@/lib/admin/platform-stats";

export default async function AdminOverviewPage() {
  const data = await getPlatformOverview();

  return <AdminOverview data={data} />;
}
