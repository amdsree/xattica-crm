import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdmin, requireSession } from "@/lib/session";

/**
 * Staff directory used for technician assignment.
 * Never returns credentials; non-admins only ever see their own branch.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const requestedBranchId = new URL(req.url).searchParams.get("branchId");

    const branchId = isAdmin(session)
      ? requestedBranchId || undefined
      : session.branchId;

    const users = await prisma.user.findMany({
      where: branchId ? { branchId } : {},
      select: {
        id: true,
        name: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, code: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}
