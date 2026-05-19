import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get("branchId") ?? "";

  const key = cacheKey(tags.bankAccount, branchId || "all");

  const accounts = await getCachedOrFetch(key, () =>
    db.bankAccount.findMany({
      where: branchId ? { branchId } : {},
      include: { branch: { select: { id: true, name: true, country: true, currency: true } } },
      orderBy: { branch: { name: "asc" } },
    }), 60);

  return NextResponse.json(accounts);
}

const CreateSchema = z.object({
  branchId:      z.string().min(1, "Branch is required"),
  bankName:      z.string().min(1, "Bank name is required").max(100),
  accountNumber: z.string().min(1, "Account number is required").max(50),
  balance:       z.number().min(0, "Balance must be 0 or more"),
});

export async function POST(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { branchId, bankName, accountNumber, balance } = parsed.data;

  // Each branch can only have one bank account
  const existing = await db.bankAccount.findUnique({ where: { branchId } });
  if (existing) {
    return NextResponse.json({ error: "This branch already has a bank account" }, { status: 409 });
  }

  const branch = await db.branch.findUnique({ where: { id: branchId }, select: { currency: true } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const account = await db.bankAccount.create({
    data: {
      id: randomUUID(),
      branchId,
      bankName,
      accountNumber,
      balance,
      currency: branch.currency,
    },
    include: { branch: { select: { id: true, name: true, country: true, currency: true } } },
  });

  await invalidateTag(tags.bankAccount);
  return NextResponse.json(account, { status: 201 });
}
