import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  isAdmin,
  requireSession,
  canManageStaff,
  isSuperAdmin,
  HttpError,
} from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const requestedBranchId = new URL(req.url).searchParams.get("branchId");

    const branchId = canManageStaff(session)
      ? requestedBranchId || undefined
      : session.branchId;

    const whereClause: Record<string, unknown> = {};
    if (branchId) {
      whereClause.branchId = branchId;
    }
    if (!isSuperAdmin(session)) {
      whereClause.role = { notIn: ["SUPER_ADMIN", "SUB_ADMIN"] };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        branchId: true,
        branch: { select: { id: true, code: true, name: true } },
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!canManageStaff(session)) {
      throw new HttpError(403, "Staff management access required");
    }

    const ip = getClientIp(req);
    const limit = checkRateLimit(ip, "create-user", 20, 10 * 60 * 1000);
    if (!limit.allowed) {
      throw new HttpError(429, `Too many staff creation attempts. Please wait ${limit.retryAfterSeconds} seconds.`);
    }
    const body = await req.json();
    const { name, username, password, branchId, role, phone } = body;

    if (!name || !username || !password || !branchId || !role) {
      throw new HttpError(400, "Name, username, password, branch, and role are required");
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      throw new HttpError(400, "Username must be at least 3 characters");
    }

    if (password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters");
    }

    const validRoles = [
      "INHOUSE_TECH",
      "FIELD_TECH",
      "BRANCH_MANAGER",
      "STAFF_MANAGER",
      "SUB_ADMIN",
    ];
    if (!validRoles.includes(role)) {
      throw new HttpError(400, "Invalid role specified");
    }

    if ((role === "SUB_ADMIN" || role === "SUPER_ADMIN") && !isSuperAdmin(session)) {
      throw new HttpError(403, "Only Super Admin can assign administrative roles");
    }

    if (role === "STAFF_MANAGER" && !isAdmin(session)) {
      throw new HttpError(403, "Only administrators can assign staff manager roles");
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) {
      throw new HttpError(404, "Selected branch not found");
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (existingUser) {
      throw new HttpError(409, `Username "${cleanUsername}" is already taken`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        password: hashedPassword,
        branchId,
        role,
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        branchId: true,
        branch: { select: { id: true, code: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!isSuperAdmin(session)) {
      throw new HttpError(403, "Only Super Admin can reset employee passwords");
    }

    const body = await req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      throw new HttpError(400, "User ID and new password are required");
    }

    if (newPassword.length < 8) {
      throw new HttpError(400, "New password must be at least 8 characters");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: `Password for ${user.username} updated` });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!isSuperAdmin(session)) {
      throw new HttpError(403, "Only Super Admin can remove staff members");
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    if (!userId) {
      throw new HttpError(400, "User ID is required");
    }

    if (userId === session.userId) {
      throw new HttpError(400, "Cannot delete your own admin account");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedJobs: { select: { id: true } },
        intakeJobs: { select: { id: true } },
      },
    });

    if (!targetUser) {
      throw new HttpError(404, "User not found");
    }

    if (
      targetUser.username === "theerdha" ||
      targetUser.username === "ctowaves" ||
      targetUser.username === "ceowaves" ||
      targetUser.username === "wavesceo" ||
      targetUser.role === "SUPER_ADMIN" ||
      targetUser.role === "SUB_ADMIN"
    ) {
      throw new HttpError(400, "Administrative accounts cannot be deleted");
    }

    if (targetUser.assignedJobs.length > 0 || targetUser.intakeJobs.length > 0) {
      throw new HttpError(
        400,
        `Cannot delete staff "${targetUser.name}" because they are linked to existing job sheets. Reset their password instead.`
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: `Staff member deleted` });
  } catch (error) {
    return errorResponse(error);
  }
}
