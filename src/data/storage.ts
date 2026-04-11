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
}

export function resetProducts() {
  writeStorage(PRODUCTS_KEY, productsData);
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
  return readStorage<Employee[]>(EMPLOYEES_KEY, employeesData);
}

export function saveEmployees(employees: Employee[]) {
  writeStorage(EMPLOYEES_KEY, employees);
}

export function resetEmployees() {
  writeStorage(EMPLOYEES_KEY, employeesData);
}

/* Optional helper: reset everything */
export function resetAllStorage() {
  resetCustomers();
  resetSuppliers();
  resetProducts();
  resetPurchases();
  resetInvoices();
  resetInvoiceItems();
  resetPayments();
  resetEmployees();
}