"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { ShiftBadge, TransactionBadge } from "@/components/ui/status-badge";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type Shift = {
  id: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt: string | null;
  branch: { name: string; currency: string };
  summary?: {
    count: number;
    totalAmount: number;
    totalFees: number;
    deposits: number;
    withdrawals: number;
    transfers: number;
  };
  transactions?: {
    id: string;
    type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
    amount: string;
    fee: string;
    customerName: string | null;
    createdAt: string;
    mobileLine: { operator: string };
  }[];
};

export default function CashierShiftPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ["my-shift"],
    queryFn: () => fetch("/api/shifts?status=OPEN&limit=1").then((r) => r.json()),
    refetchInterval: 30000,
  });

  const openShift: Shift | null = shiftsData?.shifts?.[0] ?? null;

  const { data: shiftDetail, isLoading: loadingDetail } = useQuery<Shift>({
    queryKey: ["shift-detail-full", openShift?.id],
    queryFn: () => fetch(`/api/shifts/${openShift!.id}`).then((r) => r.json()),
    enabled: !!openShift?.id,
  });

  const openMutation = useMutation({
    mutationFn: () =>
      fetch("/api/shifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to open shift");
        return data;
      }),
    onSuccess: () => {
      toast.success("Shift opened successfully");
      queryClient.invalidateQueries({ queryKey: ["my-shift"] });
      queryClient.invalidateQueries({ queryKey: ["my-open-shift"] });
      router.push("/cashier/dashboard");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeMutation = useMutation({
    mutationFn: (shiftId: string) =>
      fetch(`/api/shifts/${shiftId}/close`, { method: "PATCH" }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to close shift");
        return data;
      }),
    onSuccess: () => {
      toast.success("Shift closed");
      queryClient.invalidateQueries({ queryKey: ["my-shift"] });
      queryClient.invalidateQueries({ queryKey: ["my-open-shift"] });
      queryClient.invalidateQueries({ queryKey: ["shift-detail-full"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const shift = shiftDetail ?? openShift;
  const currency = shift?.branch.currency ?? "";
  const summary = shiftDetail?.summary;

  return (
    <>
      <PageHeader title="My Shift" breadcrumb="Cashier" />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/4 rounded-[16px] animate-pulse" />
          ))}
        </div>
      ) : !openShift ? (
        /* ── No active shift ─────────────────────── */
        <div className="max-w-sm mx-auto mt-16 text-center">
          <div className="w-20 h-20 rounded-full bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-6">
            <i className="ti ti-clock-off text-[36px] text-white/25" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Active Shift</h2>
          <p className="text-sm text-white/45 mb-8">
            Open a shift to start recording transactions for your branch.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => openMutation.mutate()}
            disabled={openMutation.isPending}
          >
            <i className="ti ti-clock-play text-[18px]" />
            {openMutation.isPending ? "Opening…" : "Open Shift"}
          </Button>
        </div>
      ) : (
        /* ── Active shift ────────────────────────── */
        <>
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-400/15 flex items-center justify-center">
                  <i className="ti ti-clock-check text-green-400 text-[18px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Shift Active</p>
                    <ShiftBadge status="OPEN" />
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {openShift.branch.name} &middot; Opened{" "}
                    {new Date(openShift.openedAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/cashier/transactions/new">
                  <Button size="sm">
                    <i className="ti ti-plus text-[14px]" />
                    New Transaction
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Close this shift? You won't be able to record more transactions until you open a new one.")) {
                      closeMutation.mutate(openShift.id);
                    }
                  }}
                  disabled={closeMutation.isPending}
                >
                  <i className="ti ti-clock-stop text-[14px]" />
                  {closeMutation.isPending ? "Closing…" : "Close Shift"}
                </Button>
              </div>
            </div>
          </GlassCard>

          {loadingDetail ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-white/4 rounded-[12px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: "Transactions", value: formatNumber(summary?.count ?? 0),                                              color: "text-white" },
                { label: "Total Amount", value: summary ? `${currency} ${formatNumber(Math.round(summary.totalAmount))}` : "—", color: "text-white" },
                { label: "Fees",         value: summary ? `${currency} ${formatNumber(Math.round(summary.totalFees))}` : "—",   color: "text-[#E040A0]" },
                { label: "Deposits",     value: formatNumber(summary?.deposits ?? 0),                                            color: "text-green-400" },
                { label: "Withdrawals",  value: formatNumber(summary?.withdrawals ?? 0),                                         color: "text-red-400" },
                { label: "Transfers",    value: formatNumber(summary?.transfers ?? 0),                                           color: "text-blue-400" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-[12px] bg-white/4 border border-white/6 text-center">
                  <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <GlassCard>
            <h3 className="text-sm font-bold text-white mb-4">
              Transactions ({shiftDetail?.transactions?.length ?? 0})
            </h3>
            {!shiftDetail?.transactions?.length ? (
              <div className="py-8 text-center">
                <i className="ti ti-inbox text-[32px] text-white/15 mb-2 block" />
                <p className="text-sm text-white/35">No transactions yet</p>
                <Link href="/cashier/transactions/new">
                  <Button size="sm" className="mt-4">
                    <i className="ti ti-plus text-[14px]" />
                    Record First Transaction
                  </Button>
                </Link>
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
                    {shiftDetail.transactions!.map((tx) => (
                      <tr key={tx.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                        <td className="py-2.5 pr-4 text-xs text-white/50">
                          {new Date(tx.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
                        <td className="py-2.5 text-white/50">{tx.customerName ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </>
      )}
    </>
  );
}
