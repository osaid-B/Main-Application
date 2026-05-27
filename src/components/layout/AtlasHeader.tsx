import { useLocation } from "react-router-dom";
import { ChevronLeft, Plus, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { useWorkspace, WORKSPACES, type Workspace } from "../../contexts/WorkspaceContext";
import { useAI } from "../../context/AIContext";
import { useSettings } from "../../context/SettingsContext";
import NotificationsPanel from "../notifications/NotificationsPanel";
import "./AtlasHeader.css";

const TABS: Workspace[] = ["company", "factory", "pos"];

export default function AtlasHeader() {
  const location = useLocation();
  const { workspace, setWorkspace } = useWorkspace();
  const { openAI } = useAI();
  const { t } = useSettings();

  const pageTitles = t.header.pageTitles as unknown as Record<string, string>;
  const pageTitle =
    pageTitles[location.pathname] ??
    pageTitles[`/${location.pathname.split("/")[1]}`] ??
    "";

  return (
    <header className="atlas-header">
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
        <div className="atlas-global-search">
          <Sparkles size={14} aria-hidden />
          <input
            type="search"
            placeholder={t.header.searchPlaceholder}
            aria-label={t.header.globalSearch}
          />
          <kbd>⌘K</kbd>
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

        {/* Notifications bell — now using NotificationsPanel */}
        <NotificationsPanel />

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-quick-create"))}
        >
          {t.header.newAction}
        </Button>
      </div>
    </header>
  );
}
