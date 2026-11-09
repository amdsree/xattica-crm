"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock, User, AlertCircle, ArrowRight, KeyRound, CheckCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Admin Recovery State
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      window.location.href = "/";
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newAdminPassword !== confirmAdminPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newAdminPassword.length < 8) {
      setError("New admin password must be at least 8 characters");
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryKey, newPassword: newAdminPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      setSuccess("Super Admin password successfully reset. You can now sign in.");
      setShowRecovery(false);
      setUsername("admin");
      setPassword("");
      setRecoveryKey("");
      setNewAdminPassword("");
      setConfirmAdminPassword("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black mx-auto shadow-2xl border border-zinc-800 p-1 flex items-center justify-center">
          <Image
            src="/xattica-logo.jpg"
            alt="Xattica Logo"
            width={76}
            height={76}
            className="object-cover rounded-xl"
            priority
          />
        </div>
        <h1 className="text-3xl font-black tracking-wider text-white">
          XATTICA
        </h1>
        <p className="text-xs font-bold tracking-widest text-red-500 uppercase">
          Premier PC Builder In Kerala
        </p>
        <p className="text-xs text-zinc-400">
          Multibranch Service CRM (Kollam, Kottayam, Cochin, Calicut)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-zinc-800 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 flex items-center gap-2 text-red-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!showRecovery ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    id="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter username"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? "Signing in..." : "Sign In to Branch Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowRecovery(true);
                  }}
                  className="text-xs text-zinc-400 hover:text-red-400 transition-colors inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Forgot Admin Password? (Master Key Reset)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-zinc-800/80 rounded-lg border border-zinc-700 text-xs text-zinc-300 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-red-500" />
                  Admin Emergency Recovery
                </span>
                <p className="text-[11px] text-zinc-400">
                  Enter your lengthy Master Recovery Key to reset the Super Admin password. Protected by active rate limiting.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Master Recovery Key *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Paste lengthy admin master recovery key"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  New Admin Password (min 8 characters) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Enter new admin password"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Confirm New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirm new admin password"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowRecovery(false);
                  }}
                  className="w-1/3 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-2/3 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  {isResetting ? "Verifying..." : "Reset Admin Password"}
                </button>
              </div>
            </form>
          )}

          <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
            Access is restricted to Xattica staff. Contact your branch manager
            if you cannot sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
