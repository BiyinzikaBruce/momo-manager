"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GradientCard } from "@/components/ui/gradient-card";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
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

const OPERATOR_LABELS: Record<string, string> = {
  MTN_UG:       "MTN Uganda",
  AIRTEL_UG:    "Airtel Uganda",
  VODACOM_TZ:   "Vodacom Tanzania",
  TIGO_TZ:      "Tigo Tanzania",
  SAFARICOM_KE: "Safaricom M-Pesa",
  AIRTEL_KE:    "Airtel Kenya",
  ORANGE_CD:    "Orange Congo",
  VODACOM_CD:   "Vodacom Congo",
  AIRTEL_CD:    "Airtel Congo",
};

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";

function EditFloatDialog({ line, currency }: { line: LineFloat; currency: string }) {
  const qc = useQueryClient();
  const [topUp, setTopUp] = useState("");
  const [threshold, setThreshold] = useState(
    line.lowThreshold !== null ? String(Number(line.lowThreshold)) : ""
  );
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const topUpNum = topUp !== "" ? Number(topUp) : undefined;
      const thrNum = threshold !== "" ? Number(threshold) : null;

      if (topUpNum !== undefined && (isNaN(topUpNum) || topUpNum <= 0)) {
        throw new Error("Top-up amount must be a positive number");
      }

      const res = await fetch(`/api/float/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(topUpNum !== undefined ? { topUp: topUpNum } : {}),
          ...(threshold !== "" ? { lowThreshold: thrNum ?? 0 } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Float updated");
      qc.invalidateQueries({ queryKey: ["float"] });
      setTopUp("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bal = Number(line.balance);
  const thr = line.lowThreshold !== null ? Number(line.lowThreshold) : null;
  const isLow = thr !== null && bal < thr;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="ml-2 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-[#E040A0] hover:bg-[#E040A0]/10 transition-colors">
          <i className="ti ti-pencil text-[13px]" />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Float</DialogTitle>
          <DialogDescription>
            {OPERATOR_LABELS[line.mobileLine.operator] ?? line.mobileLine.operator} · {line.mobileLine.branch.name}
          </DialogDescription>
        </DialogHeader>

        {/* Current balance display */}
        <div className={`p-4 rounded-[12px] border mb-5 ${isLow ? "border-red-400/30 bg-red-400/5" : "border-white/8 bg-white/4"}`}>
          <p className="text-xs text-white/40 mb-1">Current Balance</p>
          <p className={`text-2xl font-extrabold ${isLow ? "text-red-400" : "text-white"}`}>
            {currency} {formatNumber(bal)}
          </p>
          {isLow && (
            <p className="text-xs text-red-400 mt-1">
              Below threshold ({currency} {formatNumber(thr!)})
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Add Funds (Top Up)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={topUp}
              onChange={(e) => setTopUp(e.target.value)}
              placeholder={`e.g. 500,000`}
              className={inputCls}
            />
            <p className="text-[11px] text-white/30 mt-1">
              Leave empty to keep current balance
            </p>
          </div>

          <div>
            <label className={labelCls}>Low Float Threshold</label>
            <input
              type="number"
              min="0"
              step="any"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={thr !== null ? String(thr) : "Not set"}
              className={inputCls}
            />
            <p className="text-[11px] text-white/30 mt-1">
              Alert will trigger when balance falls below this
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (topUp === "" && threshold === "")}
              className="flex-1"
            >
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
                            <EditFloatDialog line={f} currency={group.branch.currency} />
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
