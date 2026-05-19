"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { ShiftBadge, TransactionBadge } from "@/components/ui/status-badge";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type ShiftDetail = {
  id: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
  cashier: { id: string; name: string; email: string };
  branch:  { id: string; name: string; currency: string };
  summary: {
    count: number;
    totalAmount: number;
    totalFees: number;
    deposits: number;
    withdrawals: number;
    transfers: number;
  };
  transactions: {
    id: string;
    type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
    amount: string;
    fee: string;
    customerName: string | null;
    createdAt: string;
    mobileLine: { operator: string };
  }[];
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/45">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

export default function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: shift, isLoading } = useQuery<ShiftDetail>({
    queryKey: ["shift", id],
    queryFn: () => fetch(`/api/shifts/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Shift Detail" breadcrumb="Shifts" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <GlassCard key={i}>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-8 bg-white/4 rounded-[10px] animate-pulse" />
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </>
    );
  }

  if (!shift || (shift as { error?: string }).error) {
    return (
      <>
        <PageHeader title="Shift Detail" breadcrumb="Shifts">
          <Link href="/dashboard/shifts"><Button variant="secondary" size="sm">← Back</Button></Link>
        </PageHeader>
        <GlassCard className="max-w-md">
          <div className="py-12 text-center">
            <i className="ti ti-file-x text-[40px] text-white/15 mb-3 block" />
            <p className="text-white/40">Shift not found</p>
          </div>
        </GlassCard>
      </>
    );
  }

  const currency = shift.branch.currency;

  return (
    <>
      <PageHeader title="Shift Detail" breadcrumb="Shifts">
        <Link href="/dashboard/shifts">
          <Button variant="secondary" size="sm">← Back</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <GlassCard>
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Info</h3>
          <DetailRow label="Branch"  value={shift.branch.name} />
          <DetailRow label="Cashier" value={shift.cashier.name} />
          <DetailRow label="Status"  value={<ShiftBadge status={shift.status} />} />
          <DetailRow
            label="Opened"
            value={new Date(shift.openedAt).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          />
          <DetailRow
            label="Closed"
            value={shift.closedAt
              ? new Date(shift.closedAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
              : <span className="text-green-400">Still active</span>
            }
          />
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Txns",    value: String(shift.summary?.count ?? 0), icon: "ti-arrows-exchange" },
              { label: "Total Amount",  value: `${currency} ${formatNumber(shift.summary?.totalAmount ?? 0)}`, icon: "ti-cash" },
              { label: "Total Fees",    value: `${currency} ${formatNumber(shift.summary?.totalFees ?? 0)}`, icon: "ti-coin" },
              { label: "Deposits",      value: String(shift.summary?.deposits ?? 0), icon: "ti-arrow-down-circle" },
              { label: "Withdrawals",   value: String(shift.summary?.withdrawals ?? 0), icon: "ti-arrow-up-circle" },
              { label: "Transfers",     value: String(shift.summary?.transfers ?? 0), icon: "ti-transfer" },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-white/4 rounded-[12px]">
                <i className={`ti ${s.icon} text-[#E040A0] text-[16px] mb-1 block`} />
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-sm font-bold text-white mb-4">
          Transactions ({shift.transactions?.length ?? 0})
        </h3>
        {!shift.transactions?.length ? (
          <div className="py-8 text-center">
            <i className="ti ti-inbox text-[32px] text-white/15 mb-2 block" />
            <p className="text-sm text-white/35">No transactions in this shift</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Time", "Operator", "Type", "Amount", "Fee", "Customer"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-white/40 pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shift.transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                    <td className="py-2.5 pr-4 text-xs text-white/50">
                      {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 pr-4">
                      <MobileLineBadge operator={tx.mobileLine.operator as never} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <TransactionBadge type={tx.type} />
                    </td>
                    <td className="py-2.5 pr-4 font-bold text-white">
                      {currency} {formatNumber(Number(tx.amount))}
                    </td>
                    <td className="py-2.5 pr-4 text-white/50">
                      {formatNumber(Number(tx.fee))}
                    </td>
                    <td className="py-2.5 text-white/50">
                      {tx.customerName ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </>
  );
}
