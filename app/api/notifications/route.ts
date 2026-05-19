import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guard";
import { getCachedOrFetch, invalidateTag, cacheKey, tags } from "@/lib/cache";

export const dynamic = "force-dynamic";

type AuthUser = { id: string; role: string; branchId?: string | null };

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const { searchParams } = req.nextUrl;
  const limit      = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const where = buildWhere(user, unreadOnly);
  const key = cacheKey(tags.notifications, "list", user.id, user.role, user.branchId ?? "", unreadOnly ? "1" : "0", limit);

  const data = await getCachedOrFetch(key, async () => {
    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({ where: buildWhere(user, true) }),
    ]);
    return { notifications, unreadCount };
  }, 15);

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = session!.user as AuthUser;
  const where = buildWhere(user, true);

  await db.notification.updateMany({ where, data: { isRead: true } });
  await invalidateTag(tags.notifications);

  return NextResponse.json({ ok: true });
}

function buildWhere(user: AuthUser, unreadOnly: boolean) {
  const readFilter = unreadOnly ? { isRead: false } : {};

  if (user.role === "ADMIN") {
    return { ...readFilter };
  }
  if (user.role === "MANAGER") {
    return {
      ...readFilter,
      OR: [
        { branchId: user.branchId ?? "" },
        { userId: user.id },
      ],
    };
  }
  // CASHIER — only own notifications
  return {
    ...readFilter,
    userId: user.id,
  };
}
