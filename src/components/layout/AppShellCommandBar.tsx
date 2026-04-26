import { Bell, BrainCircuit, ChevronRight, Plus, Search } from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  moduleGroups,
  moduleRegistry,
  quickCreateActions,
  rolePresets,
  type RolePreset,
} from "../../config/moduleRegistry";
import {
  getInvoices,
  getPayments,
  getProducts,
  getPurchases,
} from "../../data/storage";
import { useAI } from "../../context/AIContext";
import { useSettings } from "../../context/SettingsContext";

type CommandBarProps = {
  currentPath: string;
};

type ShellSignal = {
  id: string;
  label: string;
  detail: string;
  tone: "critical" | "important" | "info";
  path: string;
};

const ROLE_PRESET_KEY = "app-role-preset";
type LayerKey = "search" | "create" | "alerts";

export default function AppShellCommandBar({ currentPath }: CommandBarProps) {
  const navigate = useNavigate();
  const { openAI } = useAI();
  const { t, isArabic } = useSettings();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [layerStyles, setLayerStyles] = useState<Record<LayerKey, CSSProperties>>({
    search: {},
    create: {},
    alerts: {},
  });
  const [rolePreset, setRolePreset] = useState<RolePreset>(() => {
    const saved = localStorage.getItem(ROLE_PRESET_KEY);
    return rolePresets.includes(saved as RolePreset) ? (saved as RolePreset) : "Admin";
  });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const searchAnchorRef = useRef<HTMLDivElement | null>(null);
  const createAnchorRef = useRef<HTMLDivElement | null>(null);
  const alertsAnchorRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const createPanelRef = useRef<HTMLDivElement | null>(null);
  const alertsPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(ROLE_PRESET_KEY, rolePreset);
  }, [rolePreset]);

  const closeLayers = useCallback(() => {
    setSearchOpen(false);
    setCreateOpen(false);
    setAlertsOpen(false);
  }, []);

  const getAnchor = useCallback((layer: LayerKey) => {
    if (layer === "search") return searchAnchorRef.current;
    if (layer === "create") return createAnchorRef.current;
    return alertsAnchorRef.current;
  }, []);

  const positionLayer = useCallback(
    (layer: LayerKey) => {
      const anchor = getAnchor(layer);
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const gutter = 14;
      const preferredWidth = layer === "search" ? 540 : 380;
      const width = Math.min(preferredWidth, window.innerWidth - gutter * 2);
      const alignStart = layer === "search";
      const rawLeft = alignStart
        ? isArabic
          ? rect.right - width
          : rect.left
        : isArabic
          ? rect.left
          : rect.right - width;
      const left = Math.max(gutter, Math.min(rawLeft, window.innerWidth - width - gutter));
      const spaceBelow = window.innerHeight - rect.bottom - gutter;
      const spaceAbove = rect.top - gutter;
      const shouldOpenUp = spaceBelow < 260 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(480, Math.max(220, shouldOpenUp ? spaceAbove - 10 : spaceBelow - 10));
      const top = shouldOpenUp
        ? Math.max(gutter, rect.top - maxHeight - 10)
        : Math.min(window.innerHeight - gutter - 120, rect.bottom + 10);

      setLayerStyles((current) => ({
        ...current,
        [layer]: {
          left,
          top,
          width,
          maxHeight,
        },
      }));
    },
    [getAnchor, isArabic]
  );

  useLayoutEffect(() => {
    const openLayers: LayerKey[] = [];
    if (searchOpen) openLayers.push("search");
    if (createOpen) openLayers.push("create");
    if (alertsOpen) openLayers.push("alerts");
    if (openLayers.length === 0) return undefined;

    openLayers.forEach(positionLayer);

    const sync = () => openLayers.forEach(positionLayer);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [alertsOpen, createOpen, positionLayer, searchOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideLayer = [
        wrapperRef.current,
        searchPanelRef.current,
        createPanelRef.current,
        alertsPanelRef.current,
      ].some((node) => node?.contains(target));

      if (!isInsideLayer) closeLayers();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLayers();
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeLayers]);

  const shellSignals = useMemo<ShellSignal[]>(() => {
    const invoices = getInvoices();
    const payments = getPayments();
    const products = getProducts();
    const purchases = getPurchases();

    const openInvoices = invoices.filter((invoice) =>
      ["Debit", "Partial", "Pending"].includes(invoice.status ?? "Pending")
    ).length;
    const pendingPayments = payments.filter((payment) =>
      ["Pending", "Partial", "Failed"].includes(payment.status ?? "Pending")
    ).length;
    const stockAlerts = products.filter(
      (product) =>
        Number(product.stock || 0) <= 5 ||
        product.status === "Low Stock" ||
        product.status === "Out of Stock"
    ).length;
    const pendingPurchases = purchases.filter(
      (purchase) => purchase.status === "Pending"
    ).length;

    return [
      {
        id: "open-invoices",
        label: `${openInvoices} ${t.shell.signals.invoices}`,
        detail: t.shell.signalDetails.invoices,
        tone: openInvoices > 0 ? "critical" : "info",
        path: "/invoices",
      },
      {
        id: "pending-payments",
        label: `${pendingPayments} ${t.shell.signals.payments}`,
        detail: t.shell.signalDetails.payments,
        tone: pendingPayments > 0 ? "important" : "info",
        path: "/payments",
      },
      {
        id: "stock-alerts",
        label: `${stockAlerts} ${t.shell.signals.stock}`,
        detail: t.shell.signalDetails.stock,
        tone: stockAlerts > 0 ? "important" : "info",
        path: "/products",
      },
      {
        id: "pending-purchases",
        label: `${pendingPurchases} ${t.shell.signals.purchases}`,
        detail: t.shell.signalDetails.purchases,
        tone: pendingPurchases > 0 ? "important" : "info",
        path: "/purchases",
      },
    ];
  }, [t.shell.signalDetails, t.shell.signals]);

  const matchingModules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return moduleRegistry.filter((item) => !item.future).slice(0, 6);

    return moduleRegistry.filter((item) => {
      const translatedLabel = t.modules[item.key as keyof typeof t.modules]?.label || item.label;
      const translatedDescription = t.modules[item.key as keyof typeof t.modules]?.description || item.description;
      const translatedGroup = t.groups[item.group as keyof typeof t.groups] || moduleGroups[item.group];
      const haystack = `${item.label} ${item.description} ${translatedLabel} ${translatedDescription} ${translatedGroup} ${moduleGroups[item.group]}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, t]);

  const roleSummary = useMemo(() => {
    return t.shell.roleSummary[rolePreset];
  }, [rolePreset, t.shell.roleSummary]);

  const handleNavigate = (path: string) => {
    navigate(path);
    closeLayers();
  };

  const safeSearchIndex = Math.min(
    activeSearchIndex,
    Math.max(0, matchingModules.length - 1)
  );

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      setSearchOpen(true);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSearchIndex((current) =>
        Math.min(current + 1, Math.max(0, matchingModules.length - 1))
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSearchIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (event.key === "Enter") {
      const target = matchingModules[safeSearchIndex];
      if (target?.path) {
        event.preventDefault();
        handleNavigate(target.path);
      }
    }
  };

  const searchLayer =
    searchOpen &&
    createPortal(
      <div
        ref={searchPanelRef}
        className="shell-popover shell-search-panel shell-layer-panel"
        style={layerStyles.search}
        role="dialog"
        aria-label={t.shell.workspaceSearch}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="shell-popover-head">
          <strong>{t.shell.workspaceSearch}</strong>
          <span>
            {matchingModules.length} {t.shell.matches}
          </span>
        </div>

        <div className="shell-search-results" role="listbox">
          {matchingModules.map((module, index) => (
            <button
              key={module.key}
              type="button"
              className={`shell-search-result ${safeSearchIndex === index ? "active" : ""}`}
              onClick={() => {
                if (module.path) handleNavigate(module.path);
              }}
              onMouseEnter={() => setActiveSearchIndex(index)}
              disabled={!module.path}
              role="option"
              aria-selected={safeSearchIndex === index}
            >
              <div>
                <strong>{t.modules[module.key as keyof typeof t.modules]?.label || module.label}</strong>
                <span>{t.modules[module.key as keyof typeof t.modules]?.description || module.description}</span>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </div>,
      document.body
    );

  const createLayer =
    createOpen &&
    createPortal(
      <div
        ref={createPanelRef}
        className="shell-popover shell-action-menu shell-layer-panel"
        style={layerStyles.create}
        role="menu"
        aria-label={t.shell.quickCreate}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="shell-popover-head">
          <strong>{t.shell.quickCreate}</strong>
          <span>{t.shell.operationalShortcuts}</span>
        </div>

        {quickCreateActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="shell-action-item"
            onClick={() => handleNavigate(action.path)}
            role="menuitem"
          >
            <div>
              <strong>{t.shell.quickCreateItems[action.id as keyof typeof t.shell.quickCreateItems]?.label || action.label}</strong>
              <span>{t.shell.quickCreateItems[action.id as keyof typeof t.shell.quickCreateItems]?.description || action.description}</span>
            </div>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>,
      document.body
    );

  const alertsLayer =
    alertsOpen &&
    createPortal(
      <div
        ref={alertsPanelRef}
        className="shell-popover shell-alerts-menu shell-layer-panel"
        style={layerStyles.alerts}
        role="dialog"
        aria-label={t.shell.operationalSignals}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="shell-popover-head">
          <strong>{t.shell.operationalSignals}</strong>
          <span>{t.shell.priorityQueue}</span>
        </div>

        <div className="shell-alert-list">
          {shellSignals.map((signal) => (
            <button
              key={signal.id}
              type="button"
              className={`shell-alert-item tone-${signal.tone}`}
              onClick={() => handleNavigate(signal.path)}
            >
              <div>
                <strong>{signal.label}</strong>
                <span>{signal.detail}</span>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <div className="shell-command-bar" ref={wrapperRef} dir={isArabic ? "rtl" : "ltr"}>
        <div className="shell-command-left">
          <div className="shell-command-search" ref={searchAnchorRef}>
            <Search size={16} />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveSearchIndex(0);
              }}
              onFocus={() => {
                setSearchOpen(true);
                setCreateOpen(false);
                setAlertsOpen(false);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={t.shell.searchPlaceholder}
              aria-label={t.shell.globalSearch}
              aria-expanded={searchOpen}
              aria-haspopup="dialog"
              autoComplete="off"
            />
          </div>

          <div className="shell-role-cluster">
            <div className="shell-role-preset">
              {rolePresets.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={rolePreset === role ? "active" : ""}
                  onClick={() => setRolePreset(role)}
                  aria-pressed={rolePreset === role}
                >
                  {t.shell.roleLabels[role]}
                </button>
              ))}
            </div>
            <span className="shell-role-inline-summary">{roleSummary}</span>
          </div>
        </div>

        <div className="shell-command-right">
          <div className="shell-action-stack">
            <div className="shell-action-anchor" ref={createAnchorRef}>
              <button
                type="button"
                className="shell-toolbar-btn primary"
                onClick={() => {
                  setCreateOpen((current) => !current);
                  setAlertsOpen(false);
                  setSearchOpen(false);
                }}
                aria-expanded={createOpen}
                aria-haspopup="menu"
              >
                <Plus size={16} />
                {t.shell.quickCreate}
              </button>
            </div>

            <button
              type="button"
              className="shell-toolbar-btn"
              onClick={() =>
                openAI({
                  prompt: `Summarize the operational priorities for ${currentPath}`,
                })
              }
            >
              <BrainCircuit size={16} />
              {t.shell.askAI}
            </button>

            <div className="shell-action-anchor" ref={alertsAnchorRef}>
              <button
                type="button"
                className="shell-toolbar-btn"
                onClick={() => {
                  setAlertsOpen((current) => !current);
                  setCreateOpen(false);
                  setSearchOpen(false);
                }}
                aria-expanded={alertsOpen}
                aria-haspopup="dialog"
              >
                <Bell size={16} />
                {t.shell.alerts}
                <span className="shell-count-pill">{shellSignals.length}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {searchLayer}
      {createLayer}
      {alertsLayer}
    </>
  );
}
