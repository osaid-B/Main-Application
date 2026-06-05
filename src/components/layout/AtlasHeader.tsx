import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Moon, Plus, Sun } from "lucide-react";
import { Button } from "../ui/Button";
import { useWorkspace, WORKSPACES, type Workspace } from "../../contexts/WorkspaceContext";
import { useSettings } from "../../context/SettingsContext";
import NotificationsPanel from "../notifications/NotificationsPanel";
import { quickCreateActions } from "../../config/moduleRegistry";
import "./AtlasHeader.css";

const TABS: Workspace[] = ["company", "factory", "pos"];

// Static demo notifications rotated in the header ticker (no backend).
const HEADER_NOTIFICATIONS = [
  "تنبيه: 3 فواتير بانتظار المراجعة",
  "تحديث: تم تسجيل 12 عملية بيع اليوم",
  "ملاحظة: مخزون المصنع يحتاج متابعة",
  "تذكير: مراجعة حسابات الموردين قبل نهاية اليوم",
] as const;

export default function AtlasHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspace, setWorkspace } = useWorkspace();
  const { t, isArabic, theme, toggleTheme } = useSettings();

  const [tickerIdx, setTickerIdx] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // ── Rotate header notification ticker every 5s ────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTickerIdx(i => (i + 1) % HEADER_NOTIFICATIONS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Close create menu on outside click ────────────────────────────────────
  useEffect(() => {
    if (!createOpen) return;
    function onDown(e: MouseEvent) {
      if (
        createBtnRef.current && !createBtnRef.current.contains(e.target as Node) &&
        createMenuRef.current && !createMenuRef.current.contains(e.target as Node)
      ) setCreateOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setCreateOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [createOpen]);

  // ── Context-aware new action ───────────────────────────────────────────────
  const PAGE_CREATE_MAP: Record<string, { actionId: string; navigateTo: string }> = {
    "/customers": { actionId: "new-customer", navigateTo: "/customers/new" },
    "/invoices":  { actionId: "new-invoice",  navigateTo: "/invoices" },
    "/purchases": { actionId: "new-purchase", navigateTo: "/purchases" },
    "/suppliers": { actionId: "new-supplier", navigateTo: "/suppliers/new" },
    "/payments":  { actionId: "new-payment",  navigateTo: "/payments" },
  };
  const basePath = `/${location.pathname.split("/")[1]}`;
  const ctxEntry = PAGE_CREATE_MAP[basePath] ?? null;
  const ctxAction = ctxEntry
    ? quickCreateActions.find(a => a.id === ctxEntry.actionId) ?? null
    : null;
  const ctxLabel = ctxAction
    ? (t.shell.quickCreateItems[ctxAction.id as keyof typeof t.shell.quickCreateItems]?.label ?? ctxAction.label)
    : t.header.newAction;

  // ── Quick-create: ordered list of IDs to show (first group / second group) ─
  const CREATE_GROUP_1 = ["new-customer", "new-invoice", "new-supplier"];
  const CREATE_GROUP_2 = ["new-employee", "new-expense", "new-pos-sale"];

  // ── Quick-create dropdown position ────────────────────────────────────────
  const [createStyle, setCreateStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!createOpen || !createBtnRef.current) return;
    const rect = createBtnRef.current.getBoundingClientRect();
    setCreateStyle({
      position: "fixed",
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      width: 260,
      zIndex: 200,
    });
  }, [createOpen]);

  return (
    <header className="atlas-header" dir={isArabic ? "rtl" : "ltr"}>
      {/* Left: logo + brand */}
      <div className="atlas-header-left">
        <button
          type="button"
          className="atlas-brand-btn"
          onClick={() => navigate("/dashboard")}
          aria-label={t.header.brand}
        >
          <span className="atlas-brand-logo-sm" aria-hidden>A</span>
          <span className="atlas-brand-name">{t.header.brand}</span>
        </button>
      </div>

      {/* Center: rotating notifications ticker */}
        <div className="atlas-header-center">
          <div className="atlas-header-ticker" role="status" aria-live="polite">
            <Bell size={14} aria-hidden />
            <span key={tickerIdx} className="atlas-ticker-text">
              {HEADER_NOTIFICATIONS[tickerIdx]}
            </span>
          </div>
      </div>

      {/* Right: workspace tabs + actions */}
      <div className="atlas-header-right">
        <div className="atlas-workspace-tabs" role="tablist" aria-label={t.header.workspace}>
          {TABS.map((id) => {
            const info = WORKSPACES[id];
            const isActive = workspace === id;
            const wsName = t.header.workspaces[id as keyof typeof t.header.workspaces] ?? info.name;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`atlas-ws-tab atlas-ws-tab--${info.color} ${isActive ? "is-active" : ""}`}
                onClick={() => setWorkspace(id)}
                title={`${wsName} (${info.shortcut})`}
              >
                <span>{wsName}</span>
              </button>
            );
          })}
        </div>

        <NotificationsPanel />

        <button
          type="button"
          className="atlas-theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div style={{ position: "relative" }}>
          <Button
            ref={createBtnRef}
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => {
              if (ctxEntry) { navigate(ctxEntry.navigateTo); }
              else { setCreateOpen(v => !v); }
            }}
            aria-expanded={ctxEntry ? undefined : createOpen}
            aria-haspopup={ctxEntry ? undefined : "menu"}
          >
            {ctxLabel}
          </Button>

          {!ctxEntry && createOpen && createPortal(
            <div
              ref={createMenuRef}
              className="atlas-create-menu"
              style={createStyle}
              role="menu"
              aria-label={t.header.quickCreate}
            >
              <div className="atlas-create-menu-head">{t.header.quickCreate}</div>
              {quickCreateActions
                .filter(a => CREATE_GROUP_1.includes(a.id))
                .sort((a, b) => CREATE_GROUP_1.indexOf(a.id) - CREATE_GROUP_1.indexOf(b.id))
                .map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      role="menuitem"
                      className="atlas-create-item"
                      onClick={() => { navigate(action.path); setCreateOpen(false); }}
                    >
                      {Icon && <Icon size={14} className="atlas-create-item-icon" aria-hidden />}
                      <span className="atlas-create-item-label">
                        {t.shell.quickCreateItems[action.id as keyof typeof t.shell.quickCreateItems]?.label ?? action.label}
                      </span>
                      <ChevronRight size={12} aria-hidden />
                    </button>
                  );
                })}
              <div className="atlas-create-divider" role="separator" />
              {quickCreateActions
                .filter(a => CREATE_GROUP_2.includes(a.id))
                .sort((a, b) => CREATE_GROUP_2.indexOf(a.id) - CREATE_GROUP_2.indexOf(b.id))
                .map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      role="menuitem"
                      className="atlas-create-item"
                      onClick={() => { navigate(action.path); setCreateOpen(false); }}
                    >
                      {Icon && <Icon size={14} className="atlas-create-item-icon" aria-hidden />}
                      <span className="atlas-create-item-label">
                        {t.shell.quickCreateItems[action.id as keyof typeof t.shell.quickCreateItems]?.label ?? action.label}
                      </span>
                      <ChevronRight size={12} aria-hidden />
                    </button>
                  );
                })}
            </div>,
            document.body
          )}
        </div>
      </div>
    </header>
  );
}
