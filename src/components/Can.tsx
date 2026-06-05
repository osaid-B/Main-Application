import { useAuth } from "../context/AuthContext";
import type { Permission } from "../lib/permissions";

interface CanProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Renders children only if the current user has the given permission. */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

/** Renders children only if the current user LACKS the given permission. */
export function Cannot({ permission, children, fallback = null }: CanProps) {
  const { can } = useAuth();
  return can(permission) ? <>{fallback}</> : <>{children}</>;
}
