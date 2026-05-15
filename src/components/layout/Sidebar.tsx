import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Search,
  Settings,
  Shield,
  Truck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";
import "./Sidebar.atlas.css";

type SidebarProps = {
  mobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

interface NavItem {
  icon: ComponentType<{ size?: number }>;
  label: string;
  path: string;
  badge?: string;
  dot?: boolean;
  comingSoon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Main Dashboard", path: "/dashboard" },
      { icon: Building2, label: "Company", path: "/company", comingSoon: true },
      { icon: DollarSign, label: "Finance", path: "/treasury" },
    ],
  },
  {
    title: "RELATIONS",
    items: [
      { icon: Users, label: "Customers", path: "/customers", badge: "4.2k" },
      { icon: Truck, label: "Suppliers", path: "/suppliers" },
      { icon: UserCircle, label: "Employees", path: "/employees" },
      { icon: Briefcase, label: "Departments", path: "/departments", comingSoon: true },
    ],
  },
  {
    title: "ACCOUNTING",
    items: [
      { icon: FileText, label: "Invoices", path: "/invoices", dot: true },
      { icon: Receipt, label: "Expenses", path: "/purchases" },
      { icon: CreditCard, label: "Payments", path: "/payments" },
      { icon: BarChart3, label: "Reports", path: "/reports", comingSoon: true },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      { icon: Package, label: "Inventory", path: "/products" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { icon: Shield, label: "Permissions", path: "/permissions", comingSoon: true },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

export default function Sidebar({
  mobile = false,
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const userName = user?.username ?? "Sara Halim";
  const userRole = "Owner";

  return (
    <aside
      className={[
        "atlas-sidebar",
        mobile ? "atlas-sidebar--mobile" : "atlas-sidebar--desktop",
        collapsed && !mobile ? "is-collapsed" : "",
        mobile && isOpen ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={mobile ? !isOpen : undefined}
    >
      {/* Brand */}
      <header className="atlas-brand">
        <div className="atlas-brand-logo" aria-hidden>A</div>
        {(!collapsed || mobile) && (
          <div className="atlas-brand-info">
            <h3>Atlas ERP</h3>
            <p>Northwind Holdings</p>
          </div>
        )}
        {!mobile ? (
          <button
            type="button"
            className="atlas-sidebar-toggle"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        ) : (
          <button
            type="button"
            className="atlas-sidebar-toggle"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={14} />
          </button>
        )}
      </header>

      {/* Search */}
      {(!collapsed || mobile) && (
        <div className="atlas-sidebar-search">
          <Search size={13} aria-hidden />
          <input type="search" placeholder="Search…" aria-label="Search" />
          <kbd>⌘K</kbd>
        </div>
      )}

      {/* Sections */}
      <nav className="atlas-sidebar-nav" aria-label="Main navigation">
        {SECTIONS.map((section) => (
          <div key={section.title} className="atlas-nav-section">
            {(!collapsed || mobile) && (
              <h4 className="atlas-nav-section-title">{section.title}</h4>
            )}
            <ul className="atlas-nav-list">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        [
                          "atlas-nav-link",
                          isActive && !item.comingSoon ? "is-active" : "",
                          item.comingSoon ? "is-disabled" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                      onClick={(e) => {
                        if (item.comingSoon) e.preventDefault();
                        if (mobile && onClose) onClose();
                      }}
                      aria-disabled={item.comingSoon || undefined}
                      title={item.comingSoon ? "Coming soon" : undefined}
                    >
                      <Icon size={16} />
                      {(!collapsed || mobile) && (
                        <>
                          <span className="atlas-nav-label">{item.label}</span>
                          {item.badge && (
                            <span className="atlas-nav-badge">{item.badge}</span>
                          )}
                          {item.dot && <span className="atlas-nav-dot" aria-hidden />}
                          {item.comingSoon && (
                            <span className="atlas-nav-soon">soon</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <footer className="atlas-sidebar-user">
        <Avatar name={userName} size="sm" tone="accent" />
        {(!collapsed || mobile) && (
          <>
            <div className="atlas-user-info">
              <p>{userName}</p>
              <span>{userRole}</span>
            </div>
            <button
              type="button"
              className="atlas-user-logout"
              onClick={() => {
                if (mobile && onClose) onClose();
                logout();
              }}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </footer>
    </aside>
  );
}
