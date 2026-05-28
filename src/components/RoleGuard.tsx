import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";

interface RoleGuardProps {
  roles: UserRole[];
}

export default function RoleGuard({ roles }: RoleGuardProps) {
  const { hasRole } = useAuth();
  const location = useLocation();

  if (!hasRole(...roles)) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
