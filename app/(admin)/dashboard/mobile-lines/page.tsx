"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/gradient-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { MobileLineBadge } from "@/components/ui/mobile-line-badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatNumber } from "@/lib/utils";

type MobileLine = {
  id: string;
  operator: string;
  isActive: boolean;
  branch: { name: string; currency: string };
  float: { balance: string; lowThreshold: string | null } | null;
  feeRates: { transactionType: string; rateType: string; rate: string }[];
};

const OPERATORS = [
  { value: "MTN_UG",       label: "MTN Uganda" },
  { value: "AIRTEL_UG",    label: "Airtel Uganda" },
  { value: "VODACOM_TZ",   label: "Vodacom Tanzania" },
  { value: "TIGO_TZ",      label: "Tigo Tanzania" },
  { value: "SAFARICOM_KE", label: "Safaricom M-Pesa" },
  { value: "AIRTEL_KE",    label: "Airtel Kenya" },
  { value: "ORANGE_CD",    label: "Orange Congo" },
  { value: "VODACOM_CD",   label: "Vodacom Congo" },
  { value: "AIRTEL_CD",    label: "Airtel Congo" },
];

const inputCls = "w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E040A0]/50 focus:ring-1 focus:ring-[#E040A0]/30 transition-all";
const labelCls = "block text-xs font-medium text-white/60 mb-1.5";

function NewLineDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [operator, setOperator] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [lowThreshold, setLowThreshold] = useState("");

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => fetch("/api/branches?limit=100").then((r) => r.json()),
  });
  const branches: { id: string; name: string; currency: string }[] = branchesData?.branches ?? [];

  const { data: bankAccountsData } = useQuery({
    queryKey: ["bank-accounts", branchId],
    queryFn: () => fetch(`/api/bank-account?branchId=${branchId}`).then((r) => r.json()),
    enabled: !!branchId,
  });
  const bankAccounts: { id: string; bankName: string; accountNumber: string; balance: string }[] =
    bankAccountsData ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      if (!branchId) throw new Error("Select a branch");
      if (!operator) throw new Error("Select an operator");
      const bal = openingBalance !== "" ? Number(openingBalance) : 0;
      const thr = lowThreshold !== "" ? Number(lowThreshold) : null;
      if (isNaN(bal) || bal < 0) throw new Error("Opening balance must be 0 or more");

      const res = await fetch("/api/mobile-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId, operator,
          bankAccountId: bankAccountId || null,
          openingBalance: bal, lowThreshold: thr,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Mobile line added");
      qc.invalidateQueries({ queryKey: ["mobile-lines"] });
      qc.invalidateQueries({ queryKey: ["float"] });
      setBranchId(""); setOperator(""); setBankAccountId(""); setOpeningBalance(""); setLowThreshold("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <i className="ti ti-plus text-[12px]" /> New Line
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Mobile Line</DialogTitle>
          <DialogDescription>Add a new operator line to a branch with default fee rates</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              style={{ colorScheme: "dark" }}
              className={inputCls + " appearance-none bg-[#1c1c28]"}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              style={{ colorScheme: "dark" }}
              className={inputCls + " appearance-none bg-[#1c1c28]"}
            >
              <option value="">Select operator</option>
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Bank Account (optional)</label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              disabled={!branchId}
              style={{ colorScheme: "dark" }}
              className={inputCls + " appearance-none bg-[#1c1c28]"}
            >
              <option value="">No bank account linked</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} · {b.accountNumber}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-white/30 mt-1">
              Top-ups will be debited from this account automatically
            </p>
          </div>
          <div>
            <label className={labelCls}>Opening Balance</label>
            <input
              type="number"
              min="0"
              step="any"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Low Float Threshold (optional)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={lowThreshold}
              onChange={(e) => setLowThreshold(e.target.value)}
              placeholder="Leave empty to disable alert"
              className={inputCls}
            />
          </div>
          <p className="text-[11px] text-white/30">
            Default fee rates will be applied automatically based on the operator.
          </p>
          <div className="flex gap-3 pt-1">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? "Creating…" : "Add Line"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      <PageHeader title="Mobile Lines" breadcrumb="Admin">
        <NewLineDialog />
      </PageHeader>

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
