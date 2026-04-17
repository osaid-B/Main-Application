import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, isArabic } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  return (
    <aside className="sidebar" dir={isArabic ? "rtl" : "ltr"}>
      <div>
        <h2 className="sidebar-title">{t.sidebar.title}</h2>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={getLinkClass}>
            {t.sidebar.dashboard}
          </NavLink>
          <NavLink to="/customers" className={getLinkClass}>
            {t.sidebar.customers}
          </NavLink>
          <NavLink to="/products" className={getLinkClass}>
            {t.sidebar.products}
          </NavLink>
          <NavLink to="/purchases" className={getLinkClass}>
            {t.sidebar.purchases}
          </NavLink>
          <NavLink to="/invoices" className={getLinkClass}>
            {t.sidebar.invoices}
          </NavLink>
          <NavLink to="/payments" className={getLinkClass}>
            {t.sidebar.payments}
          </NavLink>
          <NavLink to="/employees" className={getLinkClass}>
            {t.sidebar.employees}
          </NavLink>
          <NavLink to="/settings" className={getLinkClass}>
            {t.sidebar.settings}
          </NavLink>
          <NavLink to="/data-import" className={getLinkClass}>
            {t.sidebar.dataImport}
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-user">
          {t.sidebar.loggedInAs} <strong>{user?.username}</strong>
        </p>

        <button className="logout-button" onClick={handleLogout}>
          {t.common.logout}
        </button>
      </div>
    </aside>
  );
}