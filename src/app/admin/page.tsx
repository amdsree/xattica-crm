"use client";

import React, { useState, useEffect } from "react";
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

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

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
