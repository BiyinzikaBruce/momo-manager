import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { invalidateTag, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  bankName:      z.string().min(1).max(100).optional(),
  accountNumber: z.string().min(1).max(50).optional(),
  topUp:         z.number().positive("Amount must be positive").optional(),
  balance:       z.number().min(0).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { bankName, accountNumber, topUp, balance } = parsed.data;

  const account = await db.bankAccount.update({
    where: { id },
    data: {
      ...(bankName      ? { bankName }                        : {}),
      ...(accountNumber ? { accountNumber }                   : {}),
      ...(topUp !== undefined ? { balance: { increment: topUp } } : {}),
      ...(balance !== undefined && topUp === undefined ? { balance } : {}),
    },
    include: { branch: { select: { id: true, name: true, country: true, currency: true } } },
  }).catch(() => null);

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await invalidateTag(tags.bankAccount);
  return NextResponse.json(account);
}
