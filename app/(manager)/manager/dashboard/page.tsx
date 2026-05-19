"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, GlassCard } from "@/components/ui/gradient-card";
import { TransactionBadge } from "@/components/ui/status-badge";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type Summary = {
  totals: { count: number; totalAmount: number; totalFees: number };
  activeShifts: number;
  lowFloatAlerts: number;
};

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  amount: string;
  fee: string;
  customerName: string | null;
  createdAt: string;
  branch: { name: string; currency: string };
  cashier: { name: string };
};

type LineFloat = {
  id: string;
  balance: string;
  lowThreshold: string | null;
  mobileLine: { operator: string; branch: { name: string; currency: string } };
};

export default function ManagerDashboard() {
  const { data: sessionData } = useSession();
  const userName = (sessionData?.user as { name?: string })?.name ?? "Manager";
  const today = new Date().toISOString().split("T")[0];

  const { data: summary } = useQuery<Summary>({
    queryKey: ["manager-summary"],
    queryFn: () => fetch(`/api/reports/summary?dateFrom=${today}`).then((r) => r.json()),
  });

  const { data: txData } = useQuery({
    queryKey: ["manager-recent-txs"],
    queryFn: () => fetch(`/api/transactions?limit=8&dateFrom=${today}`).then((r) => r.json()),
  });

  const { data: floatData } = useQuery<{ floats: LineFloat[] }>({
    queryKey: ["float"],
    queryFn: () => fetch("/api/float").then((r) => r.json()),
  });

  const recentTxs: Transaction[] = txData?.transactions ?? [];
  const floats: LineFloat[] = floatData?.floats ?? [];

  return (
    <>
      <PageHeader title="Dashboard" breadcrumb={userName}>
        <span className="text-xs text-white/40">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Transactions Today"
          value={formatNumber(summary?.totals.count ?? 0)}
          icon={<i className="ti ti-arrows-exchange text-[#E040A0] text-[16px]" />}
        />
        <StatCard
          label="Fees Collected"
          value={formatNumber(Math.round(summary?.totals.totalFees ?? 0))}
          trend="Multi-currency"
          icon={<i className="ti ti-coin text-[#E040A0] text-[16px]" />}
        />
        <StatCard
          label="Active Shifts"
          value={String(summary?.activeShifts ?? 0)}
          icon={<i className="ti ti-clock text-[#E040A0] text-[16px]" />}
        />
        <StatCard
          label="Low Float Alerts"
          value={String(summary?.lowFloatAlerts ?? 0)}
          trendUp={!summary?.lowFloatAlerts}
          trend={(summary?.lowFloatAlerts ?? 0) > 0 ? "Needs attention" : "All healthy"}
          icon={<i className="ti ti-alert-triangle text-[#E040A0] text-[16px]" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Today&apos;s Transactions</h2>
            <Link href="/manager/transactions" className="text-xs text-[#E040A0] hover:text-[#FF6B35] transition-colors">
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
                <Link key={tx.id} href={`/manager/transactions/${tx.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <TransactionBadge type={tx.type} />
                        <span className="text-xs text-white/50 truncate">{tx.cashier.name}</span>
                      </div>
                      <p className="text-xs text-white/35 truncate">{tx.customerName ?? "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">
                        {tx.branch.currency} {formatNumber(Number(tx.amount))}
                      </p>
                      <p className="text-[10px] text-white/40">Fee {formatNumber(Number(tx.fee))}</p>
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
            <Link href="/manager/float" className="text-xs text-[#E040A0] hover:text-[#FF6B35] transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {floats.length === 0 ? (
              <div className="py-8 text-center">
                <i className="ti ti-device-mobile text-[32px] text-white/20 mb-2 block" />
                <p className="text-sm text-white/40">No lines configured</p>
              </div>
            ) : (
              floats.map((f) => {
                const bal = Number(f.balance);
                const thr = f.lowThreshold !== null ? Number(f.lowThreshold) : null;
                const isLow = thr !== null && bal < thr;
                return (
                  <div key={f.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <MobileLineBadge operator={f.mobileLine.operator as never} />
                    <div className="flex-1" />
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isLow ? "text-red-400" : "text-green-400"}`}>
                        {f.mobileLine.branch.currency} {formatNumber(bal)}
                      </p>
                      {isLow && <p className="text-[10px] text-red-400">Below threshold</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
