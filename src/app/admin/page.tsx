"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  IndianRupee,
  AlertTriangle,
  Clock,
  Building2,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Cpu,
  Flame,
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  Shield,
  CheckCircle,
  Phone,
  MapPin,
  Edit3,
  PlusCircle,
  Save,
  X,
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
} from "lucide-react";

interface BranchAnalytic {
  id: string;
  code: string;
  name: string;
  totalJobs: number;
  closedJobs: number;
  closureRate: number;
  grossRevenue: number;
  partsCost: number;
  outflowFee: number;
  inflowFee: number;
  netProfit: number;
}

interface AnalyticsData {
  totalCompanyRevenue: number;
  totalCompanyNetProfit: number;
  branchAnalytics: BranchAnalytic[];
  overdueRepairs: Array<{
    id: string;
    jobNo: string;
    brand: string;
    modelNumber: string;
    originBranch: { name: string; code: string };
    customer: { name: string; phone: string };
    assignedTech?: { name: string } | null;
    createdAt: string;
  }>;
  overdueCredits: Array<{
    id: string;
    jobNo: string;
    customer: { name: string; phone: string };
    originBranch: { name: string; code: string };
    creditDueDate?: string | null;
    serviceCharge: number;
    partsUsed: Array<{ sellingPrice: number; quantity: number }>;
  }>;
  activeCredits: Array<{
    id: string;
    jobNo: string;
    customer: { name: string; phone: string };
    originBranch: { name: string; code: string };
    creditDueDate?: string | null;
  }>;
  abandonedHardware: Array<{
    id: string;
    jobNo: string;
    brand: string;
    modelNumber: string;
    customer: { name: string; phone: string };
    originBranch: { name: string };
    closedAt: string;
  }>;
  topBrands: Array<{ brand: string; count: number }>;
  topComplaints: Array<{ complaint: string; count: number }>;
  technicianRanking: Array<{
    name: string;
    branchName: string;
    total: number;
    closed: number;
    revenue: number;
  }>;
}

interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: string;
  phone?: string | null;
  branchId: string;
  branch: { id: string; code: string; name: string };
  createdAt?: string;
}

interface AdminBranch {
  id: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  _count?: {
    users: number;
    originJobs: number;
    servicingJobs: number;
    stockItems: number;
  };
}

interface ReportSummary {
  totalJobs: number;
  closedJobs: number;
  totalServiceCharge: number;
  totalSparesBilled: number;
  totalSparesCost: number;
  totalSparesMargin: number;
  totalInterBranchFees: number;
  totalNetRevenue: number;
}

interface ReportBranchBreakup {
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

interface ReportTechnicianBreakup {
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

interface ReportJobRow {
  id: string;
  jobNo: string;
  createdAt: string;
  closedAt: string | null;
  status: string;
  paymentStatus: string;
  originBranchName: string;
  originBranchCode: string;
  servicingBranchName: string | null;
  customerName: string;
  customerPhone: string;
  deviceSummary: string;
  assignedTechName: string;
  serviceCharge: number;
  sparesBilled: number;
  sparesCost: number;
  sparesMargin: number;
  interBranchFee: number;
  netProfit: number;
  partsCount: number;
}

interface ReportData {
  period: {
    startDate: string;
    endDate: string;
    month: string | null;
  };
  summary: ReportSummary;
  branchBreakup: ReportBranchBreakup[];
  technicianBreakup: ReportTechnicianBreakup[];
  jobs: ReportJobRow[];
}

export default function AdminDashboardPage() {
  const { currentUser, branches } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Staff management state
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffUsername, setNewStaffUsername] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffBranchId, setNewStaffBranchId] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("INHOUSE_TECH");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  const [resetStaffId, setResetStaffId] = useState<string | null>(null);
  const [resetStaffPassword, setResetStaffPassword] = useState("");
  const [isResettingStaff, setIsResettingStaff] = useState(false);

  // Branch management state
  const [adminBranches, setAdminBranches] = useState<AdminBranch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchSuccess, setBranchSuccess] = useState<string | null>(null);

  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCode, setNewBranchCode] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchName, setEditBranchName] = useState("");
  const [editBranchCode, setEditBranchCode] = useState("");
  const [editBranchPhone, setEditBranchPhone] = useState("");
  const [editBranchAddress, setEditBranchAddress] = useState("");
  const [isSavingBranch, setIsSavingBranch] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "reports">("overview");
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [reportUseCustomDate, setReportUseCustomDate] = useState(false);
  const [reportFromDate, setReportFromDate] = useState("");
  const [reportToDate, setReportToDate] = useState("");
  const [reportBranchId, setReportBranchId] = useState("");
  const [reportTechId, setReportTechId] = useState("");
  const [reportJobSearch, setReportJobSearch] = useState("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoadingReport(true);
    setReportError(null);
    try {
      const params = new URLSearchParams();
      if (reportUseCustomDate && reportFromDate && reportToDate) {
        params.set("from", reportFromDate);
        params.set("to", reportToDate);
      } else if (reportMonth) {
        params.set("month", reportMonth);
      }
      if (reportBranchId) params.set("branchId", reportBranchId);
      if (reportTechId) params.set("techId", reportTechId);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load report data");
      }
      const json = await res.json();
      setReportData(json);
    } catch (err) {
      setReportError((err as Error).message);
    } finally {
      setIsLoadingReport(false);
    }
  }, [
    reportMonth,
    reportUseCustomDate,
    reportFromDate,
    reportToDate,
    reportBranchId,
    reportTechId,
  ]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReport();
    }
  }, [activeTab, fetchReport]);

  const handleExportCSV = () => {
    if (!reportData) return;
    const periodLabel = reportUseCustomDate
      ? `${reportFromDate}_to_${reportToDate}`
      : reportMonth || "all";

    const lines: string[] = [];
    lines.push(`XATTICA CRM - FINANCIAL AND SERVICE REPORT (${periodLabel})`);
    lines.push(`Generated On,"${new Date().toLocaleString()}"`);
    lines.push("");

    lines.push("FINANCIAL SUMMARY");
    lines.push(`Total Jobs,${reportData.summary.totalJobs}`);
    lines.push(`Closed Jobs,${reportData.summary.closedJobs}`);
    lines.push(`Total Service Charges (Rs),${reportData.summary.totalServiceCharge}`);
    lines.push(`Total Spares Billed (Rs),${reportData.summary.totalSparesBilled}`);
    lines.push(`Total Spares Wholesale Cost (Rs),${reportData.summary.totalSparesCost}`);
    lines.push(`Net Spares Margin (Rs),${reportData.summary.totalSparesMargin}`);
    lines.push(`Inter-Branch Transfer Fees (Rs),${reportData.summary.totalInterBranchFees}`);
    lines.push(`Total Net Realized Revenue (Rs),${reportData.summary.totalNetRevenue}`);
    lines.push("");

    lines.push("BRANCH-WISE BREAKDOWN");
    lines.push(
      "Branch Name,Code,Total Jobs,Closed Jobs,Service Charges (Rs),Spares Billed (Rs),Spares Cost (Rs),Spares Margin (Rs),Transfer Credit (Rs),Transfer Debit (Rs),Net Revenue (Rs)"
    );
    for (const b of reportData.branchBreakup) {
      lines.push(
        `"${b.name}","${b.code}",${b.totalJobs},${b.closedJobs},${b.serviceCharge},${b.sparesBilled},${b.sparesCost},${b.sparesMargin},${b.transferCredit},${b.transferDebit},${b.netRevenue}`
      );
    }
    lines.push("");

    lines.push("TECHNICIAN-WISE BREAKDOWN");
    lines.push(
      "Technician Name,Branch,Total Cases,Closed Cases,Service Labor (Rs),Spares Billed (Rs),Spares Cost (Rs),Net Contribution (Rs)"
    );
    for (const t of reportData.technicianBreakup) {
      lines.push(
        `"${t.name}","${t.branchName}",${t.totalJobs},${t.closedJobs},${t.serviceCharge},${t.sparesBilled},${t.sparesCost},${t.netContribution}`
      );
    }
    lines.push("");

    lines.push("DETAILED SERVICE JOB REGISTER");
    lines.push(
      "Job No,Intake Date,Status,Origin Branch,Servicing Branch,Customer,Phone,Device,Technician,Service Charge (Rs),Spares Billed (Rs),Spares Cost (Rs),Net Profit (Rs),Payment Status"
    );
    for (const j of reportData.jobs) {
      const dateStr = j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "";
      lines.push(
        `"${j.jobNo}","${dateStr}","${j.status}","${j.originBranchName}","${
          j.servicingBranchName || "-"
        }","${j.customerName}","${j.customerPhone}","${j.deviceSummary}","${
          j.assignedTechName
        }",${j.serviceCharge},${j.sparesBilled},${j.sparesCost},${j.netProfit},"${
          j.paymentStatus
        }"`
      );
    }

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute(
      "download",
      `xattica-report-${periodLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const availableMonths = [
    { value: "2026-11", label: "November 2026 (Current)" },
    { value: "2026-10", label: "October 2026" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-08", label: "August 2026" },
    { value: "2026-07", label: "July 2026" },
    { value: "2026-06", label: "June 2026" },
    { value: "2026-05", label: "May 2026" },
    { value: "2026-04", label: "April 2026" },
    { value: "2026-03", label: "March 2026" },
    { value: "2026-02", label: "February 2026" },
    { value: "2026-01", label: "January 2026" },
    { value: "2025-12", label: "December 2025" },
  ];

  const availableTechs = staffList.filter(
    (s) =>
      (!reportBranchId || s.branchId === reportBranchId) &&
      (s.role === "INHOUSE_TECH" || s.role === "FIELD_TECH")
  );

  const fetchAdminBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const json = await res.json();
        setAdminBranches(json.branches || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches", err);
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBranchError(null);
    setBranchSuccess(null);
    setIsCreatingBranch(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBranchName,
          code: newBranchCode,
          phone: newBranchPhone,
          address: newBranchAddress,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create branch");
      setBranchSuccess(`Branch "${newBranchName}" (${newBranchCode.toUpperCase()}) created successfully.`);
      setNewBranchName("");
      setNewBranchCode("");
      setNewBranchPhone("");
      setNewBranchAddress("");
      fetchAdminBranches();
    } catch (err) {
      setBranchError((err as Error).message);
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleStartEditBranch = (b: AdminBranch) => {
    setEditingBranchId(b.id);
    setEditBranchName(b.name);
    setEditBranchCode(b.code);
    setEditBranchPhone(b.phone);
    setEditBranchAddress(b.address);
    setBranchError(null);
    setBranchSuccess(null);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranchId) return;
    setBranchError(null);
    setBranchSuccess(null);
    setIsSavingBranch(true);
    try {
      const res = await fetch("/api/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBranchId,
          name: editBranchName,
          code: editBranchCode,
          phone: editBranchPhone,
          address: editBranchAddress,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update branch");
      setBranchSuccess(`Branch "${editBranchName}" updated successfully.`);
      setEditingBranchId(null);
      fetchAdminBranches();
    } catch (err) {
      setBranchError((err as Error).message);
    } finally {
      setIsSavingBranch(false);
    }
  };

  const fetchStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const json = await res.json();
        setStaffList(json.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSuccess(null);

    if (!newStaffBranchId) {
      setStaffError("Please select a branch for the new staff member");
      return;
    }

    setIsCreatingStaff(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          username: newStaffUsername,
          password: newStaffPassword,
          branchId: newStaffBranchId,
          role: newStaffRole,
          phone: newStaffPhone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create staff member");
      }

      setStaffSuccess(`Technician "${newStaffName}" (@${newStaffUsername}) created successfully.`);
      setNewStaffName("");
      setNewStaffUsername("");
      setNewStaffPassword("");
      setNewStaffPhone("");
      fetchStaff();
    } catch (err) {
      setStaffError((err as Error).message);
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleResetStaffPassword = async (userId: string) => {
    if (!resetStaffPassword || resetStaffPassword.length < 8) {
      setStaffError("New password must be at least 8 characters");
      return;
    }
    setIsResettingStaff(true);
    setStaffError(null);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword: resetStaffPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reset password");
      setStaffSuccess(json.message || "Password updated");
      setResetStaffId(null);
      setResetStaffPassword("");
    } catch (err) {
      setStaffError((err as Error).message);
    } finally {
      setIsResettingStaff(false);
    }
  };

  const handleDeleteStaff = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete staff member "${name}"?`)) return;
    setStaffError(null);
    setStaffSuccess(null);
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete staff");
      setStaffSuccess(json.message || "Staff deleted");
      fetchStaff();
    } catch (err) {
      setStaffError((err as Error).message);
    }
  };

  const isStaffManagerOnly = currentUser?.role === "STAFF_MANAGER";
  const isSuperOrSubAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "SUB_ADMIN";

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    fetchStaff();
    fetchAdminBranches();
  }, [fetchStaff, fetchAdminBranches]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-sm">
        Aggregating multi-branch financial records...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center text-zinc-500 text-sm">
        Unable to load analytics.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Admin Operations & Financial Center
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                currentUser?.role === "SUB_ADMIN"
                  ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                  : isStaffManagerOnly
                  ? "bg-sky-100 text-sky-800 border-sky-200"
                  : "bg-purple-100 text-purple-800 border-purple-200"
              }`}
            >
              {currentUser?.role === "SUB_ADMIN"
                ? `Sub Admin (${currentUser.name || "Live"})`
                : isStaffManagerOnly
                ? "Operations & Analytics"
                : "Multi-Branch Live"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Auditing multi-branch stores (Logged in as {currentUser?.name || "Admin"}).
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm text-right">
              <span className="text-[11px] font-semibold text-zinc-500 block uppercase">
                Total Gross Revenue
              </span>
              <span className="text-xl font-black text-zinc-900">
                Rs {data.totalCompanyRevenue.toLocaleString()}
              </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 shadow-sm text-right">
              <span className="text-[11px] font-semibold text-emerald-700 block uppercase">
                Net Service Margin
              </span>
              <span className="text-xl font-black text-emerald-900">
                Rs {data.totalCompanyNetProfit.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-zinc-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === "overview"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Operations & Multi-Branch Live</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === "reports"
              ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Filterable Financial & Spares Reports</span>
        </button>
      </div>

      {activeTab === "overview" ? (
        <>
          {data && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Branch Performance & Net Profit Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.branchAnalytics.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start border-b border-zinc-100 pb-2">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-sm">{b.name}</h3>
                  <span className="text-xs font-mono text-zinc-500">
                    Code: {b.code}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                  {b.closureRate}% Closure
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Work Orders</span>
                  <span className="font-semibold">{b.totalJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Closed Cases</span>
                  <span className="font-semibold">{b.closedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Gross Revenue</span>
                  <span className="font-bold text-zinc-900">
                    Rs {b.grossRevenue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Wholesale Spares Cost</span>
                  <span className="font-mono text-zinc-600">
                    Rs {b.partsCost}
                  </span>
                </div>

                {b.outflowFee > 0 && (
                  <div className="flex justify-between text-purple-700">
                    <span>Inter-branch Outflow</span>
                    <span>- Rs {b.outflowFee}</span>
                  </div>
                )}

                {b.inflowFee > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Chip Repair Inflow</span>
                    <span>+ Rs {b.inflowFee}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-zinc-100 pt-2 font-bold text-sm">
                  <span>Net Margin</span>
                  <span className="text-emerald-600">Rs {b.netProfit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Staff & Service Technicians Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Staff & Service Technicians Management
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Add and manage technicians across branches with distinct role credentials and quick password resets.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 w-fit">
            {staffList.length} Active Staff Members
          </span>
        </div>

        {staffError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{staffError}</span>
          </div>
        )}

        {staffSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{staffSuccess}</span>
          </div>
        )}

        {/* Add Staff Form */}
        <form onSubmit={handleAddStaff} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
              Add New Service Technician / Branch Staff
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Anil Kumar"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Username (for sign in) *</label>
              <input
                type="text"
                required
                placeholder="e.g. anil_cok"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={newStaffUsername}
                onChange={(e) => setNewStaffUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Assigned Branch *</label>
              <select
                required
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={newStaffBranchId}
                onChange={(e) => setNewStaffBranchId(e.target.value)}
              >
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Staff Role *</label>
              <select
                required
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
              >
                <option value="INHOUSE_TECH">In-House Technician (Bench / Chip-Level)</option>
                <option value="FIELD_TECH">Field Technician (Doorstep Visits)</option>
                <option value="BRANCH_MANAGER">Branch Manager (Store Counter)</option>
                {currentUser?.role === "SUPER_ADMIN" && (
                  <>
                    <option value="SUB_ADMIN">Sub Admin (Administrative Access)</option>
                    <option value="STAFF_MANAGER">Staff Manager (Operations & Staff)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Phone Number (optional)</label>
              <input
                type="text"
                placeholder="+91 98470 xxxxx"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isCreatingStaff}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isCreatingStaff ? "Creating..." : "Create Technician Account"}</span>
            </button>
          </div>
        </form>

        {/* Existing Staff Directory */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
            Branch Staff Directory
          </h3>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-zinc-900">{s.name}</td>
                    <td className="py-3 px-3 font-mono text-zinc-600">@{s.username}</td>
                    <td className="py-3 px-3 font-semibold text-zinc-700">
                      {s.branch?.name} ({s.branch?.code})
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.role === "SUPER_ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : s.role === "SUB_ADMIN"
                          ? "bg-indigo-100 text-indigo-800"
                          : s.role === "STAFF_MANAGER"
                          ? "bg-sky-100 text-sky-800"
                          : s.role === "BRANCH_MANAGER"
                          ? "bg-blue-100 text-blue-800"
                          : s.role === "FIELD_TECH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {s.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-600">{s.phone || "-"}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {resetStaffId === s.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="password"
                              placeholder="New pass (min 8)"
                              className="w-24 bg-white border border-zinc-300 rounded p-1 text-[11px]"
                              value={resetStaffPassword}
                              onChange={(e) => setResetStaffPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              disabled={isResettingStaff}
                              onClick={() => handleResetStaffPassword(s.id)}
                              className="px-2 py-1 bg-zinc-900 hover:bg-black text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetStaffId(null);
                                setResetStaffPassword("");
                              }}
                              className="px-1.5 py-1 text-zinc-500 text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          currentUser?.role === "SUPER_ADMIN" && (
                            <button
                              type="button"
                              onClick={() => {
                                setResetStaffId(s.id);
                                setResetStaffPassword("");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100 text-[11px] font-semibold cursor-pointer"
                            >
                              <KeyRound className="w-3 h-3 text-zinc-500" />
                              <span>Reset Pass</span>
                            </button>
                          )
                        )}

                        {currentUser?.role === "SUPER_ADMIN" &&
                          s.role !== "SUPER_ADMIN" &&
                          s.role !== "SUB_ADMIN" &&
                          s.username !== "theerdha" &&
                          s.username !== "ctowaves" &&
                          s.username !== "ceowaves" &&
                          s.username !== "wavesceo" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(s.id, s.name)}
                              className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Remove staff member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Branch Network & Contact Numbers
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Add new branches, update branch codes, official helpline numbers, and workshop addresses.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 w-fit">
            {adminBranches.length} Operational Branches
          </span>
        </div>

        {branchError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{branchError}</span>
          </div>
        )}

        {branchSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{branchSuccess}</span>
          </div>
        )}

        {isSuperOrSubAdmin && (
          <form onSubmit={handleAddBranch} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
              Add New Branch Location
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Xattica Calicut"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Code (2-5 letters) *</label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="e.g. CLT"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newBranchCode}
                onChange={(e) => setNewBranchCode(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Helpline / Contact Number *</label>
              <input
                type="text"
                required
                placeholder="+91 98470 44444"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newBranchPhone}
                onChange={(e) => setNewBranchPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Address *</label>
              <input
                type="text"
                required
                placeholder="Mavoor Road, Calicut, Kerala"
                className="w-full bg-white border border-zinc-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newBranchAddress}
                onChange={(e) => setNewBranchAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isCreatingBranch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isCreatingBranch ? "Creating..." : "Add Branch"}</span>
            </button>
          </div>
        </form>
      )}

        {/* Operational Branches List & Edit */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide block">
            Configured Branches & Direct Numbers
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminBranches.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3"
              >
                {editingBranchId === b.id ? (
                  <form onSubmit={handleSaveBranch} className="space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                      <span className="font-bold text-zinc-900">Edit Branch Details</span>
                      <button
                        type="button"
                        onClick={() => setEditingBranchId(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-0.5 text-[11px]">Branch Name</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs font-semibold"
                          value={editBranchName}
                          onChange={(e) => setEditBranchName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-zinc-700 mb-0.5 text-[11px]">Branch Code</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs font-mono uppercase"
                          value={editBranchCode}
                          onChange={(e) => setEditBranchCode(e.target.value.toUpperCase())}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-0.5 text-[11px]">Contact Number</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs"
                        value={editBranchPhone}
                        onChange={(e) => setEditBranchPhone(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 mb-0.5 text-[11px]">Workshop Address</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-zinc-300 rounded p-1.5 text-xs"
                        value={editBranchAddress}
                        onChange={(e) => setEditBranchAddress(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingBranchId(null)}
                        className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 text-xs font-semibold hover:bg-zinc-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingBranch}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingBranch ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-zinc-900 text-sm">{b.name}</h3>
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                            {b.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>{b.phone}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-xs text-zinc-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{b.address}</span>
                        </div>
                      </div>

                      {isSuperOrSubAdmin && (
                        <button
                          type="button"
                          onClick={() => handleStartEditBranch(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {b._count && (
                      <div className="flex items-center gap-3 pt-3 mt-3 border-t border-zinc-200 text-[11px] text-zinc-500">
                        <span>Staff: <strong className="text-zinc-800">{b._count.users}</strong></span>
                        <span>Direct Jobs: <strong className="text-zinc-800">{b._count.originJobs}</strong></span>
                        <span>Repairs Done: <strong className="text-zinc-800">{b._count.servicingJobs}</strong></span>
                        <span>Stock Parts: <strong className="text-zinc-800">{b._count.stockItems}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border-2 border-red-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
            <h2 className="text-sm font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Overdue Repairs (&gt;7 Days Pending)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
              {data.overdueRepairs.length} Cases
            </span>
          </div>

          {data.overdueRepairs.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No repairs overdue beyond 7 days across branches.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto text-xs">
              {data.overdueRepairs.map((job) => {
                const days = Math.floor(
                  (Date.now() - new Date(job.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={job.id}
                    className="py-2.5 flex items-center justify-between hover:bg-zinc-50 px-2 rounded"
                  >
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-mono font-bold text-blue-600 hover:underline"
                      >
                        {job.jobNo}
                      </Link>
                      <p className="text-zinc-700 font-semibold mt-0.5">
                        {job.brand} {job.modelNumber} ({job.customer.name})
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {job.originBranch.name} | Tech:{" "}
                        {job.assignedTech?.name || "Unassigned"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold font-mono">
                        {days} Days Old
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border-2 border-orange-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
            <h2 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Credit Aging Board (5-Day Max Limit)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              {data.overdueCredits.length} Overdue / {data.activeCredits.length}{" "}
              Active
            </span>
          </div>

          {data.overdueCredits.length === 0 && data.activeCredits.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No outstanding customer credits.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto text-xs">
              {data.overdueCredits.map((c) => {
                const total =
                  c.serviceCharge +
                  c.partsUsed.reduce(
                    (s, p) => s + p.sellingPrice * p.quantity,
                    0
                  );
                return (
                  <div
                    key={c.id}
                    className="py-2.5 flex items-center justify-between bg-red-50/50 px-2 rounded mb-1 border border-red-200"
                  >
                    <div>
                      <Link
                        href={`/jobs/${c.id}`}
                        className="font-mono font-bold text-blue-600 hover:underline"
                      >
                        {c.jobNo}
                      </Link>
                      <p className="font-semibold text-zinc-900">
                        {c.customer.name} ({c.customer.phone})
                      </p>
                      <span className="text-[10px] text-red-700 font-bold">
                        Exceeded 5-Day Credit Window!
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-red-900 block font-mono">
                        Rs {total}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {c.originBranch.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {data.activeCredits.map((c) => (
                <div
                  key={c.id}
                  className="py-2 flex items-center justify-between px-2"
                >
                  <div>
                    <Link
                      href={`/jobs/${c.id}`}
                      className="font-mono font-bold text-blue-600 hover:underline"
                    >
                      {c.jobNo}
                    </Link>
                    <p className="text-zinc-700">{c.customer.name}</p>
                  </div>
                  <span className="text-orange-700 text-xs font-semibold">
                    Due:{" "}
                    {c.creditDueDate
                      ? new Date(c.creditDueDate).toLocaleDateString()
                      : "Within 5d"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border-2 border-zinc-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-zinc-900" />
            30-Day Abandoned Hardware Disposal Register
          </h2>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-white text-xs font-bold">
            {data.abandonedHardware.length} Disposals Due
          </span>
        </div>

        {data.abandonedHardware.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            No equipment left uncollected beyond 30 days.
          </p>
        ) : (
          <div className="divide-y divide-zinc-200 text-xs">
            {data.abandonedHardware.map((j) => (
              <div
                key={j.id}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-red-700">
                    {j.jobNo}
                  </span>
                  <p className="font-semibold text-zinc-900">
                    {j.brand} {j.modelNumber} - Customer: {j.customer.name} (
                    {j.customer.phone})
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Branch: {j.originBranch.name} | Completed on:{" "}
                    {new Date(j.closedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-red-600 text-white font-bold rounded text-xs uppercase tracking-wider">
                    Eligible For Scrap Disposal
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
            <Cpu className="w-4 h-4 text-blue-600" />
            Brand Issue Frequency
          </h2>

          <div className="space-y-2 text-xs">
            {data.topBrands.map((b, i) => (
              <div
                key={b.brand}
                className="flex items-center justify-between p-2 rounded bg-zinc-50"
              >
                <span className="font-semibold text-zinc-800">
                  {i + 1}. {b.brand}
                </span>
                <span className="font-bold text-blue-600 font-mono">
                  {b.count} Repairs
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
            <Flame className="w-4 h-4 text-amber-600" />
            Most Common Service Complaints
          </h2>

          <div className="space-y-2 text-xs">
            {data.topComplaints.map((c, i) => (
              <div
                key={c.complaint}
                className="flex items-center justify-between p-2 rounded bg-zinc-50"
              >
                <span className="font-semibold text-zinc-800 truncate max-w-[200px]">
                  {i + 1}. {c.complaint}
                </span>
                <span className="font-bold text-amber-600 font-mono">
                  {c.count} Jobs
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Technician Productivity & Revenue
          </h2>

          <div className="space-y-2 text-xs">
            {data.technicianRanking.map((t) => (
              <div
                key={t.name}
                className="p-2 rounded bg-zinc-50 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-zinc-900 block">{t.name}</span>
                  <span className="text-[10px] text-zinc-500">
                    {t.branchName} ({t.closed}/{t.total} closed)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 font-mono block">
                    Rs {t.revenue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  Financial & Performance Report Filter
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Filter by month or custom dates, branch, and technician to audit service charges and wholesale spares margins.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={!reportData || reportData.jobs.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={fetchReport}
                  disabled={isLoadingReport}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoadingReport ? "Loading..." : "Apply Filter"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Time Period
                </label>
                <div className="space-y-1.5">
                  <select
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={reportUseCustomDate ? "custom" : reportMonth}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setReportUseCustomDate(true);
                      } else {
                        setReportUseCustomDate(false);
                        setReportMonth(e.target.value);
                      }
                    }}
                  >
                    <option value="custom">Custom Date Range...</option>
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  {reportUseCustomDate && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">From</span>
                        <input
                          type="date"
                          className="w-full bg-white border border-zinc-300 rounded p-1 text-[11px]"
                          value={reportFromDate}
                          onChange={(e) => setReportFromDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">To</span>
                        <input
                          type="date"
                          className="w-full bg-white border border-zinc-300 rounded p-1 text-[11px]"
                          value={reportToDate}
                          onChange={(e) => setReportToDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Branch Filter
                </label>
                <select
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={reportBranchId}
                  onChange={(e) => {
                    setReportBranchId(e.target.value);
                    setReportTechId("");
                  }}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Technician Filter
                </label>
                <select
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={reportTechId}
                  onChange={(e) => setReportTechId(e.target.value)}
                >
                  <option value="">All Technicians</option>
                  {availableTechs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.branch.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Job Search
                </label>
                <input
                  type="text"
                  placeholder="Filter by Job # or Customer..."
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={reportJobSearch}
                  onChange={(e) => setReportJobSearch(e.target.value)}
                />
              </div>
            </div>

            {reportError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{reportError}</span>
              </div>
            )}
          </div>

          {isLoadingReport && (
            <div className="py-16 text-center text-zinc-500 text-xs">
              Calculating service charges, wholesale spares costs, and branch metrics...
            </div>
          )}

          {!isLoadingReport && reportData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-zinc-500 block uppercase">
                    Service Labor
                  </span>
                  <span className="text-lg font-black text-zinc-900 block mt-1">
                    Rs {reportData.summary.totalServiceCharge.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    {reportData.summary.totalJobs} Cases ({reportData.summary.closedJobs} Closed)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-zinc-500 block uppercase">
                    Spares Billed
                  </span>
                  <span className="text-lg font-black text-blue-700 block mt-1">
                    Rs {reportData.summary.totalSparesBilled.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    Gross billed to customers
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-zinc-500 block uppercase">
                    Spares Wholesale Cost
                  </span>
                  <span className="text-lg font-black text-amber-700 block mt-1">
                    Rs {reportData.summary.totalSparesCost.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    Parts landing expense
                  </span>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-emerald-800 block uppercase">
                    Spares Net Margin
                  </span>
                  <span className="text-lg font-black text-emerald-900 block mt-1">
                    Rs {reportData.summary.totalSparesMargin.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    Parts gross profit
                  </span>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-purple-800 block uppercase">
                    Net Realized Revenue
                  </span>
                  <span className="text-lg font-black text-purple-900 block mt-1">
                    Rs {reportData.summary.totalNetRevenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-purple-700 block mt-0.5">
                    Labor + Spares margin
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Branch-Wise Financial & Spares Breakup
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 font-bold">Branch</th>
                        <th className="py-2.5 px-3 font-bold text-center">Jobs</th>
                        <th className="py-2.5 px-3 font-bold text-right">Service Charges</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spares Billed</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spares Cost</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spares Margin</th>
                        <th className="py-2.5 px-3 font-bold text-right">Inter-Branch Fee</th>
                        <th className="py-2.5 px-3 font-bold text-right">Net Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono">
                      {reportData.branchBreakup.map((b) => (
                        <tr key={b.id} className="hover:bg-zinc-50">
                          <td className="py-2.5 px-3 font-sans font-bold text-zinc-900">
                            {b.name} <span className="text-zinc-400 font-normal">({b.code})</span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-zinc-700 font-sans">
                            {b.totalJobs} <span className="text-zinc-400 text-[11px]">({b.closedJobs} closed)</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-900">
                            Rs {b.serviceCharge.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-blue-700">
                            Rs {b.sparesBilled.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-700">
                            Rs {b.sparesCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                            Rs {b.sparesMargin.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-purple-700">
                            {b.transferCredit - b.transferDebit >= 0 ? "+" : ""}
                            Rs {(b.transferCredit - b.transferDebit).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-zinc-900">
                            Rs {b.netRevenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-zinc-200 bg-zinc-50 font-bold text-zinc-900 font-mono">
                        <td className="py-2.5 px-3 font-sans">Total</td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          {reportData.summary.totalJobs} ({reportData.summary.closedJobs} closed)
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          Rs {reportData.summary.totalServiceCharge.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-blue-700">
                          Rs {reportData.summary.totalSparesBilled.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700">
                          Rs {reportData.summary.totalSparesCost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700">
                          Rs {reportData.summary.totalSparesMargin.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-purple-700">Rs 0</td>
                        <td className="py-2.5 px-3 text-right text-black font-black">
                          Rs {reportData.summary.totalNetRevenue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Technician-Wise Productivity & Revenue Contribution
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 font-bold">Technician</th>
                        <th className="py-2.5 px-3 font-bold">Branch</th>
                        <th className="py-2.5 px-3 font-bold text-center">Cases</th>
                        <th className="py-2.5 px-3 font-bold text-right">Service Charges</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spares Billed</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spares Cost</th>
                        <th className="py-2.5 px-3 font-bold text-right">Net Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono">
                      {reportData.technicianBreakup.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-50">
                          <td className="py-2.5 px-3 font-sans font-bold text-zinc-900">
                            {t.name}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-zinc-600">
                            {t.branchName}
                          </td>
                          <td className="py-2.5 px-3 text-center text-zinc-700 font-sans">
                            {t.totalJobs} <span className="text-zinc-400 text-[11px]">({t.closedJobs} closed)</span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-900">
                            Rs {t.serviceCharge.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-blue-700">
                            Rs {t.sparesBilled.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-700">
                            Rs {t.sparesCost.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                            Rs {t.netContribution.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                    Service Jobs Register ({reportData.jobs.length} Records)
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Click any Job # to inspect card
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto border border-zinc-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-zinc-100 text-zinc-700 text-[11px] uppercase tracking-wider z-10">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Job #</th>
                        <th className="py-2.5 px-3 font-bold">Date</th>
                        <th className="py-2.5 px-3 font-bold">Branch</th>
                        <th className="py-2.5 px-3 font-bold">Customer</th>
                        <th className="py-2.5 px-3 font-bold">Device</th>
                        <th className="py-2.5 px-3 font-bold">Tech</th>
                        <th className="py-2.5 px-3 font-bold">Status</th>
                        <th className="py-2.5 px-3 font-bold text-right">Service (Rs)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Spares (Rs)</th>
                        <th className="py-2.5 px-3 font-bold text-right">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono">
                      {reportData.jobs
                        .filter(
                          (j) =>
                            !reportJobSearch ||
                            j.jobNo.toLowerCase().includes(reportJobSearch.toLowerCase()) ||
                            j.customerName.toLowerCase().includes(reportJobSearch.toLowerCase()) ||
                            j.deviceSummary.toLowerCase().includes(reportJobSearch.toLowerCase())
                        )
                        .map((j) => (
                          <tr key={j.id} className="hover:bg-zinc-50">
                            <td className="py-2 px-3 font-sans">
                              <Link
                                href={`/jobs/${j.id}`}
                                className="font-bold text-blue-600 hover:underline"
                              >
                                {j.jobNo}
                              </Link>
                            </td>
                            <td className="py-2 px-3 text-[11px] text-zinc-500 font-sans">
                              {new Date(j.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 text-zinc-700 font-sans">
                              {j.originBranchCode}
                              {j.servicingBranchName && ` → ${j.servicingBranchName.split(" ")[1] || "SRV"}`}
                            </td>
                            <td className="py-2 px-3 text-zinc-900 font-sans font-medium">
                              {j.customerName}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 font-sans text-[11px]">
                              {j.deviceSummary}
                            </td>
                            <td className="py-2 px-3 text-zinc-700 font-sans">
                              {j.assignedTechName}
                            </td>
                            <td className="py-2 px-3 font-sans">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
                                {j.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right text-zinc-900">
                              {j.serviceCharge}
                            </td>
                            <td className="py-2 px-3 text-right text-blue-700">
                              {j.sparesBilled}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-emerald-700">
                              Rs {j.netProfit}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
