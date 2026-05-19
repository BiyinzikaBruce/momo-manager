import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-guard";
import { invalidateTag, tags } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  topUp:        z.number().positive("Amount must be positive").optional(),
  lowThreshold: z.number().min(0).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.topUp === undefined && parsed.data.lowThreshold === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const float = await db.lineFloat.update({
    where: { id },
    data: {
      ...(parsed.data.topUp !== undefined
        ? { balance: { increment: parsed.data.topUp } }
        : {}),
      ...(parsed.data.lowThreshold !== undefined
        ? { lowThreshold: parsed.data.lowThreshold }
        : {}),
    },
  }).catch(() => null);

  if (!float) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await invalidateTag(tags.float);
  return NextResponse.json(float);
}
