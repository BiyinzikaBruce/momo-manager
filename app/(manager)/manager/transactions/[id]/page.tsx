"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { TransactionBadge } from "@/components/ui/status-badge";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  amount: string;
  fee: string;
  customerName: string | null;
  customerPhone: string | null;
  reference: string | null;
  createdAt: string;
  branch:     { name: string; currency: string };
  mobileLine: { operator: string };
  cashier:    { name: string };
  shift:      { id: string; status: string } | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/45 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

export default function ManagerTransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tx, isLoading } = useQuery<Transaction>({
    queryKey: ["transaction", id],
    queryFn: () => fetch(`/api/transactions/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  return (
    <>
      <PageHeader title="Transaction Detail" breadcrumb="Transactions">
        <Link href="/manager/transactions">
          <Button variant="secondary" size="sm">← Back</Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <GlassCard className="max-w-xl">
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded-[10px] animate-pulse" />
            ))}
          </div>
        </GlassCard>
      ) : !tx || (tx as { error?: string }).error ? (
        <GlassCard className="max-w-xl">
          <div className="py-12 text-center">
            <i className="ti ti-file-x text-[40px] text-white/15 mb-3 block" />
            <p className="text-white/40">Transaction not found</p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
          <GlassCard>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/8">
              <TransactionBadge type={tx.type} />
              <div>
                <p className="text-lg font-extrabold text-white">
                  {tx.branch.currency} {formatNumber(Number(tx.amount))}
                </p>
                <p className="text-xs text-white/40">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <Row label="Amount" value={`${tx.branch.currency} ${formatNumber(Number(tx.amount))}`} />
            <Row label="Fee"    value={`${tx.branch.currency} ${formatNumber(Number(tx.fee))}`} />
            <Row
              label="Net"
              value={
                <span className="font-bold">
                  {tx.branch.currency} {formatNumber(
                    tx.type === "WITHDRAWAL"
                      ? Number(tx.amount) - Number(tx.fee)
                      : Number(tx.amount) + Number(tx.fee)
                  )}
                </span>
              }
            />
            <Row label="Reference" value={tx.reference ?? "—"} />
          </GlassCard>
          <GlassCard>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Details</h3>
            <Row label="Branch"       value={tx.branch.name} />
            <Row label="Operator"     value={<MobileLineBadge operator={tx.mobileLine.operator as never} />} />
            <Row label="Cashier"      value={tx.cashier.name} />
            <Row label="Customer"     value={tx.customerName ?? "—"} />
            <Row label="Phone"        value={tx.customerPhone ?? "—"} />
            <Row
              label="Shift"
              value={
                tx.shift
                  ? <Link href={`/manager/shifts/${tx.shift.id}`} className="text-[#E040A0] hover:underline">View shift →</Link>
                  : "—"
              }
            />
          </GlassCard>
        </div>
      )}
    </>
  );
}
