"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GradientCard } from "@/components/ui/gradient-card";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  balance: string;
  branch: { name: string; currency: string };
};

type LineFloat = {
  id: string;
  balance: string;
  lowThreshold: string | null;
  mobileLine: {
    id: string;
    operator: string;
    branchId: string;
    branch: { id: string; name: string; country: string; currency: string };
  };
};

type BranchGroup = {
  branch: { id: string; name: string; country: string; currency: string };
  lines: LineFloat[];
};

export default function FloatPage() {
  const [openBranch, setOpenBranch] = useState<string | null>(null);

  const { data: accountsData = [], isLoading: loadingAccounts } = useQuery<BankAccount[]>({
    queryKey: ["bank-accounts"],
    queryFn: () => fetch("/api/bank-account").then((r) => r.json()),
  });

  const { data: floatData, isLoading: loadingFloat } = useQuery<{
    floats: LineFloat[];
    byBranch: BranchGroup[];
  }>({
    queryKey: ["float"],
    queryFn: () => fetch("/api/float").then((r) => r.json()),
  });

  const byBranch = floatData?.byBranch ?? [];
  const allFloats = floatData?.floats ?? [];

  const totalLow = allFloats.filter(
    (f) => f.lowThreshold !== null && Number(f.balance) < Number(f.lowThreshold)
  ).length;

  return (
    <>
      <PageHeader title="Float Management" breadcrumb="Admin">
        <Link
          href="/dashboard/settings"
          className="text-xs text-[#E040A0] hover:text-[#FF6B35] transition-colors"
        >
          Set Thresholds →
        </Link>
      </PageHeader>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <GradientCard
          label="Total Lines"
          value={String(allFloats.length)}
          subtitle="Across all branches"
        />
        <div className="rounded-[20px] border border-white/8 bg-[#13131A] p-5 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Low Float Lines</p>
          <p className="text-4xl font-extrabold text-red-400">{totalLow}</p>
          <p className="text-xs text-white/40 mt-2">Below threshold</p>
        </div>
        <div className="rounded-[20px] border border-white/8 bg-[#13131A] p-5 flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Branches</p>
          <p className="text-4xl font-extrabold text-white">{byBranch.length}</p>
          <p className="text-xs text-white/40 mt-2">With active lines</p>
        </div>
      </div>

      {/* Bank Accounts */}
      {!loadingAccounts && accountsData.length > 0 && (
        <GlassCard className="mb-6">
          <h2 className="text-sm font-bold text-white mb-4">Bank Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {accountsData.map((acc) => (
              <div key={acc.id} className="p-4 bg-white/4 rounded-[12px] border border-white/6">
                <p className="text-xs text-white/40 mb-1">{acc.branch.name}</p>
                <p className="text-sm font-bold text-white truncate">{acc.bankName}</p>
                <p className="text-xs text-white/50 truncate">{acc.accountName}</p>
                <p className="font-mono text-xs text-white/35 mt-1">{acc.accountNumber}</p>
                <p className="text-base font-extrabold text-[#E040A0] mt-2">
                  {acc.branch.currency} {formatNumber(Number(acc.balance))}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Per-branch accordion */}
      {loadingFloat ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white/4 rounded-[16px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {byBranch.map((group) => {
            const isOpen = openBranch === group.branch.id;
            const lowCount = group.lines.filter(
              (f) => f.lowThreshold !== null && Number(f.balance) < Number(f.lowThreshold)
            ).length;

            return (
              <GlassCard key={group.branch.id} className="p-0 overflow-hidden">
                <button
                  onClick={() => setOpenBranch(isOpen ? null : group.branch.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <i className="ti ti-building-store text-[#E040A0] text-[18px]" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{group.branch.name}</p>
                      <p className="text-xs text-white/40">
                        {group.lines.length} lines &middot; {group.branch.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {lowCount > 0 && (
                      <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                        {lowCount} low
                      </span>
                    )}
                    <i className={`ti ti-chevron-${isOpen ? "up" : "down"} text-white/30`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/6 px-5 pb-4">
                    <div className="mt-3 space-y-2">
                      {group.lines.map((f) => {
                        const bal = Number(f.balance);
                        const thr = f.lowThreshold !== null ? Number(f.lowThreshold) : null;
                        const isLow = thr !== null && bal < thr;
                        const pct = thr ? Math.min(100, (bal / thr) * 100) : 100;

                        return (
                          <div
                            key={f.id}
                            className="flex items-center gap-4 p-3 bg-white/3 rounded-[10px]"
                          >
                            <MobileLineBadge operator={f.mobileLine.operator as never} />
                            <div className="flex-1 min-w-0">
                              {thr !== null && (
                                <div className="w-full bg-white/8 rounded-full h-1.5 mt-1">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      isLow ? "bg-red-400" : "bg-green-400"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${isLow ? "text-red-400" : "text-white"}`}>
                                {group.branch.currency} {formatNumber(bal)}
                              </p>
                              {thr !== null && (
                                <p className="text-[10px] text-white/35">
                                  min {group.branch.currency} {formatNumber(thr)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </>
  );
}
