import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { invalidateTag, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireRole("CASHIER");
  if (error) return error;

  const user = session!.user as AuthUser;
  const { id } = await params;

  const shift = await db.shift.findUnique({ where: { id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (shift.cashierId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (shift.status === "CLOSED") return NextResponse.json({ error: "Shift already closed" }, { status: 409 });

  // Capture current float balances as closing snapshot
  const snapshots = await db.shiftLineSnapshot.findMany({
    where: { shiftId: id },
    include: { mobileLine: { include: { float: true } } },
  });

  const now = new Date();

  await Promise.all([
    // Update closing balances on snapshots
    ...snapshots.map((s) =>
      db.shiftLineSnapshot.update({
        where: { id: s.id },
        data: { closingBalance: s.mobileLine.float?.balance ?? 0 },
      })
    ),
    // Close the shift
    db.shift.update({
      where: { id },
      data: { status: "CLOSED", closedAt: now },
    }),
  ]);

  const closed = await db.shift.findUnique({
    where: { id },
    include: {
      lineSnapshots: { include: { mobileLine: { select: { operator: true } } } },
      _count: { select: { transactions: true } },
    },
  });

  await invalidateTag(tags.shifts);
  return NextResponse.json(closed);
}
