"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export interface Branch {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: "SUPER_ADMIN" | "BRANCH_MANAGER" | "INHOUSE_TECH" | "FIELD_TECH";
  branchId: string;
  phone?: string | null;
  branch: Branch;
}

interface AuthContextType {
  currentUser: User | null;
  branches: Branch[];
  adminBranchView: string | null;
  isLoading: boolean;
  switchAdminBranch: (branchId: string | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [adminBranchView, setAdminBranchView] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The session is whatever the signed httpOnly cookie says it is.
  const initAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user ?? null);
      setBranches(data.branches ?? []);
      setAdminBranchView(data.adminBranchView ?? null);
    } catch (err) {
      console.error("Auth init failed", err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !currentUser && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, currentUser, pathname, router]);

  const switchAdminBranch = async (branchId: string | null) => {
    setAdminBranchView(branchId);
    try {
      const res = await fetch("/api/auth/switch-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to switch branch view");
      }
    } catch (err) {
      console.error(err);
      setAdminBranchView(null);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed", err);
    }
    setCurrentUser(null);
    setBranches([]);
    setAdminBranchView(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        branches,
        adminBranchView,
        isLoading,
        switchAdminBranch,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
