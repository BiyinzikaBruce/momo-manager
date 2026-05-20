import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { invalidateTag, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  topUp:        z.number().positive("Amount must be positive").optional(),
  balance:      z.number().min(0, "Balance cannot be negative").optional(),
  lowThreshold: z.number().min(0).nullable().optional(),
}).refine(
  (d) => !(d.topUp !== undefined && d.balance !== undefined),
  { message: "Use either topUp or balance, not both" }
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { topUp, balance, lowThreshold } = parsed.data;
  if (topUp === undefined && balance === undefined && lowThreshold === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const existing = await db.lineFloat.findUnique({
    where: { id },
    include: { mobileLine: { select: { bankAccountId: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bankAccountId = existing.mobileLine.bankAccountId;

  // If topping up and a bank account is linked, atomically debit the bank account
  if (topUp !== undefined && bankAccountId) {
    const bankAccount = await db.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (bankAccount && Number(bankAccount.balance) < topUp) {
      return NextResponse.json(
        { error: `Insufficient bank balance (${Number(bankAccount.balance).toLocaleString()} available)` },
        { status: 422 }
      );
    }

    const [float] = await db.$transaction([
      db.lineFloat.update({
        where: { id },
        data: {
          balance: { increment: topUp },
          ...(lowThreshold !== undefined ? { lowThreshold } : {}),
        },
      }),
      db.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: { decrement: topUp } },
      }),
    ]);

    await invalidateTag(tags.float);
    await invalidateTag(tags.bankAccount);
    return NextResponse.json(float);
  }

  // Standard update (no bank account debit — direct balance set or no linked account)
  const float = await db.lineFloat.update({
    where: { id },
    data: {
      ...(topUp   !== undefined ? { balance: { increment: topUp } } : {}),
      ...(balance !== undefined ? { balance }                       : {}),
      ...(lowThreshold !== undefined ? { lowThreshold }            : {}),
    },
  });

  await invalidateTag(tags.float);
  return NextResponse.json(float);
}
