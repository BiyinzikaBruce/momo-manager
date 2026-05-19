"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
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

export default function SettingsPage() {
  const qc = useQueryClient();

  const { data: floatData, isLoading } = useQuery<{
    floats: LineFloat[];
  }>({
    queryKey: ["float"],
    queryFn: () => fetch("/api/float").then((r) => r.json()),
  });

  const floats = floatData?.floats ?? [];
  const [thresholds, setThresholds] = useState<Record<string, string>>({});

  useEffect(() => {
    if (floats.length > 0) {
      const map: Record<string, string> = {};
      for (const f of floats) {
        map[f.id] = f.lowThreshold !== null ? String(f.lowThreshold) : "";
      }
      setThresholds(map);
    }
  }, [floats]);

  const mutation = useMutation({
    mutationFn: async () => {
      const updates = floats.map((f) =>
        fetch(`/api/float/${f.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lowThreshold: thresholds[f.id] !== "" ? Number(thresholds[f.id]) : null,
          }),
        }).then((r) => {
          if (!r.ok) throw new Error(`Failed for ${f.mobileLine.operator}`);
          return r.json();
        })
      );
      return Promise.all(updates);
    },
    onSuccess: () => {
      toast.success("Thresholds saved");
      qc.invalidateQueries({ queryKey: ["float"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all text-right";

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
              its threshold, it will be flagged as &quot;Low&quot; on the dashboard. Leave blank to disable
              alerts for that line.
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
            <div className="mb-3 flex items-center gap-4 pb-3 border-b border-white/8">
              <span className="text-xs font-bold text-white/40 flex-1">Line</span>
              <span className="text-xs font-bold text-white/40 w-28 text-right">Current Balance</span>
              <span className="text-xs font-bold text-white/40 w-36 text-right">Alert Threshold</span>
            </div>

            <div className="space-y-2">
              {floats.map((f) => {
                const bal = Number(f.balance);
                const thr = thresholds[f.id] !== "" && thresholds[f.id] !== undefined
                  ? Number(thresholds[f.id])
                  : null;
                const isLow = thr !== null && bal < thr;

                return (
                  <div key={f.id} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <MobileLineBadge operator={f.mobileLine.operator as never} />
                      <span className="text-xs text-white/40 truncate">{f.mobileLine.branch.name}</span>
                    </div>
                    <div className="w-28 text-right">
                      <span className={`text-sm font-bold ${isLow ? "text-red-400" : "text-white/70"}`}>
                        {f.mobileLine.branch.currency} {formatNumber(bal)}
                      </span>
                    </div>
                    <div className="w-36">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="No alert"
                        value={thresholds[f.id] ?? ""}
                        onChange={(e) =>
                          setThresholds((prev) => ({ ...prev, [f.id]: e.target.value }))
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full mt-6"
            >
              {mutation.isPending ? "Saving…" : "Save All Thresholds"}
            </Button>
          </>
        )}
      </GlassCard>
    </>
  );
}
