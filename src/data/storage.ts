import {
  customersData,
  invoicesData,
  paymentsData,
  productsData,
  purchasesData,
} from "./mockData";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
};

export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  createdAt: string;
  imageUrl?: string;
};

export type PurchaseStatus = "Paid" | "Partial" | "Debt";

export type Purchase = {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  totalCost: number;
  paidAmount: number;
  remainingDebt: number;
  date: string;
  status: PurchaseStatus;
};

export type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Check";

export type InvoiceStatus = "Paid" | "Pending" | "Partial";

export type Invoice = {
  id: string;
  customer: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  paymentMethod: PaymentMethod;
  checkNumber?: string;
  checkDueDate?: string;
  notes?: string;
};
export type Payment = {
  customer: string;
  method: "Cash" | "Card" | "Bank Transfer" | "Check";
  date: string;
  amount: number;
  notes?: string;
};
const STORAGE_KEYS = {
  customers: "dashboard_customers",
  products: "dashboard_products",
  purchases: "dashboard_purchases",
  invoices: "dashboard_invoices",
  payments: "dashboard_payments",
} as const;

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) {
      return cloneData(fallback);
    }

    return JSON.parse(stored) as T;
  } catch {
    return cloneData(fallback);
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // تجاهل أخطاء localStorage
  }
}

/* ----------------------------- Customers ----------------------------- */

export function getCustomers(): Customer[] {
  return safeRead<Customer[]>(STORAGE_KEYS.customers, customersData);
}

export function saveCustomers(customers: Customer[]) {
  safeWrite(STORAGE_KEYS.customers, customers);
}

export function resetCustomers() {
  safeWrite(STORAGE_KEYS.customers, cloneData(customersData));
}

/* ----------------------------- Products ------------------------------ */

export function getProducts(): Product[] {
  return safeRead<Product[]>(STORAGE_KEYS.products, productsData);
}

export function saveProducts(products: Product[]) {
  safeWrite(STORAGE_KEYS.products, products);
}

export function resetProducts() {
  safeWrite(STORAGE_KEYS.products, cloneData(productsData));
}

/* ----------------------------- Purchases ----------------------------- */

export function getPurchases(): Purchase[] {
  return safeRead<Purchase[]>(STORAGE_KEYS.purchases, purchasesData);
}

export function savePurchases(purchases: Purchase[]) {
  safeWrite(STORAGE_KEYS.purchases, purchases);
}

export function resetPurchases() {
  safeWrite(STORAGE_KEYS.purchases, cloneData(purchasesData));
}

/* ------------------------------ Invoices ----------------------------- */

export function getInvoices(): Invoice[] {
  return safeRead<Invoice[]>(STORAGE_KEYS.invoices, invoicesData);
}

export function saveInvoices(invoices: Invoice[]) {
  safeWrite(STORAGE_KEYS.invoices, invoices);
}

export function resetInvoices() {
  safeWrite(STORAGE_KEYS.invoices, cloneData(invoicesData));
}

/* ------------------------------ Payments ----------------------------- */

export function getPayments(): Payment[] {
  return safeRead<Payment[]>(STORAGE_KEYS.payments, paymentsData);
}

export function savePayments(payments: Payment[]) {
  safeWrite(STORAGE_KEYS.payments, payments);
}

export function resetPayments() {
  safeWrite(STORAGE_KEYS.payments, cloneData(paymentsData));
}

/* ---------------------------- Utilities ------------------------------ */

export function clearAllDashboardStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function seedDashboardStorage() {
  resetCustomers();
  resetProducts();
  resetPurchases();
  resetInvoices();
  resetPayments();
}