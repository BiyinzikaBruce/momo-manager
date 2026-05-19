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
  const key = cacheKey(tags.transactions, id);

  const tx = await getCachedOrFetch(key, () =>
    db.transaction.findUnique({
      where: { id },
      include: {
        mobileLine: { select: { operator: true } },
        cashier:    { select: { id: true, name: true } },
        branch:     { select: { id: true, name: true, currency: true } },
        shift:      { select: { id: true, openedAt: true, closedAt: true, status: true } },
      },
    }), 60);

  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Scope checks
  if (user.role === "CASHIER"  && tx.cashierId !== user.id)      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (user.role === "MANAGER"  && tx.branchId  !== user.branchId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(tx);
}
