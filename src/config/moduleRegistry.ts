import {
  ArrowDownToLine,
  ArrowLeftRight,
  Building2,
  CreditCard,
  Database,
  Factory,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Landmark,
  Receipt,
  ReceiptText,
  ScanLine,
  Settings,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export type ModuleGroupKey = "executive" | "operations" | "finance" | "admin" | "expansion";
export type RolePreset = "Admin" | "Finance" | "Sales" | "Inventory";

export type ModuleRoute = {
  key: string;
  label: string;
  description: string;
  path?: string;
  icon: typeof LayoutDashboard;
  group: ModuleGroupKey;
  mobilePrimary?: boolean;
  future?: boolean;
};

export type QuickCreateAction = {
  id: string;
  label: string;
  description: string;
  path: string;
  icon?: typeof LayoutDashboard;
};

export const moduleGroups: Record<ModuleGroupKey, string> = {
  executive: "Executive",
  operations: "Operations",
  finance: "Finance",
  admin: "Administration",
  expansion: "Future Ready",
};

export const moduleRegistry: ModuleRoute[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Executive control center",
    path: "/dashboard",
    icon: LayoutDashboard,
    group: "executive",
    mobilePrimary: true,
  },
  {
    key: "customers",
    label: "Customers",
    description: "CRM, balances, and account activity",
    path: "/customers",
    icon: Users,
    group: "operations",
    mobilePrimary: true,
  },
  {
    key: "purchases",
    label: "Purchases",
    description: "Procurement and receiving workflow",
    path: "/purchases",
    icon: ShoppingCart,
    group: "operations",
  },
  {
    key: "suppliers",
    label: "Suppliers",
    description: "Vendor profile and payables view",
    path: "/suppliers",
    icon: Truck,
    group: "operations",
  },
  {
    key: "invoices",
    label: "Invoices",
    description: "Receivables, payables, and billing",
    path: "/invoices",
    icon: ReceiptText,
    group: "finance",
    mobilePrimary: true,
  },
  {
    key: "payments",
    label: "Payments",
    description: "Collections, refunds, and allocation",
    path: "/payments",
    icon: CreditCard,
    group: "finance",
    mobilePrimary: true,
  },
  {
    key: "treasury",
    label: "Treasury",
    description: "Banking, cheques, transfers, and reconciliation",
    path: "/treasury",
    icon: Landmark,
    group: "finance",
  },
  {
    key: "employees",
    label: "Employees",
    description: "Attendance, payroll, and HR basics",
    path: "/employees",
    icon: Building2,
    group: "admin",
  },
  {
    key: "settings",
    label: "Settings",
    description: "System, localization, and business rules",
    path: "/settings",
    icon: Settings,
    group: "admin",
  },
  {
    key: "data-import",
    label: "Data Import",
    description: "Migration, validation, and onboarding",
    path: "/data-import",
    icon: Database,
    group: "admin",
  },
  {
    key: "ledger",
    label: "General Ledger",
    description: "Journals, COA, and financial statements",
    icon: Wallet,
    group: "finance",
    future: true,
  },
  {
    key: "pos",
    label: "POS",
    description: "Retail cashier and checkout workflow",
    icon: ScanLine,
    group: "expansion",
    future: true,
  },
  {
    key: "manufacturing",
    label: "Manufacturing",
    description: "BOM, production orders, and costing",
    icon: Factory,
    group: "expansion",
    future: true,
  },
  {
    key: "reports",
    label: "Reports",
    description: "Operational exports and period analysis",
    icon: FileSpreadsheet,
    group: "finance",
    future: true,
  },
];

export const quickCreateActions: QuickCreateAction[] = [
  {
    id: "new-invoice",
    label: "New Invoice",
    description: "Create a receivable, payable, or internal invoice",
    path: "/invoices",
    icon: FileText,
  },
  {
    id: "new-payment",
    label: "Record Payment",
    description: "Add a payment and link it to an invoice",
    path: "/payments",
    icon: CreditCard,
  },
  {
    id: "new-transfer",
    label: "New Transfer",
    description: "Record a bank transfer with proof and verification",
    path: "/treasury",
    icon: ArrowLeftRight,
  },
  {
    id: "new-cheque",
    label: "Register Cheque",
    description: "Capture an incoming or outgoing cheque instrument",
    path: "/treasury",
    icon: ArrowDownToLine,
  },
  {
    id: "new-customer",
    label: "Add Customer",
    description: "Create a customer profile with financial details",
    path: "/customers/new",
    icon: UserPlus,
  },
  {
    id: "new-purchase",
    label: "New Purchase",
    description: "Create a supplier-linked purchase order",
    path: "/purchases",
    icon: ShoppingCart,
  },
  {
    id: "new-supplier",
    label: "Add Supplier",
    description: "Create a supplier profile and payment terms",
    path: "/suppliers/new",
    icon: Truck,
  },
  {
    id: "new-employee",
    label: "Add Employee",
    description: "Create an employee profile with payroll details",
    path: "/employees/new",
    icon: Users,
  },
  {
    id: "new-expense",
    label: "Add Expense",
    description: "Record a business expense with supporting details",
    path: "/expenses",
    icon: Receipt,
  },
  {
    id: "new-pos-sale",
    label: "New POS Sale",
    description: "Open POS checkout for a new retail transaction",
    path: "/pos/checkout",
    icon: ScanLine,
  },
];

export const rolePresets: RolePreset[] = ["Admin", "Finance", "Sales", "Inventory"];
