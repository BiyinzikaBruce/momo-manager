import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function requireRole(role: string | string[]) {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  const allowed = Array.isArray(role) ? role : [role];
  const userRole = (session!.user as { role?: string }).role;
  if (!userRole || !allowed.includes(userRole)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
