import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTE_PERMISSIONS } from "../lib/permissions";
import type { Permission } from "../lib/permissions";

interface ProtectedRouteProps {
  permission?: Permission;
  children?: React.ReactNode;
}

export default function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, can, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const requiredPermission = permission || ROUTE_PERMISSIONS[location.pathname];

  if (requiredPermission && !can(requiredPermission)) {
    return <AccessDenied user={user} logout={logout} />;
  }

  return children ? <>{children}</> : <Outlet />;
}

function AccessDenied({ user, logout }: { user: { username: string; role: string } | null; logout: () => void }) {
  const navigate = useNavigate();
  const roleLabels: Record<string, string> = {
    admin:   "مدير النظام",
    manager: "مدير",
    cashier: "أمين صندوق",
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", direction: "rtl",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#FEF2F2",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: 32,
        }}>
          🔒
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
          غير مصرح لك بالوصول
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px", lineHeight: 1.6 }}>
          ليس لديك صلاحية للوصول إلى هذه الصفحة.
          تواصل مع مدير النظام لطلب الصلاحيات المطلوبة.
        </p>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 20px" }}>
          دورك الحالي: <strong>{roleLabels[user?.role ?? ""] || user?.role || "غير محدد"}</strong>
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 24px",
            background: "#EF4444",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
