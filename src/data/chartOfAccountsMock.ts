import type { ChartAccount } from "./types";

export const CHART_OF_ACCOUNTS: ChartAccount[] = [
  // 1000 Assets
  { id: "1000", code: "1000", nameAr: "الأصول",                         nameEn: "Assets",                    type: "asset",     normalBalance: "debit",  isParent: true,  isActive: true },
  { id: "1100", code: "1100", nameAr: "الأصول المتداولة",               nameEn: "Current Assets",            type: "asset",     normalBalance: "debit",  isParent: true,  parentId: "1000", isActive: true },
  { id: "1110", code: "1110", nameAr: "الصندوق والبنك",                 nameEn: "Cash & Bank",               type: "asset",     normalBalance: "debit",  isParent: false, parentId: "1100", isActive: true },
  { id: "1120", code: "1120", nameAr: "الذمم المدينة",                  nameEn: "Accounts Receivable",       type: "asset",     normalBalance: "debit",  isParent: false, parentId: "1100", isActive: true },
  { id: "1130", code: "1130", nameAr: "المخزون",                        nameEn: "Inventory",                 type: "asset",     normalBalance: "debit",  isParent: false, parentId: "1100", isActive: true },
  { id: "1140", code: "1140", nameAr: "أصول متداولة أخرى",             nameEn: "Other Current Assets",      type: "asset",     normalBalance: "debit",  isParent: false, parentId: "1100", isActive: true },
  { id: "1200", code: "1200", nameAr: "الأصول الثابتة",                 nameEn: "Fixed Assets",              type: "asset",     normalBalance: "debit",  isParent: true,  parentId: "1000", isActive: true },
  { id: "1210", code: "1210", nameAr: "الممتلكات والمعدات",             nameEn: "Property & Equipment",      type: "asset",     normalBalance: "debit",  isParent: false, parentId: "1200", isActive: true },
  { id: "1211", code: "1211", nameAr: "مجمع الاستهلاك",                nameEn: "Accumulated Depreciation",  type: "asset",     normalBalance: "credit", isParent: false, parentId: "1200", isActive: true },
  // 2000 Liabilities
  { id: "2000", code: "2000", nameAr: "الخصوم",                         nameEn: "Liabilities",               type: "liability", normalBalance: "credit", isParent: true,  isActive: true },
  { id: "2100", code: "2100", nameAr: "الخصوم المتداولة",               nameEn: "Current Liabilities",       type: "liability", normalBalance: "credit", isParent: true,  parentId: "2000", isActive: true },
  { id: "2110", code: "2110", nameAr: "الذمم الدائنة",                  nameEn: "Accounts Payable",          type: "liability", normalBalance: "credit", isParent: false, parentId: "2100", isActive: true },
  { id: "2120", code: "2120", nameAr: "ضريبة القيمة المضافة المستحقة", nameEn: "VAT Payable",               type: "liability", normalBalance: "credit", isParent: false, parentId: "2100", isActive: true },
  { id: "2130", code: "2130", nameAr: "مصروفات مستحقة",                nameEn: "Accrued Expenses",          type: "liability", normalBalance: "credit", isParent: false, parentId: "2100", isActive: true },
  { id: "2200", code: "2200", nameAr: "الخصوم طويلة الأجل",            nameEn: "Long-term Liabilities",     type: "liability", normalBalance: "credit", isParent: true,  parentId: "2000", isActive: true },
  { id: "2210", code: "2210", nameAr: "قروض طويلة الأجل",              nameEn: "Long-term Loans",           type: "liability", normalBalance: "credit", isParent: false, parentId: "2200", isActive: true },
  // 3000 Equity
  { id: "3000", code: "3000", nameAr: "حقوق الملكية",                  nameEn: "Equity",                    type: "equity",    normalBalance: "credit", isParent: true,  isActive: true },
  { id: "3100", code: "3100", nameAr: "رأس المال المدفوع",             nameEn: "Paid-in Capital",           type: "equity",    normalBalance: "credit", isParent: false, parentId: "3000", isActive: true },
  { id: "3200", code: "3200", nameAr: "الأرباح المتراكمة",             nameEn: "Retained Earnings",         type: "equity",    normalBalance: "credit", isParent: false, parentId: "3000", isActive: true },
  { id: "3300", code: "3300", nameAr: "احتياطي قانوني",                nameEn: "Legal Reserve",             type: "equity",    normalBalance: "credit", isParent: false, parentId: "3000", isActive: true },
  // 4000 Revenue
  { id: "4000", code: "4000", nameAr: "الإيرادات",                     nameEn: "Revenue",                   type: "revenue",   normalBalance: "credit", isParent: true,  isActive: true },
  { id: "4100", code: "4100", nameAr: "إيرادات المبيعات",              nameEn: "Sales Revenue",             type: "revenue",   normalBalance: "credit", isParent: false, parentId: "4000", isActive: true },
  { id: "4200", code: "4200", nameAr: "إيرادات أخرى",                 nameEn: "Other Revenue",             type: "revenue",   normalBalance: "credit", isParent: false, parentId: "4000", isActive: true },
  // 5000 Expenses
  { id: "5000", code: "5000", nameAr: "المصروفات",                     nameEn: "Expenses",                  type: "expense",   normalBalance: "debit",  isParent: true,  isActive: true },
  { id: "5100", code: "5100", nameAr: "تكلفة البضاعة المباعة",        nameEn: "Cost of Goods Sold",        type: "expense",   normalBalance: "debit",  isParent: false, parentId: "5000", isActive: true },
  { id: "5200", code: "5200", nameAr: "مصروفات التشغيل",              nameEn: "Operating Expenses",        type: "expense",   normalBalance: "debit",  isParent: true,  parentId: "5000", isActive: true },
  { id: "5210", code: "5210", nameAr: "رواتب وأجور",                  nameEn: "Salaries & Wages",          type: "expense",   normalBalance: "debit",  isParent: false, parentId: "5200", isActive: true },
  { id: "5220", code: "5220", nameAr: "إيجار ومرافق",                 nameEn: "Rent & Utilities",          type: "expense",   normalBalance: "debit",  isParent: false, parentId: "5200", isActive: true },
  { id: "5230", code: "5230", nameAr: "تسويق وإعلان",                 nameEn: "Marketing & Advertising",   type: "expense",   normalBalance: "debit",  isParent: false, parentId: "5200", isActive: true },
  { id: "5240", code: "5240", nameAr: "مصروفات إدارية",               nameEn: "Administrative Expenses",   type: "expense",   normalBalance: "debit",  isParent: false, parentId: "5200", isActive: true },
  { id: "5300", code: "5300", nameAr: "مصروفات التمويل",              nameEn: "Finance Costs",             type: "expense",   normalBalance: "debit",  isParent: false, parentId: "5000", isActive: true },
];
