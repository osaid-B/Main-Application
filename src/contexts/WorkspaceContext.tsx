import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
    description: "Supermarket checkout, products & loyalty coins.",
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

function readStored(): Workspace {
  if (typeof window === "undefined") return "company";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "company" || saved === "factory" || saved === "pos") return saved;
  return "company";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace>(readStored);

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
      if (e.key === "1") { e.preventDefault(); setWorkspaceState("company"); }
      else if (e.key === "2") { e.preventDefault(); setWorkspaceState("factory"); }
      else if (e.key === "3") { e.preventDefault(); setWorkspaceState("pos"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace: setWorkspaceState, info: WORKSPACES[workspace] }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
