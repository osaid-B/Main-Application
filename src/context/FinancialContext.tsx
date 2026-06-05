import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useData } from "./DataContext";
import { computeFinancialSummary, type FinancialSummary } from "../lib/financialCompute";

interface FinancialContextValue {
  summary: FinancialSummary;
}

const FinancialContext = createContext<FinancialContextValue | null>(null);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const { invoices, expenses, payments } = useData();

  const summary = useMemo(
    () => computeFinancialSummary(invoices, expenses, payments),
    [invoices, expenses, payments],
  );

  return (
    <FinancialContext.Provider value={{ summary }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial(): FinancialContextValue {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error("useFinancial must be used within FinancialProvider");
  return ctx;
}
