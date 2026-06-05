// ============================================
// ATLAS ERP — ROLES & PERMISSIONS SYSTEM
// ============================================

export type Role =
  | 'super_admin'   // مدير النظام الأعلى — كل الصلاحيات
  | 'admin'         // مدير — كل الصلاحيات إلا إدارة المستخدمين
  | 'accountant'    // محاسب — المالية والتقارير فقط
  | 'sales'         // مبيعات — POS والعملاء والفواتير
  | 'warehouse'     // مستودع — المخزون والمنتجات فقط
  | 'hr'            // موارد بشرية — الموظفين والإجازات فقط
  | 'cashier'       // أمين صندوق — POS فقط
  | 'viewer'        // مشاهد — قراءة فقط، بدون تعديل

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
  // Users & Roles
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.assign_roles'
  // Settings
  | 'settings.view'
  | 'settings.edit'
  // Notifications
  | 'notifications.view'
  | 'notifications.manage'

// ============================================
// ROLE → PERMISSIONS MAPPING
// ============================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {

  super_admin: [
    'dashboard.view',
    'company.view', 'company.edit',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
    'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
    'employees.salary', 'employees.advances',
    'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
    'leaves.view', 'leaves.create', 'leaves.approve', 'leaves.delete',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'inventory.movements',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'products.price_edit',
    'pos.access', 'pos.checkout', 'pos.refund', 'pos.discount', 'pos.void',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
    'invoices.send',
    'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
    'treasury.view', 'treasury.create', 'treasury.edit', 'treasury.delete',
    'treasury.approve', 'treasury.reconcile',
    'reports.view', 'reports.profit_loss', 'reports.balance_sheet', 'reports.export',
    'ledger.view', 'ledger.create', 'ledger.edit', 'ledger.delete',
    'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
    'settings.view', 'settings.edit',
    'notifications.view', 'notifications.manage',
  ],

  admin: [
    'dashboard.view',
    'company.view', 'company.edit',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
    'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
    'employees.salary', 'employees.advances',
    'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
    'leaves.view', 'leaves.create', 'leaves.approve', 'leaves.delete',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'inventory.movements',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'products.price_edit',
    'pos.access', 'pos.checkout', 'pos.refund', 'pos.discount', 'pos.void',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
    'invoices.send',
    'payments.view', 'payments.create', 'payments.edit', 'payments.delete',
    'treasury.view', 'treasury.create', 'treasury.edit', 'treasury.delete',
    'treasury.approve', 'treasury.reconcile',
    'reports.view', 'reports.profit_loss', 'reports.balance_sheet', 'reports.export',
    'ledger.view', 'ledger.create', 'ledger.edit', 'ledger.delete',
    'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.delete',
    'settings.view',
    'notifications.view', 'notifications.manage',
  ],

  accountant: [
    'dashboard.view',
    'customers.view',
    'suppliers.view',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'payments.view', 'payments.create', 'payments.edit',
    'treasury.view', 'treasury.create', 'treasury.approve', 'treasury.reconcile',
    'reports.view', 'reports.profit_loss', 'reports.balance_sheet', 'reports.export',
    'ledger.view', 'ledger.create', 'ledger.edit',
    'accounts.view', 'accounts.create', 'accounts.edit',
    'notifications.view',
  ],

  sales: [
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit',
    'products.view',
    'inventory.view',
    'pos.access', 'pos.checkout', 'pos.discount',
    'invoices.view', 'invoices.create', 'invoices.send',
    'payments.view', 'payments.create',
    'notifications.view',
  ],

  warehouse: [
    'dashboard.view',
    'products.view', 'products.create', 'products.edit',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.movements',
    'suppliers.view',
    'notifications.view',
  ],

  hr: [
    'dashboard.view',
    'employees.view', 'employees.create', 'employees.edit',
    'employees.salary', 'employees.advances',
    'departments.view', 'departments.create', 'departments.edit',
    'leaves.view', 'leaves.create', 'leaves.approve', 'leaves.delete',
    'notifications.view',
  ],

  cashier: [
    'pos.access', 'pos.checkout', 'pos.refund',
    'products.view',
    'inventory.view',
    'customers.view',
    'notifications.view',
  ],

  viewer: [
    'dashboard.view',
    'customers.view',
    'suppliers.view',
    'employees.view',
    'products.view',
    'inventory.view',
    'invoices.view',
    'payments.view',
    'reports.view',
    'notifications.view',
  ],
}

// ============================================
// PERMISSION CHECK FUNCTIONS
// ============================================

export function hasPermission(userRole: Role, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[userRole] ?? []
  return perms.includes(permission)
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(userRole, p))
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(userRole, p))
}

// Route → required permission mapping
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard':                 'dashboard.view',
  '/company':                   'company.view',
  '/customers':                 'customers.view',
  '/suppliers':                 'suppliers.view',
  '/employees':                 'employees.view',
  '/departments':               'departments.view',
  '/leaves':                    'leaves.view',
  '/inventory':                 'inventory.view',
  '/inventory/movements':       'inventory.movements',
  '/products':                  'products.view',
  '/pos/checkout':              'pos.access',
  '/pos/history':               'invoices.view',
  '/pos/refunds':               'pos.refund',
  '/pos/products':              'products.view',
  '/invoices':                  'invoices.view',
  '/purchases':                 'invoices.view',
  '/payments':                  'payments.view',
  '/treasury':                  'treasury.view',
  '/reports':                   'reports.view',
  '/reports/profit-loss':       'reports.profit_loss',
  '/reports/balance-sheet':     'reports.balance_sheet',
  '/general-ledger':            'ledger.view',
  '/chart-of-accounts':         'accounts.view',
  '/expenses':                  'ledger.view',
  '/notifications':             'notifications.view',
  '/settings':                  'settings.view',
  '/permissions':               'users.assign_roles',
  '/users':                     'users.view',
  '/audit-log':                 'users.view',
}

// ============================================
// ROLE DISPLAY LABELS
// ============================================

export const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
  super_admin: { ar: 'مدير النظام الأعلى', en: 'Super Admin' },
  admin:       { ar: 'مدير',               en: 'Admin' },
  accountant:  { ar: 'محاسب',              en: 'Accountant' },
  sales:       { ar: 'مبيعات',             en: 'Sales' },
  warehouse:   { ar: 'مستودع',             en: 'Warehouse' },
  hr:          { ar: 'موارد بشرية',         en: 'HR' },
  cashier:     { ar: 'أمين صندوق',          en: 'Cashier' },
  viewer:      { ar: 'مشاهد',              en: 'Viewer' },
}
