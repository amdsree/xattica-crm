import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SECRET_KEY } from "@/lib/jwt-key";

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname === "/api/health" ||
    pathname === "/login" ||
    pathname.includes(".")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token = req.cookies.get("xattica_session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Authentication required" }, { status: 401 })
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const role = String(payload.role || "");

    if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
      return applySecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", String(payload.userId || ""));
    requestHeaders.set("x-user-role", role);
    requestHeaders.set("x-user-branch", String(payload.branchId || ""));

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return applySecurityHeaders(response);
  } catch {
    if (pathname.startsWith("/api/")) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Invalid session" }, { status: 401 })
      );
    }
    return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
