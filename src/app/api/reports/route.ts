import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAnalyticsAccess } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAnalyticsAccess();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const branchId = searchParams.get("branchId");
    const techId = searchParams.get("techId");

    let startDate: Date;
    let endDate: Date;

    if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;
      startDate = new Date(year, m, 1, 0, 0, 0, 0);
      endDate = new Date(year, m + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const where: Record<string, unknown> = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) {
      where.OR = [
        { originBranchId: branchId },
        { servicingBranchId: branchId },
      ];
    }

    if (techId) {
      where.assignedTechId = techId;
    }

    const [branches, jobs] = await Promise.all([
      prisma.branch.findMany({ orderBy: { name: "asc" } }),
      prisma.jobSheet.findMany({
        where,
        include: {
          customer: true,
          originBranch: true,
          servicingBranch: true,
          assignedTech: {
            include: { branch: true },
          },
          intakeStaff: true,
          partsUsed: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    let totalServiceCharge = 0;
    let totalSparesBilled = 0;
    let totalSparesCost = 0;
    let totalInterBranchFees = 0;

    const branchMap = new Map<
      string,
      {
        id: string;
        name: string;
        code: string;
        totalJobs: number;
        closedJobs: number;
        serviceCharge: number;
        sparesBilled: number;
        sparesCost: number;
        sparesMargin: number;
        transferCredit: number;
        transferDebit: number;
        netRevenue: number;
      }
    >();

    for (const b of branches) {
      branchMap.set(b.id, {
        id: b.id,
        name: b.name,
        code: b.code,
        totalJobs: 0,
        closedJobs: 0,
        serviceCharge: 0,
        sparesBilled: 0,
        sparesCost: 0,
        sparesMargin: 0,
        transferCredit: 0,
        transferDebit: 0,
        netRevenue: 0,
      });
    }

    const techMap = new Map<
      string,
      {
        id: string;
        name: string;
        username: string;
        branchName: string;
        totalJobs: number;
        closedJobs: number;
        serviceCharge: number;
        sparesBilled: number;
        sparesCost: number;
        netContribution: number;
      }
    >();

    const jobRows = jobs.map((job) => {
      const serviceCharge = job.serviceCharge || 0;
      const sparesBilled = job.partsUsed.reduce(
        (sum, p) => sum + p.sellingPrice * p.quantity,
        0
      );
      const sparesCost = job.partsUsed.reduce(
        (sum, p) => sum + p.landingPrice * p.quantity,
        0
      );
      const sparesMargin = sparesBilled - sparesCost;
      const interFee = job.interBranchFee || 0;
      const isTransferred =
        Boolean(job.servicingBranchId) &&
        job.servicingBranchId !== job.originBranchId;

      totalServiceCharge += serviceCharge;
      totalSparesBilled += sparesBilled;
      totalSparesCost += sparesCost;
      if (isTransferred) {
        totalInterBranchFees += interFee;
      }

      const originEntry = branchMap.get(job.originBranchId);
      if (originEntry) {
        originEntry.totalJobs += 1;
        if (job.closedAt) originEntry.closedJobs += 1;
        originEntry.serviceCharge += serviceCharge;
        originEntry.sparesBilled += sparesBilled;
        originEntry.sparesCost += sparesCost;
        originEntry.sparesMargin += sparesMargin;
        if (isTransferred) {
          originEntry.transferDebit += interFee;
        }
        originEntry.netRevenue +=
          serviceCharge + sparesMargin - (isTransferred ? interFee : 0);
      }

      if (isTransferred && job.servicingBranchId) {
        const servEntry = branchMap.get(job.servicingBranchId);
        if (servEntry) {
          servEntry.transferCredit += interFee;
          servEntry.netRevenue += interFee;
        }
      }

      const creditedTech = job.assignedTech;
      const techKey = creditedTech ? creditedTech.id : "unassigned";
      const techName = creditedTech ? creditedTech.name : "Unassigned";
      const techUsername = creditedTech ? creditedTech.username : "none";
      const techBranch = creditedTech?.branch?.name || job.originBranch.name;

      let techEntry = techMap.get(techKey);
      if (!techEntry) {
        techEntry = {
          id: techKey,
          name: techName,
          username: techUsername,
          branchName: techBranch,
          totalJobs: 0,
          closedJobs: 0,
          serviceCharge: 0,
          sparesBilled: 0,
          sparesCost: 0,
          netContribution: 0,
        };
        techMap.set(techKey, techEntry);
      }

      techEntry.totalJobs += 1;
      if (job.closedAt) techEntry.closedJobs += 1;
      techEntry.serviceCharge += serviceCharge;
      techEntry.sparesBilled += sparesBilled;
      techEntry.sparesCost += sparesCost;
      techEntry.netContribution += serviceCharge + sparesMargin;

      return {
        id: job.id,
        jobNo: job.jobNo,
        createdAt: job.createdAt.toISOString(),
        closedAt: job.closedAt ? job.closedAt.toISOString() : null,
        status: job.status,
        paymentStatus: job.paymentStatus,
        originBranchName: job.originBranch.name,
        originBranchCode: job.originBranch.code,
        servicingBranchName: job.servicingBranch?.name || null,
        customerName: job.customer.name,
        customerPhone: job.customer.phone,
        deviceSummary: `${job.brand} ${job.modelNumber}`,
        assignedTechName: techName,
        serviceCharge,
        sparesBilled,
        sparesCost,
        sparesMargin,
        interBranchFee: isTransferred ? interFee : 0,
        netProfit: serviceCharge + sparesMargin,
        partsCount: job.partsUsed.length,
      };
    });

    const totalSparesMargin = totalSparesBilled - totalSparesCost;
    const totalNetRevenue = totalServiceCharge + totalSparesMargin;

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        month: month || null,
      },
      summary: {
        totalJobs: jobs.length,
        closedJobs: jobs.filter((j) => Boolean(j.closedAt)).length,
        totalServiceCharge: Math.round(totalServiceCharge * 100) / 100,
        totalSparesBilled: Math.round(totalSparesBilled * 100) / 100,
        totalSparesCost: Math.round(totalSparesCost * 100) / 100,
        totalSparesMargin: Math.round(totalSparesMargin * 100) / 100,
        totalInterBranchFees: Math.round(totalInterBranchFees * 100) / 100,
        totalNetRevenue: Math.round(totalNetRevenue * 100) / 100,
      },
      branchBreakup: Array.from(branchMap.values()).map((b) => ({
        ...b,
        serviceCharge: Math.round(b.serviceCharge * 100) / 100,
        sparesBilled: Math.round(b.sparesBilled * 100) / 100,
        sparesCost: Math.round(b.sparesCost * 100) / 100,
        sparesMargin: Math.round(b.sparesMargin * 100) / 100,
        transferCredit: Math.round(b.transferCredit * 100) / 100,
        transferDebit: Math.round(b.transferDebit * 100) / 100,
        netRevenue: Math.round(b.netRevenue * 100) / 100,
      })),
      technicianBreakup: Array.from(techMap.values())
        .map((t) => ({
          ...t,
          serviceCharge: Math.round(t.serviceCharge * 100) / 100,
          sparesBilled: Math.round(t.sparesBilled * 100) / 100,
          sparesCost: Math.round(t.sparesCost * 100) / 100,
          netContribution: Math.round(t.netContribution * 100) / 100,
        }))
        .sort((a, b) => b.netContribution - a.netContribution),
      jobs: jobRows,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
