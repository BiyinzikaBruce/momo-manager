import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, cacheKey, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { id } = await params;
  const key = cacheKey(tags.shifts, id);

  const shift = await getCachedOrFetch(key, async () => {
    const s = await db.shift.findUnique({
      where: { id },
      include: {
        cashier: { select: { id: true, name: true, email: true } },
        branch:  { select: { id: true, name: true, currency: true } },
        lineSnapshots: {
          include: { mobileLine: { select: { id: true, operator: true } } },
        },
        transactions: {
          select: {
            id: true, type: true, amount: true, fee: true,
            mobileLineId: true, customerName: true, createdAt: true,
            mobileLine: { select: { operator: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!s) return null;

    // Compute summary totals
    const summary = s.transactions.reduce(
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

    return { ...s, summary };
  }, 30);

  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Scope check — cashier can only see own shifts, manager sees their branch
  if (user.role === "CASHIER" && shift.cashierId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "MANAGER" && shift.branchId !== user.branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(shift);
}
