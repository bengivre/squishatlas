import type { NextRequest } from "next/server";

/** Cookie names Better Auth uses for the session token (dev + HTTPS). */
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

/**
 * Optimistic session check for Edge middleware — only verifies a cookie exists.
 * Protected routes must still validate the session on the server (Node runtime).
 */
export function hasSessionCookie(request: NextRequest): boolean {
  for (const name of SESSION_COOKIE_NAMES) {
    const cookie = request.cookies.get(name);
    if (cookie?.value) {
      return true;
    }
  }
  return false;
}
