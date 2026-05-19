import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, cacheKey, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { id } = await params;
  const key = cacheKey(tags.mobileLines, id);

  const line = await getCachedOrFetch(key, () =>
    db.mobileLine.findUnique({
      where: { id },
      include: {
        branch:   { select: { id: true, name: true, country: true, currency: true } },
        float:    true,
        feeRates: { orderBy: { transactionType: "asc" } },
      },
    }), 120);

  if (!line) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "ADMIN" && line.branchId !== user.branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(line);
}
