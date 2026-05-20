import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

const OPERATORS = [
  "MTN_UG","AIRTEL_UG","VODACOM_TZ","TIGO_TZ",
  "SAFARICOM_KE","AIRTEL_KE","ORANGE_CD","VODACOM_CD","AIRTEL_CD",
] as const;

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get("branchId") ?? "";

  const effectiveBranchId =
    user.role === "MANAGER" ? (user.branchId ?? "") :
    user.role === "CASHIER" ? (user.branchId ?? "") :
    branchId;

  const key = cacheKey(tags.mobileLines, "list", effectiveBranchId);

  const lines = await getCachedOrFetch(key, () =>
    db.mobileLine.findMany({
      where: {
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        isActive: true,
      },
      include: {
        branch: { select: { id: true, name: true, country: true, currency: true } },
        float:  { select: { balance: true, lowThreshold: true } },
        feeRates: true,
      },
      orderBy: [{ branchId: "asc" }, { operator: "asc" }],
    }), 120);

  return NextResponse.json(lines);
}

const CreateSchema = z.object({
  branchId:      z.string().min(1, "Branch is required"),
  operator:      z.enum(OPERATORS, { required_error: "Operator is required" }),
  bankAccountId: z.string().optional().nullable(),
  openingBalance: z.number().min(0).default(0),
  lowThreshold:   z.number().min(0).nullable().default(null),
});

export async function POST(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { branchId, operator, bankAccountId, openingBalance, lowThreshold } = parsed.data;

  const branch = await db.branch.findUnique({ where: { id: branchId } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  // Check if this operator already exists on this branch
  const existing = await db.mobileLine.findFirst({ where: { branchId, operator } });
  if (existing) {
    return NextResponse.json({ error: `${operator} already exists for this branch` }, { status: 409 });
  }

  const lineId = randomUUID();

  // Default fee rates by operator category
  const wRate = ["ORANGE_CD", "VODACOM_CD"].includes(operator) ? 1.8
    : ["AIRTEL_UG","AIRTEL_KE","AIRTEL_CD","TIGO_TZ"].includes(operator) ? 1.3
    : 1.5;
  const tRate = ["ORANGE_CD","VODACOM_CD"].includes(operator) ? 1.2
    : ["AIRTEL_UG","AIRTEL_KE","AIRTEL_CD","TIGO_TZ"].includes(operator) ? 0.9
    : 1.0;

  const curr = branch.currency;
  const limits: Record<string, { wMin: number; wMax: number; tMin: number; tMax: number }> = {
    UGX: { wMin: 500,  wMax: 50000, tMin: 300,  tMax: 30000 },
    KES: { wMin: 10,   wMax: 3000,  tMin: 10,   tMax: 2000  },
    TZS: { wMin: 100,  wMax: 20000, tMin: 100,  tMax: 15000 },
    CDF: { wMin: 200,  wMax: 50000, tMin: 200,  tMax: 40000 },
  };
  const lim = limits[curr] ?? limits.UGX;

  const [line] = await db.$transaction([
    db.mobileLine.create({
      data: { id: lineId, branchId, operator, ...(bankAccountId ? { bankAccountId } : {}) },
      include: {
        branch: { select: { id: true, name: true, country: true, currency: true } },
        float: true,
        feeRates: true,
      },
    }),
    db.lineFloat.create({
      data: { mobileLineId: lineId, balance: openingBalance, lowThreshold },
    }),
    db.feeRate.createMany({
      data: [
        { mobileLineId: lineId, transactionType: "DEPOSIT",    rateType: "PERCENTAGE", rate: 0,     minFee: null,     maxFee: null },
        { mobileLineId: lineId, transactionType: "WITHDRAWAL", rateType: "PERCENTAGE", rate: wRate, minFee: lim.wMin, maxFee: lim.wMax },
        { mobileLineId: lineId, transactionType: "TRANSFER",   rateType: "PERCENTAGE", rate: tRate, minFee: lim.tMin, maxFee: lim.tMax },
      ],
    }),
  ]);

  await invalidateTag(tags.mobileLines);
  await invalidateTag(tags.float);
  return NextResponse.json(line, { status: 201 });
}
