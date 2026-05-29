import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { USE_SUPABASE } from "../lib/supabase";
import { signIn as sbSignIn, signOut as sbSignOut, getSession, onAuthStateChange } from "../services/auth";

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

// Mock credentials — used when USE_SUPABASE is false
const CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  admin:   { password: "1234", role: "Admin" },
  manager: { password: "1234", role: "Manager" },
  finance: { password: "1234", role: "Finance" },
  factory: { password: "1234", role: "Factory" },
  cashier: { password: "1234", role: "Cashier" },
  // Allow email-style logins for the mock path
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    USE_SUPABASE ? null : readStoredUser()
  );

  // Restore Supabase session on mount
  useEffect(() => {
    if (!USE_SUPABASE) return;
    getSession().then((authUser) => {
      if (!authUser) return;
      const role = (authUser.role ?? "Cashier") as UserRole;
      setUser({ username: authUser.email, role });
    }).catch(() => {});
  }, []);

  // Keep session in sync with token refreshes / sign-out from other tabs
  useEffect(() => {
    if (!USE_SUPABASE) return;
    return onAuthStateChange((authUser) => {
      if (!authUser) {
        setUser(null);
        return;
      }
      const role = (authUser.role ?? "Cashier") as UserRole;
      setUser({ username: authUser.email, role });
    });
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const key = username.trim().toLowerCase();
    const pwd = password.trim();

    if (USE_SUPABASE) {
      try {
        const authUser = await sbSignIn(key, pwd);
        const role = (authUser.role ?? "Cashier") as UserRole;
        setUser({ username: authUser.email, role });
        return true;
      } catch {
        return false;
      }
    }

    // Mock path
    const cred = CREDENTIALS[key];
    if (cred && pwd === cred.password) {
      const loggedInUser: User = { username: key, role: cred.role };
      setUser(loggedInUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  }, []);

  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (USE_SUPABASE) sbSignOut().catch(() => {});
  }, []);

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
