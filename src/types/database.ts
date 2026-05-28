/**
 * TypeScript types that mirror every PostgreSQL table in the Atlas ERP schema.
 * Row = what you get back from SELECT.
 * Insert = what you send to INSERT (id / timestamps are optional).
 * Update = partial Insert for PATCH operations.
 */

// ── Utility ───────────────────────────────────────────────────────────────────

type Nullable<T> = T | null;

// ── COMPANY MODULE ────────────────────────────────────────────────────────────

export interface CustomerRow {
  id: string;
  code: Nullable<string>;
  name: string;
  type: Nullable<"individual" | "company" | "institution">;
  classification: Nullable<"standard" | "vip" | "risk">;
  tax_id: Nullable<string>;
  phone: string;
  email: Nullable<string>;
  city: Nullable<string>;
  governorate: Nullable<string>;
  payment_terms: Nullable<"cash" | "net30" | "net60" | "net90">;
  currency: string;
  credit_limit: number;
  outstanding_balance: number;
  status: "active" | "inactive" | "archived";
  sales_rep: Nullable<string>;
  notes: Nullable<string>;
  joined_at: Nullable<string>;
  last_order_date: Nullable<string>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
export type CustomerInsert = Omit<CustomerRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type CustomerUpdate = Partial<CustomerInsert>;

export interface SupplierRow {
  id: string;
  name: string;
  phone: Nullable<string>;
  email: Nullable<string>;
  address: Nullable<string>;
  notes: Nullable<string>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
export type SupplierInsert = Omit<SupplierRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type SupplierUpdate = Partial<SupplierInsert>;

export interface DepartmentRow {
  id: string;
  name: string;
  name_ar: string;
  parent_id: Nullable<string>;
  head_id: Nullable<string>;
  head_name: Nullable<string>;
  headcount: number;
  open_positions: number;
  monthly_revenue: number;
  status: "active" | "inactive";
  created_at: string;
}
export type DepartmentInsert = Omit<DepartmentRow, "created_at"> & { created_at?: string };
export type DepartmentUpdate = Partial<DepartmentInsert>;

export interface EmployeeRow {
  id: string;
  name: string;
  phone: string;
  department_id: Nullable<string>;
  work_start: string;
  work_end: string;
  salary_type: "hourly" | "fixed" | "daily";
  hourly_rate: Nullable<number>;
  fixed_salary: Nullable<number>;
  advance: number;
  notes: Nullable<string>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
export type EmployeeInsert = Omit<EmployeeRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type EmployeeUpdate = Partial<EmployeeInsert>;

export interface InvoiceRow {
  id: string;
  customer_id: string;
  amount: number;
  remaining_amount: number;
  status: "Paid" | "Partial" | "Debit" | "Pending";
  date: string;
  notes: Nullable<string>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
export type InvoiceInsert = Omit<InvoiceRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type InvoiceUpdate = Partial<InvoiceInsert>;

export interface InvoiceLineRow {
  id: string;
  invoice_id: string;
  product_id: Nullable<string>;
  description: Nullable<string>;
  quantity: number;
  unit_price: number;
  total: number;
}
export type InvoiceLineInsert = InvoiceLineRow;

export interface PaymentRow {
  id: string;
  invoice_id: string;
  customer_id: string;
  customer_name: Nullable<string>;
  amount: number;
  method: Nullable<"Cash" | "Card" | "Bank Transfer" | "Wallet" | "Cheque">;
  status: Nullable<"Paid" | "Pending" | "Partial" | "Completed" | "Failed" | "Refunded" | "Cancelled">;
  date: string;
  notes: Nullable<string>;
  reference_number: Nullable<string>;
  created_at: string;
}
export type PaymentInsert = Omit<PaymentRow, "created_at"> & { created_at?: string };
export type PaymentUpdate = Partial<PaymentInsert>;

export interface ExpenseRow {
  id: string;
  date: string;
  description: Nullable<string>;
  category: string;
  amount: number;
  currency: "ILS" | "USD" | "EUR";
  vendor: Nullable<string>;
  payee: Nullable<string>;
  payment_method: "cash" | "bank" | "card" | "cheque";
  receipt_url: Nullable<string>;
  notes: Nullable<string>;
  status: "approved" | "pending" | "rejected";
  is_deleted: boolean;
  created_at: string;
}
export type ExpenseInsert = Omit<ExpenseRow, "created_at"> & { created_at?: string };
export type ExpenseUpdate = Partial<ExpenseInsert>;

// ── POS MODULE ────────────────────────────────────────────────────────────────

export interface PosProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  purchase_price: Nullable<number>;
  status: Nullable<string>;
  code: Nullable<string>;
  barcode: Nullable<string>;
  unit: Nullable<string>;
  min_stock: Nullable<number>;
  is_deleted: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}
export type PosProductInsert = Omit<PosProductRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type PosProductUpdate = Partial<PosProductInsert>;

export interface PosCashierRow {
  id: string;
  name: string;
  code: string;
  employee_id: Nullable<string>;
  shift: "morning" | "afternoon" | "evening";
  status: "active" | "inactive" | "on-break";
  today_sales: number;
  transactions: number;
  last_active: Nullable<string>;
  is_deleted: boolean;
  created_at: string;
}
export type PosCashierInsert = Omit<PosCashierRow, "created_at"> & { created_at?: string };
export type PosCashierUpdate = Partial<PosCashierInsert>;

export interface PosSaleRow {
  id: string;
  cashier_id: Nullable<string>;
  customer_id: Nullable<string>;
  date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  method: "cash" | "card" | "wallet" | "split";
  status: "completed" | "refunded" | "voided";
  created_at: string;
}
export type PosSaleInsert = Omit<PosSaleRow, "created_at"> & { created_at?: string };

export interface PosRefundRow {
  id: string;
  sale_id: string;
  cashier_id: Nullable<string>;
  date: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "completed" | "rejected";
  created_at: string;
}
export type PosRefundInsert = Omit<PosRefundRow, "created_at"> & { created_at?: string };
export type PosRefundUpdate = Partial<PosRefundInsert>;

export interface PosStockCountRow {
  id: string;
  date: string;
  location: Nullable<string>;
  status: "open" | "in-progress" | "completed" | "cancelled";
  counted_by: Nullable<string>;
  created_at: string;
}
export type PosStockCountInsert = Omit<PosStockCountRow, "created_at"> & { created_at?: string };
export type PosStockCountUpdate = Partial<PosStockCountInsert>;

export interface LoyaltyTransactionRow {
  id: string;
  customer_id: string;
  date: string;
  action: "earn" | "redeem" | "adjust" | "expire";
  coins: number;
  trigger: Nullable<string>;
  balance_after: number;
  sale_id: Nullable<string>;
  created_at: string;
}
export type LoyaltyTransactionInsert = Omit<LoyaltyTransactionRow, "created_at"> & { created_at?: string };

// ── FACTORY MODULE ────────────────────────────────────────────────────────────

export interface FactoryOrderRow {
  id: string;
  product_id: string;
  quantity: number;
  start_date: string;
  due_date: string;
  status: "planned" | "in-progress" | "done" | "cancelled";
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
export type FactoryOrderInsert = Omit<FactoryOrderRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type FactoryOrderUpdate = Partial<FactoryOrderInsert>;

export interface FactoryBomRow {
  id: string;
  product_id: string;
  product_name: string;
  product_name_ar: string;
  version: string;
  effective_date: string;
  created_at: string;
}
export type FactoryBomInsert = Omit<FactoryBomRow, "created_at"> & { created_at?: string };

export interface FactoryBomLineRow {
  id: string;
  bom_id: string;
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
}
export type FactoryBomLineInsert = FactoryBomLineRow;

export interface FactoryQcRow {
  id: string;
  production_order_id: string;
  product_id: string;
  product_name: string;
  batch_id: string;
  inspection_date: string;
  inspector: string;
  status: "pass" | "fail" | "pending" | "conditional";
  defect_rate: number;
  sample_size: number;
  failed_units: number;
  notes: Nullable<string>;
  created_at: string;
}
export type FactoryQcInsert = Omit<FactoryQcRow, "created_at"> & { created_at?: string };
export type FactoryQcUpdate = Partial<FactoryQcInsert>;

export interface FactoryBatchRow {
  id: string;
  production_order_id: string;
  product_name: string;
  quantity: number;
  produced_date: string;
  expiry_date: string;
  status: "open" | "closed" | "quarantine" | "recalled";
  qc_status: "pass" | "fail" | "pending" | "conditional";
  unit_cost: number;
  total_cost: number;
  notes: Nullable<string>;
  created_at: string;
}
export type FactoryBatchInsert = Omit<FactoryBatchRow, "created_at"> & { created_at?: string };
export type FactoryBatchUpdate = Partial<FactoryBatchInsert>;

export interface RawMaterialRow {
  id: string;
  name: string;
  name_ar: string;
  category: "oil" | "packaging" | "additives" | "labeling" | "cleaning";
  unit: string;
  on_hand: number;
  reorder_point: number;
  unit_cost: number;
  supplier: string;
  origin: "local" | "imported";
  last_purchase_date: Nullable<string>;
  created_at: string;
  updated_at: string;
}
export type RawMaterialInsert = Omit<RawMaterialRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type RawMaterialUpdate = Partial<RawMaterialInsert>;

export interface FinishedGoodRow {
  id: string;
  name: string;
  name_ar: string;
  sku: string;
  category: string;
  on_hand: number;
  reserved: number;
  unit_cost: number;
  selling_price: number;
  production_order_id: Nullable<string>;
  last_produced_date: Nullable<string>;
  created_at: string;
  updated_at: string;
}
export type FinishedGoodInsert = Omit<FinishedGoodRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type FinishedGoodUpdate = Partial<FinishedGoodInsert>;

export interface WarehouseLocationRow {
  id: string;
  name: string;
  zone: "raw" | "finished" | "packaging" | "quarantine";
  capacity: number;
  used: number;
  temperature: Nullable<string>;
  notes: Nullable<string>;
  created_at: string;
}
export type WarehouseLocationInsert = Omit<WarehouseLocationRow, "created_at"> & { created_at?: string };

export interface ImportOrderRow {
  id: string;
  supplier_name: string;
  origin: string;
  total_value: number;
  currency: string;
  order_date: string;
  estimated_arrival: string;
  actual_arrival: Nullable<string>;
  status: "ordered" | "in-transit" | "customs" | "received" | "cancelled";
  customs_ref: Nullable<string>;
  notes: Nullable<string>;
  created_at: string;
  updated_at: string;
}
export type ImportOrderInsert = Omit<ImportOrderRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};
export type ImportOrderUpdate = Partial<ImportOrderInsert>;

export interface ImportOrderLineRow {
  id: string;
  import_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
}
export type ImportOrderLineInsert = ImportOrderLineRow;

export interface CostingEntryRow {
  id: string;
  production_order_id: string;
  product_name: string;
  period: string;
  raw_material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  units_produced: number;
  cost_per_unit: number;
  variance: number;
  created_at: string;
}
export type CostingEntryInsert = Omit<CostingEntryRow, "created_at"> & { created_at?: string };

// ── AUTH ──────────────────────────────────────────────────────────────────────

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: "Admin" | "Manager" | "Finance" | "Factory" | "Cashier";
  created_at: string;
}
export type UserRoleInsert = Omit<UserRoleRow, "created_at"> & { created_at?: string };

export interface RolePermissionRow {
  id: string;
  role: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
}
export type RolePermissionInsert = RolePermissionRow;

// ── Database interface (for typed Supabase client) ────────────────────────────

export interface Database {
  public: {
    Tables: {
      customers: { Row: CustomerRow; Insert: CustomerInsert; Update: CustomerUpdate };
      suppliers: { Row: SupplierRow; Insert: SupplierInsert; Update: SupplierUpdate };
      departments: { Row: DepartmentRow; Insert: DepartmentInsert; Update: DepartmentUpdate };
      employees: { Row: EmployeeRow; Insert: EmployeeInsert; Update: EmployeeUpdate };
      invoices: { Row: InvoiceRow; Insert: InvoiceInsert; Update: InvoiceUpdate };
      invoice_lines: { Row: InvoiceLineRow; Insert: InvoiceLineInsert; Update: Partial<InvoiceLineInsert> };
      payments: { Row: PaymentRow; Insert: PaymentInsert; Update: PaymentUpdate };
      expenses: { Row: ExpenseRow; Insert: ExpenseInsert; Update: ExpenseUpdate };
      pos_products: { Row: PosProductRow; Insert: PosProductInsert; Update: PosProductUpdate };
      pos_cashiers: { Row: PosCashierRow; Insert: PosCashierInsert; Update: PosCashierUpdate };
      pos_sales: { Row: PosSaleRow; Insert: PosSaleInsert; Update: Partial<PosSaleInsert> };
      pos_refunds: { Row: PosRefundRow; Insert: PosRefundInsert; Update: PosRefundUpdate };
      pos_stock_counts: { Row: PosStockCountRow; Insert: PosStockCountInsert; Update: PosStockCountUpdate };
      loyalty_transactions: { Row: LoyaltyTransactionRow; Insert: LoyaltyTransactionInsert; Update: Partial<LoyaltyTransactionInsert> };
      factory_orders: { Row: FactoryOrderRow; Insert: FactoryOrderInsert; Update: FactoryOrderUpdate };
      factory_boms: { Row: FactoryBomRow; Insert: FactoryBomInsert; Update: Partial<FactoryBomInsert> };
      factory_bom_lines: { Row: FactoryBomLineRow; Insert: FactoryBomLineInsert; Update: Partial<FactoryBomLineInsert> };
      factory_qc: { Row: FactoryQcRow; Insert: FactoryQcInsert; Update: FactoryQcUpdate };
      factory_batches: { Row: FactoryBatchRow; Insert: FactoryBatchInsert; Update: FactoryBatchUpdate };
      factory_raw_materials: { Row: RawMaterialRow; Insert: RawMaterialInsert; Update: RawMaterialUpdate };
      factory_finished_goods: { Row: FinishedGoodRow; Insert: FinishedGoodInsert; Update: FinishedGoodUpdate };
      factory_warehouse: { Row: WarehouseLocationRow; Insert: WarehouseLocationInsert; Update: Partial<WarehouseLocationInsert> };
      factory_imports: { Row: ImportOrderRow; Insert: ImportOrderInsert; Update: ImportOrderUpdate };
      factory_import_lines: { Row: ImportOrderLineRow; Insert: ImportOrderLineInsert; Update: Partial<ImportOrderLineInsert> };
      factory_costing: { Row: CostingEntryRow; Insert: CostingEntryInsert; Update: Partial<CostingEntryInsert> };
      user_roles: { Row: UserRoleRow; Insert: UserRoleInsert; Update: Partial<UserRoleInsert> };
      role_permissions: { Row: RolePermissionRow; Insert: RolePermissionInsert; Update: Partial<RolePermissionInsert> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
