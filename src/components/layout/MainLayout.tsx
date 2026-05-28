import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogOut, Menu, PanelRightOpen, Plus } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import AtlasHeader from "./AtlasHeader";
import AIAssistantPanel from "../ai/AIAssistantPanel";
import ShortcutsOverlay from "../ui/ShortcutsOverlay";
import { useAI } from "../../context/AIContext";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

export default function MainLayout() {
  const { isOpen, initialPrompt, openAI, closeAI } = useAI();
  const { t, isArabic, theme, toggleTheme } = useSettings();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileNavOpen(false);
  }
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("app-sidebar-collapsed") === "1"
  );

  const focusSearch = useCallback(() => {
    const input = document.querySelector<HTMLInputElement>(".atlas-global-search input");
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const requestLogout = useCallback(() => {
    setLogoutPending(true);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => setLogoutPending(false), 6000);
  }, []);

  const confirmLogout = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setLogoutPending(false);
    logout();
  }, [logout]);

  const cancelLogout = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    setLogoutPending(false);
  }, []);

  useEffect(() => {
    if (!logoutPending) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); confirmLogout(); }
      if (e.key === "Escape") { e.preventDefault(); cancelLogout(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logoutPending, confirmLogout, cancelLogout]);

  useEffect(() => () => { if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current); }, []);

  const shortcuts = useKeyboardShortcuts(
    useCallback(() => setShortcutsOpen((v) => !v), []),
    focusSearch,
    toggleTheme,
    requestLogout
  );

  useEffect(() => {
    localStorage.setItem("app-sidebar-collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  /*
    مهم:
    لا نستخدم document.body.style.overflow = "hidden" مباشرة.
    نضيف class فقط عند فتح قائمة الموبايل.
  */
  useEffect(() => {
    document.body.classList.toggle("nav-open", mobileNavOpen);

    if (!mobileNavOpen) {
      const activeElement = document.activeElement as HTMLElement | null;

      if (activeElement && typeof activeElement.blur === "function") {
        activeElement.blur();
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    if (mobileNavOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.classList.remove("nav-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileNavOpen]);


  const sectionMeta = useMemo(() => {
    const entries = [
      {
        path: "/dashboard",
        title: t.sidebar.dashboard,
        subtitle: t.layout.sectionSubtitles.dashboard,
      },
      {
        path: "/customers",
        title: t.sidebar.customers,
        subtitle: t.layout.sectionSubtitles.customers,
      },
      {
        path: "/products",
        title: t.sidebar.products,
        subtitle: t.layout.sectionSubtitles.products,
      },
      {
        path: "/purchases",
        title: t.sidebar.purchases,
        subtitle: t.layout.sectionSubtitles.purchases,
      },
      {
        path: "/suppliers",
        title: t.sidebar.suppliers,
        subtitle: t.layout.sectionSubtitles.suppliers,
      },
      {
        path: "/invoices",
        title: t.sidebar.invoices,
        subtitle: t.layout.sectionSubtitles.invoices,
      },
      {
        path: "/payments",
        title: t.sidebar.payments,
        subtitle: t.layout.sectionSubtitles.payments,
      },
      {
        path: "/treasury",
        title: t.sidebar.treasury,
        subtitle: t.layout.sectionSubtitles.treasury,
      },
      {
        path: "/employees",
        title: t.sidebar.employees,
        subtitle: t.layout.sectionSubtitles.employees,
      },
      {
        path: "/settings",
        title: t.sidebar.settings,
        subtitle: t.layout.sectionSubtitles.settings,
      },
      {
        path: "/data-import",
        title: t.sidebar.dataImport,
        subtitle: t.layout.sectionSubtitles["data-import"],
      },
    ];

    return (
      entries.find((entry) => location.pathname.startsWith(entry.path)) ??
      entries[0]
    );
  }, [location.pathname, t.layout.sectionSubtitles, t.sidebar]);

  const bottomNavItems = useMemo(
    () => [
      { path: "/dashboard", label: t.sidebar.dashboard },
      { path: "/customers", label: t.sidebar.customers },
      { path: "/invoices", label: t.sidebar.invoices },
      { path: "/payments", label: t.sidebar.payments },
      { path: "/products", label: t.sidebar.products },
    ],
    [t.sidebar]
  );

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      {mobileNavOpen ? (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <Sidebar
        mobile
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      <main className="app-main">
        <div className="app-main-shell">
          <header className="mobile-topbar" dir={isArabic ? "rtl" : "ltr"}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t.layout.mobileOpenNavigation}
            >
              <Menu size={18} />
            </button>

            <div className="mobile-topbar-copy">
              <strong>{sectionMeta.title}</strong>
              <span>{sectionMeta.subtitle}</span>
            </div>

            <div className="mobile-topbar-actions">
              <button
                type="button"
                className="mobile-topbar-btn"
                onClick={() => openAI()}
                aria-label={t.layout.mobileOpenAI}
              >
                <PanelRightOpen size={16} />
              </button>

              <button
                type="button"
                className="mobile-topbar-btn primary"
                onClick={() => navigate("/invoices")}
                aria-label={t.layout.mobileCreateInvoice}
              >
                <Plus size={16} />
              </button>
            </div>
          </header>

          <AtlasHeader />

          <div className="app-page-content">
            <Outlet />
          </div>
        </div>

        {logoutPending && (
          <div className="logout-confirm-toast" role="alertdialog" aria-label="Confirm sign out">
            <div className="logout-confirm-icon">
              <LogOut size={16} />
            </div>
            <div className="logout-confirm-body">
              <strong>Sign out?</strong>
              <span>Press Enter to confirm or Esc to cancel</span>
            </div>
            <div className="logout-confirm-actions">
              <button type="button" className="logout-btn-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button type="button" className="logout-btn-confirm" onClick={confirmLogout}>
                Sign out
              </button>
            </div>
            <div className="logout-confirm-progress" />
          </div>
        )}
      </main>

      {shortcutsOpen && (
        <ShortcutsOverlay
          shortcuts={shortcuts}
          onClose={() => setShortcutsOpen(false)}
          isDark={theme === "dark"}
        />
      )}

      <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              type="button"
              className={`mobile-bottom-link ${isActive ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <AIAssistantPanel
        isOpen={isOpen}
        onClose={closeAI}
        initialPrompt={initialPrompt}
      />
    </div>
  );
}