import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { moduleGroups, moduleRegistry } from "../../config/moduleRegistry";

type SidebarProps = {
  mobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export default function Sidebar({
  mobile = false,
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { t, isArabic } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (mobile && onClose) {
      onClose();
    }

    logout();
    navigate("/login");
  };

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "sidebar-link active" : "sidebar-link";

  const groupedModules = Object.entries(moduleGroups).map(
    ([groupKey, groupLabel]) => ({
      groupKey,
      groupLabel: t.groups[groupKey as keyof typeof t.groups] || groupLabel,
      items: moduleRegistry.filter((item) => item.group === groupKey),
    })
  );

  return (
    <aside
      className={[
        "sidebar",
        mobile ? "mobile-drawer-sidebar" : "desktop-sidebar",
        collapsed && !mobile ? "collapsed" : "",
        mobile && isOpen ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      dir={isArabic ? "rtl" : "ltr"}
      aria-hidden={mobile ? !isOpen : undefined}
    >
      <div>
        <div className="sidebar-head">
          <div className="sidebar-title-block">
            <h2 className="sidebar-title">
              {collapsed && !mobile ? "PF" : t.sidebar.title}
            </h2>

            {!collapsed || mobile ? (
              <span className="sidebar-subtitle">{t.sidebar.subtitle}</span>
            ) : null}
          </div>

          {!mobile ? (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={onToggleCollapsed}
              aria-label={
                collapsed
                  ? t.sidebar.expandNavigation
                  : t.sidebar.collapseNavigation
              }
            >
              {collapsed ? (
                <PanelLeftOpen size={16} />
              ) : (
                <PanelLeftClose size={16} />
              )}
            </button>
          ) : null}

          {mobile ? (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={onClose}
              aria-label={t.sidebar.closeNavigation}
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <nav className="sidebar-nav">
          {groupedModules.map((group) => (
            <div key={group.groupKey} className="sidebar-group">
              <span className="sidebar-group-label">{group.groupLabel}</span>

              <div className="sidebar-group-links">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  const label =
                    item.path && item.key in t.sidebar
                      ? t.sidebar[item.key as keyof typeof t.sidebar]
                      : t.modules[item.key as keyof typeof t.modules]?.label ||
                        item.label;

                  const description =
                    t.modules[item.key as keyof typeof t.modules]
                      ?.description || item.description;

                  if (!item.path) {
                    return (
                      <div
                        key={item.key}
                        className={`sidebar-link sidebar-link-disabled ${
                          item.future ? "sidebar-link-planned" : ""
                        }`}
                      >
                        <span className="sidebar-link-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>

                        <span
                          className={`sidebar-link-text ${
                            collapsed && !mobile ? "collapsed" : ""
                          }`}
                        >
                          {label}

                          {!collapsed || mobile ? (
                            <small>
                              {item.future ? t.sidebar.planned : description}
                            </small>
                          ) : null}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={getLinkClass}
                      onClick={mobile ? onClose : undefined}
                    >
                      <span className="sidebar-link-icon" aria-hidden="true">
                        <Icon size={18} />
                      </span>

                      <span
                        className={`sidebar-link-text ${
                          collapsed && !mobile ? "collapsed" : ""
                        }`}
                      >
                        {label}

                        {!mobile && !collapsed && !item.future ? (
                          <small>{description}</small>
                        ) : null}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        {!collapsed || mobile ? (
          <p className="sidebar-user">
            {t.sidebar.loggedInAs} <strong>{user?.username}</strong>
          </p>
        ) : null}

        <button type="button" className="logout-button" onClick={handleLogout}>
          {t.common.logout}
        </button>
      </div>
    </aside>
  );
} 