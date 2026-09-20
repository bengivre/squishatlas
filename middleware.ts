import { NextRequest, NextResponse } from "next/server";

import { hasSessionCookie } from "@/lib/auth/session-cookie";

const AUTH_API_PREFIX = "/api/auth";
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/change-password",
  "/offline",
  "/api/health",
  "/uploads",
  "/icons",
  "/sw.js",
];

const TENANT_ROUTE = /^\/t\/([^/]+)(?:\/(.*))?$/;

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/_next")) {
    return true;
  }

  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Public tenant pages (hub / gallery / tree / unlock) are reachable without
 * a login session. Enabled + password gates run in enforcePublicPageAccess
 * (server-side) because they need the database.
 */
function isPublicTenantPath(pathname: string): boolean {
  const match = pathname.match(TENANT_ROUTE);
  if (!match) {
    return false;
  }

  const rest = match[2] ?? "";
  if (rest === "") {
    return true;
  }

  const first = rest.split("/")[0] ?? "";
  return first === "gallery" || first === "tree" || first === "unlock";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  if (isPublicTenantPath(pathname)) {
    return NextResponse.next();
  }

  const tenantMatch = pathname.match(TENANT_ROUTE);

  if (tenantMatch && !hasSessionCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // mustChangePassword and full session validation run in server guards
  // (requireTenantMember, requireSuperadmin) — middleware stays Edge-safe.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
