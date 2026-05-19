"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type MobileLine = {
  id: string;
  operator: string;
  isActive: boolean;
  branch: { name: string; currency: string };
  float: { balance: string; lowThreshold: string | null } | null;
  feeRates: { transactionType: string; rateType: string; rate: string }[];
};

const columns: ColumnDef<MobileLine, unknown>[] = [
  {
    accessorKey: "operator",
    header: "Operator",
    cell: ({ row }) => (
      <MobileLineBadge operator={row.original.operator as never} />
    ),
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }) => (
      <span className="text-white/70 text-sm">{row.original.branch.name}</span>
    ),
  },
  {
    id: "balance",
    header: "Float Balance",
    cell: ({ row }) => {
      const bal = row.original.float ? Number(row.original.float.balance) : 0;
      const thr = row.original.float?.lowThreshold ? Number(row.original.float.lowThreshold) : null;
      const isLow = thr !== null && bal < thr;
      return (
        <span className={`text-sm font-bold ${isLow ? "text-red-400" : "text-white"}`}>
          {row.original.branch.currency} {formatNumber(bal)}
          {isLow && <span className="ml-1 text-[10px] text-red-400">▼ Low</span>}
        </span>
      );
    },
  },
  {
    id: "threshold",
    header: "Threshold",
    cell: ({ row }) => {
      const thr = row.original.float?.lowThreshold;
      return thr ? (
        <span className="text-xs text-white/50">
          {row.original.branch.currency} {formatNumber(Number(thr))}
        </span>
      ) : (
        <span className="text-xs text-white/25 italic">Not set</span>
      );
    },
  },
  {
    id: "feeRates",
    header: "Fee Rates",
    cell: ({ row }) => (
      <span className="text-xs text-white/50">
        {row.original.feeRates.length} configured
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      row.getValue("isActive") ? (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-500/12 text-green-400 border border-green-500/20">
          Active
        </span>
      ) : (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/8 text-white/40 border border-white/10">
          Inactive
        </span>
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/dashboard/mobile-lines/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="text-xs">
          <i className="ti ti-settings text-[14px]" /> Rates
        </Button>
      </Link>
    ),
  },
];

export default function MobileLinesPage() {
  const { data: lines = [], isLoading } = useQuery<MobileLine[]>({
    queryKey: ["mobile-lines"],
    queryFn: () => fetch("/api/mobile-lines").then((r) => r.json()),
  });

  return (
    <>
      <PageHeader title="Mobile Lines" breadcrumb="Admin" />

      <GlassCard>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={lines}
            searchPlaceholder="Search lines..."
          />
        )}
      </GlassCard>
    </>
  );
}
