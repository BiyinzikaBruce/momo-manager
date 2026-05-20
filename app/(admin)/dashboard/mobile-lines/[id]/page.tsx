"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type FeeRate = {
  id?: string;
  transactionType: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  rateType: "FLAT" | "PERCENTAGE";
  rate: string | number;
  minFee: string | number | null;
  maxFee: string | number | null;
};

type LineData = {
  id: string;
  operator: string;
  isActive: boolean;
  branch: { id: string; name: string; currency: string };
  float: { id: string; balance: string; lowThreshold: string | null } | null;
  feeRates: FeeRate[];
};

const TX_TYPES = ["DEPOSIT", "WITHDRAWAL", "TRANSFER"] as const;
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";

function defaultRate(type: string): FeeRate {
  return { transactionType: type as never, rateType: "PERCENTAGE", rate: 0, minFee: null, maxFee: null };
}

export default function MobileLineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: line, isLoading } = useQuery<LineData>({
    queryKey: ["mobile-line", id],
    queryFn: () => fetch(`/api/mobile-lines/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const [rates, setRates] = useState<Record<string, FeeRate>>({});

  useEffect(() => {
    if (line) {
      const map: Record<string, FeeRate> = {};
      for (const t of TX_TYPES) {
        const existing = line.feeRates.find((r) => r.transactionType === t);
        map[t] = existing ?? defaultRate(t);
      }
      setRates(map);
    }
  }, [line]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/fee-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: TX_TYPES.map((t) => ({
            mobileLineId:    id,
            transactionType: t,
            rateType:        rates[t].rateType,
            rate:            Number(rates[t].rate),
            minFee:          rates[t].minFee !== null && rates[t].minFee !== "" ? Number(rates[t].minFee) : null,
            maxFee:          rates[t].maxFee !== null && rates[t].maxFee !== "" ? Number(rates[t].maxFee) : null,
          })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Fee rates saved");
      qc.invalidateQueries({ queryKey: ["mobile-lines"] });
      qc.invalidateQueries({ queryKey: ["mobile-line", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !line) {
    return (
      <>
        <PageHeader title="Fee Rate Editor" breadcrumb="Mobile Lines" />
        <GlassCard className="max-w-2xl">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/4 rounded-[12px] animate-pulse" />
            ))}
          </div>
        </GlassCard>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Fee Rate Editor" breadcrumb="Mobile Lines">
        <Link href="/dashboard/mobile-lines">
          <Button variant="secondary" size="sm">← Back</Button>
        </Link>
      </PageHeader>

      {/* Line info */}
      <GlassCard className="max-w-2xl mb-6">
        <div className="flex items-center gap-4">
          <MobileLineBadge operator={line.operator as never} />
          <div className="flex-1">
            <p className="text-sm text-white/50">{line.branch.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Float Balance</p>
            <p className="text-lg font-bold text-white">
              {line.branch.currency} {line.float ? formatNumber(Number(line.float.balance)) : "0"}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Fee rates */}
      <GlassCard className="max-w-2xl">
        <h3 className="text-sm font-bold text-white mb-5">Fee Configuration</h3>
        <div className="space-y-6">
          {TX_TYPES.map((type) => {
            const r = rates[type];
            if (!r) return null;
            const isPercentage = r.rateType === "PERCENTAGE";
            return (
              <div key={type} className="p-4 bg-white/3 rounded-[12px] border border-white/6">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">
                  {type}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Rate Type</label>
                    <select
                      value={r.rateType}
                      onChange={(e) =>
                        setRates((prev) => ({ ...prev, [type]: { ...prev[type], rateType: e.target.value as never } }))
                      }
                      style={{ colorScheme: "dark" }}
                      className={inputCls + " appearance-none bg-[#1c1c28]"}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">
                      {isPercentage ? "Rate (%)" : `Flat Amount (${line.branch.currency})`}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={r.rate}
                      onChange={(e) =>
                        setRates((prev) => ({ ...prev, [type]: { ...prev[type], rate: e.target.value } }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                {isPercentage && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        Min Fee ({line.branch.currency})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="No minimum"
                        value={r.minFee ?? ""}
                        onChange={(e) =>
                          setRates((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], minFee: e.target.value === "" ? null : e.target.value },
                          }))
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">
                        Max Fee ({line.branch.currency})
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="No maximum"
                        value={r.maxFee ?? ""}
                        onChange={(e) =>
                          setRates((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], maxFee: e.target.value === "" ? null : e.target.value },
                          }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full mt-6"
        >
          {mutation.isPending ? "Saving…" : "Save Fee Rates"}
        </Button>
      </GlassCard>
    </>
  );
}
