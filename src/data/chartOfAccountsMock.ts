import type { ChartAccount } from "./types";

export const CHART_ACCOUNTS: ChartAccount[] = [
  { id: "1000", name: "Cash & Bank", type: "asset", balance: 142300, currency: "ILS", isActive: true },
  { id: "1100", name: "Petty Cash", type: "asset", parentId: "1000", balance: 2500, currency: "ILS", isActive: true },
  { id: "1200", name: "Accounts Receivable", type: "asset", balance: 84600, currency: "ILS", isActive: true },
  { id: "1300", name: "Inventory", type: "asset", balance: 63200, currency: "ILS", isActive: true },
  { id: "1500", name: "Fixed Assets", type: "asset", balance: 210000, currency: "ILS", isActive: true },
  { id: "2000", name: "Accounts Payable", type: "liability", balance: 41500, currency: "ILS", isActive: true },
  { id: "2100", name: "Accrued Liabilities", type: "liability", balance: 8300, currency: "ILS", isActive: true },
  { id: "2500", name: "Long-term Debt", type: "liability", balance: 95000, currency: "ILS", isActive: true },
  { id: "3000", name: "Owner's Equity", type: "equity", balance: 315800, currency: "ILS", isActive: true },
  { id: "4000", name: "Revenue", type: "revenue", balance: 188500, currency: "ILS", isActive: true },
  { id: "4100", name: "Sales Revenue", type: "revenue", parentId: "4000", balance: 176000, currency: "ILS", isActive: true },
  { id: "4200", name: "Service Revenue", type: "revenue", parentId: "4000", balance: 12500, currency: "ILS", isActive: true },
  { id: "5000", name: "Cost of Goods Sold", type: "expense", balance: 98400, currency: "ILS", isActive: true },
  { id: "6100", name: "Rent Expense", type: "expense", balance: 25000, currency: "ILS", isActive: true },
  { id: "6200", name: "Salaries Expense", type: "expense", balance: 72000, currency: "ILS", isActive: true },
  { id: "6300", name: "Depreciation", type: "expense", balance: 4800, currency: "ILS", isActive: true },
  { id: "6400", name: "Utilities", type: "expense", balance: 3200, currency: "ILS", isActive: true },
];
