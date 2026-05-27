import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Factory,
  FileCheck2,
  FileText,
  Globe,
  History,
  Layers,
  LayoutDashboard,
  ListTree,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  RotateCcw,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Ship,
  ShoppingCart,
  Sliders,
  Star,
  Tag,
  TrendingUp,
  Truck,
  UserCircle,
  UserCircle2,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSidebarPreferences } from "../../context/SidebarPreferencesContext";
import { Avatar } from "../ui/Avatar";
import { useWorkspace, type Workspace } from "../../contexts/WorkspaceContext";
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

const COMPANY_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Main Dashboard", path: "/dashboard" },
      { icon: Building2, label: "Company", path: "/company" },
      { icon: DollarSign, label: "Finance", path: "/treasury" },
    ],
  },
  {
    title: "RELATIONS",
    items: [
      { icon: Users, label: "Customers", path: "/customers", badge: "4.2k" },
      { icon: FileCheck2, label: "Quotes", path: "/quotes" },
      { icon: Truck, label: "Suppliers", path: "/suppliers" },
      { icon: UserCircle, label: "Employees", path: "/employees" },
      { icon: Briefcase, label: "Departments", path: "/departments" },
    ],
  },
  {
    title: "ACCOUNTING",
    items: [
      { icon: BookOpen, label: "General Ledger", path: "/general-ledger" },
      { icon: ListTree, label: "Chart of Accounts", path: "/chart-of-accounts" },
      { icon: FileText, label: "Invoices", path: "/invoices", dot: true },
      { icon: Receipt, label: "Expenses", path: "/expenses" },
      { icon: CreditCard, label: "Payments", path: "/payments" },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { icon: BarChart3, label: "Reports", path: "/reports" },
      { icon: TrendingUp, label: "Profit & Loss", path: "/reports/profit-loss" },
      { icon: Scale, label: "Balance Sheet", path: "/reports/balance-sheet" },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      { icon: Package, label: "Products", path: "/products" },
      { icon: Warehouse, label: "Inventory", path: "/inventory" },
      { icon: ArrowLeftRight, label: "Movements", path: "/inventory/movements" },
      { icon: Factory, label: "Manufacturing", path: "/manufacturing" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Shield, label: "Permissions", path: "/permissions" },
      { icon: ClipboardList, label: "Audit Log", path: "/audit-log" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

const POS_SECTIONS: NavSection[] = [
  {
    title: "REGISTER",
    items: [
      { icon: ShoppingCart, label: "Checkout", path: "/pos/checkout" },
      { icon: History, label: "Sales History", path: "/pos/history" },
      { icon: RotateCcw, label: "Refunds", path: "/pos/refunds" },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { icon: Package, label: "Products", path: "/pos/products" },
      { icon: Tag, label: "Categories", path: "/pos/categories" },
      { icon: ClipboardList, label: "Stock Counts", path: "/pos/stock" },
    ],
  },
  {
    title: "LOYALTY",
    items: [
      { icon: UserCircle2, label: "Customer Profile", path: "/pos/loyalty/profile" },
      { icon: Clock, label: "Coins History", path: "/pos/loyalty/history" },
      { icon: Star, label: "Coins Settings", path: "/pos/loyalty/settings" },
      { icon: BarChart3, label: "Coins Reports", path: "/pos/loyalty/reports" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { icon: Users, label: "Cashiers", path: "/pos/cashiers" },
      { icon: Receipt, label: "Receipts", path: "/pos/receipts" },
    ],
  },
];

const FACTORY_SECTIONS: NavSection[] = [
  {
    title: "OPERATIONS",
    items: [
      { icon: Factory, label: "Factory Dashboard", path: "/factory" },
      { icon: ClipboardList, label: "Production Orders", path: "/factory/orders", badge: "12" },
      { icon: FileText, label: "Bills of Material", path: "/factory/boms" },
      { icon: ShieldCheck, label: "Quality Control", path: "/factory/qc" },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      { icon: Globe, label: "Local vs Imported", path: "/factory/inventory/sources" },
      { icon: Boxes, label: "Raw Materials", path: "/factory/inventory/raw" },
      { icon: Package, label: "Finished Goods", path: "/factory/inventory/finished" },
      { icon: Warehouse, label: "Warehouse", path: "/factory/inventory/warehouse" },
    ],
  },
  {
    title: "SOURCING",
    items: [
      { icon: Ship, label: "Imports", path: "/factory/imports" },
      { icon: Layers, label: "Batches", path: "/factory/batches" },
      { icon: DollarSign, label: "Costing", path: "/factory/costing" },
    ],
  },
];

const SECTIONS_BY_WORKSPACE: Record<Workspace, NavSection[]> = {
  company: COMPANY_SECTIONS,
  pos: POS_SECTIONS,
  factory: FACTORY_SECTIONS,
};

export default function Sidebar({
  mobile = false,
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();
  const prefs = useSidebarPreferences();
  const [editMode, setEditMode] = useState(false);

  const userName = user?.username ?? "Sara Halim";
  const userRole = "Owner";

  const sections = SECTIONS_BY_WORKSPACE[workspace];

  function sectionKey(title: string) {
    return `${workspace}:${title}`;
  }

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

      {(!collapsed || mobile) && (
        <div className="atlas-sidebar-search">
          <Search size={13} aria-hidden />
          <input type="search" placeholder="Search…" aria-label="Search" />
          <kbd>⌘K</kbd>
        </div>
      )}

      <nav className="atlas-sidebar-nav" aria-label="Main navigation">
        {sections.map((section) => {
          const key = sectionKey(section.title);
          const isSectionCollapsed = !editMode && prefs.isSectionCollapsed(key);
          const visibleItems = editMode
            ? section.items
            : section.items.filter((item) => !prefs.isHidden(item.path));

          if (!editMode && visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="atlas-nav-section">
              {(!collapsed || mobile) && (
                <div className="atlas-nav-section-header">
                  <h4 className="atlas-nav-section-title">{section.title}</h4>
                  {!editMode && (
                    <button
                      type="button"
                      className="atlas-nav-section-collapse"
                      onClick={() => prefs.toggleSection(key)}
                      aria-label={isSectionCollapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
                    >
                      {isSectionCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                </div>
              )}
              {!isSectionCollapsed && (
                <ul className="atlas-nav-list">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const hidden = prefs.isHidden(item.path);

                    if (editMode) {
                      return (
                        <li key={item.label} className="atlas-nav-edit-row">
                          <span className="atlas-nav-edit-icon"><Icon size={15} /></span>
                          {(!collapsed || mobile) && (
                            <>
                              <span className={`atlas-nav-label ${hidden ? "atlas-nav-label--dim" : ""}`}>{item.label}</span>
                              <button
                                type="button"
                                className="atlas-nav-visibility-btn"
                                onClick={() => prefs.toggleItem(item.path)}
                                aria-label={hidden ? `Show ${item.label}` : `Hide ${item.label}`}
                                title={hidden ? "Show" : "Hide"}
                              >
                                {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </>
                          )}
                        </li>
                      );
                    }

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
                              {item.badge && <span className="atlas-nav-badge">{item.badge}</span>}
                              {item.dot && <span className="atlas-nav-dot" aria-hidden />}
                              {item.comingSoon && <span className="atlas-nav-soon">soon</span>}
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {(!collapsed || mobile) && (
        <div className="atlas-sidebar-customize">
          {editMode ? (
            <div className="atlas-customize-actions">
              <button
                type="button"
                className="atlas-customize-done"
                onClick={() => setEditMode(false)}
              >
                Done
              </button>
              <button
                type="button"
                className="atlas-customize-reset"
                onClick={() => { prefs.resetToDefaults(); setEditMode(false); }}
              >
                Reset to defaults
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="atlas-customize-btn"
              onClick={() => setEditMode(true)}
              aria-label="Customize sidebar"
            >
              <Sliders size={13} />
              <span>Customize</span>
            </button>
          )}
        </div>
      )}

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
