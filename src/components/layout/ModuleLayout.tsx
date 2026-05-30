import { Outlet } from "react-router-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useModule, MODULE_META, type ModuleId } from "../../context/ModuleContext";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";

interface NavSection {
  header: string;
  items: { label: string; path: string; badge?: number }[];
}

const COMPANY_NAV: NavSection[] = [
  {
    header: "الرئيسية",
    items: [{ label: "لوحة التحكم", path: "/company/dashboard" }],
  },
  {
    header: "التجارة",
    items: [
      { label: "الزبائن", path: "/company/customers" },
      { label: "الموردون", path: "/company/suppliers" },
      { label: "الفواتير", path: "/company/invoices" },
      { label: "الدفعات", path: "/company/payments" },
    ],
  },
  {
    header: "المحاسبة",
    items: [{ label: "المصروفات", path: "/company/expenses" }],
  },
  {
    header: "الموارد البشرية",
    items: [{ label: "الموظفون", path: "/company/employees" }],
  },
  {
    header: "التقارير",
    items: [{ label: "التقارير", path: "/company/reports" }],
  },
];

const FACTORY_NAV: NavSection[] = [
  {
    header: "الرئيسية",
    items: [{ label: "لوحة التحكم", path: "/factory/dashboard" }],
  },
  {
    header: "الإنتاج",
    items: [
      { label: "أوامر الإنتاج", path: "/factory/orders" },
      { label: "قوائم المواد", path: "/factory/boms" },
      { label: "مراقبة الجودة", path: "/factory/quality" },
    ],
  },
  {
    header: "المخزون",
    items: [
      { label: "المواد الخام", path: "/factory/materials" },
      { label: "المنتجات النهائية", path: "/factory/products" },
    ],
  },
  {
    header: "التوريد",
    items: [{ label: "الموردون", path: "/factory/suppliers" }],
  },
  {
    header: "التقارير",
    items: [{ label: "التقارير", path: "/factory/reports" }],
  },
];

const POS_NAV: NavSection[] = [
  {
    header: "الرئيسية",
    items: [{ label: "لوحة التحكم", path: "/pos/dashboard" }],
  },
  {
    header: "البيع",
    items: [
      { label: "الكاشير", path: "/pos/checkout" },
      { label: "سجل المبيعات", path: "/pos/sales" },
    ],
  },
  {
    header: "الكتالوج",
    items: [
      { label: "المنتجات", path: "/pos/products" },
      { label: "الفئات", path: "/pos/categories" },
    ],
  },
  {
    header: "الزبائن",
    items: [
      { label: "برنامج الولاء", path: "/pos/customers" },
      { label: "الكاشيرون", path: "/pos/cashiers" },
    ],
  },
  {
    header: "التقارير",
    items: [{ label: "التقارير", path: "/pos/reports" }],
  },
];

const MODULE_NAV: Record<ModuleId, NavSection[]> = {
  company: COMPANY_NAV,
  factory: FACTORY_NAV,
  pos: POS_NAV,
};

export default function ModuleLayout() {
  const navigate = useNavigate();
  const { activeModule, userModules } = useModule();
  const { isArabic, setLanguage } = useSettings();
  const { user } = useAuth();
  const meta = MODULE_META[activeModule];
  const nav = MODULE_NAV[activeModule];

  return (
    <div className={`module-shell ${meta.cls}`}>
      {/* Sidebar */}
      <aside className="module-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-module-badge">
            <span className="sidebar-module-badge__icon">{meta.icon}</span>
            <span className="sidebar-module-badge__name">{meta.name}</span>
          </div>
          <div className="sidebar-app-name">أطلس لإدارة الأعمال</div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((section) => (
            <div key={section.header}>
              <div className="sidebar-section-header">{section.header}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? " sidebar-nav-item--active" : ""}`
                  }
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-name">{user?.username ?? "المستخدم"}</div>
          <div className="sidebar-user-role">{user?.role ?? "مدير"}</div>
          <div className="sidebar-footer-links">
            {userModules.length > 1 && (
              <button
                type="button"
                className="sidebar-link"
                onClick={() => navigate("/")}
              >
                تغيير الوحدة
              </button>
            )}
            <button
              type="button"
              className="lang-toggle"
              onClick={() => setLanguage(isArabic ? "en" : "ar")}
            >
              {isArabic ? "EN" : "ع"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main body */}
      <div className="module-body">
        {/* Header */}
        <header className="module-header">
          <div className="header-search">
            <span className="search-icon"><Search size={14} /></span>
            <input className="ds-input" placeholder="بحث في النظام..." style={{ paddingRight: 32 }} />
          </div>

          <div className="header-actions">
            <div className="header-bell" title="الإشعارات">
              <Bell size={16} />
              <span className="header-bell__dot" />
            </div>
            <div className="header-avatar" title={user?.username ?? "المستخدم"}>
              {(user?.username ?? "م").charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="module-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
