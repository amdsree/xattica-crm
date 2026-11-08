"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";

interface JobSheet {
  id: string;
  jobNo: string;
  originBranch: { name: string; code: string; phone: string; address: string };
  customer: { name: string; phone: string; address?: string | null };
  intakeStaff: { name: string };
  assignedTech?: { name: string } | null;
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
  estimatedCost?: number | null;
  estimatedSpareCost?: number | null;
  createdAt: string;
}

export default function PrintJobsheetPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<JobSheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (res.ok) {
          const data = await res.json();
          setJob(data);
        }
      } catch (err) {
        console.error("Failed to load jobsheet for print", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-sm">Preparing document for print...</div>;
  }

  if (!job) {
    return <div className="p-8 text-center text-sm">Jobsheet not found.</div>;
  }

  return (
    <div className="bg-white min-h-screen text-black p-8 font-sans">
      <div className="max-w-3xl mx-auto border-2 border-black p-6 space-y-6 print:border-none print:p-0">
        <div className="flex justify-between items-center print:hidden mb-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded font-bold text-sm shadow hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            Print to Paper / PDF (A4)
          </button>
          <span className="text-xs text-zinc-500">
            Ensure printer scale is set to Default / Fit to Page
          </span>
        </div>

        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
              <Image
                src="/xattica-logo.jpg"
                alt="Xattica Logo"
                width={56}
                height={56}
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none">XATTICA</h1>
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-600 mt-0.5">
                Premier PC Builder In Kerala
              </p>
              <p className="text-xs mt-1 font-medium text-zinc-800">
                {job.originBranch.name} | {job.originBranch.address}
              </p>
              <p className="text-xs font-bold">Helpline: {job.originBranch.phone}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider mb-1">
              Customer Service Jobsheet
            </span>
            <p className="text-xl font-mono font-black">{job.jobNo}</p>
            <p className="text-xs text-zinc-600">
              Date: {new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-black p-3 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-zinc-600 block mb-1">
              Customer Details
            </span>
            <p className="font-black text-sm">{job.customer.name}</p>
            <p className="font-mono font-bold mt-0.5">{job.customer.phone}</p>
            {job.customer.address && (
              <p className="text-zinc-700 mt-1">{job.customer.address}</p>
            )}
          </div>

          <div className="border-l border-zinc-300 pl-4">
            <span className="font-bold uppercase tracking-wider text-zinc-600 block mb-1">
              Service Intake Info
            </span>
            <p>
              <span className="font-semibold">Intake Staff:</span> {job.intakeStaff.name}
            </p>
            <p>
              <span className="font-semibold">Assigned Tech:</span>{" "}
              {job.assignedTech?.name || "Service Desk"}
            </p>
            <p>
              <span className="font-semibold">Warranty:</span>{" "}
              {job.isWarranty ? "In Manufacturer Warranty" : "Out of Warranty"}
            </p>
          </div>
        </div>

        <div className="border border-black p-3 space-y-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-zinc-600 block">
            Hardware Description & Reported Complaints
          </span>

          <div className="grid grid-cols-3 gap-2 bg-zinc-50 p-2 border border-zinc-200">
            <div>
              <span className="text-zinc-500 font-semibold block text-[10px]">
                Device Category
              </span>
              <span className="font-bold">{job.deviceType}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-semibold block text-[10px]">
                Brand & Model
              </span>
              <span className="font-bold">
                {job.brand} {job.modelNumber}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 font-semibold block text-[10px]">
                Serial Number
              </span>
              <span className="font-mono font-bold">{job.serialNumber}</span>
            </div>
          </div>

          <div>
            <span className="font-semibold text-zinc-700 block">
              Physical Condition Upon Receipt:
            </span>
            <p className="font-medium bg-zinc-50 p-2 border border-zinc-200 mt-0.5">
              {job.physicalCondition}
            </p>
          </div>

          <div>
            <span className="font-semibold text-zinc-700 block">
              Reported Symptoms / Required Service:
            </span>
            <p className="font-bold bg-zinc-50 p-2 border border-zinc-200 mt-0.5">
              {job.complaintDescription}
            </p>
            {job.additionalIssues && (
              <p className="text-zinc-700 text-xs mt-1 pl-1">
                Additional Notes: {job.additionalIssues}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border border-black p-3 text-center text-xs">
          <div>
            <span className="text-zinc-500 font-semibold block text-[10px]">
              Estimated Service Cost
            </span>
            <span className="font-black text-sm">
              Rs {job.estimatedCost || 0}
            </span>
          </div>
          <div className="border-x border-zinc-300">
            <span className="text-zinc-500 font-semibold block text-[10px]">
              Estimated Spares Cost
            </span>
            <span className="font-black text-sm">
              Rs {job.estimatedSpareCost || 0}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 font-semibold block text-[10px]">
              Target Delivery TAT
            </span>
            <span className="font-black text-sm">
              {job.tatDate
                ? new Date(job.tatDate).toLocaleDateString()
                : "2 Working Days"}
            </span>
          </div>
        </div>

        <div className="border-2 border-black p-3 text-[10px] space-y-1.5 leading-tight">
          <span className="font-bold uppercase tracking-wider block text-xs underline">
            Terms & Conditions of Service
          </span>
          <p>
            1. <strong>Customer Data Disclaimer:</strong> Customers are advised
            to back up all personal data before handing over the device. Xattica
            is not liable for data loss during repair or software procedures.
          </p>
          <p>
            2. <strong>30-Day Abandonment & Scrap Disposal Clause:</strong> Any
            repaired, non-repairable, or inspected equipment not collected by
            the customer within thirty (30) days from notification will be
            disposed of as electronic scrap without further notice. The customer
            expressly forfeits all ownership and claims upon expiry of 30 days.
          </p>
          <p>
            3. <strong>Estimate Revisions:</strong> Final charges may vary if
            internal motherboard faults are discovered during diagnostics. Work
            will proceed only upon customer confirmation.
          </p>
          <p>
            4. Original jobsheet slip must be presented at the time of delivery.
          </p>
        </div>

        <div className="pt-8 flex justify-between items-end text-xs">
          <div className="text-center w-64 border-t border-black pt-2">
            <span className="font-bold block">Customer Signature</span>
            <span className="text-[10px] text-zinc-500 block">
              (I accept the physical condition & 30-day terms)
            </span>
          </div>

          <div className="text-center w-64 border-t border-black pt-2">
            <span className="font-bold block">Authorized Signatory</span>
            <span className="text-[10px] text-zinc-500 block">
              For Xattica {job.originBranch.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
