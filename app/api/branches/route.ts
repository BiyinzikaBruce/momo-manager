import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

const CreateSchema = z.object({
  name:     z.string().min(1).max(100),
  country:  z.string().min(1).max(50),
  city:     z.string().min(1).max(50),
  address:  z.string().max(200).optional(),
  currency: z.enum(["UGX", "KES", "TZS", "CDF"]),
});

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") ?? "";

  const scopeKey = user.role === "ADMIN" ? "all" : (user.branchId ?? "none");
  const key = cacheKey(tags.branches, "list", scopeKey, page, limit, search);

  const data = await getCachedOrFetch(key, async () => {
    const where = {
      ...(search ? {
        OR: [
          { name:    { contains: search, mode: "insensitive" as const } },
          { city:    { contains: search, mode: "insensitive" as const } },
          { country: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
      ...(user.role !== "ADMIN" && user.branchId ? { id: user.branchId } : {}),
    };

    const [branches, total] = await Promise.all([
      db.branch.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" } }),
      db.branch.count({ where }),
    ]);

    return { branches, total, page, limit, totalPages: Math.ceil(total / limit) };
  }, 120);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const branch = await db.branch.create({ data: parsed.data });
  await invalidateTag(tags.branches);

  return NextResponse.json(branch, { status: 201 });
}
