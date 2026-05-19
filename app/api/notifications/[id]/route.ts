import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { invalidateTag, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { id } = await params;

  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify the user can access this notification
  const canAccess =
    user.role === "ADMIN" ||
    notification.userId === user.id ||
    (user.role === "MANAGER" && notification.branchId === user.branchId);

  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.notification.update({ where: { id }, data: { isRead: true } });
  await invalidateTag(tags.notifications);

  return NextResponse.json({ ok: true });
}
