"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { ShiftBadge } from "@/components/ui/status-badge";

type Shift = {
  id: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
  cashier: { id: string; name: string };
  branch:  { id: string; name: string; currency: string };
  _count:  { transactions: number };
};

const inputCls =
  "bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all appearance-none";

const columns: ColumnDef<Shift, unknown>[] = [
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }) => (
      <span className="text-sm text-white font-medium">{row.original.branch.name}</span>
    ),
  },
  {
    accessorKey: "cashier",
    header: "Cashier",
    cell: ({ row }) => (
      <span className="text-sm text-white/70">{row.original.cashier.name}</span>
    ),
  },
  {
    accessorKey: "openedAt",
    header: "Opened",
    cell: ({ row }) => (
      <span className="text-xs text-white/60">
        {new Date(row.getValue("openedAt")).toLocaleString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    accessorKey: "closedAt",
    header: "Closed",
    cell: ({ row }) =>
      row.getValue("closedAt") ? (
        <span className="text-xs text-white/60">
          {new Date(row.getValue("closedAt") as string).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </span>
      ) : (
        <span className="text-xs text-white/25 italic">Active</span>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <ShiftBadge status={row.getValue("status")} />
    ),
  },
  {
    id: "transactions",
    header: "Transactions",
    cell: ({ row }) => (
      <span className="text-sm font-bold text-white">{row.original._count.transactions}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/dashboard/shifts/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="text-xs">
          <i className="ti ti-eye text-[14px]" /> View
        </Button>
      </Link>
    ),
  },
];

export default function ShiftsPage() {
  const [branchId, setBranchId] = useState("");
  const [status, setStatus]     = useState("");

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => fetch("/api/branches?limit=100").then((r) => r.json()),
  });
  const branches = branchesData?.branches ?? [];

  const params = new URLSearchParams({
    ...(branchId ? { branchId } : {}),
    ...(status   ? { status }   : {}),
    limit: "100",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["shifts", branchId, status],
    queryFn: () => fetch(`/api/shifts?${params}`).then((r) => r.json()),
  });

  const shifts: Shift[] = data?.shifts ?? [];

  return (
    <>
      <PageHeader title="Shifts" breadcrumb="Admin" />

      <GlassCard className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <p className="text-xs text-white/40 mb-1.5">Branch</p>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className={inputCls + " min-w-[160px]"}
            >
              <option value="">All branches</option>
              {branches.map((b: { id: string; name: string }) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1.5">Status</p>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + " min-w-[120px]"}>
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setBranchId(""); setStatus(""); }}>
            Clear
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="py-12 text-center">
            <i className="ti ti-clock-off text-[40px] text-white/15 mb-3 block" />
            <p className="text-sm text-white/35">No shifts found</p>
          </div>
        ) : (
          <DataTable columns={columns} data={shifts} searchPlaceholder="Search shifts..." />
        )}
      </GlassCard>
    </>
  );
}
