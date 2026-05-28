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
  path: string;
  badge?: string;
  dot?: boolean;
  comingSoon?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const COMPANY_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Main Dashboard", path: "/dashboard" },
      { icon: Building2, label: "Company", path: "/company" },
      { icon: DollarSign, label: "Finance", path: "/treasury" },
    ],
  },
  {
    title: "RELATIONS",
    items: [
      { icon: Users, label: "Customers", path: "/customers", badge: "4.2k" },
      { icon: FileCheck2, label: "Quotes", path: "/quotes" },
      { icon: Truck, label: "Suppliers", path: "/suppliers" },
      { icon: UserCircle, label: "Employees", path: "/employees" },
      { icon: Briefcase, label: "Departments", path: "/departments" },
    ],
  },
  {
    title: "ACCOUNTING",
    items: [
      { icon: BookOpen, label: "General Ledger", path: "/general-ledger" },
      { icon: ListTree, label: "Chart of Accounts", path: "/chart-of-accounts" },
      { icon: FileText, label: "Invoices", path: "/invoices", dot: true },
      { icon: Receipt, label: "Expenses", path: "/expenses" },
      { icon: CreditCard, label: "Payments", path: "/payments" },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { icon: BarChart3, label: "Reports", path: "/reports" },
      { icon: TrendingUp, label: "Profit & Loss", path: "/reports/profit-loss" },
      { icon: Scale, label: "Balance Sheet", path: "/reports/balance-sheet" },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      { icon: Package, label: "Products", path: "/products" },
      { icon: Warehouse, label: "Inventory", path: "/inventory" },
      { icon: ArrowLeftRight, label: "Movements", path: "/inventory/movements" },
      { icon: Factory, label: "Manufacturing", path: "/manufacturing" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Shield, label: "Permissions", path: "/permissions" },
      { icon: ClipboardList, label: "Audit Log", path: "/audit-log" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

export const POS_SECTIONS: NavSection[] = [
  {
    title: "REGISTER",
    items: [
      { icon: ShoppingCart, label: "Checkout", path: "/pos/checkout" },
      { icon: History, label: "Sales History", path: "/pos/history" },
      { icon: RotateCcw, label: "Refunds", path: "/pos/refunds" },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { icon: Package, label: "Products", path: "/pos/products" },
      { icon: Tag, label: "Categories", path: "/pos/categories" },
      { icon: ClipboardList, label: "Stock Counts", path: "/pos/stock" },
    ],
  },
  {
    title: "LOYALTY",
    items: [
      { icon: UserCircle2, label: "Customer Profile", path: "/pos/loyalty/profile" },
      { icon: Clock, label: "Coins History", path: "/pos/loyalty/history" },
      { icon: Star, label: "Coins Settings", path: "/pos/loyalty/settings" },
      { icon: BarChart3, label: "Coins Reports", path: "/pos/loyalty/reports" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { icon: Users, label: "Cashiers", path: "/pos/cashiers" },
      { icon: Receipt, label: "Receipts", path: "/pos/receipts" },
    ],
  },
];

export const FACTORY_SECTIONS: NavSection[] = [
  {
    title: "OPERATIONS",
    items: [
      { icon: Factory, label: "Factory Dashboard", path: "/factory" },
      { icon: ClipboardList, label: "Production Orders", path: "/factory/orders", badge: "12" },
      { icon: FileText, label: "Bills of Material", path: "/factory/boms" },
      { icon: ShieldCheck, label: "Quality Control", path: "/factory/qc" },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      { icon: Globe, label: "Local vs Imported", path: "/factory/inventory/sources" },
      { icon: Boxes, label: "Raw Materials", path: "/factory/inventory/raw" },
      { icon: Package, label: "Finished Goods", path: "/factory/inventory/finished" },
      { icon: Warehouse, label: "Warehouse", path: "/factory/inventory/warehouse" },
    ],
  },
  {
    title: "SOURCING",
    items: [
      { icon: Ship, label: "Imports", path: "/factory/imports" },
      { icon: Layers, label: "Batches", path: "/factory/batches" },
      { icon: DollarSign, label: "Costing", path: "/factory/costing" },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = [
  ...COMPANY_SECTIONS,
  ...POS_SECTIONS,
  ...FACTORY_SECTIONS,
].flatMap((s) => s.items);
