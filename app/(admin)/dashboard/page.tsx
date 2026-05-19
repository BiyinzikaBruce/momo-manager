import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/gradient-card";

export default function AdminDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" breadcrumb="Admin" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Transactions Today" value="—" />
        <StatCard label="Fees Collected" value="—" />
        <StatCard label="Active Shifts" value="—" />
        <StatCard label="Low Float Alerts" value="—" />
      </div>
      <p className="text-white/30 text-sm mt-8 text-center">Phase 4 will populate this dashboard.</p>
    </>
  );
}
