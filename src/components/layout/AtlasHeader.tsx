import { useLocation } from "react-router-dom";
import { Bell, ChevronLeft, Plus, Search, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { useWorkspace, WORKSPACES, type Workspace } from "../../contexts/WorkspaceContext";
import { useAI } from "../../context/AIContext";
import "./AtlasHeader.css";

const PAGE_TITLES: Record<string, string> = {
  "/": "Operations Command",
  "/dashboard": "Operations Command",
  "/company": "Company Overview",
  "/customers": "Customers",
  "/customers/new": "Add Customer",
  "/suppliers": "Suppliers",
  "/suppliers/new": "Add Supplier",
  "/employees": "Employees",
  "/employees/new": "Add Employee",
  "/invoices": "Invoices",
  "/payments": "Payments",
  "/purchases": "Purchases",
  "/products": "Inventory",
  "/treasury": "Treasury",
  "/settings": "Settings",
  "/data-import": "Data Import",
  "/preview": "Design Preview",
};

const TABS: Workspace[] = ["company", "factory", "pos"];

export default function AtlasHeader() {
  const location = useLocation();
  const { workspace, setWorkspace } = useWorkspace();
  const { openAI } = useAI();

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    PAGE_TITLES[`/${location.pathname.split("/")[1]}`] ??
    "";

  return (
    <header className="atlas-header">
      {/* Left: breadcrumb */}
      <div className="atlas-header-left">
        <nav aria-label="Breadcrumb" className="atlas-breadcrumb">
          <span>Atlas ERP</span>
          <ChevronLeft size={12} className="atlas-breadcrumb-sep" aria-hidden />
          <span className="atlas-breadcrumb-current">{pageTitle}</span>
        </nav>
      </div>

      {/* Center: global search */}
      <div className="atlas-header-center">
        <div className="atlas-global-search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder="Search customers, invoices, products, orders…"
            aria-label="Global search"
          />
          <kbd>⌘K</kbd>
        </div>
      </div>

      {/* Right: workspace tabs + actions */}
      <div className="atlas-header-right">
        <div className="atlas-workspace-tabs" role="tablist" aria-label="Workspace">
          {TABS.map((id) => {
            const info = WORKSPACES[id];
            const isActive = workspace === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`atlas-ws-tab atlas-ws-tab--${info.color} ${isActive ? "is-active" : ""}`}
                onClick={() => setWorkspace(id)}
                title={`${info.name} (${info.shortcut})`}
              >
                <span className={`status-dot status-dot--${info.color === "blue" ? "blue" : info.color === "green" ? "green" : "purple"}`} aria-hidden />
                <span>{info.name}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="atlas-icon-btn"
          onClick={() => openAI()}
          aria-label="Open AI assistant"
          title="AI assistant"
        >
          <Sparkles size={15} />
        </button>

        <button
          type="button"
          className="atlas-icon-btn"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-alerts"))}
        >
          <Bell size={15} />
          <span className="atlas-notif-badge" aria-hidden>6</span>
        </button>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-quick-create"))}
        >
          New action
        </Button>
      </div>
    </header>
  );
}
