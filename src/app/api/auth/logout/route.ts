import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_BRANCH_VIEW_COOKIE,
  SESSION_COOKIE_NAME,
  isSecureRequest,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const secure = isSecureRequest(req);
  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(ADMIN_BRANCH_VIEW_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
