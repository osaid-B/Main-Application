import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  return (
    <aside className="sidebar">
      <div>
        <h2 className="sidebar-title">Business Dashboard</h2>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={getLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/customers" className={getLinkClass}>
            Customers
          </NavLink>
          <NavLink to="/products" className={getLinkClass}>
            Products
          </NavLink>
          <NavLink to="/purchases" className={getLinkClass}>
            Purchases
          </NavLink>
          <NavLink to="/invoices" className={getLinkClass}>
            Invoices
          </NavLink>
          <NavLink to="/payments" className={getLinkClass}>
            Payments
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-user">
          Logged in as <strong>{user?.username}</strong>
        </p>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}