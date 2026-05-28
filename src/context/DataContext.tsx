import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { USE_SUPABASE } from "../lib/supabase";
import { fetchCustomers, createCustomer as sbCreateCustomer, updateCustomer as sbUpdateCustomer, deleteCustomer as sbDeleteCustomer } from "../services/customers";
import { fetchSuppliers, createSupplier as sbCreateSupplier, updateSupplier as sbUpdateSupplier, deleteSupplier as sbDeleteSupplier } from "../services/suppliers";
import { fetchEmployees, createEmployee as sbCreateEmployee, updateEmployee as sbUpdateEmployee, softDeleteEmployee as sbDeleteEmployee } from "../services/employees";
import { fetchInvoices, createInvoice as sbCreateInvoice, updateInvoice as sbUpdateInvoice } from "../services/invoices";
import { fetchExpenses, createExpense as sbCreateExpense, updateExpense as sbUpdateExpense, deleteExpense as sbDeleteExpense } from "../services/expenses";
import { fetchDepartments, createDepartment as sbCreateDepartment, updateDepartment as sbUpdateDepartment } from "../services/departments";
import { customerFromRow, supplierFromRow, employeeFromRow, invoiceFromRow, expenseFromRow, departmentFromRow } from "../services/adapters";
import type { CustomerRow } from "../types/database";
import type {
  Customer,
  Department,
  Employee,
  Expense,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  Purchase,
  StockMovement,
  Supplier,
} from "../data/types";
import { STOCK_MOVEMENTS_MOCK } from "../data/stockMovementsMock";
import {
  getCustomers, saveCustomers,
  getDepartments, saveDepartments,
  getEmployees, saveEmployees,
  getExpenses, saveExpenses,
  getInvoiceItems,
  getInvoices, saveInvoices,
  getPayments, savePayments,
  getStockMovements, saveStockMovements,
  getProductCategories, saveProductCategories,
  getProducts, saveProducts,
  getPurchases, savePurchases,
  getSuppliers, saveSuppliers,
} from "../data/storage";
import { isSuccessfulPaymentStatus, roundMoney } from "../data/relations";
import { POS_CASHIERS, type PosCashier } from "../data/posMock";

interface DataContextValue {
  // Raw entity lists
  customers: Customer[];
  departments: Department[];
  products: Product[];
  suppliers: Supplier[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
  employees: Employee[];
  purchases: Purchase[];
  expenses: Expense[];
  productCategories: string[];

  // Customer CRUD
  addCustomer: (c: Customer) => void;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;

  // Product CRUD
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  setProductCategories: (cats: string[]) => void;

  // Supplier CRUD
  addSupplier: (s: Supplier) => void;
  updateSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;

  // Payment CRUD
  addPayment: (p: Payment) => void;
  updatePayment: (p: Payment) => void;
  deletePayment: (id: string) => void;

  // Employee CRUD
  addEmployee: (e: Employee) => void;
  updateEmployee: (e: Employee) => void;
  deleteEmployee: (id: string) => void;

  // Cashier CRUD
  cashiers: PosCashier[];
  addCashier: (c: PosCashier) => void;
  updateCashier: (c: PosCashier) => void;

  // Department CRUD
  addDepartment: (d: Department) => void;
  updateDepartment: (d: Department) => void;

  // Expense CRUD
  addExpense: (e: Expense) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;

  // Invoice CRUD
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (inv: Invoice) => void;

  // Stock Movements
  stockMovements: StockMovement[];
  addStockMovement: (m: StockMovement) => void;

  // Derived selectors (replace hard-coded dashboard numbers)
  totalRevenue: number;
  receivablesTotal: number;
  openInvoicesCount: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalPaymentsCount: number;
  payablesDue: number;
  headcount: number;

  // Cross-entity derived maps
  customerBalanceMap: Map<string, number>;
  customerLastOrderMap: Map<string, string>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [productCategories, setProductCategoriesState] = useState<string[]>(() => getProductCategories());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());
  const [payments, setPayments] = useState<Payment[]>(() => getPayments());
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [purchases, setPurchases] = useState<Purchase[]>(() => getPurchases());
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [departments, setDepartments] = useState<Department[]>(() => getDepartments());
  const [cashiers, setCashiers] = useState<PosCashier[]>(() => POS_CASHIERS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const stored = getStockMovements();
    return stored.length > 0 ? stored : STOCK_MOVEMENTS_MOCK;
  });

  // ── Supabase bootstrap — replace initial state from DB when connected ─────────
  useEffect(() => {
    if (!USE_SUPABASE) return;
    Promise.all([
      fetchCustomers(),
      fetchSuppliers(),
      fetchEmployees(),
      fetchInvoices(),
      fetchExpenses(),
      fetchDepartments(),
    ]).then(([dbCustomers, dbSuppliers, dbEmployees, dbInvoices, dbExpenses, dbDepts]) => {
      if (dbCustomers.length)   setCustomers(dbCustomers.map(customerFromRow));
      if (dbSuppliers.length)   setSuppliers(dbSuppliers.map(supplierFromRow));
      if (dbEmployees.length)   setEmployees(dbEmployees.map(employeeFromRow));
      if (dbInvoices.length)    setInvoices(dbInvoices.map(invoiceFromRow));
      if (dbExpenses.length)    setExpenses(dbExpenses.map(expenseFromRow));
      if (dbDepts.length)       setDepartments(dbDepts.map(departmentFromRow));
    }).catch((e) => console.error("[DataContext] Supabase bootstrap failed:", e));
  }, []);

  // ── Customer CRUD ────────────────────────────────────────────────────────────

  function addCustomer(c: Customer) {
    const next = [...customers, c];
    setCustomers(next);
    saveCustomers(next);
    if (USE_SUPABASE) sbCreateCustomer({ id: c.id, name: c.name, phone: c.phone ?? "", code: c.code ?? null, tax_id: c.taxId ?? null, email: c.email ?? null, city: c.city ?? null, governorate: c.governorate ?? null, type: c.type ?? null, classification: c.classification ?? null, payment_terms: c.paymentTerms ?? null, currency: c.currency ?? "ILS", credit_limit: c.creditLimit ?? 0, outstanding_balance: c.outstandingBalance ?? 0, status: (c.status as CustomerRow["status"]) ?? "active", sales_rep: c.salesRep ?? null, notes: c.notes ?? null, joined_at: c.joinedAt ?? null, last_order_date: c.lastOrderDate ?? null, is_deleted: false }).catch(console.error);
  }

  function updateCustomer(c: Customer) {
    const next = customers.map((x) => (x.id === c.id ? c : x));
    setCustomers(next);
    saveCustomers(next);
    if (USE_SUPABASE) sbUpdateCustomer(c.id, { name: c.name, phone: c.phone ?? "", code: c.code ?? null, tax_id: c.taxId ?? null, email: c.email ?? null, city: c.city ?? null, governorate: c.governorate ?? null, type: c.type ?? null, classification: c.classification ?? null, payment_terms: c.paymentTerms ?? null, currency: c.currency ?? "ILS", credit_limit: c.creditLimit ?? 0, outstanding_balance: c.outstandingBalance ?? 0, status: (c.status as CustomerRow["status"]) ?? "active", sales_rep: c.salesRep ?? null, notes: c.notes ?? null }).catch(console.error);
  }

  function deleteCustomer(id: string) {
    const next = customers.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setCustomers(next);
    saveCustomers(next);
    if (USE_SUPABASE) sbDeleteCustomer(id).catch(console.error);
  }

  // ── Product CRUD ─────────────────────────────────────────────────────────────

  function addProduct(p: Product) {
    const next = [...products, p];
    setProducts(next);
    saveProducts(next);
  }

  function updateProduct(p: Product) {
    const next = products.map((x) => (x.id === p.id ? p : x));
    setProducts(next);
    saveProducts(next);
  }

  function deleteProduct(id: string) {
    const next = products.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setProducts(next);
    saveProducts(next);
  }

  function setProductCategories(cats: string[]) {
    setProductCategoriesState(cats);
    saveProductCategories(cats);
  }

  // ── Supplier CRUD ────────────────────────────────────────────────────────────

  function addSupplier(s: Supplier) {
    const next = [...suppliers, s];
    setSuppliers(next);
    saveSuppliers(next);
    if (USE_SUPABASE) sbCreateSupplier({ id: s.id, name: s.name, phone: s.phone ?? null, email: s.email ?? null, address: s.address ?? null, notes: s.notes ?? null, is_deleted: false }).catch(console.error);
  }

  function updateSupplier(s: Supplier) {
    const next = suppliers.map((x) => (x.id === s.id ? s : x));
    setSuppliers(next);
    saveSuppliers(next);
    if (USE_SUPABASE) sbUpdateSupplier(s.id, { name: s.name, phone: s.phone ?? null, email: s.email ?? null, address: s.address ?? null, notes: s.notes ?? null }).catch(console.error);
  }

  function deleteSupplier(id: string) {
    const next = suppliers.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setSuppliers(next);
    saveSuppliers(next);
    if (USE_SUPABASE) sbDeleteSupplier(id).catch(console.error);
  }

  // ── Payment CRUD ─────────────────────────────────────────────────────────────

  function addPayment(p: Payment) {
    const next = [...payments, p];
    setPayments(next);
    savePayments(next);
  }

  function updatePayment(p: Payment) {
    const next = payments.map((x) => (x.id === p.id ? p : x));
    setPayments(next);
    savePayments(next);
  }

  function deletePayment(id: string) {
    const next = payments.map((x) =>
      x.id === id ? { ...x, status: "Cancelled" as const } : x
    );
    setPayments(next);
    savePayments(next);
  }

  // ── Employee CRUD ────────────────────────────────────────────────────────────

  function addEmployee(e: Employee) {
    const next = [...employees, e];
    setEmployees(next);
    saveEmployees(next);
    if (USE_SUPABASE) sbCreateEmployee({ id: e.id, name: e.name, phone: e.phone, department_id: e.departmentId ?? null, work_start: e.workStart, work_end: e.workEnd, salary_type: e.salaryType, hourly_rate: e.hourlyRate ?? null, fixed_salary: e.fixedSalary ?? null, advance: e.advance, notes: e.notes ?? null, is_deleted: false }).catch(console.error);
  }

  function updateEmployee(e: Employee) {
    const next = employees.map((x) => (x.id === e.id ? e : x));
    setEmployees(next);
    saveEmployees(next);
    if (USE_SUPABASE) sbUpdateEmployee(e.id, { name: e.name, phone: e.phone, department_id: e.departmentId ?? null, work_start: e.workStart, work_end: e.workEnd, salary_type: e.salaryType, hourly_rate: e.hourlyRate ?? null, fixed_salary: e.fixedSalary ?? null, advance: e.advance, notes: e.notes ?? null }).catch(console.error);
  }

  function deleteEmployee(id: string) {
    const next = employees.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setEmployees(next);
    saveEmployees(next);
    if (USE_SUPABASE) sbDeleteEmployee(id).catch(console.error);
    // cascade: deactivate any cashier linked to this employee
    setCashiers((prev) =>
      prev.map((c) => (c.employeeId === id && c.status === "active" ? { ...c, status: "inactive" as const } : c))
    );
  }

  // ── Cashier CRUD ─────────────────────────────────────────────────────────────

  function addCashier(c: PosCashier) {
    setCashiers((prev) => [...prev, c]);
  }

  function updateCashier(c: PosCashier) {
    setCashiers((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  }

  // ── Department CRUD ──────────────────────────────────────────────────────────

  function addDepartment(d: Department) {
    const next = [...departments, d];
    setDepartments(next);
    saveDepartments(next);
    if (USE_SUPABASE) sbCreateDepartment({ id: d.id, name: d.name, name_ar: d.nameAr, head_id: d.headId ?? null, head_name: d.headName ?? null, parent_id: d.parentId ?? null, headcount: d.headcount, open_positions: d.openPositions, monthly_revenue: d.monthlyRevenue, status: d.status }).catch(console.error);
  }

  function updateDepartment(d: Department) {
    const next = departments.map((x) => (x.id === d.id ? d : x));
    setDepartments(next);
    saveDepartments(next);
    if (USE_SUPABASE) sbUpdateDepartment(d.id, { name: d.name, name_ar: d.nameAr, head_id: d.headId ?? null, head_name: d.headName ?? null, parent_id: d.parentId ?? null, headcount: d.headcount, open_positions: d.openPositions, monthly_revenue: d.monthlyRevenue, status: d.status }).catch(console.error);
  }

  // ── Expense CRUD ─────────────────────────────────────────────────────────────

  function addExpense(e: Expense) {
    const next = [...expenses, e];
    setExpenses(next);
    saveExpenses(next);
    if (USE_SUPABASE) sbCreateExpense({ id: e.id, date: e.date, description: e.description ?? null, category: e.category, amount: e.amount, currency: e.currency, vendor: e.vendor ?? null, payee: e.payee ?? null, payment_method: e.paymentMethod, receipt_url: e.receiptUrl ?? null, notes: e.notes ?? null, status: e.status ?? "pending", is_deleted: false }).catch(console.error);
  }

  function updateExpense(e: Expense) {
    const next = expenses.map((x) => (x.id === e.id ? e : x));
    setExpenses(next);
    saveExpenses(next);
    if (USE_SUPABASE) sbUpdateExpense(e.id, { date: e.date, description: e.description ?? null, category: e.category, amount: e.amount, currency: e.currency, vendor: e.vendor ?? null, payee: e.payee ?? null, payment_method: e.paymentMethod, receipt_url: e.receiptUrl ?? null, notes: e.notes ?? null, status: e.status ?? "pending" }).catch(console.error);
  }

  function deleteExpense(id: string) {
    const next = expenses.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setExpenses(next);
    saveExpenses(next);
    if (USE_SUPABASE) sbDeleteExpense(id).catch(console.error);
  }

  // ── Stock Movements ──────────────────────────────────────────────────────────

  function addStockMovement(m: StockMovement) {
    const next = [m, ...stockMovements];
    setStockMovements(next);
    saveStockMovements(next);
    // update product stock
    const delta = m.quantityIn - m.quantityOut;
    if (delta !== 0) {
      const updatedProducts = products.map((p) =>
        p.id === m.productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      );
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }
  }

  // ── Invoice CRUD ─────────────────────────────────────────────────────────────

  function addInvoice(inv: Invoice) {
    const next = [...invoices, inv];
    setInvoices(next);
    saveInvoices(next);
    if (USE_SUPABASE) sbCreateInvoice({ id: inv.id, customer_id: inv.customerId, amount: inv.amount ?? inv.total ?? 0, remaining_amount: inv.remainingAmount ?? inv.amount ?? 0, status: inv.status ?? "Pending", date: inv.date, notes: inv.notes ?? null, is_deleted: false }, []).catch(console.error);
  }

  function updateInvoice(inv: Invoice) {
    const next = invoices.map((x) => (x.id === inv.id ? inv : x));
    setInvoices(next);
    saveInvoices(next);
    if (USE_SUPABASE) sbUpdateInvoice(inv.id, { amount: inv.amount ?? inv.total ?? 0, remaining_amount: inv.remainingAmount ?? 0, status: inv.status ?? "Pending", date: inv.date, notes: inv.notes ?? null }).catch(console.error);
  }

  // ── Purchase CRUD (internal) ─────────────────────────────────────────────────
  // Exposed via context if needed; Purchases page can call savePurchases directly
  // until it migrates to DataContext.
  function _addPurchase(p: Purchase) {
    const next = [...purchases, p];
    setPurchases(next);
    savePurchases(next);
  }
  void _addPurchase; // suppress unused warning — available for future slice migration

  // ── Derived selectors ────────────────────────────────────────────────────────

  const activeCustomers = useMemo(
    () => customers.filter((c) => !c.isDeleted),
    [customers]
  );

  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted && p.archived !== true),
    [products]
  );

  const activeEmployees = useMemo(
    () => employees.filter((e) => !e.isDeleted),
    [employees]
  );

  const totalRevenue = useMemo(
    () =>
      roundMoney(
        payments
          .filter((p) => isSuccessfulPaymentStatus(p.status))
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      ),
    [payments]
  );

  const receivablesTotal = useMemo(
    () =>
      roundMoney(
        invoices
          .filter((inv) => inv.status !== "Paid")
          .reduce((sum, inv) => sum + Number(inv.remainingAmount ?? inv.amount ?? 0), 0)
      ),
    [invoices]
  );

  const openInvoicesCount = useMemo(
    () => invoices.filter((inv) => inv.status !== "Paid").length,
    [invoices]
  );

  const totalCustomers = useMemo(() => activeCustomers.length, [activeCustomers]);
  const totalProducts = useMemo(() => activeProducts.length, [activeProducts]);

  const lowStockCount = useMemo(
    () =>
      activeProducts.filter(
        (p) => p.stock > 0 && p.stock <= (p.minStock ?? p.reorderThreshold ?? 5)
      ).length,
    [activeProducts]
  );

  const outOfStockCount = useMemo(
    () => activeProducts.filter((p) => p.stock <= 0).length,
    [activeProducts]
  );

  const totalPaymentsCount = useMemo(() => payments.length, [payments]);

  const payablesDue = useMemo(
    () =>
      roundMoney(
        purchases
          .filter((p) => p.status === "Pending")
          .reduce((sum, p) => sum + Number(p.totalCost || 0), 0)
      ),
    [purchases]
  );

  const headcount = useMemo(() => activeEmployees.length, [activeEmployees]);

  const customerBalanceMap = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      if (inv.status === "Paid") return;
      const amount = Number(inv.remainingAmount ?? inv.amount ?? 0);
      map.set(inv.customerId, (map.get(inv.customerId) ?? 0) + amount);
    });
    return map;
  }, [invoices]);

  const customerLastOrderMap = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach((inv) => {
      const existing = map.get(inv.customerId);
      if (!existing || inv.date > existing) map.set(inv.customerId, inv.date);
    });
    return map;
  }, [invoices]);

  const value: DataContextValue = {
    customers,
    departments,
    products,
    suppliers,
    invoices,
    invoiceItems,
    payments,
    employees,
    purchases,
    expenses,
    productCategories,
    addCustomer, updateCustomer, deleteCustomer,
    addDepartment, updateDepartment,
    addProduct, updateProduct, deleteProduct, setProductCategories,
    addSupplier, updateSupplier, deleteSupplier,
    addPayment, updatePayment, deletePayment,
    addEmployee, updateEmployee, deleteEmployee,
    cashiers, addCashier, updateCashier,
    addExpense, updateExpense, deleteExpense,
    addInvoice, updateInvoice,
    stockMovements, addStockMovement,
    totalRevenue,
    receivablesTotal,
    openInvoicesCount,
    totalCustomers,
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalPaymentsCount,
    payablesDue,
    headcount,
    customerBalanceMap,
    customerLastOrderMap,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
