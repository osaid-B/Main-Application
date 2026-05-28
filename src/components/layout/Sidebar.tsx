import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sliders,
  Star,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSidebarPreferences } from "../../context/SidebarPreferencesContext";
import { useSettings } from "../../context/SettingsContext";
import { Avatar } from "../ui/Avatar";
import { useWorkspace, type Workspace } from "../../contexts/WorkspaceContext";
import {
  type NavItem,
  type NavSection,
  COMPANY_SECTIONS,
  POS_SECTIONS,
  FACTORY_SECTIONS,
  ALL_ITEMS,
} from "./sidebarItems";
import "./Sidebar.atlas.css";

type SidebarProps = {
  mobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const SECTIONS_BY_WORKSPACE: Record<Workspace, NavSection[]> = {
  company: COMPANY_SECTIONS,
  pos: POS_SECTIONS,
  factory: FACTORY_SECTIONS,
};

interface ContextMenuState {
  x: number;
  y: number;
  item: NavItem;
}

function NavContextMenu({
  menu,
  onClose,
  prefs,
  onHideWithUndo,
  ts,
}: {
  menu: ContextMenuState;
  onClose: () => void;
  prefs: ReturnType<typeof useSidebarPreferences>;
  onHideWithUndo: (path: string) => void;
  ts: ReturnType<typeof useSettings>["t"]["sidebar"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = prefs.isHidden(menu.item.path);
  const pinned = prefs.isPinned(menu.item.path);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="atlas-ctx-menu"
      style={{ top: menu.y, left: menu.x }}
      role="menu"
    >
      <button
        type="button"
        role="menuitem"
        className="atlas-ctx-item"
        onClick={() => {
          if (hidden) { prefs.showItem(menu.item.path); }
          else { onHideWithUndo(menu.item.path); }
          onClose();
        }}
      >
        {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
        <span>{hidden ? ts.ctxShow : ts.ctxHide}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="atlas-ctx-item"
        onClick={() => { if (pinned) prefs.unpinItem(menu.item.path); else prefs.pinItem(menu.item.path); onClose(); }}
      >
        {pinned ? <X size={13} /> : <Star size={13} />}
        <span>{pinned ? ts.ctxUnpin : ts.ctxPin}</span>
      </button>
    </div>
  );
}

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
  const { t, isArabic } = useSettings();
  const ts = t.sidebar;
  const [editMode, setEditMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [undoToast, setUndoToast] = useState<{ path: string; label: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userName = user?.username ?? "Sara Halim";
  const userRole = "Owner";

  const sections = SECTIONS_BY_WORKSPACE[workspace];

  // Resolve pinned item metadata from any workspace's item list
  const pinnedItems = prefs.pinnedItems
    .map((path) => ALL_ITEMS.find((i) => i.path === path))
    .filter((i): i is NavItem => i !== undefined);

  function sectionKey(title: string) {
    return `${workspace}:${title}`;
  }

  function openContextMenu(e: React.MouseEvent, item: NavItem) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  function hideWithUndo(path: string) {
    const item = ALL_ITEMS.find((i) => i.path === path);
    prefs.hideItem(path);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoToast({ path, label: item?.label ?? path });
    undoTimerRef.current = setTimeout(() => setUndoToast(null), 5000);
  }

  function undoHide() {
    if (!undoToast) return;
    prefs.showItem(undoToast.path);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoToast(null);
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
            aria-label={collapsed ? ts.expandNavigation : ts.collapseNavigation}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        ) : (
          <button
            type="button"
            className="atlas-sidebar-toggle"
            onClick={onClose}
            aria-label={ts.closeNavigation}
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
        {/* Pinned section — appears at top when user has pinned items */}
        {!editMode && pinnedItems.length > 0 && (
          <div className="atlas-nav-section">
            {(!collapsed || mobile) && (
              <div className="atlas-nav-section-header">
                <h4 className="atlas-nav-section-title">{ts.pinnedSection}</h4>
              </div>
            )}
            <ul className="atlas-nav-list">
              {pinnedItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        ["atlas-nav-link", isActive ? "is-active" : ""].filter(Boolean).join(" ")
                      }
                      onClick={() => { if (mobile && onClose) onClose(); }}
                      onContextMenu={(e) => openContextMenu(e, item)}
                    >
                      <Icon size={16} />
                      {(!collapsed || mobile) && <span className="atlas-nav-label">{isArabic ? (item.labelAr ?? item.label) : item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

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
                  <h4 className="atlas-nav-section-title">{isArabic ? (section.titleAr ?? section.title) : section.title}</h4>
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
                              <span className={`atlas-nav-label ${hidden ? "atlas-nav-label--dim" : ""}`}>{isArabic ? (item.labelAr ?? item.label) : item.label}</span>
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
                          onContextMenu={(e) => openContextMenu(e, item)}
                          aria-disabled={item.comingSoon || undefined}
                          title={item.comingSoon ? ts.comingSoon : undefined}
                        >
                          <Icon size={16} />
                          {(!collapsed || mobile) && (
                            <>
                              <span className="atlas-nav-label">{isArabic ? (item.labelAr ?? item.label) : item.label}</span>
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
                {ts.done}
              </button>
              <button
                type="button"
                className="atlas-customize-reset"
                onClick={() => { prefs.resetToDefaults(); setEditMode(false); }}
              >
                {ts.resetDefaults}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="atlas-customize-btn"
              onClick={() => setEditMode(true)}
              aria-label={ts.customize}
            >
              <Sliders size={13} />
              <span>{ts.customize}</span>
            </button>
          )}
        </div>
      )}

      {/* Undo toast */}
      {undoToast && (
        <div className="atlas-undo-toast" role="status">
          <span>{ts.hiddenToast}</span>
          <button type="button" className="atlas-undo-btn" onClick={undoHide}>
            {ts.undoHide}
          </button>
        </div>
      )}

      {contextMenu && (
        <NavContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          prefs={prefs}
          onHideWithUndo={hideWithUndo}
          ts={ts}
        />
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
