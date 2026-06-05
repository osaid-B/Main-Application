import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type Workspace = "company" | "pos" | "factory";

export interface WorkspaceInfo {
  id: Workspace;
  name: string;
  nameAr: string;
  description: string;
  shortcut: string;
  color: "blue" | "green" | "purple";
}

export const WORKSPACES: Record<Workspace, WorkspaceInfo> = {
  company: {
    id: "company",
    name: "Company",
    nameAr: "الشركة",
    description: "Accounting, CRM, HR & finance · the parent entity.",
    shortcut: "⌘1",
    color: "blue",
  },
  factory: {
    id: "factory",
    name: "Factory",
    nameAr: "المصنع",
    description: "Production orders, BOMs, raw materials & imports.",
    shortcut: "⌘2",
    color: "purple",
  },
  pos: {
    id: "pos",
    name: "POS",
    nameAr: "نقطة البيع",
    description: "Supermarket checkout, products & cashiers.",
    shortcut: "⌘3",
    color: "green",
  },
};

interface WorkspaceContextValue {
  workspace: Workspace;
  setWorkspace: (ws: Workspace) => void;
  info: WorkspaceInfo;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = "atlas-workspace";
const WORKSPACE_DASHBOARD_ROUTES: Record<Workspace, string> = {
  company: "/dashboard",
  factory: "/factory/dashboard",
  pos: "/pos/dashboard",
};

function readStored(): Workspace {
  if (typeof window === "undefined") return "company";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "company" || saved === "factory" || saved === "pos") return saved;
  return "company";
}

function resolveWorkspaceFromPathname(pathname: string): Workspace | null {
  if (pathname === "/" || pathname === "/login" || pathname === "/modules") return null;
  if (pathname.startsWith("/factory")) return "factory";
  if (pathname.startsWith("/pos")) return "pos";
  return "company";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [preferredWorkspace, setPreferredWorkspace] = useState<Workspace>(readStored);

  const routeWorkspace = useMemo(
    () => resolveWorkspaceFromPathname(location.pathname),
    [location.pathname]
  );

  const workspace = routeWorkspace ?? preferredWorkspace;

  const setWorkspace = useCallback((ws: Workspace) => {
    setPreferredWorkspace(ws);
    const targetRoute = WORKSPACE_DASHBOARD_ROUTES[ws];
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!routeWorkspace || routeWorkspace === preferredWorkspace) return;
    setPreferredWorkspace(routeWorkspace);
  }, [preferredWorkspace, routeWorkspace]);

  useEffect(() => {
    document.body.setAttribute("data-workspace", workspace);
    window.localStorage.setItem(STORAGE_KEY, workspace);
    return () => {
      document.body.removeAttribute("data-workspace");
    };
  }, [workspace]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      if (e.key === "1") { e.preventDefault(); setWorkspace("company"); }
      else if (e.key === "2") { e.preventDefault(); setWorkspace("factory"); }
      else if (e.key === "3") { e.preventDefault(); setWorkspace("pos"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setWorkspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, info: WORKSPACES[workspace] }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
