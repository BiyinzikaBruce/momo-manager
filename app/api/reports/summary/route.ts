import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, cacheKey, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const branchId     = searchParams.get("branchId")     ?? "";
  const mobileLineId = searchParams.get("mobileLineId") ?? "";
  const dateFrom     = searchParams.get("dateFrom")     ?? "";
  const dateTo       = searchParams.get("dateTo")       ?? "";
  const type         = searchParams.get("type")         ?? "";

  const effectiveBranchId =
    user.role === "ADMIN" ? branchId : (user.branchId ?? "");

  const key = cacheKey(tags.reports, "summary", effectiveBranchId, mobileLineId, type, dateFrom, dateTo);

  const data = await getCachedOrFetch(key, async () => {
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
        branch:     { select: { id: true, name: true, currency: true } },
      },
    });

    // Aggregate totals
    const totals = transactions.reduce(
      (acc, tx) => {
        acc.count++;
        acc.totalAmount += Number(tx.amount);
        acc.totalFees   += Number(tx.fee);
        if (tx.type === "DEPOSIT")    acc.deposits++;
        if (tx.type === "WITHDRAWAL") acc.withdrawals++;
        if (tx.type === "TRANSFER")   acc.transfers++;
        return acc;
      },
      { count: 0, totalAmount: 0, totalFees: 0, deposits: 0, withdrawals: 0, transfers: 0 }
    );

    // Breakdown by mobile operator
    const byOperator: Record<string, { count: number; totalAmount: number; totalFees: number }> = {};
    for (const tx of transactions) {
      const op = tx.mobileLine.operator;
      if (!byOperator[op]) byOperator[op] = { count: 0, totalAmount: 0, totalFees: 0 };
      byOperator[op].count++;
      byOperator[op].totalAmount += Number(tx.amount);
      byOperator[op].totalFees   += Number(tx.fee);
    }

    // Breakdown by type
    const byType = {
      DEPOSIT:    transactions.filter((t) => t.type === "DEPOSIT"),
      WITHDRAWAL: transactions.filter((t) => t.type === "WITHDRAWAL"),
      TRANSFER:   transactions.filter((t) => t.type === "TRANSFER"),
    };
    const byTypeAgg = Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, {
        count: v.length,
        totalAmount: v.reduce((s, t) => s + Number(t.amount), 0),
        totalFees:   v.reduce((s, t) => s + Number(t.fee), 0),
      }])
    );

    // Active shifts count
    const activeShifts = await db.shift.count({
      where: {
        status: "OPEN",
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      },
    });

    // Low float alerts
    const lowFloats = await db.lineFloat.count({
      where: {
        AND: [
          { lowThreshold: { not: null } },
          // balance < lowThreshold (Prisma raw comparison workaround)
        ],
        mobileLine: effectiveBranchId ? { branchId: effectiveBranchId } : {},
      },
    });

    return { totals, byOperator, byType: byTypeAgg, activeShifts, lowFloatAlerts: lowFloats };
  }, 60);

  return NextResponse.json(data);
}
