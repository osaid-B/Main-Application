import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { USE_SUPABASE } from "../lib/supabase";
import { signIn as sbSignIn, signOut as sbSignOut, getSession } from "../services/auth";

export type UserRole = "Admin" | "Manager" | "Finance" | "Factory" | "Cashier";

type User = {
  username: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// ── Django backend auth ────────────────────────────────────────────────────
// Active when VITE_API_URL is set (see .env.local). Takes priority over
// Supabase and mock paths. Vite proxy forwards /api/* to the Django server
// so no CORS headers are needed in development.
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

// Maps backend role codes (lowercase) to frontend UserRole (PascalCase).
// Falls back to "Admin" for unknown codes so the app never gets stuck.
const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  admin:   "Admin",
  manager: "Manager",
  finance: "Finance",
  factory: "Factory",
  cashier: "Cashier",
};

function mapBackendRole(code: string | null): UserRole {
  if (!code) return "Admin";
  return BACKEND_ROLE_MAP[code.toLowerCase()] ?? "Admin";
}

/** Returns the stored JWT access token for use in API calls outside this context. */
export function getAccessToken(): string | null {
  return USE_DJANGO ? localStorage.getItem(DJANGO_ACCESS_KEY) : null;
}

// ── Shared helpers ─────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "dashboard_auth_user";

const VALID_ROLES: UserRole[] = ["Admin", "Manager", "Finance", "Factory", "Cashier"];

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

// Mock credentials — used when neither Django nor Supabase is configured
const CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  admin:   { password: "1234", role: "Admin" },
  manager: { password: "1234", role: "Manager" },
  finance: { password: "1234", role: "Finance" },
  factory: { password: "1234", role: "Factory" },
  cashier: { password: "1234", role: "Cashier" },
  "admin@atlas-erp.com":   { password: "Admin1234!",   role: "Admin" },
  "manager@atlas-erp.com": { password: "Manager1234!", role: "Manager" },
  "finance@atlas-erp.com": { password: "Finance1234!", role: "Finance" },
  "factory@atlas-erp.com": { password: "Factory1234!", role: "Factory" },
  "cashier@atlas-erp.com": { password: "Cashier1234!", role: "Cashier" },
};

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) return null;
  try {
    const parsedUser: unknown = JSON.parse(storedUser);
    if (isValidUser(parsedUser)) return parsedUser;
  } catch {
    // fall through
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Django and mock paths both persist the user shape in AUTH_STORAGE_KEY.
    // For the Django path we additionally require the access token to be present;
    // if it has been cleared (e.g. cleared by logout or browser) treat as logged out.
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
      // Verify the stored access token is still valid via /api/v1/auth/me/.
      // If invalid, wipe all stored credentials so the user sees the login page.
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
          const role = (authUser.role ?? "Cashier") as UserRole;
          setUser({ username: authUser.email, role });
        })
        .catch(() => {});
    }
  }, []);

  // ── login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const trimmed  = username.trim();
    const pwd      = password.trim();

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
        const role = (authUser.role ?? "Cashier") as UserRole;
        setUser({ username: authUser.email, role });
        return true;
      } catch {
        return false;
      }
    }

    // ── 3. Mock path ─────────────────────────────────────────────────────
    const key  = trimmed.toLowerCase();
    const cred = CREDENTIALS[key];
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
      // Fire-and-forget: blacklist the refresh token on the server
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

  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, hasRole, login, logout }),
    [hasRole, login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
