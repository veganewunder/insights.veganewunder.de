import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/constants";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAdminApiRoute =
    request.nextUrl.pathname.startsWith("/api/share-links") ||
    request.nextUrl.pathname.startsWith("/api/admin/logout");

  if (isDashboardRoute || isAdminApiRoute) {
    const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

    if (!hasSession) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Nicht autorisiert" }, { status: 401 });
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/share-links/:path*", "/api/admin/logout"],
};
