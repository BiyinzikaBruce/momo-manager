import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { invalidateTag, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  role:     z.enum(["ADMIN", "MANAGER", "CASHIER"]).optional(),
  branchId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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

  const user = await db.user.update({
    where: { id },
    data: { ...parsed.data, updatedAt: new Date() },
    select: { id: true, name: true, email: true, role: true, branchId: true, isActive: true },
  }).catch(() => null);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await invalidateTag(tags.users);
  return NextResponse.json(user);
}
