"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { TransactionBadge, ShiftBadge } from "@/components/ui/status-badge";
import { formatNumber } from "@/lib/utils";

type Shift = {
  id: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  branch: { name: string; currency: string };
  summary?: {
    count: number;
    totalAmount: number;
    totalFees: number;
    deposits: number;
    withdrawals: number;
    transfers: number;
  };
};

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  amount: string;
  fee: string;
  customerName: string | null;
  createdAt: string;
  branch: { currency: string };
};

export default function CashierDashboard() {
  const { data: sessionData } = useSession();
  const userName = (sessionData?.user as { name?: string })?.name ?? "Cashier";

  const { data: shiftsData, isLoading: loadingShift } = useQuery({
    queryKey: ["my-open-shift"],
    queryFn: () => fetch("/api/shifts?status=OPEN&limit=1").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const openShift: Shift | null = shiftsData?.shifts?.[0] ?? null;

  const { data: shiftDetail } = useQuery<Shift>({
    queryKey: ["shift-detail", openShift?.id],
    queryFn: () => fetch(`/api/shifts/${openShift!.id}`).then((r) => r.json()),
    enabled: !!openShift?.id,
  });

  const { data: recentTxData } = useQuery({
    queryKey: ["my-recent-txs", openShift?.id],
    queryFn: () =>
      fetch(`/api/transactions?limit=5${openShift?.id ? `&shiftId=${openShift.id}` : ""}`).then((r) => r.json()),
    enabled: !!openShift,
  });

  const recentTxs: Transaction[] = recentTxData?.transactions ?? [];
  const summary = shiftDetail?.summary;
  const currency = openShift?.branch.currency ?? "";

  return (
    <>
      <PageHeader title={`Welcome, ${userName.split(" ")[0]}`} breadcrumb="Cashier">
        <span className="text-xs text-white/40">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </PageHeader>

      {loadingShift ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/4 rounded-[16px] animate-pulse" />
          ))}
        </div>
      ) : !openShift ? (
        <div className="max-w-md mx-auto mt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-6">
            <i className="ti ti-clock-off text-[36px] text-white/25" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Shift</h2>
          <p className="text-sm text-white/45 mb-8">
            You need to open a shift before recording transactions.
          </p>
          <Link href="/cashier/shift">
            <Button size="lg" className="w-full">
              <i className="ti ti-clock-play text-[18px]" />
              Open Shift
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-400/15 flex items-center justify-center">
                  <i className="ti ti-clock-check text-green-400 text-[18px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Shift Active</p>
                    <ShiftBadge status="OPEN" />
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    Opened {new Date(openShift.openedAt).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit",
                    })} &middot; {openShift.branch.name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/cashier/transactions/new">
                  <Button size="sm">
                    <i className="ti ti-plus text-[14px]" />
                    New Transaction
                  </Button>
                </Link>
                <Link href="/cashier/shift">
                  <Button variant="secondary" size="sm">Manage Shift</Button>
                </Link>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Transactions", value: formatNumber(summary?.count ?? 0), color: "text-white" },
              { label: "Total Amount",  value: summary ? `${currency} ${formatNumber(Math.round(summary.totalAmount))}` : "—", color: "text-white" },
              { label: "Fees",          value: summary ? `${currency} ${formatNumber(Math.round(summary.totalFees))}` : "—", color: "text-[#E040A0]" },
              { label: "Deposits",      value: formatNumber(summary?.deposits ?? 0), color: "text-green-400" },
              { label: "Withdrawals",   value: formatNumber(summary?.withdrawals ?? 0), color: "text-red-400" },
              { label: "Transfers",     value: formatNumber(summary?.transfers ?? 0), color: "text-blue-400" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-[12px] bg-white/4 border border-white/6 text-center">
                <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
              <Link href="/cashier/transactions" className="text-xs text-[#E040A0] hover:text-[#FF6B35] transition-colors">
                View all →
              </Link>
            </div>
            {recentTxs.length === 0 ? (
              <div className="py-8 text-center">
                <i className="ti ti-inbox text-[32px] text-white/20 mb-2 block" />
                <p className="text-sm text-white/40">No transactions yet this shift</p>
                <Link href="/cashier/transactions/new">
                  <Button size="sm" className="mt-4">
                    <i className="ti ti-plus text-[14px]" />
                    Record First Transaction
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-[10px] bg-white/3">
                    <TransactionBadge type={tx.type} />
                    <p className="flex-1 text-xs text-white/50 truncate">{tx.customerName ?? "—"}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">
                        {tx.branch.currency} {formatNumber(Number(tx.amount))}
                      </p>
                      <p className="text-[10px] text-white/35">
                        {new Date(tx.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </>
  );
}
