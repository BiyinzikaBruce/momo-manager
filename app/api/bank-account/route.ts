import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { getCachedOrFetch, cacheKey, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Bank accounts are ADMIN-only
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
