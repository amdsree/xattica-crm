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
    if (!resetStaffPassword || resetStaffPassword.length < 6) {
      setStaffError("New password must be at least 6 characters");
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
  }, [fetchStaff]);

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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Multi-Branch Live
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Auditing Kollam, Kottayam, Cochin, and Calicut stores.
          </p>
        </div>

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
      </div>

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
                          : s.role === "BRANCH_MANAGER"
                          ? "bg-blue-100 text-blue-800"
                          : s.role === "FIELD_TECH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {s.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-600">{s.phone || "—"}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {resetStaffId === s.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="password"
                              placeholder="New pass"
                              className="w-24 bg-white border border-zinc-300 rounded p-1 text-[11px]"
                              value={resetStaffPassword}
                              onChange={(e) => setResetStaffPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              disabled={isResettingStaff}
                              onClick={() => handleResetStaffPassword(s.id)}
                              className="px-2 py-1 bg-zinc-900 hover:bg-black text-white rounded text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetStaffId(null);
                                setResetStaffPassword("");
                              }}
                              className="px-1.5 py-1 text-zinc-500 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setResetStaffId(s.id);
                              setResetStaffPassword("");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-100 text-[11px] font-semibold"
                          >
                            <KeyRound className="w-3 h-3 text-zinc-500" />
                            <span>Reset Pass</span>
                          </button>
                        )}

                        {s.role !== "SUPER_ADMIN" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(s.id, s.name)}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors"
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
    </div>
  );
}
