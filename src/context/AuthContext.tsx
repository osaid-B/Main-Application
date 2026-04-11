import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type User = {
  username: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "dashboard_auth_user";

function isValidUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "username" in value &&
    typeof (value as User).username === "string"
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedUser) return;

    try {
      const parsedUser: unknown = JSON.parse(storedUser);

      if (isValidUser(parsedUser)) {
        setUser(parsedUser);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const login = (username: string, password: string) => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (trimmedUsername === "admin" && trimmedPassword === "1234") {
      const loggedInUser = { username: trimmedUsername };
      setUser(loggedInUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user]
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