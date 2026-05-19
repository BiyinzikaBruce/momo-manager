import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

const UpdateSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  country:  z.string().min(1).max(50).optional(),
  city:     z.string().min(1).max(50).optional(),
  address:  z.string().max(200).optional(),
  currency: z.enum(["UGX", "KES", "TZS", "CDF"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { id } = await params;

  // Non-admins can only view their own branch
  if (user.role !== "ADMIN" && user.branchId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = cacheKey(tags.branches, id);
  const branch = await getCachedOrFetch(key, () =>
    db.branch.findUnique({
      where: { id },
      include: {
        mobileLines: { include: { float: true } },
        bankAccount: user.role === "ADMIN" ? true : false,
        _count: { select: { users: true, shifts: true, transactions: true } },
      },
    }), 120);

  if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(branch);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const branch = await db.branch.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await invalidateTag(tags.branches);
  return NextResponse.json(branch);
}
