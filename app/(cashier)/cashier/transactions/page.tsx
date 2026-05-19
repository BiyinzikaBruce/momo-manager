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
  branch: { currency: string };
  mobileLine: { operator: string };
};

const inputCls =
  "bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all appearance-none";

const columns: ColumnDef<Transaction, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "Time",
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
];

export default function CashierTransactionsPage() {
  const [type, setType] = useState("");

  const { data: shiftsData } = useQuery({
    queryKey: ["my-open-shift"],
    queryFn: () => fetch("/api/shifts?status=OPEN&limit=1").then((r) => r.json()),
  });
  const openShift = shiftsData?.shifts?.[0] ?? null;

  const params = new URLSearchParams({
    ...(type ? { type } : {}),
    ...(openShift?.id ? { shiftId: openShift.id } : {}),
    limit: "200",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["my-transactions", type, openShift?.id],
    queryFn: () => fetch(`/api/transactions?${params}`).then((r) => r.json()),
    enabled: !!openShift,
  });

  const transactions: Transaction[] = data?.transactions ?? [];

  return (
    <>
      <PageHeader title="My Transactions" breadcrumb="Cashier">
        <Link href="/cashier/transactions/new">
          <Button size="sm">
            <i className="ti ti-plus text-[14px]" />
            New Transaction
          </Button>
        </Link>
      </PageHeader>

      {!openShift && !isLoading ? (
        <GlassCard>
          <div className="py-12 text-center">
            <i className="ti ti-clock-off text-[40px] text-white/15 mb-3 block" />
            <p className="text-sm text-white/35 mb-4">No active shift — open a shift first</p>
            <Link href="/cashier/shift">
              <Button size="sm">Open Shift</Button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="mb-4">
            <div className="flex gap-3 items-end">
              <div>
                <p className="text-xs text-white/40 mb-1.5">Type</p>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputCls + " min-w-[140px]"}
                >
                  <option value="">All types</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setType("")}>Clear</Button>
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-xs text-white/40 mb-3">
              {isLoading ? "Loading…" : `${transactions.length} transactions this shift`}
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
                <p className="text-sm text-white/35">No transactions yet</p>
                <Link href="/cashier/transactions/new">
                  <Button size="sm" className="mt-4">
                    <i className="ti ti-plus text-[14px]" />
                    Record First Transaction
                  </Button>
                </Link>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={transactions}
                searchPlaceholder="Search transactions..."
                showViewOptions={false}
              />
            )}
          </GlassCard>
        </>
      )}
    </>
  );
}
