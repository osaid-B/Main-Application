export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface BreakdownRow {
  name: string;
  transactions: number;
  amount: number;
  share: number;
}

export interface PLLineItem {
  label: string;
  labelAr: string;
  amount: number;
  isTotal?: boolean;
  isNegative?: boolean;
}

export const MONTHLY_FINANCIALS: MonthlyFinancial[] = [
  { month: "Jul",  revenue: 142000, expenses:  89000, grossProfit: 95000, netProfit:  53000 },
  { month: "Aug",  revenue: 158000, expenses:  95000, grossProfit: 107000, netProfit:  63000 },
  { month: "Sep",  revenue: 173000, expenses: 101000, grossProfit: 118000, netProfit:  72000 },
  { month: "Oct",  revenue: 165000, expenses:  98000, grossProfit: 112000, netProfit:  67000 },
  { month: "Nov",  revenue: 190000, expenses: 107000, grossProfit: 130000, netProfit:  83000 },
  { month: "Dec",  revenue: 225000, expenses: 120000, grossProfit: 155000, netProfit: 105000 },
  { month: "Jan",  revenue: 148000, expenses:  93000, grossProfit:  99000, netProfit:  55000 },
  { month: "Feb",  revenue: 162000, expenses:  97000, grossProfit: 109000, netProfit:  65000 },
  { month: "Mar",  revenue: 178000, expenses: 104000, grossProfit: 119000, netProfit:  74000 },
  { month: "Apr",  revenue: 185000, expenses: 108000, grossProfit: 124000, netProfit:  77000 },
  { month: "May",  revenue: 197000, expenses: 112000, grossProfit: 133000, netProfit:  85000 },
  { month: "Jun",  revenue: 214000, expenses: 118000, grossProfit: 145000, netProfit:  96000 },
];

export const SALES_BY_CASHIER: BreakdownRow[] = [
  { name: "Ahmad Qasim",    transactions: 412, amount: 89340, share: 24.1 },
  { name: "Sara Haddad",    transactions: 387, amount: 82100, share: 22.2 },
  { name: "Tariq Mansour",  transactions: 356, amount: 74200, share: 20.0 },
  { name: "Lina Barakat",   transactions: 298, amount: 62450, share: 16.8 },
  { name: "Omar Haddad",    transactions: 241, amount: 52100, share: 14.1 },
  { name: "Dina Saleh",     transactions: 108, amount: 10900, share:  2.8 },
];

export const SALES_BY_METHOD: BreakdownRow[] = [
  { name: "Cash",          transactions: 891, amount: 198500, share: 53.6 },
  { name: "Card",          transactions: 612, amount: 142700, share: 38.5 },
  { name: "Bank Transfer", transactions:  99, amount:  29890, share:  8.1 },
  { name: "Voucher",       transactions:  46, amount:   9200, share:  2.5 },
  { name: "Multi",         transactions:  14, amount:   2340, share:  0.6 },
];

export const SALES_BY_CATEGORY: BreakdownRow[] = [
  { name: "Coffee",      transactions: 584, amount: 112000, share: 30.2 },
  { name: "Food",        transactions: 498, amount: 102500, share: 27.7 },
  { name: "Drinks",      transactions: 312, amount:  66800, share: 18.0 },
  { name: "Bakery",      transactions: 278, amount:  52400, share: 14.1 },
  { name: "Merchandise", transactions:  90, amount:  20000, share:  5.4 },
  { name: "Other",       transactions:  66, amount:  17490, share:  4.6 },
];

export const PL_ITEMS: PLLineItem[] = [
  { label: "Product Sales",    labelAr: "مبيعات المنتجات",    amount: 214000 },
  { label: "Service Revenue",  labelAr: "إيرادات الخدمات",    amount:  18500 },
  { label: "Other Income",     labelAr: "إيرادات أخرى",       amount:   4200 },
  { label: "Total Income",     labelAr: "إجمالي الدخل",       amount: 236700, isTotal: true },
  { label: "Cost of Goods",    labelAr: "تكلفة البضاعة",      amount:  91600, isNegative: true },
  { label: "Gross Profit",     labelAr: "إجمالي الربح",       amount: 145100, isTotal: true },
  { label: "Rent",             labelAr: "الإيجار",            amount:  18000, isNegative: true },
  { label: "Salaries",         labelAr: "الرواتب",            amount:  42000, isNegative: true },
  { label: "Utilities",        labelAr: "المرافق",            amount:   6400, isNegative: true },
  { label: "Marketing",        labelAr: "التسويق",            amount:   7800, isNegative: true },
  { label: "Maintenance",      labelAr: "الصيانة",            amount:   3200, isNegative: true },
  { label: "Other Expenses",   labelAr: "مصروفات أخرى",      amount:   2500, isNegative: true },
  { label: "Total Expenses",   labelAr: "إجمالي المصروفات",   amount:  79900, isNegative: true, isTotal: true },
  { label: "Net Profit",       labelAr: "صافي الربح",         amount:  65200, isTotal: true },
];
