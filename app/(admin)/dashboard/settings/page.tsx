"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/utils";

type LineFloat = {
  id: string;
  balance: string;
  lowThreshold: string | null;
  mobileLine: {
    id: string;
    operator: string;
    branch: { name: string; currency: string };
  };
};

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";

function EditThresholdDialog({ f }: { f: LineFloat }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"topup" | "set">("topup");
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState(
    f.lowThreshold !== null ? String(Number(f.lowThreshold)) : ""
  );

  const bal = Number(f.balance);
  const thr = f.lowThreshold !== null ? Number(f.lowThreshold) : null;
  const isLow = thr !== null && bal < thr;

  const mutation = useMutation({
    mutationFn: async () => {
      const amtNum = amount !== "" ? Number(amount) : undefined;
      if (amtNum !== undefined && isNaN(amtNum)) throw new Error("Invalid amount");
      if (mode === "topup" && amtNum !== undefined && amtNum <= 0) throw new Error("Top-up must be positive");
      if (mode === "set" && amtNum !== undefined && amtNum < 0) throw new Error("Balance cannot be negative");

      const body: Record<string, unknown> = {};
      if (amtNum !== undefined) body[mode === "topup" ? "topUp" : "balance"] = amtNum;
      if (threshold !== "") body.lowThreshold = Number(threshold);
      else body.lowThreshold = null;

      if (Object.keys(body).length === 0) throw new Error("Nothing to update");

      const res = await fetch(`/api/float/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Line updated");
      qc.invalidateQueries({ queryKey: ["float"] });
      setAmount("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (v) setThreshold(f.lowThreshold !== null ? String(Number(f.lowThreshold)) : "");
      setOpen(v);
    }}>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white/25 hover:text-[#E040A0] hover:bg-[#E040A0]/10 transition-colors flex-shrink-0"
        title="Edit"
      >
        <i className="ti ti-pencil text-[14px]" />
      </button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Line</DialogTitle>
          <DialogDescription>
            {f.mobileLine.operator.replace(/_/g, " ")} · {f.mobileLine.branch.name}
          </DialogDescription>
        </DialogHeader>

        <div className={`p-4 rounded-[12px] border mb-5 ${isLow ? "border-red-400/30 bg-red-400/5" : "border-white/8 bg-white/4"}`}>
          <p className="text-xs text-white/40 mb-1">Current Balance</p>
          <p className={`text-2xl font-extrabold ${isLow ? "text-red-400" : "text-white"}`}>
            {f.mobileLine.branch.currency} {formatNumber(bal)}
          </p>
          {isLow && (
            <p className="text-xs text-red-400 mt-1">
              Below threshold ({f.mobileLine.branch.currency} {formatNumber(thr!)})
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["topup", "set"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setAmount(""); }}
                className={`flex-1 py-2 rounded-[10px] text-xs font-bold transition-colors border ${
                  mode === m
                    ? "bg-[#E040A0]/15 border-[#E040A0]/40 text-[#E040A0]"
                    : "bg-white/4 border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                {m === "topup" ? "Add Funds (Top Up)" : "Set Balance Directly"}
              </button>
            ))}
          </div>
          <div>
            <label className={labelCls}>{mode === "topup" ? "Amount to Add" : "New Balance"}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === "topup" ? "Leave empty to skip" : "Enter exact balance"}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Low Float Threshold</label>
            <input
              type="number"
              min="0"
              step="any"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Leave empty to disable alert"
              className={inputCls}
            />
            <p className="text-[11px] text-white/30 mt-1">
              Alert triggers when balance drops below this value
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { data: floatData, isLoading } = useQuery<{ floats: LineFloat[] }>({
    queryKey: ["float"],
    queryFn: () => fetch("/api/float").then((r) => r.json()),
  });

  const floats = floatData?.floats ?? [];

  return (
    <>
      <PageHeader title="Settings" breadcrumb="Admin" />

      <GlassCard className="max-w-2xl mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="ti ti-bell text-yellow-400 text-[15px]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Low Float Thresholds</p>
            <p className="text-xs text-white/45 mt-1">
              Set minimum balance thresholds for each mobile line. When a line&apos;s float drops below
              its threshold, it will be flagged as &quot;Low&quot; on the dashboard. Click the pencil icon
              to edit a line&apos;s threshold or top up its balance.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="max-w-2xl">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : floats.length === 0 ? (
          <div className="py-12 text-center">
            <i className="ti ti-device-mobile-off text-[40px] text-white/15 mb-3 block" />
            <p className="text-sm text-white/35">No mobile lines found</p>
          </div>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center pb-3 border-b border-white/8">
              <span className="text-xs font-bold text-white/40">Line</span>
              <span className="text-xs font-bold text-white/40 text-right w-32">Balance</span>
              <span className="text-xs font-bold text-white/40 text-right w-28">Threshold</span>
              <span className="w-8" />
            </div>

            <div className="space-y-1">
              {floats.map((f) => {
                const bal = Number(f.balance);
                const thr = f.lowThreshold !== null ? Number(f.lowThreshold) : null;
                const isLow = thr !== null && bal < thr;

                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center py-2.5 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MobileLineBadge operator={f.mobileLine.operator as never} />
                      <span className="text-xs text-white/40 truncate">{f.mobileLine.branch.name}</span>
                    </div>

                    <div className="w-32 text-right">
                      <span className={`text-sm font-bold ${isLow ? "text-red-400" : "text-white/70"}`}>
                        {f.mobileLine.branch.currency} {formatNumber(bal)}
                      </span>
                    </div>

                    <div className="w-28 text-right">
                      {thr !== null ? (
                        <span className="text-sm text-white/50">
                          {f.mobileLine.branch.currency} {formatNumber(thr)}
                        </span>
                      ) : (
                        <span className="text-xs italic text-white/25">Not set</span>
                      )}
                    </div>

                    <EditThresholdDialog f={f} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </GlassCard>
    </>
  );
}
