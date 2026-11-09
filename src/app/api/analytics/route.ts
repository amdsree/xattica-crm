import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAnalyticsAccess } from "@/lib/session";

export async function GET() {
  try {
    await requireAnalyticsAccess();

    const branches = await prisma.branch.findMany({
      include: {
        originJobs: {
          include: {
            partsUsed: true,
          },
        },
        servicingJobs: {
          include: {
            partsUsed: true,
          },
        },
        users: true,
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const overdueRepairs = await prisma.jobSheet.findMany({
      where: {
        closedAt: null,
        createdAt: {
          lt: sevenDaysAgo,
        },
      },
      include: {
        customer: true,
        originBranch: true,
        assignedTech: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const creditJobs = await prisma.jobSheet.findMany({
      where: {
        paymentStatus: "CREDIT",
      },
      include: {
        customer: true,
        originBranch: true,
        assignedTech: true,
      },
      orderBy: {
        creditDueDate: "asc",
      },
    });

    const overdueCredits = creditJobs.filter(
      (job) => job.creditDueDate && new Date(job.creditDueDate) < now
    );
    const activeCredits = creditJobs.filter(
      (job) => !job.creditDueDate || new Date(job.creditDueDate) >= now
    );

    const abandonedHardware = await prisma.jobSheet.findMany({
      where: {
        closedAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
        status: {
          not: "DELIVERED_PAID",
        },
      },
      include: {
        customer: true,
        originBranch: true,
      },
    });

    const allJobs = await prisma.jobSheet.findMany({
      include: {
        partsUsed: true,
        assignedTech: true,
        originBranch: true,
      },
    });

    const brandCounts: Record<string, number> = {};
    const complaintCounts: Record<string, number> = {};
    const techStats: Record<
      string,
      {
        name: string;
        branchName: string;
        total: number;
        closed: number;
        revenue: number;
      }
    > = {};

    let totalCompanyRevenue = 0;
    let totalCompanyNetProfit = 0;

    for (const job of allJobs) {
      brandCounts[job.brand] = (brandCounts[job.brand] || 0) + 1;
      complaintCounts[job.complaintDescription] =
        (complaintCounts[job.complaintDescription] || 0) + 1;

      if (job.assignedTech) {
        const techId = job.assignedTech.id;
        if (!techStats[techId]) {
          techStats[techId] = {
            name: job.assignedTech.name,
            branchName: job.originBranch.name,
            total: 0,
            closed: 0,
            revenue: 0,
          };
        }
        techStats[techId].total += 1;
        if (job.closedAt) {
          techStats[techId].closed += 1;
          const partsRevenue = job.partsUsed.reduce(
            (sum, p) => sum + p.sellingPrice * p.quantity,
            0
          );
          techStats[techId].revenue += job.serviceCharge + partsRevenue;
        }
      }
    }

    const branchAnalytics = branches.map((b) => {
      let revenue = 0;
      let cost = 0;
      let outflowFee = 0;
      let inflowFee = 0;
      let closedCount = 0;

      for (const job of b.originJobs) {
        if (job.closedAt) {
          closedCount += 1;
          const partsSelling = job.partsUsed.reduce(
            (sum, p) => sum + p.sellingPrice * p.quantity,
            0
          );
          const partsCost = job.partsUsed.reduce(
            (sum, p) => sum + p.landingPrice * p.quantity,
            0
          );
          revenue += job.serviceCharge + partsSelling;
          cost += partsCost;
          if (job.servicingBranchId && job.servicingBranchId !== b.id) {
            outflowFee += job.interBranchFee;
          }
        }
      }

      for (const job of b.servicingJobs) {
        if (job.closedAt && job.originBranchId !== b.id) {
          inflowFee += job.interBranchFee;
        }
      }

      const netProfit =
        Math.round((revenue - cost - outflowFee + inflowFee) * 100) / 100;
      totalCompanyRevenue += Math.round(revenue * 100) / 100;
      totalCompanyNetProfit += netProfit;

      return {
        id: b.id,
        code: b.code,
        name: b.name,
        totalJobs: b.originJobs.length,
        closedJobs: closedCount,
        closureRate:
          b.originJobs.length > 0
            ? Math.round((closedCount / b.originJobs.length) * 100)
            : 0,
        grossRevenue: Math.round(revenue * 100) / 100,
        partsCost: Math.round(cost * 100) / 100,
        outflowFee: Math.round(outflowFee * 100) / 100,
        inflowFee: Math.round(inflowFee * 100) / 100,
        netProfit,
      };
    });

    const topBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topComplaints = Object.entries(complaintCounts)
      .map(([complaint, count]) => ({ complaint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const technicianRanking = Object.values(techStats).sort(
      (a, b) => b.revenue - a.revenue
    );

    return NextResponse.json({
      totalCompanyRevenue,
      totalCompanyNetProfit,
      branchAnalytics,
      overdueRepairs,
      overdueCredits,
      activeCredits,
      abandonedHardware,
      topBrands,
      topComplaints,
      technicianRanking,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
