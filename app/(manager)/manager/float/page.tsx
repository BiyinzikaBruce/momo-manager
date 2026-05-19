"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type LineFloat = {
  id: string;
  balance: string;
  lowThreshold: string | null;
  mobileLine: {
    id: string;
    operator: string;
    branch: { id: string; name: string; currency: string };
  };
};

type BranchGroup = {
  branch: { id: string; name: string; country: string; currency: string };
  lines: LineFloat[];
};

export default function ManagerFloatPage() {
  const [expanded, setExpanded] = useState(true);

  const { data: floatData, isLoading } = useQuery<{
    floats: LineFloat[];
    byBranch: BranchGroup[];
  }>({
    queryKey: ["float"],
    queryFn: () => fetch("/api/float").then((r) => r.json()),
    refetchInterval: 60000,
  });

  const groups = floatData?.byBranch ?? [];
  const allFloats = floatData?.floats ?? [];
  const lowCount = allFloats.filter(
    (f) => f.lowThreshold !== null && Number(f.balance) < Number(f.lowThreshold)
  ).length;

  return (
    <>
      <PageHeader title="Float Overview" breadcrumb="Manager">
        {lowCount > 0 && (
          <span className="text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
            {lowCount} line{lowCount > 1 ? "s" : ""} below threshold
          </span>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-white/4 rounded-[16px] animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <GlassCard>
          <div className="py-12 text-center">
            <i className="ti ti-device-mobile-off text-[40px] text-white/15 mb-3 block" />
            <p className="text-sm text-white/35">No mobile lines configured</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const groupLow = group.lines.filter(
              (f) => f.lowThreshold !== null && Number(f.balance) < Number(f.lowThreshold)
            ).length;

            return (
              <GlassCard key={group.branch.id} className="p-0 overflow-hidden">
                <button
                  onClick={() => setExpanded(!expanded)}
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
                    {groupLow > 0 && (
                      <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                        {groupLow} low
                      </span>
                    )}
                    <i className={`ti ti-chevron-${expanded ? "up" : "down"} text-white/30`} />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-white/6 px-5 pb-4 pt-3 space-y-2">
                    {group.lines.map((f) => {
                      const bal = Number(f.balance);
                      const thr = f.lowThreshold !== null ? Number(f.lowThreshold) : null;
                      const isLow = thr !== null && bal < thr;
                      const pct = thr ? Math.min(100, Math.max(0, (bal / thr) * 100)) : 100;

                      return (
                        <div key={f.id} className="flex items-center gap-4 p-3 bg-white/3 rounded-[10px]">
                          <MobileLineBadge operator={f.mobileLine.operator as never} />
                          <div className="flex-1 min-w-0">
                            {thr !== null && (
                              <div className="w-full bg-white/8 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${isLow ? "bg-red-400" : "bg-green-400"}`}
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
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </>
  );
}
