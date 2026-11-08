import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdmin, requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const requestedBranchId = searchParams.get("branchId");

    if (
      !isAdmin(session) &&
      requestedBranchId &&
      requestedBranchId !== session.branchId
    ) {
      return NextResponse.json(
        { error: "Access denied. Stock belongs to another branch." },
        { status: 403 }
      );
    }

    const branchId = isAdmin(session) ? requestedBranchId : session.branchId;
    const where = branchId ? { branchId } : {};

    const items = await prisma.stockItem.findMany({
      where,
      include: {
        branch: true,
      },
      orderBy: {
        partName: "asc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    return errorResponse(error);
  }
}
