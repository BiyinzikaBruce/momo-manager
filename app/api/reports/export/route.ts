import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const branchId     = searchParams.get("branchId")     ?? "";
  const mobileLineId = searchParams.get("mobileLineId") ?? "";
  const type         = searchParams.get("type")         ?? "";
  const dateFrom     = searchParams.get("dateFrom")     ?? "";
  const dateTo       = searchParams.get("dateTo")       ?? "";

  const effectiveBranchId =
    user.role === "ADMIN" ? branchId : (user.branchId ?? "");

  const where: Record<string, unknown> = {
    ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    ...(mobileLineId      ? { mobileLineId }               : {}),
    ...(type              ? { type }                       : {}),
    ...(dateFrom || dateTo ? {
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo   ? { lte: new Date(dateTo + "T23:59:59Z") } : {}),
      },
    } : {}),
  };

  const transactions = await db.transaction.findMany({
    where,
    include: {
      mobileLine: { select: { operator: true } },
      cashier:    { select: { name: true } },
      branch:     { select: { name: true, currency: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const rows = transactions.map((tx) => ({
    "Date":          new Date(tx.createdAt).toLocaleString(),
    "Branch":        tx.branch.name,
    "Operator":      tx.mobileLine.operator,
    "Type":          tx.type,
    "Amount":        Number(tx.amount),
    "Fee":           Number(tx.fee),
    "Net":           tx.type === "WITHDRAWAL" ? Number(tx.amount) - Number(tx.fee) : Number(tx.amount) + Number(tx.fee),
    "Currency":      tx.branch.currency,
    "Customer Name": tx.customerName  ?? "",
    "Customer Phone":tx.customerPhone ?? "",
    "Reference":     tx.reference     ?? "",
    "Cashier":       tx.cashier.name,
    "Transaction ID":tx.id,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length, 14) }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `momo-report-${dateFrom || "all"}-${dateTo || "all"}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
