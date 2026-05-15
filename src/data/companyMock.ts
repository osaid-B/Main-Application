export type KPITone = "blue" | "green" | "orange" | "purple";

export interface CompanyKPI {
  label: string;
  value: string;
  trend: number;
  subtitle?: string;
  color: KPITone;
}

export const COMPANY_KPIS: CompanyKPI[] = [
  { label: "REVENUE MTD",     value: "$1,872,400", trend: 12.4, color: "green" },
  { label: "OPERATING CASH",  value: "$1,240,500", trend: 8.2,  subtitle: "$184k inflow today",   color: "blue" },
  { label: "RECEIVABLES",     value: "$486,220",   trend: -2.1, subtitle: "32 invoices open",      color: "orange" },
  { label: "PAYABLES",        value: "$312,840",   trend: 5.3,  subtitle: "9 bills due this week", color: "blue" },
  { label: "HEADCOUNT",       value: "184",        trend: 6,    subtitle: "+6 this month",          color: "purple" },
  { label: "EBITDA MARGIN",   value: "22.4%",      trend: 1.8,  color: "green" },
];

export interface CashFlowPoint {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

export const CASH_FLOW: CashFlowPoint[] = [
  { month: "Dec", inflow: 180000, outflow: 145000, net: 35000 },
  { month: "Jan", inflow: 205000, outflow: 165000, net: 40000 },
  { month: "Feb", inflow: 195000, outflow: 158000, net: 37000 },
  { month: "Mar", inflow: 220000, outflow: 172000, net: 48000 },
  { month: "Apr", inflow: 245000, outflow: 185000, net: 60000 },
  { month: "May", inflow: 275000, outflow: 195000, net: 80000 },
];

export interface RevenueSlice {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export const REVENUE_BY_DEPT: RevenueSlice[] = [
  { name: "Wholesale",       value: 898700, percent: 48, color: "#2563EB" },
  { name: "Supermarkets",    value: 524300, percent: 28, color: "#10B981" },
  { name: "Manufacturing",   value: 299580, percent: 16, color: "#8B5CF6" },
  { name: "Other / royalties", value: 149820, percent: 8, color: "#F97316" },
];

export type InvoiceStatus = "due-soon" | "overdue" | "paid";

export interface OpenInvoice {
  invoice: string;
  customer: string;
  issue: string;
  due: string;
  amount: number;
  status: InvoiceStatus;
}

export const OPEN_INVOICES: OpenInvoice[] = [
  { invoice: "INV-2312", customer: "Halawa Bakery Co",      issue: "May 03", due: "May 13", amount: 84200, status: "overdue" },
  { invoice: "INV-2311", customer: "Al Madina Distribution",issue: "May 02", due: "May 17", amount: 42180, status: "due-soon" },
  { invoice: "INV-2310", customer: "Cedar Foods",           issue: "Apr 28", due: "May 12", amount: 28900, status: "overdue" },
  { invoice: "INV-2309", customer: "Beit Hanina Market",    issue: "Apr 30", due: "May 15", amount: 18400, status: "due-soon" },
  { invoice: "INV-2308", customer: "Nazareth Trading",      issue: "Apr 22", due: "May 06", amount: 22100, status: "overdue" },
  { invoice: "INV-2307", customer: "Olive Mills Co",        issue: "May 04", due: "May 19", amount: 14250, status: "due-soon" },
  { invoice: "INV-2306", customer: "Jericho Hotels",        issue: "Apr 26", due: "May 11", amount: 31800, status: "overdue" },
  { invoice: "INV-2305", customer: "Hebron Stone Works",    issue: "May 05", due: "May 20", amount: 9650,  status: "due-soon" },
];

export interface DepartmentRow {
  name: string;
  count: number;
  revenue: number;
  color: "blue" | "green" | "purple" | "gray" | "orange";
}

export const DEPARTMENTS: DepartmentRow[] = [
  { name: "Operations",            count: 42, revenue: 386000, color: "blue" },
  { name: "Sales & Wholesale",     count: 28, revenue: 298000, color: "green" },
  { name: "Manufacturing",         count: 36, revenue: 214000, color: "purple" },
  { name: "Finance & Accounting",  count: 14, revenue: 112000, color: "gray" },
  { name: "IT & Systems",          count: 11, revenue: 92000,  color: "blue" },
  { name: "Procurement",           count:  9, revenue: 78000,  color: "orange" },
];
