import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessJob, errorResponse, requireSession, HttpError } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const job = await prisma.jobSheet.findUnique({
      where: { id },
      include: {
        customer: true,
        originBranch: true,
        servicingBranch: true,
        assignedTech: true,
        intakeStaff: true,
        partsUsed: {
          include: {
            stockItem: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!canAccessJob(session, job)) {
      return NextResponse.json(
        { error: "Access denied. This job belongs to another branch." },
        { status: 403 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    // Role comes from the signed session only. Callers cannot escalate by
    // adding a userRole field to the request body.
    const effectiveRole = session.role;

    const existingJob = await prisma.jobSheet.findUnique({
      where: { id },
      include: {
        partsUsed: true,
        originBranch: true,
        servicingBranch: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!canAccessJob(session, existingJob)) {
      return NextResponse.json(
        { error: "Access denied. This job belongs to another branch." },
        { status: 403 }
      );
    }

    if (existingJob.closedAt && effectiveRole !== "SUPER_ADMIN" && action !== "RECORD_PAYMENT") {
      return NextResponse.json(
        { error: "This job is closed and locked. Only Super Admin can modify closed records." },
        { status: 403 }
      );
    }

    if (action === "UPDATE_STATUS") {
      const { status, remarks, assignedTechId } = body;
      const updated = await prisma.jobSheet.update({
        where: { id },
        data: {
          status: status || existingJob.status,
          remarks: remarks !== undefined ? remarks : existingJob.remarks,
          assignedTechId: assignedTechId || existingJob.assignedTechId,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "CUSTOMER_APPROVAL") {
      const { approvalProof, remarks, status } = body;
      const updated = await prisma.jobSheet.update({
        where: { id },
        data: {
          approvalProof,
          remarks: remarks !== undefined ? remarks : existingJob.remarks,
          status: status || "DIAGNOSIS_WIP",
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "INTER_BRANCH_TRANSFER") {
      const { servicingBranchId, interBranchFee, status, remarks } = body;
      const targetBranch = servicingBranchId
        ? await prisma.branch.findUnique({ where: { id: servicingBranchId } })
        : null;
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const targetName = targetBranch?.name || "servicing branch";
      const originName = existingJob.originBranch?.name || "origin branch";
      const logNote = `\n[${timestamp}] Dispatched from ${originName} to ${targetName} for specialized service.`;

      const updated = await prisma.jobSheet.update({
        where: { id },
        data: {
          servicingBranchId: servicingBranchId || existingJob.servicingBranchId,
          interBranchFee: interBranchFee !== undefined ? parseFloat(interBranchFee) : existingJob.interBranchFee,
          status: status || "TRANSFER_IN_TRANSIT",
          remarks: (remarks !== undefined ? remarks : existingJob.remarks || "") + logNote,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "RECEIVE_AT_SERVICING") {
      if (effectiveRole !== "SUPER_ADMIN" && session.branchId !== existingJob.servicingBranchId) {
        return NextResponse.json(
          { error: "Only staff at the servicing branch can confirm receipt of this hardware." },
          { status: 403 }
        );
      }
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const servicingName = existingJob.servicingBranch?.name || "Servicing Branch";
      const logNote = `\n[${timestamp}] Physical device received at ${servicingName}. Work in progress initiated by ${session.name}.`;

      const updated = await prisma.jobSheet.update({
        where: { id },
        data: {
          status: "TRANSFER_WIP",
          remarks: (existingJob.remarks || "") + logNote,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "DISPATCH_TO_ORIGIN") {
      if (effectiveRole !== "SUPER_ADMIN" && session.branchId !== existingJob.servicingBranchId) {
        return NextResponse.json(
          { error: "Only staff at the servicing branch can dispatch this hardware back." },
          { status: 403 }
        );
      }
      const { dispatchRemarks } = body;
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const servicingName = existingJob.servicingBranch?.name || "Servicing Branch";
      const originName = existingJob.originBranch?.name || "Origin Branch";
      const note = dispatchRemarks ? ` Notes: ${dispatchRemarks}` : "";
      const logNote = `\n[${timestamp}] Servicing completed at ${servicingName}. Dispatched back to ${originName}.${note}`;

      const updated = await prisma.jobSheet.update({
        where: { id },
        data: {
          status: "TRANSFER_QA",
          remarks: (existingJob.remarks || "") + logNote,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "RECEIVE_AT_ORIGIN") {
      if (effectiveRole !== "SUPER_ADMIN" && session.branchId !== existingJob.originBranchId) {
        return NextResponse.json(
          { error: "Only staff at the originating home branch can confirm receipt of returned hardware." },
          { status: 403 }
        );
      }
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const originName = existingJob.originBranch?.name || "Origin Branch";
      const servicingName = existingJob.servicingBranch?.name || "Servicing Branch";
      const logNote = `\n[${timestamp}] Physical device received back at ${originName} from ${servicingName}. Ready for customer delivery and final settlement.`;

      const updated = await prisma.jobSheet.update({
        where: { id },
        data: {
          status: "READY_FOR_DELIVERY",
          remarks: (existingJob.remarks || "") + logNote,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "CLOSE_CASE") {
      const {
        closedOutcome,
        serviceCharge,
        parts,
        paymentStatus,
        paymentRemarks,
      } = body;

      if (!closedOutcome || !["REPAIR_DONE", "NON_REPAIRABLE", "RETURNED_NO_SERVICE"].includes(closedOutcome)) {
        return NextResponse.json({ error: "Invalid closedOutcome" }, { status: 400 });
      }

      if (serviceCharge === undefined || serviceCharge === null) {
        return NextResponse.json({ error: "Service charge is required for all outcomes" }, { status: 400 });
      }

      if (paymentStatus === "CREDIT" && effectiveRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Delivery on credit requires Admin approval" }, { status: 403 });
      }

      let finalStatus = "READY_FOR_DELIVERY";
      let creditDueDate: Date | null = null;

      if (paymentStatus === "PAID") {
        finalStatus = "DELIVERED_PAID";
      } else if (paymentStatus === "CREDIT") {
        finalStatus = "DELIVERED_CREDIT";
        creditDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      } else if (closedOutcome === "NON_REPAIRABLE") {
        finalStatus = "NON_REPAIRABLE";
      } else if (closedOutcome === "RETURNED_NO_SERVICE") {
        finalStatus = "RETURNED_UNREPAIRED";
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (closedOutcome === "REPAIR_DONE" && Array.isArray(parts)) {
          for (const part of parts) {
            const requestedQty = parseInt(part.quantity, 10) || 1;
            const landing = Math.round(parseFloat(part.landingPrice) * 100) / 100;
            const selling = Math.round(parseFloat(part.sellingPrice) * 100) / 100;

            if (part.stockItemId) {
              const stockItem = await tx.stockItem.findUnique({
                where: { id: part.stockItemId },
              });

              if (!stockItem) {
                throw new HttpError(400, `Stock item for "${part.partName}" not found`);
              }

              if (stockItem.quantity < requestedQty) {
                throw new HttpError(
                  400,
                  `Insufficient stock for "${stockItem.partName}". Available: ${stockItem.quantity}, requested: ${requestedQty}`
                );
              }

              await tx.stockItem.update({
                where: { id: part.stockItemId },
                data: {
                  quantity: {
                    decrement: requestedQty,
                  },
                },
              });
            }

            await tx.jobPart.create({
              data: {
                jobSheetId: id,
                stockItemId: part.stockItemId || null,
                partName: part.partName,
                landingPrice: landing,
                sellingPrice: selling,
                quantity: requestedQty,
                vendorName: part.vendorName || (part.stockItemId ? (await tx.stockItem.findUnique({ where: { id: part.stockItemId } }))?.vendorName : null) || null,
                invoiceNumber: part.invoiceNumber || (part.stockItemId ? (await tx.stockItem.findUnique({ where: { id: part.stockItemId } }))?.invoiceNumber : null) || null,
              },
            });
          }
        }

        const cleanServiceCharge =
          Math.round(parseFloat(serviceCharge) * 100) / 100;

        return tx.jobSheet.update({
          where: { id },
          data: {
            closedOutcome,
            serviceCharge: cleanServiceCharge,
            status: finalStatus,
            paymentStatus: paymentStatus || "UNPAID",
            paymentRemarks: paymentRemarks || null,
            creditDueDate,
            closedAt: new Date(),
          },
          include: {
            partsUsed: true,
            customer: true,
          },
        });
      });

      return NextResponse.json(updated);
    }

    if (action === "RECORD_PAYMENT") {
      const { paymentStatus, paymentRemarks } = body;
      const updated = await prisma.jobSheet.update({
        where: { id },
        data: {
          paymentStatus,
          paymentRemarks,
          status: paymentStatus === "PAID" ? "DELIVERED_PAID" : existingJob.status,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
