import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Factory,
  FileCheck2,
  FileText,
  Globe,
  History,
  Layers,
  LayoutDashboard,
  ListTree,
  Package,
  Receipt,
  RotateCcw,
  Scale,
  Settings,
  Shield,
  ShieldCheck,
  Ship,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Truck,
  UserCircle,
  UserCircle2,
  Users,
  Warehouse,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  icon: ComponentType<{ size?: number }>;
  label: string;
  labelAr?: string;
  path: string;
  badge?: string;
  dot?: boolean;
  comingSoon?: boolean;
}

export interface NavSection {
  title: string;
  titleAr?: string;
  items: NavItem[];
}

export const COMPANY_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",         titleAr: "نظرة عامة",
    items: [
      { icon: LayoutDashboard, label: "Main Dashboard",    labelAr: "لوحة التحكم",          path: "/dashboard" },
      { icon: Building2,       label: "Company",           labelAr: "الشركة",               path: "/company" },
      { icon: DollarSign,      label: "Finance",           labelAr: "المالية",              path: "/treasury" },
    ],
  },
  {
    title: "RELATIONS",        titleAr: "العلاقات التجارية",
    items: [
      { icon: Users,      label: "Customers",   labelAr: "العملاء",          path: "/customers",  badge: "4.2k" },
      { icon: FileCheck2, label: "Quotes",       labelAr: "عروض الأسعار",     path: "/quotes", comingSoon: true },
      { icon: Truck,      label: "Suppliers",   labelAr: "الموردون",         path: "/suppliers" },
      { icon: UserCircle, label: "Employees",   labelAr: "الموظفون",         path: "/employees" },
      { icon: Briefcase,  label: "Departments", labelAr: "الأقسام",          path: "/departments" },
    ],
  },
  {
    title: "ACCOUNTING",       titleAr: "المحاسبة",
    items: [
      { icon: BookOpen,  label: "General Ledger",    labelAr: "دفتر الأستاذ العام", path: "/general-ledger" },
      { icon: ListTree,  label: "Chart of Accounts", labelAr: "دليل الحسابات",    path: "/chart-of-accounts" },
      { icon: FileText,  label: "Invoices",          labelAr: "الفواتير",         path: "/invoices" },
      { icon: Receipt,   label: "Expenses",          labelAr: "المصروفات",        path: "/expenses" },
      { icon: CreditCard,label: "Payments",          labelAr: "المدفوعات",        path: "/payments" },
    ],
  },
  {
    title: "REPORTS",          titleAr: "التقارير",
    items: [
      { icon: BarChart3,  label: "Reports",       labelAr: "التقارير",               path: "/reports" },
      { icon: TrendingUp, label: "Profit & Loss", labelAr: "الأرباح والخسائر",       path: "/reports/profit-loss" },
      { icon: Scale,      label: "Balance Sheet", labelAr: "الميزانية العمومية",     path: "/reports/balance-sheet" },
    ],
  },
  {
    title: "INVENTORY",        titleAr: "المخزون",
    items: [
      { icon: Package,        label: "Products",      labelAr: "المنتجات",      path: "/products" },
      { icon: Warehouse,      label: "Inventory",     labelAr: "المخزون",       path: "/inventory" },
      { icon: ArrowLeftRight, label: "Movements",     labelAr: "حركة المخزون",  path: "/inventory/movements" },
      { icon: Factory,        label: "Manufacturing", labelAr: "التصنيع",       path: "/manufacturing" },
    ],
  },
  {
    title: "ADMIN",            titleAr: "الإدارة",
    items: [
      { icon: Bell,          label: "Notifications", labelAr: "التنبيهات",   path: "/notifications" },
      { icon: Shield,        label: "Permissions",   labelAr: "الصلاحيات",   path: "/permissions" },
      { icon: ClipboardList, label: "Audit Log",     labelAr: "سجل التدقيق", path: "/audit-log" },
      { icon: Settings,      label: "Settings",      labelAr: "الإعدادات",   path: "/settings" },
    ],
  },
];

export const POS_SECTIONS: NavSection[] = [
  {
    title: "REGISTER",         titleAr: "نقطة البيع",
    items: [
      { icon: ShoppingCart, label: "Checkout",      labelAr: "نقطة البيع",    path: "/pos/checkout" },
      { icon: History,      label: "Sales History", labelAr: "سجل المبيعات",  path: "/pos/history" },
      { icon: RotateCcw,    label: "Refunds",       labelAr: "المسترجعات",    path: "/pos/refunds" },
    ],
  },
  {
    title: "CATALOG",          titleAr: "الكتالوج",
    items: [
      { icon: Package,       label: "Products",     labelAr: "المنتجات",    path: "/pos/products" },
      { icon: Tag,           label: "Categories",   labelAr: "الفئات",      path: "/pos/categories" },
      { icon: ClipboardList, label: "Stock Counts", labelAr: "جرد المخزون", path: "/pos/stock" },
    ],
  },
  {
    title: "LOYALTY",          titleAr: "برنامج الولاء",
    items: [
      { icon: UserCircle2, label: "Customer Profile", labelAr: "ملف العميل",      path: "/pos/loyalty/profile" },
      { icon: Clock,       label: "Coins History",    labelAr: "سجل النقاط",      path: "/pos/loyalty/history" },
      { icon: Star,        label: "Coins Settings",   labelAr: "إعدادات النقاط",  path: "/pos/loyalty/settings" },
      { icon: BarChart3,   label: "Coins Reports",    labelAr: "تقارير النقاط",   path: "/pos/loyalty/reports" },
    ],
  },
  {
    title: "ADMIN",            titleAr: "الإدارة",
    items: [
      { icon: Users,   label: "Cashiers", labelAr: "أمناء الصندوق", path: "/pos/cashiers" },
      { icon: Receipt, label: "Receipts", labelAr: "الإيصالات",   path: "/pos/receipts" },
    ],
  },
];

export const FACTORY_SECTIONS: NavSection[] = [
  {
    title: "OPERATIONS",       titleAr: "العمليات",
    items: [
      { icon: Factory,       label: "Factory Dashboard",   labelAr: "لوحة المصنع",        path: "/factory" },
      { icon: ClipboardList, label: "Production Orders",   labelAr: "أوامر الإنتاج",      path: "/factory/orders",  badge: "12" },
      { icon: FileText,      label: "Bills of Material",   labelAr: "قوائم المواد",        path: "/factory/boms" },
      { icon: ShieldCheck,   label: "Quality Control",     labelAr: "ضبط الجودة",          path: "/factory/qc" },
    ],
  },
  {
    title: "INVENTORY",        titleAr: "المخزون",
    items: [
      { icon: Globe,     label: "Local vs Imported", labelAr: "المواد المحلية والمستوردة", path: "/factory/inventory/sources" },
      { icon: Boxes,     label: "Raw Materials",     labelAr: "المواد الخام",       path: "/factory/inventory/raw" },
      { icon: Package,   label: "Finished Goods",    labelAr: "البضائع الجاهزة",   path: "/factory/inventory/finished" },
      { icon: Warehouse, label: "Warehouse",         labelAr: "المستودع",          path: "/factory/inventory/warehouse" },
    ],
  },
  {
    title: "SOURCING",         titleAr: "المصادر والاستيراد",
    items: [
      { icon: Ship,       label: "Imports", labelAr: "الاستيراد", path: "/factory/imports" },
      { icon: Layers,     label: "Batches", labelAr: "الدفعات",   path: "/factory/batches" },
      { icon: DollarSign, label: "Costing", labelAr: "التكاليف",  path: "/factory/costing" },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = [
  ...COMPANY_SECTIONS,
  ...POS_SECTIONS,
  ...FACTORY_SECTIONS,
].flatMap((s) => s.items);
