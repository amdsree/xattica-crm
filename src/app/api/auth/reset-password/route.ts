import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const configuredKey = process.env.ADMIN_RECOVERY_KEY?.trim();
    if (!configuredKey || configuredKey.length < 16) {
      return NextResponse.json(
        {
          error:
            "Emergency password recovery is currently disabled. Configure ADMIN_RECOVERY_KEY in environment variables to enable it.",
        },
        { status: 503 }
      );
    }

    const ip = getClientIp(req);
    const limit = checkRateLimit(ip, "reset-password", 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset attempts. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const { recoveryKey, newPassword } = await req.json();

    if (!recoveryKey || !newPassword) {
      return NextResponse.json(
        { error: "Master recovery key and new password are required" },
        { status: 400 }
      );
    }

    const providedBuf = Buffer.from(recoveryKey.trim());
    const expectedBuf = Buffer.from(configuredKey);

    const isMatch =
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid master recovery key" },
        { status: 401 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: {
        OR: [{ role: "SUPER_ADMIN" }, { username: "admin" }],
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found in database" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Admin password successfully reset. You can now log in.",
    });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json(
      { error: "Failed to reset admin password" },
      { status: 500 }
    );
  }
}
