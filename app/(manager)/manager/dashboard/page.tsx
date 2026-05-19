import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/gradient-card";

export const dynamic = "force-dynamic";

export default function ManagerDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" breadcrumb="Manager" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Transactions Today" value="—" />
        <StatCard label="Fees Collected" value="—" />
        <StatCard label="Active Cashiers" value="—" />
      </div>
      <p className="text-white/30 text-sm mt-8 text-center">Phase 5 will populate this dashboard.</p>
    </>
  );
}
