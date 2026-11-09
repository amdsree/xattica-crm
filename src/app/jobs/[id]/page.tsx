"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  Wrench,
  Printer,
  Share2,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Lock,
  IndianRupee,
  FileText,
  ShieldCheck,
  ChevronLeft,
  Building2,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";

interface JobPart {
  id?: string;
  partName: string;
  landingPrice: number;
  sellingPrice: number;
  quantity: number;
  stockItemId?: string | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
}

interface StockItem {
  id: string;
  partName: string;
  landingPrice: number;
  quantity: number;
  invoiceNumber: string;
  vendorName: string;
}

interface JobSheet {
  id: string;
  jobNo: string;
  originBranchId: string;
  servicingBranchId?: string | null;
  originBranch: { id: string; name: string; code: string; phone: string; address: string };
  servicingBranch?: { id: string; name: string; code: string } | null;
  customerId: string;
  customer: { name: string; phone: string; address?: string | null };
  intakeStaff: { name: string };
  assignedTech?: { id: string; name: string } | null;
  deviceType: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  physicalCondition: string;
  complaintDescription: string;
  additionalIssues?: string | null;
  isWarranty: boolean;
  status: string;
  tatDate?: string | null;
  approvalProof?: string | null;
  remarks?: string | null;
  estimatedCost?: number | null;
  estimatedSpareCost?: number | null;
  serviceCharge: number;
  interBranchFee: number;
  paymentStatus: string;
  creditDueDate?: string | null;
  paymentRemarks?: string | null;
  closedOutcome?: string | null;
  reopenRequested?: boolean;
  reopenReason?: string | null;
  reopenRequestedAt?: string | null;
  reopenApprovedBy?: string | null;
  partsUsed: JobPart[];
  createdAt: string;
  closedAt?: string | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { currentUser, branches } = useAuth();

  const [job, setJob] = useState<JobSheet | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [wipRemarks, setWipRemarks] = useState("");
  const [isUpdatingWip, setIsUpdatingWip] = useState(false);

  const [approvalCallTime, setApprovalCallTime] = useState("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const [transferBranchId, setTransferBranchId] = useState("");
  const [transferFee, setTransferFee] = useState("500");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const [closureOutcome, setClosureOutcome] = useState<"REPAIR_DONE" | "NON_REPAIRABLE" | "RETURNED_NO_SERVICE">("REPAIR_DONE");
  const [closureServiceCharge, setClosureServiceCharge] = useState("800");
  const [closurePaymentStatus, setClosurePaymentStatus] = useState<"PAID" | "CREDIT" | "UNPAID">("PAID");
  const [closurePaymentRemarks, setClosurePaymentRemarks] = useState("");
  const [parts, setParts] = useState<JobPart[]>([]);
  const [isClosingCase, setIsClosingCase] = useState(false);

  const [settlePaymentRemarks, setSettlePaymentRemarks] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  const [reopenReasonText, setReopenReasonText] = useState("");
  const [reopenReviewRemarks, setReopenReviewRemarks] = useState("");
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);
  const [showReopenInput, setShowReopenInput] = useState(false);

  const fetchJob = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error("Job not found");
      const data = await res.json();
      setJob(data);
      setWipRemarks(data.remarks || "");

      const activeBranchId = data.servicingBranchId || data.originBranchId;
      const stockRes = await fetch(`/api/stock?branchId=${activeBranchId}`);
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setStockItems(stockData);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleUpdateWip = async (newStatus = "DIAGNOSIS_WIP") => {
    setIsUpdatingWip(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          status: newStatus,
          remarks: wipRemarks,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      setActionSuccess("Work in progress updated.");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUpdatingWip(false);
    }
  };

  const handleSubmitApproval = async () => {
    if (!approvalCallTime) {
      setError("Please enter customer call timestamp or approval record.");
      return;
    }
    setIsSubmittingApproval(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CUSTOMER_APPROVAL",
          approvalProof: approvalCallTime,
          status: "DIAGNOSIS_WIP",
          remarks: `${job?.remarks || ""}\nCustomer approval logged: ${approvalCallTime}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record approval");
      }
      setActionSuccess("Customer approval logged successfully.");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleTransfer = async (status = "TRANSFER_IN_TRANSIT") => {
    if (!transferBranchId) {
      setError("Please select the destination servicing branch.");
      return;
    }
    setIsTransferring(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INTER_BRANCH_TRANSFER",
          servicingBranchId: transferBranchId,
          interBranchFee: transferFee,
          status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transfer failed");
      }
      setActionSuccess("Job transferred successfully.");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReceiveAtServicing = async () => {
    setIsTransferring(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECEIVE_AT_SERVICING" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to confirm receipt at servicing branch");
      }
      setActionSuccess("Hardware marked as received at servicing branch.");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDispatchToOrigin = async () => {
    setIsTransferring(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPATCH_TO_ORIGIN",
          dispatchRemarks: returnRemarks,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to dispatch back to origin branch");
      }
      setActionSuccess(`Hardware dispatched back to ${job?.originBranch?.name}.`);
      setReturnRemarks("");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReceiveAtOrigin = async () => {
    setIsTransferring(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECEIVE_AT_ORIGIN" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to confirm receipt at origin branch");
      }
      setActionSuccess("Hardware marked as received back at home branch.");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAddPart = () => {
    setParts([
      ...parts,
      {
        partName: "",
        landingPrice: 0,
        sellingPrice: 0,
        quantity: 1,
        stockItemId: null,
        vendorName: "",
        invoiceNumber: "",
      },
    ]);
  };

  const handleSelectStock = (index: number, stockId: string) => {
    const item = stockItems.find((s) => s.id === stockId);
    if (!item) return;
    const nextParts = [...parts];
    nextParts[index] = {
      ...nextParts[index],
      partName: item.partName,
      landingPrice: item.landingPrice,
      sellingPrice: Math.round(item.landingPrice * 1.35),
      stockItemId: item.id,
      vendorName: item.vendorName,
      invoiceNumber: item.invoiceNumber,
    };
    setParts(nextParts);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleCloseCase = async () => {
    setIsClosingCase(true);
    setError(null);
    try {
      if (closurePaymentStatus === "CREDIT" && currentUser?.role !== "SUPER_ADMIN") {
        throw new Error("Credit release requires Admin permission.");
      }

      if (closureOutcome === "REPAIR_DONE" && parts.length > 0) {
        for (const p of parts) {
          if (!p.partName.trim()) throw new Error("Part name is required for all parts");
          if (!p.vendorName?.trim() || !p.invoiceNumber?.trim()) {
            throw new Error(`Please enter purchase place / vendor and invoice number for "${p.partName}"`);
          }
        }
      }

      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_CASE",
          closedOutcome: closureOutcome,
          serviceCharge: closureServiceCharge,
          parts,
          paymentStatus: closurePaymentStatus,
          paymentRemarks: closurePaymentRemarks,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to close case");
      }
      setActionSuccess("Case closed successfully.");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsClosingCase(false);
    }
  };

  const handleSettleCredit = async () => {
    setIsSettling(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_PAYMENT",
          paymentStatus: "PAID",
          paymentRemarks: settlePaymentRemarks || "Credit balance settled in full",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to settle payment");
      }
      setActionSuccess("Credit settled and recorded as Paid.");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSettling(false);
    }
  };

  const handleRequestReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReasonText.trim()) {
      setError("Please state the reason for requesting a reopen");
      return;
    }
    setIsSubmittingReopen(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_REOPEN",
          reason: reopenReasonText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request reopen");
      setActionSuccess("Reopen request submitted for Admin review.");
      setShowReopenInput(false);
      setReopenReasonText("");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const handleReviewReopen = async (action: "APPROVE_REOPEN" | "REJECT_REOPEN") => {
    setIsSubmittingReopen(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          remarks: reopenReviewRemarks.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process reopen");
      setActionSuccess(
        action === "APPROVE_REOPEN"
          ? "Service reopened successfully. Technicians can now continue work."
          : "Reopen request rejected."
      );
      setReopenReviewRemarks("");
      fetchJob();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-sm">
        Loading jobsheet details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-24 text-center text-zinc-500 text-sm">
        Jobsheet not found.
      </div>
    );
  }

  const cleanPhone = job.customer.phone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
    `Hello ${job.customer.name},\nThis is an update regarding your service order ${job.jobNo} (${job.brand} ${job.modelNumber}) at Xattica ${job.originBranch.name}.\nCurrent Status: ${job.status}.\nFor queries contact ${job.originBranch.phone}.`
  )}`;

  const isClosed = Boolean(job.closedAt);
  const isAdminUser =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "SUB_ADMIN" ||
    currentUser?.username === "theerdha" ||
    currentUser?.username === "admin";
  const isStaffManager = currentUser?.role === "STAFF_MANAGER";
  const isOriginBranch =
    isAdminUser ||
    isStaffManager ||
    currentUser?.branchId === job.originBranchId;
  const isServicingBranch =
    Boolean(job.servicingBranchId) &&
    (isAdminUser ||
      isStaffManager ||
      currentUser?.branchId === job.servicingBranchId);
  const canApproveReopen = isAdminUser;
  const isOverdue =
    !isClosed &&
    new Date(job.createdAt) <
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const partsTotalSelling = job.partsUsed.reduce(
    (sum, p) => sum + p.sellingPrice * p.quantity,
    0
  );
  const partsTotalLanding = job.partsUsed.reduce(
    (sum, p) => sum + p.landingPrice * p.quantity,
    0
  );
  const totalBill = job.serviceCharge + partsTotalSelling;
  const netMargin = totalBill - partsTotalLanding - job.interBranchFee;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-zinc-900">
                {job.jobNo}
              </h1>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue (&gt;7 Days)
                </span>
              )}
              {isClosed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-white">
                  <Lock className="w-3 h-3" />
                  Case Closed
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {job.status}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Received at {job.originBranch.name} on{" "}
              {new Date(job.createdAt).toLocaleString()} by {job.intakeStaff.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share WhatsApp
          </a>

          <Link
            href={`/jobs/${job.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print A4 Jobsheet
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              Hardware Profile & Complaint
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Device Type</span>
                <span className="font-semibold text-zinc-900">{job.deviceType}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Brand & Model</span>
                <span className="font-semibold text-zinc-900">
                  {job.brand} {job.modelNumber}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Serial Number</span>
                <span className="font-mono font-bold text-zinc-900">
                  {job.serialNumber}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Warranty Status</span>
                <span
                  className={`font-semibold ${
                    job.isWarranty ? "text-emerald-600" : "text-zinc-700"
                  }`}
                >
                  {job.isWarranty ? "In Warranty" : "Out of Warranty"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-500 block">Physical Condition</span>
                <span className="font-medium text-zinc-900">
                  {job.physicalCondition}
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs space-y-1">
              <span className="text-zinc-500 font-semibold block uppercase">
                Primary Complaint
              </span>
              <p className="font-bold text-zinc-900 text-sm">
                {job.complaintDescription}
              </p>
              {job.additionalIssues && (
                <p className="text-zinc-600 pt-1">
                  <span className="font-semibold">Additional Notes:</span>{" "}
                  {job.additionalIssues}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                <span className="text-blue-700 font-medium block">Est. Service</span>
                <span className="font-bold text-zinc-900 text-sm">
                  Rs {job.estimatedCost || 0}
                </span>
              </div>
              <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                <span className="text-blue-700 font-medium block">Est. Spares</span>
                <span className="font-bold text-zinc-900 text-sm">
                  Rs {job.estimatedSpareCost || 0}
                </span>
              </div>
              <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                <span className="text-blue-700 font-medium block">Est. TAT</span>
                <span className="font-bold text-zinc-900 text-sm">
                  {job.tatDate
                    ? new Date(job.tatDate).toLocaleDateString()
                    : "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {!isClosed && (
            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Technician Work in Progress & Remarks
              </h2>

              <div className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Enter current diagnostic findings, parts pending, customer communications..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={wipRemarks}
                  onChange={(e) => setWipRemarks(e.target.value)}
                />

                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingWip}
                      onClick={() => handleUpdateWip("DIAGNOSIS_WIP")}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {isUpdatingWip ? "Saving..." : "Save WIP Remarks"}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingWip}
                      onClick={() => handleUpdateWip("APPROVAL_PENDING")}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Hold for Customer Approval
                    </button>
                  </div>
                </div>
              </div>

              {job.status === "APPROVAL_PENDING" && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2 text-xs">
                  <span className="font-bold text-amber-900 block">
                    Customer Overrun Consent Audit
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Call at 14:35 approved Rs 2,500 by customer OR WhatsApp screenshot ref"
                    className="w-full bg-white border border-amber-300 rounded-md p-2 text-xs focus:outline-none"
                    value={approvalCallTime}
                    onChange={(e) => setApprovalCallTime(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={isSubmittingApproval}
                    onClick={handleSubmitApproval}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Confirm Customer Consent & Resume Work
                  </button>
                </div>
              )}
            </div>
          )}

          {!isClosed && (
            <div className="space-y-4">
              {/* State A: Device Dispatched to Servicing Branch - Awaiting Physical Receipt at Servicing */}
              {job.servicingBranchId && job.status === "TRANSFER_IN_TRANSIT" && (
                <div className="bg-purple-50/70 p-5 rounded-xl border-2 border-purple-400 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-700 text-white">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        In Transit to Servicing Branch
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900 pt-1">
                        Dispatched from {job.originBranch.name} ({job.originBranch.code}) to {job.servicingBranch?.name} ({job.servicingBranch?.code})
                      </h3>
                      <p className="text-xs text-zinc-600">
                        Specialized repair request. Internal Fee Credit: <span className="font-bold text-purple-900">Rs {job.interBranchFee}</span>.
                      </p>
                    </div>
                  </div>

                  {isServicingBranch ? (
                    <div className="pt-2 border-t border-purple-200">
                      <p className="text-xs text-purple-900 font-semibold mb-2">
                        Physical device arrived at {job.servicingBranch?.name}? Acknowledge custody to begin diagnosis:
                      </p>
                      <button
                        type="button"
                        disabled={isTransferring}
                        onClick={handleReceiveAtServicing}
                        className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Received at {job.servicingBranch?.name || "Servicing Branch"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/80 rounded-lg border border-purple-200 text-xs text-purple-900">
                      Waiting for {job.servicingBranch?.name} to confirm physical receipt of hardware.
                    </div>
                  )}
                </div>
              )}

              {/* State B: Device at Servicing Branch - Under Active Repair */}
              {job.servicingBranchId && (job.status === "TRANSFER_WIP" || job.status === "DIAGNOSIS_WIP") && (
                <div className="bg-white p-5 rounded-xl border-2 border-indigo-200 shadow-sm space-y-3">
                  <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                    Inter-Branch Service (Servicing at {job.servicingBranch?.name})
                  </h2>

                  {isServicingBranch ? (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-600">
                        When repair is completed (or determined non-repairable), dispatch this hardware back to the origin branch <span className="font-bold text-zinc-900">{job.originBranch.name} ({job.originBranch.code})</span>.
                      </p>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Repair Findings & Return Remarks for {job.originBranch.name}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chip-level repair completed. Power rail restored, burn-in tested OK."
                          className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          value={returnRemarks}
                          onChange={(e) => setReturnRemarks(e.target.value)}
                        />
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          disabled={isTransferring}
                          onClick={handleDispatchToOrigin}
                          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          Dispatch Back to {job.originBranch.name} ({job.originBranch.code})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-200 text-xs text-indigo-900">
                      Hardware is currently undergoing specialized service at {job.servicingBranch?.name}. Internal fee credit: Rs {job.interBranchFee}.
                    </div>
                  )}
                </div>
              )}

              {/* State C: Device Dispatched Back to Origin - Awaiting Physical Receipt at Origin */}
              {job.servicingBranchId && job.status === "TRANSFER_QA" && (
                <div className="bg-emerald-50/70 p-5 rounded-xl border-2 border-emerald-400 shadow-sm space-y-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-700 text-white">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Returned from Servicing Branch
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900 pt-1">
                      Hardware Dispatched Back to {job.originBranch.name} ({job.originBranch.code})
                    </h3>
                    <p className="text-xs text-zinc-600">
                      Servicing completed by {job.servicingBranch?.name}.
                    </p>
                  </div>

                  {isOriginBranch ? (
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="text-xs text-emerald-900 font-semibold mb-2">
                        Hardware physically returned to {job.originBranch.name}? Acknowledge custody to unlock final QA & customer delivery:
                      </p>
                      <button
                        type="button"
                        disabled={isTransferring}
                        onClick={handleReceiveAtOrigin}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Received at {job.originBranch.name} ({job.originBranch.code})
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                      Device is in transit back to {job.originBranch.name}. Waiting for home branch receipt acknowledgment.
                    </div>
                  )}
                </div>
              )}

              {/* State D: Initial Branch Intake (Not Transferred Yet) */}
              {!job.servicingBranchId && isOriginBranch && (
                <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                    <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                    Inter-Branch Transfer (e.g. Chip-Level Repair at Cochin)
                  </h2>

                  <p className="text-xs text-zinc-500">
                    Route this hardware to a specialized branch. {job.originBranch.name} maintains
                    customer billing, and a fixed fee will be credited to the servicing branch upon service completion.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Destination Branch
                      </label>
                      <select
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2 text-xs font-semibold"
                        value={transferBranchId}
                        onChange={(e) => setTransferBranchId(e.target.value)}
                      >
                        <option value="">Select Branch</option>
                        {branches
                          .filter((b) => b.id !== job.originBranchId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-1">
                        Fixed Internal Charge (Rs)
                      </label>
                      <input
                        type="number"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2 text-xs"
                        value={transferFee}
                        onChange={(e) => setTransferFee(e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={isTransferring}
                        onClick={() => handleTransfer("TRANSFER_IN_TRANSIT")}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Dispatch to Branch
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isClosed && job.servicingBranchId && !isOriginBranch && (
            <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5 text-sm">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
                Customer Invoicing & Settlement Handled by {job.originBranch.name}
              </span>
              <p>
                As the servicing branch, internal transfer credit (Rs {job.interBranchFee}) is allocated to your branch. Final customer invoicing, payment collection, and hardware delivery will be executed by {job.originBranch.name} ({job.originBranch.code}) upon return.
              </p>
            </div>
          )}

          {!isClosed && job.servicingBranchId && isOriginBranch && ["TRANSFER_IN_TRANSIT", "TRANSFER_WIP", "TRANSFER_QA"].includes(job.status) && (
            <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5 text-sm">
                <Lock className="w-4 h-4 text-zinc-600" />
                Case Closure Locked (Hardware with Servicing Branch)
              </span>
              <p>
                Confirm physical receipt of the returned hardware at {job.originBranch.name} before initiating customer delivery, warranty terms, and payment settlement.
              </p>
            </div>
          )}

          {!isClosed && (!job.servicingBranchId || !["TRANSFER_IN_TRANSIT", "TRANSFER_WIP", "TRANSFER_QA"].includes(job.status)) && isOriginBranch && (
            <div className="bg-white p-5 rounded-xl border-2 border-emerald-500 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Case Closure & Settlement
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Closure Outcome *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "REPAIR_DONE", label: "Repair Done" },
                      { id: "NON_REPAIRABLE", label: "Non Repairable" },
                      { id: "RETURNED_NO_SERVICE", label: "Returned Without Service" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setClosureOutcome(
                            opt.id as "REPAIR_DONE" | "NON_REPAIRABLE" | "RETURNED_NO_SERVICE"
                          )
                        }
                        className={`p-2.5 rounded-lg border font-bold text-xs transition-all ${
                          closureOutcome === opt.id
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Service Charge (Mandatory for all 3 outcomes) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Service charge in Rs"
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2.5 text-xs font-bold focus:outline-none"
                    value={closureServiceCharge}
                    onChange={(e) => setClosureServiceCharge(e.target.value)}
                  />
                </div>

                {closureOutcome === "REPAIR_DONE" && (
                  <div className="space-y-3 border-t border-zinc-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">
                        Parts Used (Stock Decrement & Margin Tracking)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Part
                      </button>
                    </div>

                    {parts.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end"
                      >
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                            Pick From Stock
                          </label>
                          <select
                            className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs"
                            onChange={(e) => handleSelectStock(idx, e.target.value)}
                          >
                            <option value="">Manual / Custom Part</option>
                            {stockItems.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.partName} (Qty: {s.quantity}, Landing: {s.landingPrice})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Part Name"
                            className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs mt-1"
                            value={p.partName}
                            onChange={(e) => {
                              const next = [...parts];
                              next[idx].partName = e.target.value;
                              setParts(next);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                            Landing (Rs)
                          </label>
                          <input
                            type="number"
                            placeholder="Cost"
                            className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs font-mono"
                            value={p.landingPrice}
                            onChange={(e) => {
                              const next = [...parts];
                              next[idx].landingPrice = parseFloat(e.target.value) || 0;
                              setParts(next);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                            Selling (Rs)
                          </label>
                          <input
                            type="number"
                            placeholder="Price"
                            className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs font-mono font-bold"
                            value={p.sellingPrice}
                            onChange={(e) => {
                              const next = [...parts];
                              next[idx].sellingPrice = parseFloat(e.target.value) || 0;
                              setParts(next);
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="flex-1">
                            <label className="block text-[10px] font-semibold text-zinc-500 mb-0.5">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs font-mono"
                              value={p.quantity}
                              onChange={(e) => {
                                const next = [...parts];
                                next[idx].quantity = parseInt(e.target.value, 10) || 1;
                                setParts(next);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="sm:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 mt-1">
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
                              Purchase Place / Vendor *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Supreme Computers, Sun Infotech"
                              className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs"
                              value={p.vendorName || ""}
                              onChange={(e) => {
                                const next = [...parts];
                                next[idx].vendorName = e.target.value;
                                setParts(next);
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-600 mb-0.5">
                              Purchase Invoice Ref / Bill No *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. INV-2026-9912"
                              className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs font-mono"
                              value={p.invoiceNumber || ""}
                              onChange={(e) => {
                                const next = [...parts];
                                next[idx].invoiceNumber = e.target.value;
                                setParts(next);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-zinc-100 pt-3">
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Delivery Payment Mode *
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="payMode"
                        checked={closurePaymentStatus === "PAID"}
                        onChange={() => setClosurePaymentStatus("PAID")}
                      />
                      Full Payment Collected (Cash / UPI / Card)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-orange-600">
                      <input
                        type="radio"
                        name="payMode"
                        checked={closurePaymentStatus === "CREDIT"}
                        onChange={() => setClosurePaymentStatus("CREDIT")}
                      />
                      Release on Credit (5-Day Limit, Admin Only)
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isClosingCase}
                    onClick={handleCloseCase}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors disabled:opacity-50"
                  >
                    {isClosingCase ? "Processing Case Closure..." : "Finalize & Close Job"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                Final Financials & Settlement
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-zinc-50 rounded-lg">
                  <span className="text-zinc-500 block">Closure Outcome</span>
                  <span className="font-bold text-zinc-900">
                    {job.closedOutcome?.replace("_", " ")}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg">
                  <span className="text-zinc-500 block">Service Charge</span>
                  <span className="font-bold text-zinc-900">
                    Rs {job.serviceCharge}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg">
                  <span className="text-zinc-500 block">Parts Total</span>
                  <span className="font-bold text-zinc-900">
                    Rs {partsTotalSelling}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-700 font-semibold block">
                    Total Customer Bill
                  </span>
                  <span className="font-bold text-emerald-900 text-sm">
                    Rs {totalBill}
                  </span>
                </div>
              </div>

              {job.partsUsed && job.partsUsed.length > 0 && (
                <div className="border border-zinc-200 rounded-lg overflow-hidden text-xs">
                  <div className="bg-zinc-100 px-3 py-2 font-bold text-zinc-800 flex justify-between items-center">
                    <span>Parts & Spares Replaced ({job.partsUsed.length})</span>
                    <span className="font-mono text-zinc-600">Total: Rs {partsTotalSelling}</span>
                  </div>
                  <div className="divide-y divide-zinc-200 bg-white">
                    {job.partsUsed.map((p, idx) => (
                      <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="font-semibold text-zinc-900">
                            {p.partName} <span className="text-zinc-500 font-normal">x {p.quantity}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            <span>Source / Vendor: <strong className="text-zinc-700">{p.vendorName || "Direct / Local"}</strong></span>
                            {p.invoiceNumber && (
                              <span className="ml-3">Purchase Invoice Ref: <strong className="text-zinc-700 font-mono">{p.invoiceNumber}</strong></span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-zinc-900 block">Rs {p.sellingPrice * p.quantity}</span>
                          {currentUser?.role === "SUPER_ADMIN" && (
                            <span className="text-[10px] text-zinc-500 block">
                              Wholesale: Rs {p.landingPrice * p.quantity} (Margin: +Rs {(p.sellingPrice - p.landingPrice) * p.quantity})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentUser?.role === "SUPER_ADMIN" && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs flex justify-between">
                  <div>
                    <span className="text-blue-800 font-semibold block">
                      Admin Wholesale Margin Audit
                    </span>
                    <span className="text-zinc-600">
                      Wholesale Parts Cost: Rs {partsTotalLanding} | Inter-branch
                      Transfer Fee: Rs {job.interBranchFee}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-800 font-semibold block">
                      Net Branch Margin
                    </span>
                    <span className="font-bold text-blue-900 text-sm">
                      Rs {netMargin}
                    </span>
                  </div>
                </div>
              )}

              {job.paymentStatus === "CREDIT" && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-900">
                      Credit Pending (Due:{" "}
                      {job.creditDueDate
                        ? new Date(job.creditDueDate).toLocaleDateString()
                        : "5 Days"}
                      )
                    </span>
                    <span className="px-2 py-0.5 bg-orange-200 text-orange-900 rounded font-bold">
                      Outstanding: Rs {totalBill}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Payment settlement remarks (e.g. Paid via GPay ref 41829)"
                      className="flex-1 bg-white border border-orange-300 rounded p-2 text-xs"
                      value={settlePaymentRemarks}
                      onChange={(e) => setSettlePaymentRemarks(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={isSettling}
                      onClick={handleSettleCredit}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isSettling ? "Saving..." : "Record Payment Collected"}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-300 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                      Completed Service Reopen Console
                    </h3>
                    <p className="text-xs text-amber-900/80 mt-0.5">
                      Technicians can request reopen approval. Only Super Admin or Theerdha can approve and resume work.
                    </p>
                  </div>
                  {job.reopenRequested && (
                    <span className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold text-[11px] animate-pulse w-fit">
                      Reopen Approval Pending
                    </span>
                  )}
                </div>

                {job.reopenRequested ? (
                  <div className="bg-white p-3.5 rounded-lg border border-amber-200 text-xs space-y-2">
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-500 block">Technician Reopen Reason:</span>
                      <p className="font-bold text-zinc-900 mt-0.5">{job.reopenReason}</p>
                      {job.reopenRequestedAt && (
                        <span className="text-[10px] text-zinc-500 block mt-1">
                          Requested at: {new Date(job.reopenRequestedAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {canApproveReopen ? (
                      <div className="pt-2 border-t border-zinc-100 space-y-2">
                        <input
                          type="text"
                          placeholder="Approval or rejection remarks (optional)..."
                          className="w-full bg-zinc-50 border border-zinc-300 rounded p-1.5 text-xs"
                          value={reopenReviewRemarks}
                          onChange={(e) => setReopenReviewRemarks(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isSubmittingReopen}
                            onClick={() => handleReviewReopen("APPROVE_REOPEN")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve & Reopen Service</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingReopen}
                            onClick={() => handleReviewReopen("REJECT_REOPEN")}
                            className="px-3.5 py-1.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Reject Request
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
                        Request has been submitted and is currently awaiting approval from Super Admin or Theerdha.
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {showReopenInput ? (
                      <form onSubmit={handleRequestReopen} className="bg-white p-3.5 rounded-lg border border-amber-200 space-y-2 text-xs">
                        <label className="block font-semibold text-zinc-800 text-[11px]">
                          State Findings / Reason for Reopening Service *
                        </label>
                        <textarea
                          required
                          rows={2}
                          placeholder="e.g. Device returned by customer with recurrence of power issue. Motherboard secondary rail requires diagnostic re-check."
                          className="w-full bg-zinc-50 border border-zinc-300 rounded p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          value={reopenReasonText}
                          onChange={(e) => setReopenReasonText(e.target.value)}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowReopenInput(false)}
                            className="px-3 py-1 border border-zinc-300 text-zinc-600 rounded text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingReopen}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer"
                          >
                            {isSubmittingReopen ? "Submitting..." : "Submit Reopen Request"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReopenInput(true)}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Request Reopen Approval</span>
                        </button>
                        {canApproveReopen && (
                          <button
                            type="button"
                            disabled={isSubmittingReopen}
                            onClick={() => handleReviewReopen("APPROVE_REOPEN")}
                            className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Direct Admin Reopen</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Branch & Customer File
            </h2>

            <div className="text-xs space-y-3">
              <div>
                <span className="text-zinc-500 block">Originating Branch</span>
                <span className="font-bold text-zinc-900">
                  {job.originBranch.name} ({job.originBranch.code})
                </span>
                <span className="text-zinc-500 block text-[11px]">
                  {job.originBranch.phone}
                </span>
              </div>

              {job.servicingBranch &&
                job.servicingBranch.id !== job.originBranchId && (
                  <div className="p-2 bg-purple-50 rounded border border-purple-200">
                    <span className="text-purple-800 font-bold block">
                      Servicing Branch: {job.servicingBranch.name}
                    </span>
                    <span className="text-purple-600 text-[11px] block">
                      Internal Fee: Rs {job.interBranchFee}
                    </span>
                  </div>
                )}

              <div className="border-t border-zinc-100 pt-3">
                <span className="text-zinc-500 block">Customer</span>
                <span className="font-bold text-zinc-900 text-sm">
                  {job.customer.name}
                </span>
                <span className="font-mono text-zinc-700 block">
                  {job.customer.phone}
                </span>
                {job.customer.address && (
                  <span className="text-zinc-500 block text-[11px] mt-1">
                    {job.customer.address}
                  </span>
                )}
              </div>

              <div className="border-t border-zinc-100 pt-3">
                <span className="text-zinc-500 block">Intake Staff</span>
                <span className="font-semibold text-zinc-900">
                  {job.intakeStaff.name}
                </span>
                <span className="text-zinc-500 block mt-1">Assigned Tech</span>
                <span className="font-semibold text-zinc-900">
                  {job.assignedTech?.name || "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Legal 30-Day Abandonment Notice
            </span>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Customer hardware left uncollected after 30 days from notification
              will be permanently disposed of as electronic scrap. No reclaim or
              compensation will be entertained after 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
