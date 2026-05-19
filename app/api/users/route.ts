import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";
import { z } from "zod";
import { randomBytes, scryptSync } from "crypto";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(["ADMIN", "MANAGER", "CASHIER"]),
  branchId: z.string().optional().nullable(),
});

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2,
  }) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function GET(req: NextRequest) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search   = searchParams.get("search") ?? "";
  const role     = searchParams.get("role")   ?? "";
  const branchId = searchParams.get("branchId") ?? "";

  const key = cacheKey(tags.users, "list", page, limit, search, role, branchId);

  const data = await getCachedOrFetch(key, async () => {
    const where = {
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
      ...(role     ? { role }           : {}),
      ...(branchId ? { branchId }       : {}),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          branchId: true, isActive: true, createdAt: true,
          branch: { select: { id: true, name: true, country: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      db.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }, 60);

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

  const { name, email, password, role, branchId } = parsed.data;

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const now = new Date();
  const userId = randomUUID();

  const user = await db.user.create({
    data: {
      id: userId, name, email, emailVerified: true,
      createdAt: now, updatedAt: now,
      role, branchId: branchId ?? null, isActive: true,
    },
    select: { id: true, name: true, email: true, role: true, branchId: true, isActive: true, createdAt: true },
  });

  await db.account.create({
    data: {
      id: randomUUID(), userId, accountId: email,
      providerId: "credential", password: hashPassword(password),
      createdAt: now, updatedAt: now,
    },
  });

  await invalidateTag(tags.users);
  return NextResponse.json(user, { status: 201 });
}
