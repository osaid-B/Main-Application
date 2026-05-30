import { createContext, useContext, useState, type ReactNode } from "react";

export type ModuleId = "company" | "factory" | "pos";

interface ModuleContextValue {
  activeModule: ModuleId;
  setActiveModule: (m: ModuleId) => void;
  userModules: ModuleId[];
}

const SESSION_KEY = "atlas-active-module";

function readModule(): ModuleId {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored === "company" || stored === "factory" || stored === "pos") return stored;
  return "company";
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModuleState] = useState<ModuleId>(readModule);

  const userModules: ModuleId[] = ["company", "factory", "pos"];

  function setActiveModule(m: ModuleId) {
    sessionStorage.setItem(SESSION_KEY, m);
    setActiveModuleState(m);
  }

  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule, userModules }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule(): ModuleContextValue {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModule must be used inside ModuleProvider");
  return ctx;
}

export const MODULE_META = {
  company: {
    id: "company" as const,
    name: "الشركة",
    desc: "إدارة الفواتير والزبائن والمحاسبة",
    icon: "🏢",
    primaryVar: "var(--module-company-primary)",
    gradient: "var(--module-company-gradient)",
    cls: "module-company",
    homeRoute: "/company/dashboard",
  },
  factory: {
    id: "factory" as const,
    name: "المصنع",
    desc: "إدارة الإنتاج والمخزون والجودة",
    icon: "🏭",
    primaryVar: "var(--module-factory-primary)",
    gradient: "var(--module-factory-gradient)",
    cls: "module-factory",
    homeRoute: "/factory/dashboard",
  },
  pos: {
    id: "pos" as const,
    name: "نقطة البيع",
    desc: "إدارة المبيعات والكاشير والزبائن",
    icon: "🛒",
    primaryVar: "var(--module-pos-primary)",
    gradient: "var(--module-pos-gradient)",
    cls: "module-pos",
    homeRoute: "/pos/dashboard",
  },
} as const;
