export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  joinedAt: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  createdAt: string;
};

export type Invoice = {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending";
};

export type Payment = {
  id: string;
  customer: string;
  method: "Cash" | "Card" | "Bank Transfer";
  amount: number;
  date: string;
  status: "Completed" | "Pending";
};

export type Purchase = {
  id: string;
  supplier: string;
  product: string;
  quantity: number;
  totalCost: number;
  date: string;
  status: "Received" | "Pending";
};

const STORAGE_KEYS = {
  customers: "shared_customers_data",
  products: "shared_products_data",
  invoices: "shared_invoices_data",
  payments: "shared_payments_data",
  purchases: "shared_purchases_data",
};

const defaultCustomers: Customer[] = [
  {
    id: "CUST-1001",
    name: "Ahmed Ali",
    email: "ahmed@email.com",
    phone: "0599000001",
    status: "Active",
    joinedAt: "2026-04-01",
  },
  {
    id: "CUST-1002",
    name: "Sara Mohamed",
    email: "sara@email.com",
    phone: "0599000002",
    status: "Active",
    joinedAt: "2026-04-02",
  },
  {
    id: "CUST-1003",
    name: "Omar Khaled",
    email: "omar@email.com",
    phone: "0599000003",
    status: "Inactive",
    joinedAt: "2026-04-03",
  },
  {
    id: "CUST-1004",
    name: "Lina Sameer",
    email: "lina@email.com",
    phone: "0599000004",
    status: "Active",
    joinedAt: "2026-04-03",
  },
];

const defaultProducts: Product[] = [
  {
    id: "PROD-1001",
    name: "Wireless Mouse",
    category: "Accessories",
    price: 25,
    stock: 42,
    status: "In Stock",
    createdAt: "2026-04-01",
  },
  {
    id: "PROD-1002",
    name: "Mechanical Keyboard",
    category: "Accessories",
    price: 80,
    stock: 12,
    status: "Low Stock",
    createdAt: "2026-04-02",
  },
  {
    id: "PROD-1003",
    name: "Office Chair",
    category: "Furniture",
    price: 150,
    stock: 0,
    status: "Out of Stock",
    createdAt: "2026-04-03",
  },
];

const defaultInvoices: Invoice[] = [
  {
    id: "INV-1001",
    customer: "Ahmed Ali",
    date: "2026-04-01",
    amount: 250,
    status: "Paid",
  },
  {
    id: "INV-1002",
    customer: "Sara Mohamed",
    date: "2026-04-02",
    amount: 420,
    status: "Pending",
  },
];

const defaultPayments: Payment[] = [
  {
    id: "PAY-2001",
    customer: "Ahmed Ali",
    method: "Cash",
    amount: 250,
    date: "2026-04-01",
    status: "Completed",
  },
  {
    id: "PAY-2002",
    customer: "Sara Mohamed",
    method: "Card",
    amount: 420,
    date: "2026-04-02",
    status: "Pending",
  },
];

const defaultPurchases: Purchase[] = [
  {
    id: "PUR-3001",
    supplier: "Tech Source",
    product: "Wireless Mouse",
    quantity: 20,
    totalCost: 300,
    date: "2026-04-01",
    status: "Received",
  },
  {
    id: "PUR-3002",
    supplier: "Office Hub",
    product: "Office Chair",
    quantity: 10,
    totalCost: 1200,
    date: "2026-04-02",
    status: "Pending",
  },
  {
    id: "PUR-3003",
    supplier: "Digital Market",
    product: "Mechanical Keyboard",
    quantity: 15,
    totalCost: 900,
    date: "2026-04-03",
    status: "Received",
  },
];

function loadData<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveData<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCustomers(): Customer[] {
  return loadData(STORAGE_KEYS.customers, defaultCustomers);
}

export function saveCustomers(customers: Customer[]) {
  saveData(STORAGE_KEYS.customers, customers);
}

export function resetCustomers() {
  saveCustomers(defaultCustomers);
}

export function getProducts(): Product[] {
  return loadData(STORAGE_KEYS.products, defaultProducts);
}

export function saveProducts(products: Product[]) {
  saveData(STORAGE_KEYS.products, products);
}

export function resetProducts() {
  saveProducts(defaultProducts);
}

export function getInvoices(): Invoice[] {
  return loadData(STORAGE_KEYS.invoices, defaultInvoices);
}

export function saveInvoices(invoices: Invoice[]) {
  saveData(STORAGE_KEYS.invoices, invoices);
}

export function resetInvoices() {
  saveInvoices(defaultInvoices);
}

export function getPayments(): Payment[] {
  return loadData(STORAGE_KEYS.payments, defaultPayments);
}

export function savePayments(payments: Payment[]) {
  saveData(STORAGE_KEYS.payments, payments);
}

export function resetPayments() {
  savePayments(defaultPayments);
}

export function getPurchases(): Purchase[] {
  return loadData(STORAGE_KEYS.purchases, defaultPurchases);
}

export function savePurchases(purchases: Purchase[]) {
  saveData(STORAGE_KEYS.purchases, purchases);
}

export function resetPurchases() {
  savePurchases(defaultPurchases);
}