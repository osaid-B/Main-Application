import { type PermissionAction, type PermissionModule, type Role } from "./types";

const ALL_ON:  Record<PermissionAction, boolean> = { view: true,  create: true,  edit: true,  delete: true,  export: true  };
const VIEW_ONLY:   Record<PermissionAction, boolean> = { view: true,  create: false, edit: false, delete: false, export: false };
const VIEW_EXPORT: Record<PermissionAction, boolean> = { view: true,  create: false, edit: false, delete: false, export: true  };
const NO_DELETE:   Record<PermissionAction, boolean> = { view: true,  create: true,  edit: true,  delete: false, export: true  };

const MODULES = ["pos", "customers", "invoices", "inventory", "reports", "employees", "settings"] as const;
type ModuleKey = typeof MODULES[number];

const MODULE_LABELS: Record<ModuleKey, { label: string; labelAr: string }> = {
  pos:       { label: "POS",       labelAr: "نقطة البيع" },
  customers: { label: "Customers", labelAr: "الزبائن"   },
  invoices:  { label: "Invoices",  labelAr: "الفواتير"  },
  inventory: { label: "Inventory", labelAr: "المخزون"   },
  reports:   { label: "Reports",   labelAr: "التقارير"  },
  employees: { label: "Employees", labelAr: "الموظفون"  },
  settings:  { label: "Settings",  labelAr: "الإعدادات" },
};

function makePerms(defaults: Partial<Record<ModuleKey, Record<PermissionAction, boolean>>>): PermissionModule[] {
  return MODULES.map((m) => ({
    module: m,
    ...MODULE_LABELS[m],
    actions: defaults[m] ?? VIEW_ONLY,
  }));
}

export const ROLES: Role[] = [
  {
    id: "role-admin", name: "Admin", nameAr: "مدير النظام",
    description: "Full access to all modules.", descriptionAr: "صلاحية كاملة على جميع الوحدات.",
    userCount: 2, isSystem: true,
    permissions: makePerms({ pos: ALL_ON, customers: ALL_ON, invoices: ALL_ON, inventory: ALL_ON, reports: ALL_ON, employees: ALL_ON, settings: ALL_ON }),
  },
  {
    id: "role-manager", name: "Manager", nameAr: "مدير",
    description: "Manage operations, no settings access.", descriptionAr: "إدارة العمليات دون الوصول إلى الإعدادات.",
    userCount: 5, isSystem: false,
    permissions: makePerms({ pos: ALL_ON, customers: NO_DELETE, invoices: NO_DELETE, inventory: NO_DELETE, reports: VIEW_EXPORT, employees: VIEW_ONLY, settings: VIEW_ONLY }),
  },
  {
    id: "role-cashier", name: "Cashier", nameAr: "كاشير",
    description: "POS access only.", descriptionAr: "صلاحية نقطة البيع فقط.",
    userCount: 8, isSystem: false,
    permissions: makePerms({
      pos: { view: true, create: true, edit: false, delete: false, export: false },
      customers: VIEW_ONLY, invoices: VIEW_ONLY, inventory: VIEW_ONLY, reports: VIEW_ONLY, employees: VIEW_ONLY, settings: VIEW_ONLY,
    }),
  },
  {
    id: "role-accountant", name: "Accountant", nameAr: "محاسب",
    description: "Finance & reports access.", descriptionAr: "صلاحية الوصول إلى المالية والتقارير.",
    userCount: 3, isSystem: false,
    permissions: makePerms({ pos: VIEW_ONLY, customers: VIEW_ONLY, invoices: NO_DELETE, inventory: VIEW_ONLY, reports: VIEW_EXPORT, employees: VIEW_ONLY, settings: VIEW_ONLY }),
  },
  {
    id: "role-viewer", name: "Viewer", nameAr: "مُشاهد",
    description: "Read-only access to all modules.", descriptionAr: "صلاحية القراءة فقط على جميع الوحدات.",
    userCount: 4, isSystem: false,
    permissions: makePerms({ pos: VIEW_ONLY, customers: VIEW_ONLY, invoices: VIEW_ONLY, inventory: VIEW_ONLY, reports: VIEW_EXPORT, employees: VIEW_ONLY, settings: VIEW_ONLY }),
  },
];
