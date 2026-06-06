import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { USE_SUPABASE } from "../lib/supabase";
import { signIn as sbSignIn, signOut as sbSignOut, getSession } from "../services/auth";
import type { Role, Permission } from "../lib/permissions";
import { hasPermission, hasAnyPermission } from "../lib/permissions";

// UserRole is now the full 8-role enum from the RBAC system.
// Legacy role names (Admin, Manager, Finance, Factory, Cashier) are remapped at
// login time via CREDENTIALS / BACKEND_ROLE_MAP below.
export type UserRole = Role;

type User = {
  username: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// ── Django backend auth ────────────────────────────────────────────────────
const USE_DJANGO = !!import.meta.env.VITE_API_URL;

const DJANGO_ACCESS_KEY  = "atlas_access";
const DJANGO_REFRESH_KEY = "atlas_refresh";

interface DjangoLoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: string | null;
  };
}

interface DjangoMeResponse {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string | null;
}

// Maps backend role codes to frontend UserRole (3-role system).
const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  // admin tier
  admin:       "admin",
  Admin:       "admin",
  super_admin: "admin",
  // manager tier
  manager:     "manager",
  Manager:     "manager",
  accountant:  "manager",
  finance:     "manager",
  Finance:     "manager",
  sales:       "manager",
  warehouse:   "manager",
  factory:     "manager",
  Factory:     "manager",
  hr:          "manager",
  // cashier tier
  cashier:     "cashier",
  Cashier:     "cashier",
  viewer:      "cashier",
};

function mapBackendRole(code: string | null): UserRole {
  if (!code) return "viewer";
  return BACKEND_ROLE_MAP[code] ?? BACKEND_ROLE_MAP[code.toLowerCase()] ?? "viewer";
}

/** Returns the stored JWT access token for use in API calls outside this context. */
export function getAccessToken(): string | null {
  return USE_DJANGO ? localStorage.getItem(DJANGO_ACCESS_KEY) : null;
}

// ── Shared helpers ─────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "dashboard_auth_user";

const VALID_ROLES: UserRole[] = ["admin", "manager", "cashier"];

function isValidUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "username" in value &&
    typeof (value as User).username === "string" &&
    "role" in value &&
    VALID_ROLES.includes((value as User).role)
  );
}

// Mock credentials — used when neither Django nor Supabase is configured.
const CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  // Primary accounts (new 3-role system)
  admin:      { password: "1234",   role: "admin"   },
  manager:    { password: "1234",   role: "manager" },
  cashier:    { password: "1234",   role: "cashier" },
  // Legacy usernames → mapped to closest role
  super_admin: { password: "1234",  role: "admin"   },
  finance:     { password: "1234",  role: "manager" },
  factory:     { password: "1234",  role: "manager" },
  accountant:  { password: "1234",  role: "manager" },
  sales:       { password: "1234",  role: "manager" },
  warehouse:   { password: "1234",  role: "manager" },
  hr:          { password: "1234",  role: "manager" },
  viewer:      { password: "1234",  role: "cashier" },
  // Email credentials (spec test accounts)
  "admin@atlas.ps":    { password: "123456", role: "admin"   },
  "manager@atlas.ps":  { password: "123456", role: "manager" },
  "cashier@atlas.ps":  { password: "123456", role: "cashier" },
  // Legacy email credentials
  "admin@atlas-erp.com":   { password: "Admin1234!",   role: "admin"   },
  "manager@atlas-erp.com": { password: "Manager1234!", role: "manager" },
  "finance@atlas-erp.com": { password: "Finance1234!", role: "manager" },
  "factory@atlas-erp.com": { password: "Factory1234!", role: "manager" },
  "cashier@atlas-erp.com": { password: "Cashier1234!", role: "cashier" },
};

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) return null;
  try {
    const parsedUser: unknown = JSON.parse(storedUser);
    if (isValidUser(parsedUser)) return parsedUser;
    // Attempt to migrate legacy role names stored in localStorage
    if (
      typeof parsedUser === "object" &&
      parsedUser !== null &&
      "username" in parsedUser &&
      "role" in parsedUser
    ) {
      const legacyRole = (parsedUser as { role: string }).role;
      const mappedRole = mapBackendRole(legacyRole);
      const migrated: User = {
        username: (parsedUser as { username: string }).username,
        role: mappedRole,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // fall through
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (USE_SUPABASE) return null;
    const stored = readStoredUser();
    if (USE_DJANGO && !localStorage.getItem(DJANGO_ACCESS_KEY)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return stored;
  });

  // ── Session restore on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (USE_DJANGO) {
      const token = localStorage.getItem(DJANGO_ACCESS_KEY);
      if (!token) return;
      fetch("/api/v1/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? (r.json() as Promise<DjangoMeResponse>) : Promise.reject()))
        .then((data) => {
          const role = mapBackendRole(data.role);
          const restored: User = { username: data.username, role };
          setUser(restored);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(restored));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(DJANGO_ACCESS_KEY);
          localStorage.removeItem(DJANGO_REFRESH_KEY);
        });
      return;
    }

    if (USE_SUPABASE) {
      getSession()
        .then((authUser) => {
          if (!authUser) return;
          const role = mapBackendRole(authUser.role ?? null);
          setUser({ username: authUser.email, role });
        })
        .catch(() => {});
    }
  }, []);

  // ── login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const trimmed = username.trim();
    const pwd     = password.trim();

    // ── 1. Django path ───────────────────────────────────────────────────
    if (USE_DJANGO) {
      try {
        const res = await fetch("/api/v1/auth/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: trimmed, password: pwd }),
        });
        if (!res.ok) return false;

        const data = (await res.json()) as DjangoLoginResponse;

        localStorage.setItem(DJANGO_ACCESS_KEY,  data.access);
        localStorage.setItem(DJANGO_REFRESH_KEY, data.refresh);

        const role = mapBackendRole(data.user.role);
        const loggedInUser: User = { username: data.user.username, role };
        setUser(loggedInUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
        return true;
      } catch {
        return false;
      }
    }

    // ── 2. Supabase path ─────────────────────────────────────────────────
    if (USE_SUPABASE) {
      const key = trimmed.toLowerCase();
      try {
        const authUser = await sbSignIn(key, pwd);
        const role = mapBackendRole(authUser.role ?? null);
        setUser({ username: authUser.email, role });
        return true;
      } catch {
        return false;
      }
    }

    // ── 3. Mock path ─────────────────────────────────────────────────────
    const key  = trimmed.toLowerCase();
    const cred = CREDENTIALS[key] ?? CREDENTIALS[trimmed];
    if (cred && pwd === cred.password) {
      const loggedInUser: User = { username: key, role: cred.role };
      setUser(loggedInUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);

    if (USE_DJANGO) {
      const access  = localStorage.getItem(DJANGO_ACCESS_KEY);
      const refresh = localStorage.getItem(DJANGO_REFRESH_KEY);
      if (access && refresh) {
        fetch("/api/v1/auth/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({ refresh }),
        }).catch(() => {});
      }
      localStorage.removeItem(DJANGO_ACCESS_KEY);
      localStorage.removeItem(DJANGO_REFRESH_KEY);
      return;
    }

    if (USE_SUPABASE) {
      sbSignOut().catch(() => {});
    }
  }, []);

  // ── permission helpers ───────────────────────────────────────────────────
  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const canAny = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user]);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, hasRole, can, canAny, login, logout }),
    [can, canAny, hasRole, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// Convenience hook — returns whether the current user has a given permission.
export function useCan(permission: Permission): boolean {
  const { can } = useAuth();
  return can(permission);
}

// Re-export for convenience
export type { Permission } from "../lib/permissions";
export type { Role } from "../lib/permissions";
