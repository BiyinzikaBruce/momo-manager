import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

const OpenShiftSchema = z.object({
  // Optional opening float snapshots per line (lineId → balance)
  openingFloats: z.record(z.string(), z.number()).optional(),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const branchId = searchParams.get("branchId") ?? "";
  const cashierId = searchParams.get("cashierId") ?? "";
  const status   = searchParams.get("status")   ?? "";

  // Scope by role
  const effectiveBranchId =
    user.role === "ADMIN" ? branchId :
    user.role === "MANAGER" ? (user.branchId ?? "") :
    (user.branchId ?? "");
  const effectiveCashierId = user.role === "CASHIER" ? user.id : cashierId;

  const key = cacheKey(tags.shifts, "list", effectiveBranchId, effectiveCashierId, status, page, limit);

  const data = await getCachedOrFetch(key, async () => {
    const where = {
      ...(effectiveBranchId  ? { branchId: effectiveBranchId }   : {}),
      ...(effectiveCashierId ? { cashierId: effectiveCashierId }  : {}),
      ...(status             ? { status: status as "OPEN" | "CLOSED" } : {}),
    };

    const [shifts, total] = await Promise.all([
      db.shift.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true, email: true } },
          branch:  { select: { id: true, name: true, currency: true } },
          _count:  { select: { transactions: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { openedAt: "desc" },
      }),
      db.shift.count({ where }),
    ]);

    return { shifts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }, 30);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // Only cashiers can open shifts
  const { session, error } = await requireRole("CASHIER");
  if (error) return error;

  const user = session!.user as AuthUser;
  if (!user.branchId) {
    return NextResponse.json({ error: "Cashier has no branch assigned" }, { status: 400 });
  }

  // Prevent opening a second shift
  const openShift = await db.shift.findFirst({
    where: { cashierId: user.id, status: "OPEN" },
  });
  if (openShift) {
    return NextResponse.json({ error: "You already have an open shift", shift: openShift }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = OpenShiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Get all active lines for this branch
  const branchLines = await db.mobileLine.findMany({
    where: { branchId: user.branchId, isActive: true },
    include: { float: true },
  });

  const shift = await db.shift.create({
    data: {
      cashierId: user.id,
      branchId: user.branchId,
      status: "OPEN",
    },
  });

  // Create opening snapshots from current float balances
  await db.shiftLineSnapshot.createMany({
    data: branchLines.map((line) => ({
      shiftId: shift.id,
      mobileLineId: line.id,
      openingBalance: parsed.data?.openingFloats?.[line.id]
        ? parsed.data.openingFloats[line.id]
        : Number(line.float?.balance ?? 0),
    })),
  });

  await invalidateTag(tags.shifts);
  return NextResponse.json(shift, { status: 201 });
}
