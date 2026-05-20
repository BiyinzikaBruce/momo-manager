"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { TransactionBadge } from "@/components/ui/status-badge";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  amount: string;
  fee: string;
  customerName: string | null;
  createdAt: string;
  branch: { name: string; currency: string };
  mobileLine: { operator: string };
  cashier: { name: string };
};

const inputCls =
  "bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";

const columns: ColumnDef<Transaction, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-xs text-white/60">
        {new Date(row.getValue("createdAt")).toLocaleString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    accessorKey: "mobileLine",
    header: "Operator",
    cell: ({ row }) => (
      <MobileLineBadge operator={row.original.mobileLine.operator as never} />
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <TransactionBadge type={row.getValue("type")} />,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-bold text-white text-sm">
        {row.original.branch.currency} {formatNumber(Number(row.getValue("amount")))}
      </span>
    ),
  },
  {
    accessorKey: "fee",
    header: "Fee",
    cell: ({ row }) => (
      <span className="text-sm text-white/55">{formatNumber(Number(row.getValue("fee")))}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-sm text-white/60">{row.getValue("customerName") ?? "—"}</span>
    ),
  },
  {
    accessorKey: "cashier",
    header: "Cashier",
    cell: ({ row }) => (
      <span className="text-sm text-white/60">{row.original.cashier.name}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/manager/transactions/${row.original.id}`}>
        <Button variant="ghost" size="sm" className="text-xs">
          <i className="ti ti-eye text-[14px]" /> View
        </Button>
      </Link>
    ),
  },
];

export default function ManagerTransactionsPage() {
  const [type,     setType]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const params = new URLSearchParams({
    ...(type     ? { type }     : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo   ? { dateTo }   : {}),
    limit: "200",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["manager-transactions", type, dateFrom, dateTo],
    queryFn: () => fetch(`/api/transactions?${params}`).then((r) => r.json()),
  });

  const transactions: Transaction[] = data?.transactions ?? [];

  return (
    <>
      <PageHeader title="Transactions" breadcrumb="Manager" />

      <GlassCard className="mb-4">
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
          <Button variant="secondary" size="sm" onClick={() => { setType(""); setDateFrom(""); setDateTo(""); }}>
            Clear
          </Button>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-xs text-white/40 mb-3">
          {isLoading ? "Loading…" : `${transactions.length} transactions`}
        </p>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <i className="ti ti-inbox text-[40px] text-white/15 mb-3 block" />
            <p className="text-sm text-white/35">No transactions match your filters</p>
          </div>
        ) : (
          <DataTable columns={columns} data={transactions} searchPlaceholder="Search transactions..." showViewOptions={false} />
        )}
      </GlassCard>
    </>
  );
}
