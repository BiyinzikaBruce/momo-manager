import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import LowFloatAlert from "@/emails/low-float-alert";
import React from "react";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

const CreateSchema = z.object({
  mobileLineId:  z.string(),
  type:          z.enum(["DEPOSIT", "WITHDRAWAL", "TRANSFER"]),
  amount:        z.number().positive(),
  customerName:  z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  reference:     z.string().max(50).optional(),
});

// Server-side fee calculation — always recalculate, never trust client
async function computeFee(mobileLineId: string, type: string, amount: number): Promise<number> {
  const rate = await db.feeRate.findUnique({
    where: { mobileLineId_transactionType: { mobileLineId, transactionType: type as never } },
  });
  if (!rate) return 0;

  const r = Number(rate.rate);
  if (rate.rateType === "FLAT") return r;

  let fee = (r / 100) * amount;
  const min = rate.minFee !== null ? Number(rate.minFee) : null;
  const max = rate.maxFee !== null ? Number(rate.maxFee) : null;
  if (min !== null && fee < min) fee = min;
  if (max !== null && fee > max) fee = max;
  return fee;
}

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const page         = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit        = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const branchId     = searchParams.get("branchId")     ?? "";
  const mobileLineId = searchParams.get("mobileLineId") ?? "";
  const type         = searchParams.get("type")         ?? "";
  const cashierId    = searchParams.get("cashierId")    ?? "";
  const shiftId      = searchParams.get("shiftId")      ?? "";
  const search       = searchParams.get("search")       ?? "";
  const dateFrom     = searchParams.get("dateFrom")     ?? "";
  const dateTo       = searchParams.get("dateTo")       ?? "";

  const effectiveBranchId =
    user.role === "ADMIN"   ? branchId :
    user.role === "MANAGER" ? (user.branchId ?? "") :
    (user.branchId ?? "");
  const effectiveCashierId = user.role === "CASHIER" ? user.id : cashierId;

  const key = cacheKey(tags.transactions, "list", effectiveBranchId, effectiveCashierId, type, mobileLineId, shiftId, page, limit, search, dateFrom, dateTo);

  const data = await getCachedOrFetch(key, async () => {
    const where: Record<string, unknown> = {
      ...(effectiveBranchId  ? { branchId: effectiveBranchId }       : {}),
      ...(effectiveCashierId ? { cashierId: effectiveCashierId }      : {}),
      ...(mobileLineId       ? { mobileLineId }                       : {}),
      ...(type               ? { type }                               : {}),
      ...(shiftId            ? { shiftId }                            : {}),
      ...(search ? {
        OR: [
          { customerName:  { contains: search, mode: "insensitive" } },
          { customerPhone: { contains: search, mode: "insensitive" } },
          { reference:     { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo   ? { lte: new Date(dateTo + "T23:59:59Z") } : {}),
        },
      } : {}),
    };

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          mobileLine: { select: { operator: true } },
          cashier:    { select: { id: true, name: true } },
          branch:     { select: { id: true, name: true, currency: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.transaction.count({ where }),
    ]);

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }, 30);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("CASHIER");
  if (error) return error;

  const user = session!.user as AuthUser;
  if (!user.branchId) {
    return NextResponse.json({ error: "No branch assigned" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  // Cashier must have an open shift
  const shift = await db.shift.findFirst({
    where: { cashierId: user.id, status: "OPEN" },
  });
  if (!shift) {
    return NextResponse.json({ error: "No open shift. Please open a shift first." }, { status: 403 });
  }

  const { mobileLineId, type, amount, customerName, customerPhone, reference } = parsed.data;

  // Verify mobile line belongs to cashier's branch
  const line = await db.mobileLine.findFirst({
    where: { id: mobileLineId, branchId: user.branchId },
    include: { float: true },
  });
  if (!line) return NextResponse.json({ error: "Mobile line not found in your branch" }, { status: 400 });

  // Server-side fee recalculation
  const fee = await computeFee(mobileLineId, type, amount);

  // Create transaction
  const tx = await db.transaction.create({
    data: {
      shiftId: shift.id,
      mobileLineId,
      branchId: user.branchId,
      cashierId: user.id,
      type: type as never,
      amount,
      fee,
      customerName:  customerName  ?? null,
      customerPhone: customerPhone ?? null,
      reference:     reference     ?? null,
    },
    include: {
      mobileLine: { select: { operator: true } },
      branch:     { select: { id: true, name: true, currency: true } },
    },
  });

  // Update float: DEPOSIT = money comes in (float increases)
  //              WITHDRAWAL = money goes out (float decreases)
  //              TRANSFER = money goes out (float decreases)
  const floatDelta = type === "DEPOSIT" ? amount : -amount;
  const currentBalance = Number(line.float?.balance ?? 0);
  const newBalance = Math.max(0, currentBalance + floatDelta);

  await db.lineFloat.update({
    where: { mobileLineId },
    data: { balance: newBalance },
  });

  // Check low-float threshold — create notification + email if breached
  const threshold = line.float?.lowThreshold ? Number(line.float.lowThreshold) : null;
  if (threshold !== null && newBalance < threshold) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    await db.notification.create({
      data: {
        branchId: user.branchId,
        type: "LOW_FLOAT",
        title: `Low Float: ${line.operator}`,
        message: `Float for ${line.operator} is below threshold. Current: ${newBalance.toLocaleString()}, Threshold: ${threshold.toLocaleString()}.`,
      },
    }).catch(() => {});

    // Email the branch manager
    const manager = await db.user.findFirst({
      where: { branchId: user.branchId!, role: "MANAGER" },
      select: { email: true },
    }).catch(() => null);

    if (manager) {
      sendEmail({
        to: manager.email,
        subject: `⚠️ Low Float Alert — ${line.operator.replace("_", " ")}`,
        react: React.createElement(LowFloatAlert, {
          branchName: tx.branch.name,
          operator: line.operator,
          currentBalance: newBalance,
          threshold,
          currency: tx.branch.currency,
          appUrl,
        }),
      });
    }
  }

  // Invalidate relevant caches
  await Promise.all([
    invalidateTag(tags.transactions),
    invalidateTag(tags.float),
    invalidateTag(tags.shifts),
  ]);

  return NextResponse.json(tx, { status: 201 });
}
