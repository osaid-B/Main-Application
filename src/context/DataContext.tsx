import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
  Supplier,
} from "../data/types";
import {
  getCustomers, saveCustomers,
  getDepartments, saveDepartments,
  getEmployees, saveEmployees,
  getExpenses, saveExpenses,
  getInvoiceItems,
  getInvoices, saveInvoices,
  getPayments, savePayments,
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

  // ── Customer CRUD ────────────────────────────────────────────────────────────

  function addCustomer(c: Customer) {
    const next = [...customers, c];
    setCustomers(next);
    saveCustomers(next);
  }

  function updateCustomer(c: Customer) {
    const next = customers.map((x) => (x.id === c.id ? c : x));
    setCustomers(next);
    saveCustomers(next);
  }

  function deleteCustomer(id: string) {
    const next = customers.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setCustomers(next);
    saveCustomers(next);
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
  }

  function updateSupplier(s: Supplier) {
    const next = suppliers.map((x) => (x.id === s.id ? s : x));
    setSuppliers(next);
    saveSuppliers(next);
  }

  function deleteSupplier(id: string) {
    const next = suppliers.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setSuppliers(next);
    saveSuppliers(next);
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
  }

  function updateEmployee(e: Employee) {
    const next = employees.map((x) => (x.id === e.id ? e : x));
    setEmployees(next);
    saveEmployees(next);
  }

  function deleteEmployee(id: string) {
    const next = employees.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setEmployees(next);
    saveEmployees(next);
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
  }

  function updateDepartment(d: Department) {
    const next = departments.map((x) => (x.id === d.id ? d : x));
    setDepartments(next);
    saveDepartments(next);
  }

  // ── Expense CRUD ─────────────────────────────────────────────────────────────

  function addExpense(e: Expense) {
    const next = [...expenses, e];
    setExpenses(next);
    saveExpenses(next);
  }

  function updateExpense(e: Expense) {
    const next = expenses.map((x) => (x.id === e.id ? e : x));
    setExpenses(next);
    saveExpenses(next);
  }

  function deleteExpense(id: string) {
    const next = expenses.map((x) => (x.id === id ? { ...x, isDeleted: true } : x));
    setExpenses(next);
    saveExpenses(next);
  }

  // ── Invoice CRUD ─────────────────────────────────────────────────────────────

  function addInvoice(inv: Invoice) {
    const next = [...invoices, inv];
    setInvoices(next);
    saveInvoices(next);
  }

  function updateInvoice(inv: Invoice) {
    const next = invoices.map((x) => (x.id === inv.id ? inv : x));
    setInvoices(next);
    saveInvoices(next);
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
