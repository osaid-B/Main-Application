import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./ui/Toast";
import type { UserRole } from "../context/AuthContext";

interface RoleGuardProps {
  roles: UserRole[];
}

export default function RoleGuard({ roles }: RoleGuardProps) {
  const { hasRole } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const allowed = hasRole(...roles);

  useEffect(() => {
    if (!allowed) {
      toast("You don't have permission to access this page.", { type: "error", title: "Access denied" });
    }
  }, [allowed, toast]);

  if (!allowed) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
