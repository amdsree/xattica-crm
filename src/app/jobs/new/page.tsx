"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { COMPLAINT_CATEGORIES, POPULAR_BRANDS } from "@/types";
import {
  Wrench,
  Smartphone,
  Laptop,
  CheckCircle,
  Clock,
  IndianRupee,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const { currentUser, branches } = useAuth();
  const [branchStaff, setBranchStaff] = useState<Array<{ id: string; name: string; role: string; branchId: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [serviceType, setServiceType] = useState<"WALKIN" | "FIELD">("WALKIN");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [assignedTechId, setAssignedTechId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [deviceType, setDeviceType] = useState("Laptop");
  const [brand, setBrand] = useState("Lenovo");
  const [customBrand, setCustomBrand] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [physicalCondition, setPhysicalCondition] = useState("");

  const [complaintCategory, setComplaintCategory] = useState<string>(
    COMPLAINT_CATEGORIES[0]
  );
  const [additionalIssues, setAdditionalIssues] = useState("");
  const [isWarranty, setIsWarranty] = useState(false);

  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedSpareCost, setEstimatedSpareCost] = useState("");
  const [tatDays, setTatDays] = useState("2");

  React.useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setBranchStaff(data.users || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadStaff();
  }, []);

  React.useEffect(() => {
    if (currentUser?.branch?.id) {
      setSelectedBranchId(currentUser.branch.id);
    }
    if (currentUser?.id) {
      setAssignedTechId(currentUser.id);
    }
  }, [currentUser]);

  const effectiveBrand = brand === "Other" ? customBrand : brand;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!customerName || !customerPhone || !serialNumber || !modelNumber) {
        throw new Error("Please fill in all mandatory customer and device fields.");
      }

      const payload = {
        originBranchId: selectedBranchId || currentUser?.branch?.id,
        assignedTechId: assignedTechId || currentUser?.id,
        customerName,
        customerPhone,
        customerAddress,
        deviceType,
        brand: effectiveBrand,
        modelNumber,
        serialNumber,
        physicalCondition,
        complaintDescription: complaintCategory,
        additionalIssues,
        isWarranty,
        estimatedCost,
        estimatedSpareCost,
        tatDays,
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create jobsheet");
      }

      const job = await res.json();
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const branchUsers = branchStaff.filter(
    (u) => u.branchId === (selectedBranchId || currentUser?.branch?.id)
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Create Service Jobsheet
          </h1>
          <p className="text-sm text-zinc-500">
            Intake intake register for walk-in and on-site field service jobs.
          </p>
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
          <button
            type="button"
            onClick={() => setServiceType("WALKIN")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              serviceType === "WALKIN"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Walk-in Customer
          </button>
          <button
            type="button"
            onClick={() => setServiceType("FIELD")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              serviceType === "FIELD"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Field On-site Service
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 border-b pb-3 border-zinc-100">
            <Building2Icon className="w-4 h-4 text-blue-600" />
            Branch and Assigned Technician
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Receiving Branch
              </label>
              <select
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={selectedBranchId}
                disabled={currentUser?.role !== "SUPER_ADMIN"}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Assigned Technician
              </label>
              <select
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={assignedTechId}
                onChange={(e) => setAssignedTechId(e.target.value)}
              >
                {branchUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 border-b pb-3 border-zinc-100">
            <FileText className="w-4 h-4 text-blue-600" />
            Customer Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Thomas Mathew"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9847012345"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Customer Address {serviceType === "FIELD" && "(Required for Field Visit)"}
              </label>
              <input
                type="text"
                placeholder="Door No, Street, Landmark, Area"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 border-b pb-3 border-zinc-100">
            <Laptop className="w-4 h-4 text-blue-600" />
            Hardware & Device Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Device Category
              </label>
              <select
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop PC">Desktop PC</option>
                <option value="All-in-One PC">All-in-One PC</option>
                <option value="Server / IT Asset">Server / IT Asset</option>
                <option value="Printer / Peripheral">Printer / Peripheral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Brand *
              </label>
              <select
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                {POPULAR_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {brand === "Other" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Specify Brand
                </label>
                <input
                  type="text"
                  placeholder="Brand name"
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Model Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. IdeaPad 3 15ACH6"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MP2184X9"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-800">
                <input
                  type="checkbox"
                  checked={isWarranty}
                  onChange={(e) => setIsWarranty(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Under Manufacturer Warranty
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Physical Condition Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bottom screws missing, minor scratch on lid, display hinges tight"
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={physicalCondition}
              onChange={(e) => setPhysicalCondition(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 border-b pb-3 border-zinc-100">
            <Wrench className="w-4 h-4 text-blue-600" />
            Complaint & Scope of Service
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Primary Complaint Category (Dropdown) *
            </label>
            <select
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={complaintCategory}
              onChange={(e) => setComplaintCategory(e.target.value)}
            >
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Additional Issues Reported By Customer
            </label>
            <textarea
              rows={2}
              placeholder="Customer notes, backup required, intermittent symptoms, power adapter submitted"
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={additionalIssues}
              onChange={(e) => setAdditionalIssues(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 border-b pb-3 border-zinc-100">
            <IndianRupee className="w-4 h-4 text-blue-600" />
            Estimates and Delivery TAT
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Estimated Service Charge (Rs)
              </label>
              <input
                type="number"
                placeholder="e.g. 800"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Estimated Spare Cost (Rs)
              </label>
              <input
                type="number"
                placeholder="e.g. 2500"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={estimatedSpareCost}
                onChange={(e) => setEstimatedSpareCost(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Estimated TAT (Days)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 2"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={tatDays}
                onChange={(e) => setTatDays(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-zinc-300 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {isSubmitting ? "Generating Jobsheet..." : "Generate Service Jobsheet"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
