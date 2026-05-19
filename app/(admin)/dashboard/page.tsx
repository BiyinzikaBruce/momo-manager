import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, GlassCard } from "@/components/ui/gradient-card";
import { TransactionBadge } from "@/components/ui/status-badge";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayTxs, activeShifts, allFloats] = await Promise.all([
    db.transaction.findMany({
      where: { createdAt: { gte: today } },
      include: {
        branch:     { select: { name: true, currency: true } },
        mobileLine: { select: { operator: true } },
        cashier:    { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.shift.count({ where: { status: "OPEN" } }),
    db.lineFloat.findMany({
      include: {
        mobileLine: {
          select: {
            operator: true,
            branch: { select: { name: true, currency: true } },
          },
        },
      },
      orderBy: [
        { mobileLine: { branchId: "asc" } },
        { mobileLine: { operator: "asc" } },
      ],
    }),
  ]);

  const totalFees = todayTxs.reduce((s, t) => s + Number(t.fee), 0);
  const lowFloatAlerts = allFloats.filter(
    (f) => f.lowThreshold !== null && Number(f.balance) < Number(f.lowThreshold)
  ).length;
  const recentTxs = todayTxs.slice(0, 8);

  return (
    <>
      <PageHeader title="Dashboard" breadcrumb="Admin">
        <span className="text-xs text-white/40">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Transactions Today"
          value={formatNumber(todayTxs.length)}
          icon={<i className="ti ti-arrows-exchange text-[#E040A0] text-[16px]" />}
        />
        <StatCard
          label="Fees Collected"
          value={formatNumber(Math.round(totalFees))}
          trend="Multi-currency total"
          icon={<i className="ti ti-coin text-[#E040A0] text-[16px]" />}
        />
        <StatCard
          label="Active Shifts"
          value={String(activeShifts)}
          trendUp={activeShifts > 0}
          trend={activeShifts > 0 ? `${activeShifts} shift${activeShifts > 1 ? "s" : ""} open` : "None open"}
          icon={<i className="ti ti-clock text-[#E040A0] text-[16px]" />}
        />
        <StatCard
          label="Low Float Alerts"
          value={String(lowFloatAlerts)}
          trendUp={lowFloatAlerts === 0}
          trend={lowFloatAlerts > 0 ? "Needs attention" : "All healthy"}
          icon={<i className="ti ti-alert-triangle text-[#E040A0] text-[16px]" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Today&apos;s Transactions</h2>
            <Link
              href="/dashboard/transactions"
              className="text-xs text-[#E040A0] hover:text-[#FF6B35] transition-colors"
            >
              View all →
            </Link>
          </div>
          {recentTxs.length === 0 ? (
            <div className="py-8 text-center">
              <i className="ti ti-inbox text-[32px] text-white/20 mb-2 block" />
              <p className="text-sm text-white/40">No transactions today yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTxs.map((tx) => (
                <Link key={tx.id} href={`/dashboard/transactions/${tx.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <TransactionBadge type={tx.type as "DEPOSIT" | "WITHDRAWAL" | "TRANSFER"} />
                        <span className="text-xs text-white/50 truncate">{tx.branch.name}</span>
                      </div>
                      <p className="text-xs text-white/35 truncate">
                        {tx.customerName ?? "—"} &middot; {tx.cashier.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">
                        {tx.branch.currency} {formatNumber(Number(tx.amount))}
                      </p>
                      <p className="text-[10px] text-white/40">
                        Fee {formatNumber(Number(tx.fee))}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Float Health</h2>
            <Link
              href="/dashboard/float"
              className="text-xs text-[#E040A0] hover:text-[#FF6B35] transition-colors"
            >
              Manage →
            </Link>
          </div>
          <div className="space-y-1">
            {allFloats.slice(0, 9).map((f) => {
              const bal = Number(f.balance);
              const thr = f.lowThreshold !== null ? Number(f.lowThreshold) : null;
              const isLow = thr !== null && bal < thr;
              return (
                <div
                  key={f.id}
                  className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                >
                  <MobileLineBadge operator={f.mobileLine.operator as never} />
                  <p className="flex-1 text-xs text-white/40 truncate">
                    {f.mobileLine.branch.name}
                  </p>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isLow ? "text-red-400" : "text-green-400"}`}>
                      {f.mobileLine.branch.currency} {formatNumber(bal)}
                    </p>
                    {isLow && (
                      <p className="text-[10px] text-red-400">Below threshold</p>
                    )}
                  </div>
                </div>
              );
            })}
            {allFloats.length > 9 && (
              <p className="text-xs text-white/30 text-center pt-2">
                +{allFloats.length - 9} more lines
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
