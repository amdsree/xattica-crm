"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  PlusCircle,
  LayoutDashboard,
  Wrench,
  Building2,
  LogOut,
  KeyRound,
} from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    branches,
    adminBranchView,
    switchAdminBranch,
    logout,
    isLoading,
  } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  if (isLoading || !currentUser) {
    return (
      <header className="border-b border-zinc-200 bg-white h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-200 animate-pulse rounded" />
          <span className="font-bold text-sm text-zinc-400">Loading Xattica CRM...</span>
        </div>
      </header>
    );
  }

  const canAccessAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "SUB_ADMIN" ||
    currentUser.role === "STAFF_MANAGER";

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-sm flex-shrink-0">
                <Image
                  src="/xattica-logo.jpg"
                  alt="Xattica Logo"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-zinc-900 block leading-tight">
                  XATTICA
                </span>
                <span className="text-[10px] text-red-600 font-bold tracking-wide uppercase block">
                  Premier PC Builder In Kerala
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" />
                  Jobs Queue
                </span>
              </Link>

              <Link
                href="/jobs/new"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/jobs/new"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                  <PlusCircle className="w-4 h-4" />
                  New Jobsheet
                </span>
              </Link>

              {canAccessAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/admin"
                      ? "bg-zinc-100 text-zinc-900 font-bold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4 text-purple-600" />
                    Admin Center
                  </span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-zinc-100 border border-zinc-300 px-3 py-1.5 rounded-lg text-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                  Signed in as
                </span>
                <span className="font-bold text-zinc-900">
                  {currentUser.name} ({currentUser.branch?.code || currentUser.role.replace("_", " ")})
                </span>
              </div>
            </div>

            {canAccessAdmin && (
              <div className="hidden lg:flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg text-xs">
                <span className="text-purple-700 font-bold text-[10px] uppercase">
                  Scope:
                </span>
                <select
                  className="bg-transparent font-semibold text-purple-900 focus:outline-none cursor-pointer"
                  value={adminBranchView || ""}
                  onChange={(e) => switchAdminBranch(e.target.value || null)}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
}
