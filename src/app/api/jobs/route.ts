import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminBranchView } from "@/lib/auth";
import { errorResponse, isAdmin, requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.JobSheetWhereInput = {};

    // Scope is derived from the signed session only. A branch id in the query
    // string is honoured for super admins (scope picker), never for staff.
    if (isAdmin(session)) {
      const scopedBranchId =
        searchParams.get("branchId") || (await getAdminBranchView());
      if (scopedBranchId) where.originBranchId = scopedBranchId;
    } else {
      where.OR = [
        { originBranchId: session.branchId },
        { servicingBranchId: session.branchId },
      ];
    }

    if (status) where.status = status;

    if (search) {
      where.AND = [
        {
          OR: [
            { jobNo: { contains: search } },
            { serialNumber: { contains: search } },
            { customer: { phone: { contains: search } } },
            { customer: { name: { contains: search } } },
          ],
        },
      ];
    }

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    if (pageParam || limitParam) {
      const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "50", 10) || 50));
      const skip = (page - 1) * limit;

      const [total, jobs] = await Promise.all([
        prisma.jobSheet.count({ where }),
        prisma.jobSheet.findMany({
          where,
          include: {
            customer: true,
            originBranch: true,
            servicingBranch: true,
            assignedTech: true,
            intakeStaff: true,
            partsUsed: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
      ]);

      return NextResponse.json({
        jobs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const jobs = await prisma.jobSheet.findMany({
      where,
      include: {
        customer: true,
        originBranch: true,
        servicingBranch: true,
        assignedTech: true,
        intakeStaff: true,
        partsUsed: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const {
      originBranchId: requestedBranchId,
      assignedTechId: requestedTechId,
      customerName,
      customerPhone,
      customerAddress,
      deviceType,
      brand,
      modelNumber,
      serialNumber,
      physicalCondition,
      complaintDescription,
      additionalIssues,
      isWarranty,
      estimatedCost,
      estimatedSpareCost,
      tatDays,
    } = body;

    // Non-admins can only intake into their own branch; the intake clerk is
    // always the authenticated user, never a client-supplied id.
    const originBranchId = isAdmin(session)
      ? requestedBranchId || session.branchId
      : session.branchId;
    const intakeStaffId = session.userId;

    const branch = await prisma.branch.findUnique({
      where: { id: originBranchId },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    let assignedTechId: string | null = null;
    if (requestedTechId) {
      const tech = await prisma.user.findUnique({
        where: { id: requestedTechId },
        select: { id: true, branchId: true },
      });
      if (!tech) {
        return NextResponse.json(
          { error: "Assigned technician not found" },
          { status: 400 }
        );
      }
      if (!isAdmin(session) && tech.branchId !== originBranchId) {
        return NextResponse.json(
          { error: "Technician belongs to another branch" },
          { status: 403 }
        );
      }
      assignedTechId = tech.id;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const dateCode = `${day}${month}${year}`;

    const prefix = `XAT-${branch.code}-${dateCode}-`;
    const latestJob = await prisma.jobSheet.findFirst({
      where: {
        originBranchId,
        jobNo: { startsWith: prefix },
      },
      orderBy: { jobNo: "desc" },
      select: { jobNo: true },
    });

    let nextSeq = 1;
    if (latestJob) {
      const lastSeqStr = latestJob.jobNo.slice(prefix.length);
      const parsed = parseInt(lastSeqStr, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName,
          address: customerAddress || customer.address,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress || null,
        },
      });
    }

    const tatDate = tatDays
      ? new Date(Date.now() + Number(tatDays) * 24 * 60 * 60 * 1000)
      : null;

    let job = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const sequenceNo = String(nextSeq + attempt).padStart(4, "0");
      const jobNo = `${prefix}${sequenceNo}`;
      try {
        job = await prisma.jobSheet.create({
          data: {
            jobNo,
            originBranchId,
            customerId: customer.id,
            intakeStaffId,
            assignedTechId,
            deviceType,
            brand,
            modelNumber,
            serialNumber,
            physicalCondition,
            complaintDescription,
            additionalIssues: additionalIssues || null,
            isWarranty: isWarranty === true,
            status: assignedTechId ? "ASSIGNED" : "RECEIVED",
            estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
            estimatedSpareCost: estimatedSpareCost ? parseFloat(estimatedSpareCost) : null,
            tatDate,
          },
          include: {
            customer: true,
            originBranch: true,
            assignedTech: true,
          },
        });
        break;
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr.code === "P2002" && attempt < 4) {
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
