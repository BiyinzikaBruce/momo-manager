import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

const UpsertSchema = z.object({
  mobileLineId:    z.string(),
  transactionType: z.enum(["DEPOSIT", "WITHDRAWAL", "TRANSFER"]),
  rateType:        z.enum(["PERCENTAGE", "FLAT"]),
  rate:            z.number().min(0),
  minFee:          z.number().min(0).optional().nullable(),
  maxFee:          z.number().min(0).optional().nullable(),
});

const BulkUpdateSchema = z.object({
  rates: z.array(UpsertSchema),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const branchId     = searchParams.get("branchId")     ?? "";
  const mobileLineId = searchParams.get("mobileLineId") ?? "";

  const effectiveBranchId =
    user.role !== "ADMIN" ? (user.branchId ?? "") : branchId;

  const key = cacheKey(tags.feeRates, effectiveBranchId, mobileLineId);

  const rates = await getCachedOrFetch(key, async () => {
    const lines = await db.mobileLine.findMany({
      where: {
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        ...(mobileLineId      ? { id: mobileLineId }            : {}),
      },
      include: {
        feeRates: true,
        branch: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { operator: "asc" },
    });
    return lines;
  }, 300);

  return NextResponse.json(rates);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = BulkUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await Promise.all(
    parsed.data.rates.map((r) =>
      db.feeRate.upsert({
        where: { mobileLineId_transactionType: { mobileLineId: r.mobileLineId, transactionType: r.transactionType } },
        update: { rateType: r.rateType, rate: r.rate, minFee: r.minFee ?? null, maxFee: r.maxFee ?? null },
        create: { mobileLineId: r.mobileLineId, transactionType: r.transactionType, rateType: r.rateType, rate: r.rate, minFee: r.minFee ?? null, maxFee: r.maxFee ?? null },
      })
    )
  );

  await invalidateTag(tags.feeRates);
  return NextResponse.json(updated);
}
