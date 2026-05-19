import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  mobileLineId:    z.string(),
  transactionType: z.enum(["DEPOSIT", "WITHDRAWAL", "TRANSFER"]),
  amount:          z.number().positive(),
});

export async function POST(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { mobileLineId, transactionType, amount } = parsed.data;

  const rate = await db.feeRate.findUnique({
    where: { mobileLineId_transactionType: { mobileLineId, transactionType } },
  });

  if (!rate) {
    return NextResponse.json({ fee: 0, rateType: null, rate: 0 });
  }

  const r = Number(rate.rate);
  let fee: number;

  if (rate.rateType === "FLAT") {
    fee = r;
  } else {
    fee = (r / 100) * amount;
    const min = rate.minFee !== null ? Number(rate.minFee) : null;
    const max = rate.maxFee !== null ? Number(rate.maxFee) : null;
    if (min !== null && fee < min) fee = min;
    if (max !== null && fee > max) fee = max;
  }

  return NextResponse.json({
    fee: Math.round(fee * 100) / 100,
    rateType: rate.rateType,
    rate: r,
    minFee: rate.minFee ? Number(rate.minFee) : null,
    maxFee: rate.maxFee ? Number(rate.maxFee) : null,
  });
}
