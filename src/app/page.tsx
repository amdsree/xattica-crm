"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  Wrench,
  Search,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Share2,
  ArrowRightLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface JobPart {
  id: string;
  partName: string;
  sellingPrice: number;
  landingPrice: number;
  quantity: number;
}

interface JobSheet {
  id: string;
  jobNo: string;
  originBranchId: string;
  servicingBranchId?: string | null;
  originBranch: { id: string; name: string; code: string };
  servicingBranch?: { id: string; name: string; code: string } | null;
  customer: { name: string; phone: string; address?: string | null };
  assignedTech?: { name: string } | null;
  deviceType: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  complaintDescription: string;
  physicalCondition: string;
  isWarranty: boolean;
  status: string;
  tatDate?: string | null;
  estimatedCost?: number | null;
  estimatedSpareCost?: number | null;
  serviceCharge: number;
  paymentStatus: string;
  closedOutcome?: string | null;
  partsUsed: JobPart[];
  createdAt: string;
  closedAt?: string | null;
}

export default function JobsQueuePage() {
  const { currentUser, branches } = useAuth();
  const [jobs, setJobs] = useState<JobSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const fetchJobs = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      // Non-admin scope is derived from the session on the server; only a
      // super admin may ask for a specific branch.
      if (currentUser.role === "SUPER_ADMIN" && selectedBranchId) {
        params.append("branchId", selectedBranchId);
      }
      if (search) params.append("search", search);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedBranchId, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "IN_PROGRESS") {
      return ["RECEIVED", "ASSIGNED", "DIAGNOSIS_WIP"].includes(j.status);
    }
    if (statusFilter === "APPROVAL_PENDING") {
      return j.status === "APPROVAL_PENDING";
    }
    if (statusFilter === "INTER_BRANCH") {
      return [
        "TRANSFER_IN_TRANSIT",
        "TRANSFER_WIP",
        "TRANSFER_QA",
      ].includes(j.status);
    }
    if (statusFilter === "OVERDUE") {
      return !j.closedAt && new Date(j.createdAt) < sevenDaysAgo;
    }
    if (statusFilter === "CLOSED") {
      return Boolean(j.closedAt);
    }
    return true;
  });

  const overdueCount = jobs.filter(
    (j) => !j.closedAt && new Date(j.createdAt) < sevenDaysAgo
  ).length;

  const approvalCount = jobs.filter(
    (j) => j.status === "APPROVAL_PENDING"
  ).length;

  const inProgressCount = jobs.filter((j) =>
    ["RECEIVED", "ASSIGNED", "DIAGNOSIS_WIP", "TRANSFER_WIP"].includes(j.status)
  ).length;

  const closedCount = jobs.filter((j) => Boolean(j.closedAt)).length;

  const getStatusBadge = (status: string, createdAt: string, closedAt?: string | null) => {
    const isOverdue = !closedAt && new Date(createdAt) < sevenDaysAgo;

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3 h-3" />
          OVERDUE (&gt;7d)
        </span>
      );
    }

    switch (status) {
      case "RECEIVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
            Intake Received
          </span>
        );
      case "ASSIGNED":
      case "DIAGNOSIS_WIP":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            In Progress
          </span>
        );
      case "APPROVAL_PENDING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Approval Pending
          </span>
        );
      case "TRANSFER_IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ArrowRightLeft className="w-3 h-3" />
            Transfer In Transit
          </span>
        );
      case "TRANSFER_WIP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Wrench className="w-3 h-3" />
            Servicing at Branch
          </span>
        );
      case "TRANSFER_QA":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <ArrowRightLeft className="w-3 h-3" />
            Returning to Origin
          </span>
        );
      case "READY_FOR_DELIVERY":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Ready for Delivery
          </span>
        );
      case "DELIVERED_PAID":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-800">
            Delivered & Paid
          </span>
        );
      case "DELIVERED_CREDIT":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            Credit (5-Day Aging)
          </span>
        );
      case "NON_REPAIRABLE":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
            Non Repairable
          </span>
        );
      case "RETURNED_UNREPAIRED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
            Returned No Service
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Service Jobs Queue
            </h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {currentUser?.role === "SUPER_ADMIN"
                ? "Admin View: All Branches"
                : `Branch: ${currentUser?.branch?.name}`}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            Track and process PC, laptop, and field IT service work orders.
          </p>
        </div>

        <Link
          href="/jobs/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create Jobsheet
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{inProgressCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Overdue (&gt;7 Days)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{overdueCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Approval Pending</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{approvalCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Closed Cases</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{closedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Job #, phone, customer, or serial..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {currentUser?.role === "SUPER_ADMIN" && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-500" />
              <select
                className="bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="">All 4 Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-zinc-100 text-xs font-semibold">
          {[
            { id: "ALL", label: `All (${jobs.length})` },
            { id: "IN_PROGRESS", label: `In Progress (${inProgressCount})` },
            { id: "APPROVAL_PENDING", label: `Waiting Approval (${approvalCount})` },
            { id: "INTER_BRANCH", label: "Inter-Branch Queue" },
            { id: "OVERDUE", label: `Overdue >7d (${overdueCount})` },
            { id: "CLOSED", label: `Closed (${closedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            Loading service jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No service jobs found matching the current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Job ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Device & Serial</th>
                  <th className="py-3 px-3">Complaint</th>
                  <th className="py-3 px-3">Branch & Tech</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Age / TAT</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredJobs.map((job) => {
                  const createdDate = new Date(job.createdAt);
                  const daysOld = Math.floor(
                    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-zinc-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.jobNo}
                        </Link>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-zinc-900">
                          {job.customer.name}
                        </p>
                        <p className="text-zinc-500">{job.customer.phone}</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-zinc-900">
                          {job.brand} {job.modelNumber}
                        </p>
                        <p className="text-zinc-500 font-mono">
                          SN: {job.serialNumber}
                        </p>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-medium text-zinc-900 truncate">
                          {job.complaintDescription}
                        </p>
                        {job.isWarranty && (
                          <span className="text-[10px] text-emerald-600 font-bold block">
                            Warranty Case
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-zinc-900">
                            {job.originBranch.code}
                          </span>
                          {job.servicingBranch &&
                            job.servicingBranch.id !== job.originBranchId && (
                              <span className="text-purple-600 font-bold">
                                -&gt; {job.servicingBranch.code}
                              </span>
                            )}
                        </div>
                        <p className="text-zinc-500 truncate">
                          {job.assignedTech?.name || "Unassigned"}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        {getStatusBadge(job.status, job.createdAt, job.closedAt)}
                      </td>

                      <td className="py-3 px-3 text-zinc-500">
                        <p className="font-medium text-zinc-900">
                          {daysOld === 0 ? "Today" : `${daysOld}d old`}
                        </p>
                        {job.tatDate && (
                          <p className="text-[10px]">
                            TAT: {new Date(job.tatDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md font-semibold transition-colors"
                        >
                          View
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
