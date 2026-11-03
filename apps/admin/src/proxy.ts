import { NextResponse, type NextRequest } from "next/server";

// Keep in sync with SESSION_COOKIE in src/lib/api.ts (not imported: that module is client-side)
const SESSION_COOKIE = "ecomerse_admin_token";

/** Optimistic check: no token cookie means signed out, so go to /login. RequireAdmin still checks the role. */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the login page, API rewrites, dev helpers, Next internals and static files
  matcher: ["/((?!login|api|dev|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
