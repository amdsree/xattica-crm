import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireSession, requireAdmin, isAdmin, HttpError } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    const shouldIncludeCounts = isAdmin(session);

    const branches = await prisma.branch.findMany({
      include: shouldIncludeCounts
        ? {
            _count: {
              select: {
                users: true,
                originJobs: true,
                servicingJobs: true,
                stockItems: true,
              },
            },
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const ip = getClientIp(req);
    const limit = checkRateLimit(ip, "create-branch", 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      throw new HttpError(429, `Too many requests. Please wait ${limit.retryAfterSeconds} seconds.`);
    }
    const body = await req.json();
    const { name, code, phone, address } = body;

    if (!name || !code || !phone || !address) {
      throw new HttpError(400, "Branch name, code, phone, and address are required");
    }

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 2 || cleanCode.length > 5) {
      throw new HttpError(400, "Branch code must be between 2 and 5 characters (e.g. TVM, KLM)");
    }

    const existing = await prisma.branch.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      throw new HttpError(409, `Branch code "${cleanCode}" is already in use by ${existing.name}`);
    }

    const newBranch = await prisma.branch.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        phone: phone.trim(),
        address: address.trim(),
      },
    });

    return NextResponse.json({ success: true, branch: newBranch }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, name, code, phone, address } = body;

    if (!id) {
      throw new HttpError(400, "Branch ID is required");
    }

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Branch not found");
    }

    const updateData: {
      name?: string;
      code?: string;
      phone?: string;
      address?: string;
    } = {};

    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();

    if (code && code.trim().toUpperCase() !== existing.code) {
      const cleanCode = code.trim().toUpperCase();
      const codeTaken = await prisma.branch.findUnique({
        where: { code: cleanCode },
      });
      if (codeTaken) {
        throw new HttpError(409, `Branch code "${cleanCode}" is already in use by ${codeTaken.name}`);
      }
      updateData.code = cleanCode;
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, branch: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
