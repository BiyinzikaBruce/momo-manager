import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/auth/sign-in"];
const apiAuthPrefix = "/api/auth";

type UserRole = "ADMIN" | "MANAGER" | "CASHIER";

const roleRedirects: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  MANAGER: "/manager/dashboard",
  CASHIER: "/cashier/dashboard",
};

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through auth API routes, static files, and Next.js internals
  if (
    pathname.startsWith(apiAuthPrefix) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.match(/\.[a-z]+$/)
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: req.headers });

  // Unauthenticated — redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as { role?: UserRole }).role ?? "CASHIER";
  const defaultDest = roleRedirects[role];

  // Root → role home
  if (pathname === "/") {
    return NextResponse.redirect(new URL(defaultDest, req.url));
  }

  // Block Manager from admin routes
  if (role === "MANAGER" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/manager/dashboard", req.url));
  }

  // Block Cashier from admin/manager routes
  if (
    role === "CASHIER" &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/manager"))
  ) {
    return NextResponse.redirect(new URL("/cashier/dashboard", req.url));
  }

  // Block Admin/Manager from cashier routes
  if (role !== "CASHIER" && pathname.startsWith("/cashier")) {
    return NextResponse.redirect(new URL(defaultDest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
