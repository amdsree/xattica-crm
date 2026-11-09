import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, SESSION_COOKIE_NAME, SessionPayload, isSecureRequest } from "@/lib/auth";
import { errorResponse } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(ip, "login", 5, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${limit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { branch: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const payload: SessionPayload = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role as SessionPayload["role"],
      branchId: user.branch.id,
      branchCode: user.branch.code,
      branchName: user.branch.name,
    };

    const token = await signToken(payload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch: user.branch,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
