// ============================================
// ATLAS ERP — ROLES & PERMISSIONS SYSTEM
// ============================================

export type Role =
  | 'admin'    // مدير النظام — كل الصلاحيات
  | 'manager'  // مدير — العمليات والتقارير، بدون إعدادات النظام
  | 'cashier'  // أمين صندوق — POS فقط

export type Permission =
  // Dashboard
  | 'dashboard.view'
  // Company
  | 'company.view'
  | 'company.edit'
  // Customers
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  // Suppliers
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.edit'
  | 'suppliers.delete'
  // Employees
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'employees.salary'
  | 'employees.advances'
  // Departments
  | 'departments.view'
  | 'departments.create'
  | 'departments.edit'
  | 'departments.delete'
  // Leaves
  | 'leaves.view'
  | 'leaves.create'
  | 'leaves.approve'
  | 'leaves.delete'
  // Inventory
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.edit'
  | 'inventory.delete'
  | 'inventory.movements'
  // Products
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'products.price_edit'
  // POS
  | 'pos.access'
  | 'pos.checkout'
  | 'pos.refund'
  | 'pos.discount'
  | 'pos.void'
  // Invoices
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.send'
  // Payments
  | 'payments.view'
  | 'payments.create'
  | 'payments.edit'
  | 'payments.delete'
  // Expenses
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  // Treasury
  | 'treasury.view'
  | 'treasury.create'
  | 'treasury.edit'
  | 'treasury.delete'
  | 'treasury.approve'
  | 'treasury.reconcile'
  // Reports
  | 'reports.view'
  | 'reports.profit_loss'
  | 'reports.balance_sheet'
  | 'reports.export'
  // General Ledger
  | 'ledger.view'
  | 'ledger.create'
  | 'ledger.edit'
  | 'ledger.delete'
  // Chart of Accounts
  | 'accounts.view'
  | 'accounts.create'
  | 'accounts.edit'
  | 'accounts.delete'
  // Debts
  | 'debts.view'
  | 'debts.create'
  | 'debts.edit'
  // Users & Roles
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.assign_roles'
  // Settings
  | 'settings.view'
  | 'settings.edit'
  // Permissions
  | 'permissions.view'
  | 'permissions.edit'
  // Notifications
  | 'notifications.view'
  | 'notifications.manage'

// ============================================
// ROLE → PERMISSIONS MAPPING
// ============================================

const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'company.view', 'company.edit',
  'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
  'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
  'employees.view', 'employees.create', 'employees.edit', 'employees.delete', 'employees.salary', 'employees.advances',
  'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
  'leaves.view', 'leaves.create', 'leaves.approve', 'leaves.delete',
  'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.movements',
  'products.view', 'products.create', 'products.edit', 'products.delete', 'products.price_edit',
  'pos.access', 'pos.checkout', 'pos.refund', 'pos.discount', 'pos.void',
  'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.send',
  'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
  'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
  'treasury.view', 'treasury.create', 'treasury.edit', 'treasury.delete', 'treasury.approve', 'treasury.reconcile',
  'reports.view', 'reports.profit_loss', 'reports.balance_sheet', 'reports.export',
  'ledger.view', 'ledger.create', 'ledger.edit', 'ledger.delete',
  'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete',
  'debts.view', 'debts.create', 'debts.edit',
  'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
  'settings.view', 'settings.edit',
  'permissions.view', 'permissions.edit',
  'notifications.view', 'notifications.manage',
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {

  // ── ADMIN: كل شيء بدون استثناء
  admin: [...ALL_PERMISSIONS],

  // ── MANAGER: العمليات والتقارير — بدون إدارة المستخدمين والإعدادات والصلاحيات
  manager: [
    'dashboard.view',
    'company.view',

    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',

    'employees.view', 'employees.create', 'employees.edit',
    'employees.salary', 'employees.advances',
    'departments.view', 'departments.create', 'departments.edit',
    'leaves.view', 'leaves.create', 'leaves.approve', 'leaves.delete',

    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.movements',
    'products.view', 'products.create', 'products.edit', 'products.price_edit',

    'pos.access', 'pos.checkout', 'pos.refund', 'pos.discount', 'pos.void',

    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
    'payments.view', 'payments.create', 'payments.edit',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'treasury.view', 'treasury.create', 'treasury.approve',

    'reports.view', 'reports.profit_loss', 'reports.balance_sheet', 'reports.export',
    'ledger.view', 'ledger.create',
    'accounts.view',
    'debts.view', 'debts.create', 'debts.edit',

    'notifications.view', 'notifications.manage',
    // NO: users.*, settings.*, permissions.*
  ],

  // ── CASHIER: نقطة البيع فقط
  cashier: [
    'pos.access', 'pos.checkout', 'pos.refund', 'pos.discount',
    'customers.view', 'customers.create',
    'products.view',
    'inventory.view',
    'invoices.view', 'invoices.create',
    'payments.view', 'payments.create',
    'notifications.view',
    // NO: employees, suppliers, reports, treasury, settings, users
  ],
}

// ============================================
// ROUTE → REQUIRED PERMISSION MAPPING
// ============================================

export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard':               'dashboard.view',
  '/company':                 'company.view',
  '/customers':               'customers.view',
  '/suppliers':               'suppliers.view',
  '/employees':               'employees.view',
  '/departments':             'departments.view',
  '/leaves':                  'leaves.view',
  '/inventory':               'inventory.view',
  '/inventory/movements':     'inventory.movements',
  '/products':                'products.view',
  '/pos/checkout':            'pos.access',
  '/pos/history':             'invoices.view',
  '/pos/refunds':             'pos.refund',
  '/pos/products':            'products.view',
  '/pos/categories':          'products.create',
  '/pos/stock':               'inventory.create',
  '/pos/cashiers':            'users.view',
  '/pos/receipts':            'invoices.view',
  '/invoices':                'invoices.view',
  '/purchases':               'invoices.view',
  '/payments':                'payments.view',
  '/expenses':                'expenses.view',
  '/treasury':                'treasury.view',
  '/reports':                 'reports.view',
  '/reports/profit-loss':     'reports.profit_loss',
  '/reports/balance-sheet':   'reports.balance_sheet',
  '/general-ledger':          'ledger.view',
  '/chart-of-accounts':       'accounts.view',
  '/notifications':           'notifications.view',
  '/settings':                'settings.view',
  '/settings/company':        'settings.edit',
  '/permissions':             'permissions.view',
  '/users':                   'users.view',
  '/audit-log':               'users.view',
}

// ============================================
// PERMISSION CHECK FUNCTIONS
// ============================================

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(userRole, p))
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(userRole, p))
}

// ============================================
// ROLE DISPLAY HELPERS
// ============================================

export const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
  admin:   { ar: 'مدير النظام', en: 'Admin'   },
  manager: { ar: 'مدير',        en: 'Manager' },
  cashier: { ar: 'أمين صندوق', en: 'Cashier' },
}

export function getRoleLabel(role: Role | string): string {
  const labels: Record<string, string> = {
    admin:   'مدير النظام',
    manager: 'مدير',
    cashier: 'أمين صندوق',
  }
  return labels[role] ?? role
}

export function getRoleColor(role: Role | string): { bg: string; color: string } {
  const colors: Record<string, { bg: string; color: string }> = {
    admin:   { bg: '#F5F3FF', color: '#7C3AED' },
    manager: { bg: '#EFF6FF', color: '#2563EB' },
    cashier: { bg: '#FFF7ED', color: '#EA580C' },
  }
  return colors[role] ?? { bg: '#F1F5F9', color: '#64748B' }
}
