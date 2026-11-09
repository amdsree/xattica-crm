import { NextRequest, NextResponse } from "next/server";
import { getSession, ADMIN_BRANCH_VIEW_COOKIE, isSecureRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdmin } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (!isAdmin(session) && session.role !== "STAFF_MANAGER")) {
      return NextResponse.json(
        { error: "Administrative access required to switch branch view" },
        { status: 403 }
      );
    }

    const { branchId } = await req.json();

    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { id: true },
      });
      if (!branch) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
      }
    }

    const response = NextResponse.json({ success: true, branchId: branchId || null });
    const secure = isSecureRequest(req);

    if (branchId) {
      response.cookies.set(ADMIN_BRANCH_VIEW_COOKIE, branchId, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    } else {
      response.cookies.set(ADMIN_BRANCH_VIEW_COOKIE, "", {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
