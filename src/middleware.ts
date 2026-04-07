import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Use the edge-safe slice of the config so this file doesn't pull in Prisma/bcrypt.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  if (
    pathname.startsWith("/api/auth") ||
    publicRoutes.includes(pathname)
  ) {
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Cron route uses bearer-token auth, not session — let the route handle it.
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
