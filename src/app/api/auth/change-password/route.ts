import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession, errorResponse, HttpError } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(ip, "change-password", 5, 10 * 60 * 1000);
    if (!limit.allowed) {
      throw new HttpError(429, `Too many password change attempts. Please wait ${limit.retryAfterSeconds} seconds.`);
    }

    const session = await requireSession();
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      throw new HttpError(400, "Current and new password are required");
    }

    if (newPassword.length < 8) {
      throw new HttpError(400, "New password must be at least 8 characters");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new HttpError(401, "Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
