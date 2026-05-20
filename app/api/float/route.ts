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

  // Managers/Cashiers are always scoped to their branch
  const effectiveBranchId =
    user.role === "ADMIN" ? branchId : (user.branchId ?? "");

  const key = cacheKey(tags.float, "list", effectiveBranchId);

  const data = await getCachedOrFetch(key, async () => {
    const floats = await db.lineFloat.findMany({
      where: effectiveBranchId
        ? { mobileLine: { branchId: effectiveBranchId } }
        : {},
      include: {
        mobileLine: {
          include: {
            branch:      { select: { id: true, name: true, country: true, currency: true } },
            bankAccount: { select: { id: true, bankName: true, accountNumber: true, balance: true } },
          },
        },
      },
      orderBy: [
        { mobileLine: { branchId: "asc" } },
        { mobileLine: { operator: "asc" } },
      ],
    });

    // Group by branch for easier consumption
    const byBranch: Record<string, { branch: object; lines: typeof floats }> = {};
    for (const f of floats) {
      const bid = f.mobileLine.branchId;
      if (!byBranch[bid]) byBranch[bid] = { branch: f.mobileLine.branch, lines: [] };
      byBranch[bid].lines.push(f);
    }

    return { floats, byBranch: Object.values(byBranch) };
  }, 30);

  return NextResponse.json(data);
}
