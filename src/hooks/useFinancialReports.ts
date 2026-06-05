import { useMemo } from "react";
import { useData } from "../context/DataContext";
import { computeAllReports, type ReportData } from "../lib/reportCompute";

export function useFinancialReports(): ReportData {
  const { invoices, expenses, payments } = useData();
  return useMemo(
    () => computeAllReports(invoices, expenses, payments),
    [invoices, expenses, payments],
  );
}
