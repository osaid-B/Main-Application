import type {
  Customer,
  Employee,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  Purchase,
  Supplier,
} from "./types";

import {
  customersData,
  employeesData,
  invoicesData,
  invoiceItemsData,
  paymentsData,
  productsData,
  purchasesData,
  suppliersData,
} from "./mockData";

const CUSTOMERS_KEY = "dashboard_customers";
const SUPPLIERS_KEY = "dashboard_suppliers";
const PRODUCTS_KEY = "dashboard_products";
const PRODUCT_CATEGORIES_KEY = "dashboard_product_categories";
const PURCHASES_KEY = "dashboard_purchases";
const INVOICES_KEY = "dashboard_invoices";
const INVOICE_ITEMS_KEY = "dashboard_invoice_items";
const PAYMENTS_KEY = "dashboard_payments";
const EMPLOYEES_KEY = "dashboard_employees";

function readStorage<T>(key: string, fallback: T): T {
  const data = localStorage.getItem(key);

  if (!data) return fallback;

  try {
    return JSON.parse(data) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function deriveCategoriesFromProducts(products: Product[]): string[] {
  return Array.from(
    new Set(
      products
        .map((product) => normalizeCategoryName(product.category || ""))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function normalizeEmployees(employees: Employee[]): Employee[] {
  return employees.map((employee) => ({
    ...employee,
    advance: Number(employee.advance || 0),
    advances: Array.isArray(employee.advances)
      ? employee.advances.map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
        }))
      : [],
    attendanceRecords: Array.isArray(employee.attendanceRecords)
      ? employee.attendanceRecords.map((record) => ({
          ...record,
          actualHours: Number(record.actualHours || 0),
        }))
      : [],
    dailyAttendance: Array.isArray(employee.dailyAttendance)
      ? employee.dailyAttendance.map((entry) => ({
          ...entry,
          workedHours: Number(entry.workedHours || 0),
          advanceAmount: Number(entry.advanceAmount || 0),
        }))
      : [],
  }));
}

/* Customers */
export function getCustomers(): Customer[] {
  return readStorage<Customer[]>(CUSTOMERS_KEY, customersData);
}

export function saveCustomers(customers: Customer[]) {
  writeStorage(CUSTOMERS_KEY, customers);
}

export function resetCustomers() {
  writeStorage(CUSTOMERS_KEY, customersData);
}

/* Suppliers */
export function getSuppliers(): Supplier[] {
  return readStorage<Supplier[]>(SUPPLIERS_KEY, suppliersData);
}

export function saveSuppliers(suppliers: Supplier[]) {
  writeStorage(SUPPLIERS_KEY, suppliers);
}

export function resetSuppliers() {
  writeStorage(SUPPLIERS_KEY, suppliersData);
}

/* Products */
export function getProducts(): Product[] {
  return readStorage<Product[]>(PRODUCTS_KEY, productsData);
}

export function saveProducts(products: Product[]) {
  writeStorage(PRODUCTS_KEY, products);

  const existingCategories = getProductCategories();
  const derivedCategories = deriveCategoriesFromProducts(products);

  const mergedCategories = Array.from(
    new Set([...existingCategories, ...derivedCategories].map(normalizeCategoryName))
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  writeStorage(PRODUCT_CATEGORIES_KEY, mergedCategories);
}

export function resetProducts() {
  writeStorage(PRODUCTS_KEY, productsData);
  writeStorage(
    PRODUCT_CATEGORIES_KEY,
    deriveCategoriesFromProducts(productsData)
  );
}

/* Product Categories */
export function getProductCategories(): string[] {
  const stored = readStorage<string[]>(PRODUCT_CATEGORIES_KEY, []);

  if (stored.length > 0) {
    return Array.from(new Set(stored.map(normalizeCategoryName)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  const fallback = deriveCategoriesFromProducts(getProducts());
  writeStorage(PRODUCT_CATEGORIES_KEY, fallback);
  return fallback;
}

export function saveProductCategories(categories: string[]) {
  const cleaned = Array.from(new Set(categories.map(normalizeCategoryName)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  writeStorage(PRODUCT_CATEGORIES_KEY, cleaned);
}

export function resetProductCategories() {
  writeStorage(
    PRODUCT_CATEGORIES_KEY,
    deriveCategoriesFromProducts(getProducts())
  );
}

/* Purchases */
export function getPurchases(): Purchase[] {
  return readStorage<Purchase[]>(PURCHASES_KEY, purchasesData);
}

export function savePurchases(purchases: Purchase[]) {
  writeStorage(PURCHASES_KEY, purchases);
}

export function resetPurchases() {
  writeStorage(PURCHASES_KEY, purchasesData);
}

/* Invoices */
export function getInvoices(): Invoice[] {
  return readStorage<Invoice[]>(INVOICES_KEY, invoicesData);
}

export function saveInvoices(invoices: Invoice[]) {
  writeStorage(INVOICES_KEY, invoices);
}

export function resetInvoices() {
  writeStorage(INVOICES_KEY, invoicesData);
}

/* Invoice Items */
export function getInvoiceItems(): InvoiceItem[] {
  return readStorage<InvoiceItem[]>(INVOICE_ITEMS_KEY, invoiceItemsData);
}

export function saveInvoiceItems(items: InvoiceItem[]) {
  writeStorage(INVOICE_ITEMS_KEY, items);
}

export function resetInvoiceItems() {
  writeStorage(INVOICE_ITEMS_KEY, invoiceItemsData);
}

/* Payments */
export function getPayments(): Payment[] {
  return readStorage<Payment[]>(PAYMENTS_KEY, paymentsData);
}

export function savePayments(payments: Payment[]) {
  writeStorage(PAYMENTS_KEY, payments);
}

export function resetPayments() {
  writeStorage(PAYMENTS_KEY, paymentsData);
}

/* Employees */
export function getEmployees(): Employee[] {
  const employees = readStorage<Employee[]>(EMPLOYEES_KEY, employeesData);
  return normalizeEmployees(employees);
}

export function saveEmployees(employees: Employee[]) {
  writeStorage(EMPLOYEES_KEY, normalizeEmployees(employees));
}

export function resetEmployees() {
  writeStorage(EMPLOYEES_KEY, normalizeEmployees(employeesData));
}

/* Optional helper: reset everything */
export function resetAllStorage() {
  resetCustomers();
  resetSuppliers();
  resetProducts();
  resetProductCategories();
  resetPurchases();
  resetInvoices();
  resetInvoiceItems();
  resetPayments();
  resetEmployees();
}