import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";

type SessionUser = { id: string; name: string; email: string; role?: string };
type Session = { session: { id: string }; user: SessionUser };

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass through auth API routes and static assets
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Fetch session from Better Auth
  const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: request.nextUrl.origin,
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  const role = session?.user?.role ?? null;

  // --- Unauthenticated ---
  if (!role) {
    if (pathname.startsWith("/login")) return NextResponse.next();
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Authenticated user on /login → redirect to their dashboard ---
  if (pathname.startsWith("/login")) {
    const dest =
      role === "ADMIN" ? "/dashboard" :
      role === "MANAGER" ? "/manager/dashboard" :
      "/cashier/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // --- Role-based route guards ---
  if (pathname.startsWith("/dashboard") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/manager") && role !== "MANAGER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/cashier") && role !== "CASHIER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and font/image assets
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)).*)",
  ],
};
