import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, cacheKey, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get("branchId") ?? "";

  // Managers can only see their own branch
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
