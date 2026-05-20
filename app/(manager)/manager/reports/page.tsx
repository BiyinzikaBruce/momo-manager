"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

type Summary = {
  totals: {
    count: number;
    totalAmount: number;
    totalFees: number;
    deposits: number;
    withdrawals: number;
    transfers: number;
  };
  byOperator: Record<string, { count: number; totalAmount: number; totalFees: number }>;
  byType: Record<string, { count: number; totalAmount: number; totalFees: number }>;
  activeShifts: number;
  lowFloatAlerts: number;
};

const inputCls =
  "bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";

const typeLabels: Record<string, string> = {
  DEPOSIT: "Deposits", WITHDRAWAL: "Withdrawals", TRANSFER: "Transfers",
};

export default function ManagerReportsPage() {
  const [type,     setType]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const summaryParams = new URLSearchParams({
    ...(type     ? { type }     : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo   ? { dateTo }   : {}),
  });

  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["manager-reports-summary", type, dateFrom, dateTo],
    queryFn: () => fetch(`/api/reports/summary?${summaryParams}`).then((r) => r.json()),
  });

  function buildExportUrl(format: "xlsx" | "pdf") {
    const p = new URLSearchParams({
      ...(type     ? { type }     : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo   ? { dateTo }   : {}),
    });
    return format === "xlsx"
      ? `/api/reports/export?${p}`
      : `/api/reports/pdf?${p}`;
  }

  return (
    <>
      <PageHeader title="Reports" breadcrumb="Manager" />

      <GlassCard className="mb-6">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Filters</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <p className="text-xs text-white/40 mb-1.5">Type</p>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ colorScheme: "dark" }}
              className={inputCls + " appearance-none bg-[#1c1c28] min-w-[140px]"}
            >
              <option value="">All types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1.5">From</p>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1.5">To</p>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setType(""); setDateFrom(""); setDateTo(""); }}
          >
            Clear
          </Button>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white/4 rounded-[16px] animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Transactions", value: formatNumber(summary.totals.count),                        icon: "ti-arrows-exchange", color: "text-white" },
              { label: "Total Amount", value: formatNumber(Math.round(summary.totals.totalAmount)),       icon: "ti-cash",            color: "text-white" },
              { label: "Total Fees",   value: formatNumber(Math.round(summary.totals.totalFees)),         icon: "ti-coin",            color: "text-[#E040A0]" },
              { label: "Deposits",     value: formatNumber(summary.totals.deposits),                      icon: "ti-arrow-down-circle", color: "text-green-400" },
              { label: "Withdrawals",  value: formatNumber(summary.totals.withdrawals),                   icon: "ti-arrow-up-circle",   color: "text-red-400" },
              { label: "Transfers",    value: formatNumber(summary.totals.transfers),                     icon: "ti-transfer",          color: "text-blue-400" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-[16px] bg-white/4 border border-white/6">
                <i className={`ti ${s.icon} text-[20px] mb-2 block ${s.color}`} />
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <GlassCard>
              <h3 className="text-sm font-bold text-white mb-4">By Transaction Type</h3>
              <div className="space-y-3">
                {Object.entries(summary.byType).map(([t, v]) => (
                  <div key={t} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{typeLabels[t] ?? t}</p>
                      <p className="text-xs text-white/40">{formatNumber(v.count)} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatNumber(Math.round(v.totalAmount))}</p>
                      <p className="text-xs text-white/40">Fees: {formatNumber(Math.round(v.totalFees))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-bold text-white mb-4">By Operator</h3>
              {Object.keys(summary.byOperator).length === 0 ? (
                <p className="text-sm text-white/30 py-4 text-center">No data</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(summary.byOperator)
                    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
                    .map(([op, v]) => (
                      <div key={op} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-sm text-white">{op.replace("_", " ")}</p>
                          <p className="text-xs text-white/40">{formatNumber(v.count)} txns</p>
                        </div>
                        <p className="text-sm font-bold text-white">{formatNumber(Math.round(v.totalAmount))}</p>
                      </div>
                    ))}
                </div>
              )}
            </GlassCard>
          </div>
        </>
      ) : null}

      <GlassCard>
        <h3 className="text-sm font-bold text-white mb-2">Export</h3>
        <p className="text-xs text-white/40 mb-4">
          Export uses the same filters applied above, scoped to your branch automatically.
        </p>
        <div className="flex gap-3">
          <a href={buildExportUrl("xlsx")} download>
            <Button variant="secondary">
              <i className="ti ti-file-spreadsheet text-[16px]" />
              Export XLSX
            </Button>
          </a>
          <a href={buildExportUrl("pdf")} download>
            <Button variant="outline">
              <i className="ti ti-file-type-pdf text-[16px]" />
              Export PDF
            </Button>
          </a>
        </div>
      </GlassCard>
    </>
  );
}
