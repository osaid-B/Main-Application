-- ============================================================
-- Atlas ERP — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Helpers ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMPANY MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id                TEXT PRIMARY KEY,
  code              TEXT,
  name              TEXT NOT NULL,
  type              TEXT CHECK (type IN ('individual','company','institution')),
  classification    TEXT CHECK (classification IN ('standard','vip','risk')),
  tax_id            TEXT,
  phone             TEXT NOT NULL DEFAULT '',
  email             TEXT,
  city              TEXT,
  governorate       TEXT,
  payment_terms     TEXT CHECK (payment_terms IN ('cash','net15','net30','net60','net90')),
  currency          TEXT NOT NULL DEFAULT 'ILS',
  credit_limit      NUMERIC(14,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  sales_rep         TEXT,
  notes             TEXT,
  joined_at         DATE,
  last_order_date   DATE,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_status      ON customers(status) WHERE NOT is_deleted;
CREATE INDEX idx_customers_name        ON customers(name)   WHERE NOT is_deleted;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS suppliers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  notes      TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS departments (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  name_ar          TEXT NOT NULL DEFAULT '',
  parent_id        TEXT REFERENCES departments(id),
  head_id          TEXT,
  head_name        TEXT,
  headcount        INT NOT NULL DEFAULT 0,
  open_positions   INT NOT NULL DEFAULT 0,
  monthly_revenue  NUMERIC(14,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL DEFAULT '',
  department_id TEXT REFERENCES departments(id),
  work_start    TEXT NOT NULL DEFAULT '08:00',
  work_end      TEXT NOT NULL DEFAULT '17:00',
  salary_type   TEXT NOT NULL DEFAULT 'fixed' CHECK (salary_type IN ('hourly','fixed')),
  hourly_rate   NUMERIC(10,2),
  fixed_salary  NUMERIC(10,2),
  advance       NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_employees_department ON employees(department_id) WHERE NOT is_deleted;
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS invoices (
  id               TEXT PRIMARY KEY,
  customer_id      TEXT NOT NULL REFERENCES customers(id),
  amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid','Partial','Debit','Pending')),
  date             DATE NOT NULL,
  notes            TEXT,
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invoices_customer ON invoices(customer_id) WHERE NOT is_deleted;
CREATE INDEX idx_invoices_status   ON invoices(status)      WHERE NOT is_deleted;
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS invoice_lines (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  invoice_id  TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id  TEXT,
  description TEXT,
  quantity    NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total       NUMERIC(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
  id               TEXT PRIMARY KEY,
  invoice_id       TEXT NOT NULL REFERENCES invoices(id),
  customer_id      TEXT NOT NULL REFERENCES customers(id),
  customer_name    TEXT,
  amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  method           TEXT CHECK (method IN ('Cash','Card','Bank Transfer','Wallet','Cheque')),
  status           TEXT CHECK (status IN ('Paid','Pending','Partial','Completed','Failed','Refunded','Cancelled')),
  date             DATE NOT NULL,
  notes            TEXT,
  reference_number TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_invoice  ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);

CREATE TABLE IF NOT EXISTS expenses (
  id             TEXT PRIMARY KEY,
  date           DATE NOT NULL,
  description    TEXT,
  category       TEXT NOT NULL,
  amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'ILS' CHECK (currency IN ('ILS','USD','EUR')),
  vendor         TEXT,
  payee          TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','bank','card','cheque')),
  receipt_url    TEXT,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved','pending','rejected')),
  is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expenses_date     ON expenses(date)     WHERE NOT is_deleted;
CREATE INDEX idx_expenses_category ON expenses(category) WHERE NOT is_deleted;

-- ============================================================
-- POS MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS pos_products (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT '',
  price          NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock          INT NOT NULL DEFAULT 0,
  purchase_price NUMERIC(14,2),
  status         TEXT,
  code           TEXT,
  barcode        TEXT,
  unit           TEXT,
  min_stock      INT,
  is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
  archived       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pos_products_category ON pos_products(category) WHERE NOT is_deleted;
CREATE TRIGGER trg_pos_products_updated_at BEFORE UPDATE ON pos_products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS pos_cashiers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  employee_id TEXT REFERENCES employees(id),
  shift       TEXT NOT NULL DEFAULT 'morning' CHECK (shift IN ('morning','afternoon','evening')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on-break')),
  today_sales NUMERIC(14,2) NOT NULL DEFAULT 0,
  transactions INT NOT NULL DEFAULT 0,
  last_active TIMESTAMPTZ,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_sales (
  id          TEXT PRIMARY KEY,
  cashier_id  TEXT REFERENCES pos_cashiers(id),
  customer_id TEXT REFERENCES customers(id),
  date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal    NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total       NUMERIC(14,2) NOT NULL DEFAULT 0,
  method      TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','card','wallet','split')),
  status      TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','refunded','voided')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pos_sales_cashier  ON pos_sales(cashier_id);
CREATE INDEX idx_pos_sales_customer ON pos_sales(customer_id);
CREATE INDEX idx_pos_sales_date     ON pos_sales(date);

CREATE TABLE IF NOT EXISTS pos_refunds (
  id         TEXT PRIMARY KEY,
  sale_id    TEXT NOT NULL REFERENCES pos_sales(id),
  cashier_id TEXT REFERENCES pos_cashiers(id),
  date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  reason     TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','completed','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_stock_counts (
  id         TEXT PRIMARY KEY,
  date       DATE NOT NULL,
  location   TEXT,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in-progress','completed','cancelled')),
  counted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id            TEXT PRIMARY KEY,
  customer_id   TEXT NOT NULL REFERENCES customers(id),
  date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action        TEXT NOT NULL CHECK (action IN ('earn','redeem','adjust','expire')),
  coins         INT NOT NULL DEFAULT 0,
  trigger       TEXT,
  balance_after INT NOT NULL DEFAULT 0,
  sale_id       TEXT REFERENCES pos_sales(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loyalty_customer ON loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_date     ON loyalty_transactions(date);

-- ============================================================
-- FACTORY MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS factory_orders (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  quantity   INT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  due_date   DATE NOT NULL,
  status     TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in-progress','done','cancelled')),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_factory_orders_status ON factory_orders(status) WHERE NOT is_deleted;
CREATE TRIGGER trg_factory_orders_updated_at BEFORE UPDATE ON factory_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS factory_boms (
  id              TEXT PRIMARY KEY,
  product_id      TEXT NOT NULL,
  product_name    TEXT NOT NULL,
  product_name_ar TEXT NOT NULL DEFAULT '',
  version         TEXT NOT NULL DEFAULT '1.0',
  effective_date  DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factory_bom_lines (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  bom_id        TEXT NOT NULL REFERENCES factory_boms(id) ON DELETE CASCADE,
  material_id   TEXT NOT NULL,
  material_name TEXT NOT NULL,
  quantity      NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL DEFAULT 'kg',
  unit_cost     NUMERIC(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX idx_factory_bom_lines_bom ON factory_bom_lines(bom_id);

CREATE TABLE IF NOT EXISTS factory_qc (
  id                  TEXT PRIMARY KEY,
  production_order_id TEXT NOT NULL REFERENCES factory_orders(id),
  product_id          TEXT NOT NULL,
  product_name        TEXT NOT NULL,
  batch_id            TEXT NOT NULL,
  inspection_date     DATE NOT NULL,
  inspector           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pass','fail','pending','conditional')),
  defect_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  sample_size         INT NOT NULL DEFAULT 0,
  failed_units        INT NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_factory_qc_order ON factory_qc(production_order_id);
CREATE INDEX idx_factory_qc_batch ON factory_qc(batch_id);

CREATE TABLE IF NOT EXISTS factory_batches (
  id                  TEXT PRIMARY KEY,
  production_order_id TEXT NOT NULL REFERENCES factory_orders(id),
  product_name        TEXT NOT NULL,
  quantity            INT NOT NULL DEFAULT 0,
  produced_date       DATE NOT NULL,
  expiry_date         DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','quarantine','recalled')),
  qc_status           TEXT NOT NULL DEFAULT 'pending' CHECK (qc_status IN ('pass','fail','pending','conditional')),
  unit_cost           NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_factory_batches_order ON factory_batches(production_order_id);

CREATE TABLE IF NOT EXISTS factory_raw_materials (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  name_ar            TEXT NOT NULL DEFAULT '',
  category           TEXT NOT NULL CHECK (category IN ('oil','packaging','additives','labeling','cleaning')),
  unit               TEXT NOT NULL DEFAULT 'kg',
  on_hand            NUMERIC(12,3) NOT NULL DEFAULT 0,
  reorder_point      NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
  supplier           TEXT NOT NULL DEFAULT '',
  origin             TEXT NOT NULL DEFAULT 'local' CHECK (origin IN ('local','imported')),
  last_purchase_date DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_raw_materials_stock ON factory_raw_materials(on_hand, reorder_point);
CREATE TRIGGER trg_raw_materials_updated_at BEFORE UPDATE ON factory_raw_materials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS factory_finished_goods (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  name_ar             TEXT NOT NULL DEFAULT '',
  sku                 TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT '',
  on_hand             INT NOT NULL DEFAULT 0,
  reserved            INT NOT NULL DEFAULT 0,
  unit_cost           NUMERIC(14,2) NOT NULL DEFAULT 0,
  selling_price       NUMERIC(14,2) NOT NULL DEFAULT 0,
  production_order_id TEXT REFERENCES factory_orders(id),
  last_produced_date  DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_finished_goods_updated_at BEFORE UPDATE ON factory_finished_goods
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS factory_warehouse (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  zone        TEXT NOT NULL CHECK (zone IN ('raw','finished','packaging','quarantine')),
  capacity    INT NOT NULL DEFAULT 0,
  used        INT NOT NULL DEFAULT 0,
  temperature TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factory_imports (
  id                TEXT PRIMARY KEY,
  supplier_name     TEXT NOT NULL,
  origin            TEXT NOT NULL,
  total_value       NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'USD',
  order_date        DATE NOT NULL,
  estimated_arrival DATE NOT NULL,
  actual_arrival    DATE,
  status            TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered','in-transit','customs','received','cancelled')),
  customs_ref       TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_factory_imports_updated_at BEFORE UPDATE ON factory_imports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS factory_import_lines (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  import_id TEXT NOT NULL REFERENCES factory_imports(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  quantity  NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit      TEXT NOT NULL DEFAULT 'kg',
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX idx_factory_import_lines ON factory_import_lines(import_id);

CREATE TABLE IF NOT EXISTS factory_costing (
  id                  TEXT PRIMARY KEY,
  production_order_id TEXT NOT NULL REFERENCES factory_orders(id),
  product_name        TEXT NOT NULL,
  period              TEXT NOT NULL,
  raw_material_cost   NUMERIC(14,2) NOT NULL DEFAULT 0,
  labor_cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
  overhead_cost       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
  units_produced      INT NOT NULL DEFAULT 0,
  cost_per_unit       NUMERIC(14,2) NOT NULL DEFAULT 0,
  variance            NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTH / PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('Admin','Manager','Finance','Factory','Cashier')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

CREATE TABLE IF NOT EXISTS role_permissions (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  role       TEXT NOT NULL,
  module     TEXT NOT NULL,
  can_view   BOOLEAN NOT NULL DEFAULT FALSE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit   BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  can_export BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (role, module)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_cashiers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_refunds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_stock_counts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_boms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_bom_lines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_qc           ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_batches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_finished_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_warehouse    ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_imports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_import_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_costing      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions     ENABLE ROW LEVEL SECURITY;

-- Authenticated users can SELECT everything
CREATE POLICY "authenticated_select" ON customers            FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON suppliers            FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON departments          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON employees            FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON invoices             FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON invoice_lines        FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON payments             FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON expenses             FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON pos_products         FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON pos_cashiers         FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON pos_sales            FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON pos_refunds          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON pos_stock_counts     FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON loyalty_transactions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_orders       FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_boms         FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_bom_lines    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_qc           FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_batches      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_raw_materials FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_finished_goods FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_warehouse    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_imports      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_import_lines FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON factory_costing      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON user_roles           FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "authenticated_select" ON role_permissions     FOR SELECT TO authenticated USING (TRUE);

-- Authenticated users can INSERT / UPDATE / DELETE (service-role does the same without restriction)
-- Finer-grained checks are enforced at the application layer via role_permissions
CREATE POLICY "authenticated_write" ON customers            FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON suppliers            FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON departments          FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON employees            FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON invoices             FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON invoice_lines        FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON payments             FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON expenses             FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON pos_products         FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON pos_cashiers         FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON pos_sales            FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON pos_refunds          FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON pos_stock_counts     FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON loyalty_transactions FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_orders       FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_boms         FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_bom_lines    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_qc           FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_batches      FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_raw_materials FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_finished_goods FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_warehouse    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_imports      FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_import_lines FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON factory_costing      FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON user_roles           FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "authenticated_write" ON role_permissions     FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
