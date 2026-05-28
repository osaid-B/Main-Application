import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileText, Package, Plus, Search, Sparkles, Truck, Users } from "lucide-react";
import { Button } from "../ui/Button";
import { useWorkspace, WORKSPACES, type Workspace } from "../../contexts/WorkspaceContext";
import { useAI } from "../../context/AIContext";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext";
import NotificationsPanel from "../notifications/NotificationsPanel";
import { quickCreateActions } from "../../config/moduleRegistry";
import "./AtlasHeader.css";

const TABS: Workspace[] = ["company", "factory", "pos"];

type SearchItem = { id: string; label: string; sub?: string; path: string };
type SearchGroup = { label: string; icon: typeof Users; items: SearchItem[] };

const MAX_PER_GROUP = 4;

export default function AtlasHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspace, setWorkspace } = useWorkspace();
  const { openAI } = useAI();
  const { t, isArabic } = useSettings();
  const { customers, invoices, products, suppliers } = useData();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // ── Position search dropdown under the search bar ─────────────────────────
  useEffect(() => {
    if (!searchOpen || !searchWrapRef.current) return;
    const rect = searchWrapRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 400),
      zIndex: 200,
    });
  }, [searchOpen]);

  // ── Close search on outside click / Escape ────────────────────────────────
  useEffect(() => {
    if (!searchOpen) return;
    function onDown(e: MouseEvent) {
      if (
        searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSearchOpen(false); inputRef.current?.blur(); }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [searchOpen]);

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

  // ── Search results ─────────────────────────────────────────────────────────
  const groups = useMemo((): SearchGroup[] => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const out: SearchGroup[] = [];

    const custHits = customers
      .filter(c => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (custHits.length) out.push({
      label: t.sidebar.customers,
      icon: Users,
      items: custHits.map(c => ({ id: c.id, label: c.name, sub: c.code, path: "/customers" })),
    });

    const invHits = invoices
      .filter(inv => {
        const custName = customers.find(c => c.id === inv.customerId)?.name ?? "";
        return inv.id?.toLowerCase().includes(q) || custName.toLowerCase().includes(q);
      })
      .slice(0, MAX_PER_GROUP);
    if (invHits.length) out.push({
      label: t.sidebar.invoices,
      icon: FileText,
      items: invHits.map(inv => ({
        id: inv.id,
        label: customers.find(c => c.id === inv.customerId)?.name ?? inv.id,
        sub: inv.id,
        path: `/invoices?highlight=${inv.id}`,
      })),
    });

    const prodHits = products
      .filter(p => p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (prodHits.length) out.push({
      label: t.sidebar.products,
      icon: Package,
      items: prodHits.map(p => ({ id: p.id, label: p.name, sub: p.code, path: "/products" })),
    });

    const suppHits = suppliers
      .filter(s => s.name?.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (suppHits.length) out.push({
      label: t.sidebar.suppliers,
      icon: Truck,
      items: suppHits.map(s => ({ id: s.id, label: s.name, path: "/suppliers" })),
    });

    return out;
  }, [query, customers, invoices, products, suppliers, t.sidebar]);

  const flatItems = useMemo(() => groups.flatMap(g => g.items), [groups]);
  const totalResults = flatItems.length;


  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setSearchOpen(false);
    setQuery("");
  }, [navigate]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!searchOpen) setSearchOpen(true);
      setActiveIdx(i => Math.min(i + 1, totalResults - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[activeIdx]) handleSelect(flatItems[activeIdx].path);
    }
  }

  // ── Compute flat index offset per group (for keyboard nav) ────────────────
  let flatOffset = 0;

  // ── Page title ─────────────────────────────────────────────────────────────
  const pageTitles = t.header.pageTitles as unknown as Record<string, string>;
  const pageTitle =
    pageTitles[location.pathname] ??
    pageTitles[`/${location.pathname.split("/")[1]}`] ??
    "";

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
    <header className={`atlas-header${scrolled ? " is-scrolled" : ""}`} dir={isArabic ? "rtl" : "ltr"}>
      {/* Left: breadcrumb */}
      <div className="atlas-header-left">
        <nav aria-label="Breadcrumb" className="atlas-breadcrumb">
          <span>{t.header.brand}</span>
          <ChevronLeft size={12} className="atlas-breadcrumb-sep" aria-hidden />
          <span className="atlas-breadcrumb-current">{pageTitle}</span>
        </nav>
      </div>

      {/* Center: global search */}
      <div className="atlas-header-center">
        <div className="atlas-search-wrap" ref={searchWrapRef}>
          <div className="atlas-global-search">
            <Search size={14} aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder={t.header.searchPlaceholder}
              aria-label={t.header.globalSearch}
              aria-expanded={searchOpen}
              aria-haspopup="listbox"
              autoComplete="off"
              onChange={e => {
                setQuery(e.target.value);
                setActiveIdx(0);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {searchOpen && totalResults > 0 && createPortal(
            <div
              className="atlas-search-dropdown"
              style={dropdownStyle}
              role="listbox"
              aria-label={t.header.globalSearch}
            >
              {groups.map(group => {
                const Icon = group.icon;
                const groupStart = flatOffset;
                flatOffset += group.items.length;
                return (
                  <div key={group.label} className="atlas-search-group">
                    <div className="atlas-search-group-label">
                      <Icon size={11} aria-hidden />
                      <span>{group.label}</span>
                    </div>
                    {group.items.map((item, localIdx) => {
                      const globalIdx = groupStart + localIdx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={activeIdx === globalIdx}
                          className={`atlas-search-result ${activeIdx === globalIdx ? "is-active" : ""}`}
                          onClick={() => handleSelect(item.path)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                        >
                          <span className="atlas-search-result-label">{item.label}</span>
                          {item.sub && <span className="atlas-search-result-sub">{item.sub}</span>}
                          <ChevronRight size={12} className="atlas-search-result-chevron" aria-hidden />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>,
            document.body
          )}

          {searchOpen && query.trim().length >= 2 && totalResults === 0 && createPortal(
            <div className="atlas-search-dropdown atlas-search-empty" style={dropdownStyle}>
              <span>{t.header.searchNoResults} "{query}"</span>
            </div>,
            document.body
          )}
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
                <span className={`status-dot status-dot--${info.color === "blue" ? "blue" : info.color === "green" ? "green" : "purple"}`} aria-hidden />
                <span>{wsName}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="atlas-icon-btn"
          onClick={() => openAI()}
          aria-label={t.header.openAI}
          title={t.header.openAI}
        >
          <Sparkles size={15} />
        </button>

        <NotificationsPanel />

        <div style={{ position: "relative" }}>
          <Button
            ref={createBtnRef}
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setCreateOpen(v => !v)}
            aria-expanded={createOpen}
            aria-haspopup="menu"
          >
            {t.header.newAction}
          </Button>

          {createOpen && createPortal(
            <div
              ref={createMenuRef}
              className="atlas-create-menu"
              style={createStyle}
              role="menu"
              aria-label={t.header.quickCreate}
            >
              <div className="atlas-create-menu-head">{t.header.quickCreate}</div>
              {quickCreateActions.slice(0, 5).map(action => (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  className="atlas-create-item"
                  onClick={() => { navigate(action.path); setCreateOpen(false); }}
                >
                  <span className="atlas-create-item-label">
                    {t.shell.quickCreateItems[action.id as keyof typeof t.shell.quickCreateItems]?.label ?? action.label}
                  </span>
                  <ChevronRight size={12} aria-hidden />
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </div>
    </header>
  );
}
