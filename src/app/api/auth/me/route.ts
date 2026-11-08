import { NextResponse } from "next/server";
import { getSession, getAdminBranchView } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const [user, branches, adminBranchView] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        include: { branch: true },
      }),
      prisma.branch.findMany({
        orderBy: { name: "asc" },
      }),
      getAdminBranchView(),
    ]);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        phone: user.phone,
        branchId: user.branchId,
        branch: user.branch,
      },
      branches,
      adminBranchView,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
