"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import { formatNumber } from "@/lib/utils";

type MobileLine = {
  id: string;
  operator: string;
  branch: { currency: string };
  float: { balance: string; lowThreshold: string | null } | null;
};

type FeeResult = {
  fee: number;
  rateType: string;
  rate: number;
  minFee: number | null;
  maxFee: number | null;
} | null;

const TX_TYPES = [
  { value: "DEPOSIT",    label: "Deposit",    icon: "ti-arrow-down-circle",  color: "text-green-400",  bg: "bg-green-400/10 border-green-400/30" },
  { value: "WITHDRAWAL", label: "Withdrawal", icon: "ti-arrow-up-circle",    color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30" },
  { value: "TRANSFER",   label: "Transfer",   icon: "ti-transfer",           color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30" },
] as const;

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";

export default function NewTransactionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedLineId, setSelectedLineId] = useState("");
  const [txType, setTxType]                 = useState<"DEPOSIT" | "WITHDRAWAL" | "TRANSFER">("DEPOSIT");
  const [amount, setAmount]                 = useState("");
  const [feeResult, setFeeResult]           = useState<FeeResult>(null);
  const [feeLoading, setFeeLoading]         = useState(false);
  const [customerName, setCustomerName]     = useState("");
  const [customerPhone, setCustomerPhone]   = useState("");
  const [reference, setReference]           = useState("");

  // Check for open shift
  const { data: shiftsData, isLoading: loadingShift } = useQuery({
    queryKey: ["my-open-shift"],
    queryFn: () => fetch("/api/shifts?status=OPEN&limit=1").then((r) => r.json()),
  });
  const openShift = shiftsData?.shifts?.[0] ?? null;

  // Load branch mobile lines
  const { data: linesData, isLoading: loadingLines } = useQuery<MobileLine[]>({
    queryKey: ["my-lines"],
    queryFn: () => fetch("/api/mobile-lines").then((r) => r.json()),
    enabled: !!openShift,
  });
  const lines: MobileLine[] = Array.isArray(linesData) ? linesData : [];

  // Auto-select first line
  useEffect(() => {
    if (lines.length > 0 && !selectedLineId) {
      setSelectedLineId(lines[0].id);
    }
  }, [lines, selectedLineId]);

  const selectedLine = lines.find((l) => l.id === selectedLineId) ?? null;
  const currency = selectedLine?.branch.currency ?? "";

  // Debounced fee calculation
  const feeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateFee = useCallback(async (lineId: string, type: string, amt: string) => {
    const parsed = parseFloat(amt);
    if (!lineId || !type || isNaN(parsed) || parsed <= 0) {
      setFeeResult(null);
      return;
    }
    setFeeLoading(true);
    try {
      const res = await fetch("/api/fee-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileLineId: lineId, type, amount: parsed }),
      });
      const data = await res.json();
      setFeeResult(res.ok ? data : null);
    } catch {
      setFeeResult(null);
    } finally {
      setFeeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (feeTimerRef.current) clearTimeout(feeTimerRef.current);
    feeTimerRef.current = setTimeout(() => {
      calculateFee(selectedLineId, txType, amount);
    }, 400);
    return () => {
      if (feeTimerRef.current) clearTimeout(feeTimerRef.current);
    };
  }, [selectedLineId, txType, amount, calculateFee]);

  const submitMutation = useMutation({
    mutationFn: () =>
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileLineId: selectedLineId,
          type: txType,
          amount: parseFloat(amount),
          ...(customerName.trim()  ? { customerName: customerName.trim() }   : {}),
          ...(customerPhone.trim() ? { customerPhone: customerPhone.trim() } : {}),
          ...(reference.trim()     ? { reference: reference.trim() }         : {}),
        }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to record transaction");
        return data;
      }),
    onSuccess: () => {
      toast.success("Transaction recorded");
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["my-open-shift"] });
      queryClient.invalidateQueries({ queryKey: ["shift-detail-full"] });
      queryClient.invalidateQueries({ queryKey: ["float"] });
      // Reset form
      setAmount("");
      setCustomerName("");
      setCustomerPhone("");
      setReference("");
      setFeeResult(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const amountNum = parseFloat(amount) || 0;
  const fee       = feeResult?.fee ?? 0;
  const net       = txType === "WITHDRAWAL" ? amountNum - fee : amountNum + fee;
  const canSubmit = !!selectedLineId && amountNum > 0 && !feeLoading && !submitMutation.isPending;

  // ── No open shift guard ───────────────────────────────────────────────────
  if (!loadingShift && !openShift) {
    return (
      <>
        <PageHeader title="New Transaction" breadcrumb="Transactions" />
        <GlassCard className="max-w-sm mx-auto mt-12">
          <div className="py-12 text-center">
            <i className="ti ti-clock-off text-[40px] text-white/15 mb-3 block" />
            <p className="text-sm text-white/45 mb-6">You need an open shift to record transactions.</p>
            <Button onClick={() => router.push("/cashier/shift")} className="w-full">
              <i className="ti ti-clock-play text-[16px]" />
              Open Shift
            </Button>
          </div>
        </GlassCard>
      </>
    );
  }

  return (
    <>
      <PageHeader title="New Transaction" breadcrumb="Transactions">
        <Button variant="secondary" size="sm" onClick={() => router.back()}>← Back</Button>
      </PageHeader>

      <div className="max-w-2xl">
        {/* Transaction type */}
        <GlassCard className="mb-4">
          <p className={labelCls}>Transaction Type</p>
          <div className="grid grid-cols-3 gap-2">
            {TX_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTxType(t.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-[12px] border transition-all ${
                  txType === t.value
                    ? t.bg + " " + t.color
                    : "border-white/8 bg-white/3 text-white/40 hover:bg-white/5"
                }`}
              >
                <i className={`ti ${t.icon} text-[22px]`} />
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Mobile line selection */}
        <GlassCard className="mb-4">
          <p className={labelCls}>Mobile Line</p>
          {loadingLines ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-white/4 rounded-[10px] animate-pulse" />
              ))}
            </div>
          ) : lines.length === 0 ? (
            <p className="text-sm text-white/35 py-4 text-center">No active lines in your branch</p>
          ) : (
            <div className="space-y-2">
              {lines.map((line) => {
                const bal = Number(line.float?.balance ?? 0);
                const thr = line.float?.lowThreshold != null ? Number(line.float.lowThreshold) : null;
                const isLow = thr !== null && bal < thr;
                const isSelected = selectedLineId === line.id;

                return (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => setSelectedLineId(line.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-[12px] border transition-all text-left ${
                      isSelected
                        ? "border-[#E040A0]/50 bg-[#E040A0]/8"
                        : "border-white/8 bg-white/3 hover:bg-white/5"
                    }`}
                  >
                    <MobileLineBadge operator={line.operator as never} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{line.operator.replace("_", " ")}</p>
                      <p className={`text-xs ${isLow ? "text-red-400" : "text-white/40"}`}>
                        Float: {currency} {formatNumber(bal)}
                        {isLow && " · Low"}
                      </p>
                    </div>
                    {isSelected && (
                      <i className="ti ti-circle-check-filled text-[#E040A0] text-[18px] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Amount */}
        <GlassCard className="mb-4">
          <label className={labelCls} htmlFor="amount">Amount {currency && `(${currency})`}</label>
          <input
            id="amount"
            type="number"
            min="1"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls + " text-lg font-bold"}
          />

          {/* Fee preview */}
          <div className="mt-3 p-3 rounded-[10px] bg-white/3 border border-white/6 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Amount</span>
              <span className="text-white">{currency} {formatNumber(amountNum)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Fee</span>
              <span className={feeLoading ? "text-white/30" : "text-[#E040A0]"}>
                {feeLoading ? "…" : feeResult ? `${currency} ${formatNumber(fee)}` : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-white/6 pt-1.5">
              <span className="text-white/60">
                {txType === "WITHDRAWAL" ? "Customer receives" : "Customer pays"}
              </span>
              <span className="text-white">
                {amountNum > 0 && feeResult ? `${currency} ${formatNumber(net)}` : "—"}
              </span>
            </div>
          </div>

          {feeResult && (
            <p className="text-[10px] text-white/30 mt-2">
              Rate: {feeResult.rateType === "PERCENTAGE" ? `${feeResult.rate}%` : `Flat ${currency} ${feeResult.rate}`}
              {feeResult.minFee != null && ` · Min ${formatNumber(feeResult.minFee)}`}
              {feeResult.maxFee != null && ` · Max ${formatNumber(feeResult.maxFee)}`}
            </p>
          )}
        </GlassCard>

        {/* Customer info */}
        <GlassCard className="mb-6">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
            Customer Info <span className="font-normal text-white/25 normal-case">(optional)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="customerName">Name</label>
              <input
                id="customerName"
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="customerPhone">Phone</label>
              <input
                id="customerPhone"
                type="tel"
                placeholder="+000 000 000 000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls} htmlFor="reference">Reference</label>
            <input
              id="reference"
              type="text"
              placeholder="Transaction reference or note"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputCls}
            />
          </div>
        </GlassCard>

        <Button
          size="lg"
          className="w-full"
          onClick={() => submitMutation.mutate()}
          disabled={!canSubmit}
        >
          {submitMutation.isPending ? (
            <>
              <i className="ti ti-loader-2 animate-spin text-[18px]" />
              Recording…
            </>
          ) : (
            <>
              <i className="ti ti-check text-[18px]" />
              Record {txType.charAt(0) + txType.slice(1).toLowerCase()}
            </>
          )}
        </Button>
      </div>
    </>
  );
}
