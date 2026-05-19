import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/gradient-card";

export const dynamic = "force-dynamic";

export default function CashierDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" breadcrumb="Cashier" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Today's Transactions" value="—" />
        <StatCard label="Shift Status" value="—" />
      </div>
      <p className="text-white/30 text-sm mt-8 text-center">Phase 6 will populate this dashboard.</p>
    </>
  );
}
