import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type UserRole = "Admin" | "Manager" | "Finance" | "Factory" | "Cashier";

type User = {
  username: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  login: (username: string, password: string) => boolean;
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

const CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  admin:   { password: "1234", role: "Admin" },
  manager: { password: "1234", role: "Manager" },
  finance: { password: "1234", role: "Finance" },
  factory: { password: "1234", role: "Factory" },
  cashier: { password: "1234", role: "Cashier" },
};

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const parsedUser: unknown = JSON.parse(storedUser);

    if (isValidUser(parsedUser)) {
      return parsedUser;
    }
  } catch {
    // Invalid stored auth should be cleared and treated as logged out.
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const login = useCallback((username: string, password: string) => {
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const cred = CREDENTIALS[trimmedUsername];

    if (cred && trimmedPassword === cred.password) {
      const loggedInUser: User = { username: trimmedUsername, role: cred.role };
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
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      hasRole,
      login,
      logout,
    }),
    [hasRole, login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
