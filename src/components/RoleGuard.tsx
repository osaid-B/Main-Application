import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./ui/Toast";
import { useSettings } from "../context/SettingsContext";
import type { UserRole } from "../context/AuthContext";

interface RoleGuardProps {
  roles: UserRole[];
}

export default function RoleGuard({ roles }: RoleGuardProps) {
  const { hasRole } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useSettings();

  const allowed = hasRole(...roles);

  useEffect(() => {
    if (!allowed) {
      toast(t.common.accessDeniedMsg, { type: "error", title: t.common.accessDenied });
    }
  }, [allowed, t, toast]);

  if (!allowed) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
