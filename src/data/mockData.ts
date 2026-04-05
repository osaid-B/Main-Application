import type { Customer, Invoice, Payment, Product, Purchase } from "./storage";

export const dashboardStats = [
  { title: "Total Sales", value: "$12,450" },
  { title: "Customers", value: "245" },
  { title: "Invoices", value: "38" },
  { title: "Products", value: "124" },
];

export const customersData: Customer[] = [
  {
    id: "CUST-1001",
    name: "Osid Barakat",
    email: "osid@example.com",
    phone: "0590000000",
    joinedAt: "2026-04-01",
  },
  {
    id: "CUST-1002",
    name: "Mahmoud Kharouf",
    email: "mahmoud@example.com",
    phone: "0561231231",
    joinedAt: "2026-04-02",
  },
  {
    id: "CUST-1003",
    name: "Saleem",
    email: "saleem@example.com",
    phone: "0565554443",
    joinedAt: "2026-04-03",
  },
];

export const productsData: Product[] = [
  {
    id: "PROD-1001",
    name: "Laptop",
    category: "Electronics",
    price: 1200,
    stock: 10,
    status: "Low Stock",
    createdAt: "2026-04-01",
  },
  {
    id: "PROD-1002",
    name: "Phone",
    category: "Electronics",
    price: 800,
    stock: 25,
    status: "In Stock",
    createdAt: "2026-04-02",
  },
  {
    id: "PROD-1003",
    name: "Monitor",
    category: "Accessories",
    price: 350,
    stock: 18,
    status: "In Stock",
    createdAt: "2026-04-03",
  },
  {
    id: "PROD-1004",
    name: "Keyboard",
    category: "Accessories",
    price: 90,
    stock: 0,
    status: "Out of Stock",
    createdAt: "2026-04-04",
  },
];

export const purchasesData: Purchase[] = [
  {
    id: "PUR-3001",
    customer: "Osid Barakat",
    product: "Laptop",
    quantity: 2,
    totalCost: 2400,
    paidAmount: 2400,
    remainingDebt: 0,
    date: "2026-04-01",
    status: "Paid",
  },
  {
    id: "PUR-3002",
    customer: "Mahmoud Kharouf",
    product: "Phone",
    quantity: 1,
    totalCost: 800,
    paidAmount: 300,
    remainingDebt: 500,
    date: "2026-04-02",
    status: "Partial",
  },
  {
    id: "PUR-3003",
    customer: "Saleem",
    product: "Monitor",
    quantity: 3,
    totalCost: 1050,
    paidAmount: 0,
    remainingDebt: 1050,
    date: "2026-04-03",
    status: "Debt",
  },
];

export const invoicesData: Invoice[] = [
  {
    id: "INV-1001",
    customer: "Osid Barakat",
    amount: 2400,
    status: "Paid",
    date: "2026-04-01",
  },
  {
    id: "INV-1002",
    customer: "Mahmoud Kharouf",
    amount: 800,
    status: "Pending",
    date: "2026-04-02",
  },
  {
    id: "INV-1003",
    customer: "Saleem",
    amount: 1050,
    status: "Partial",
    date: "2026-04-03",
  },
];

export const paymentsData: Payment[] = [
  {
    customer: "Osid Barakat",
    method: "Cash",
    date: "2026-04-03",
    amount: 2400,
  },
  {
    customer: "Mahmoud Kharouf",
    method: "Card",
    date: "2026-04-02",
    amount: 800,
  },
  {
    customer: "Saleem",
    method: "Bank Transfer",
    date: "2026-04-01",
    amount: 1050,
  },
];

export const recentInvoices = [
  {
    id: "INV-1001",
    customer: "Osid Barakat",
    status: "Paid",
    amount: 2400,
    date: "2026-04-01",
  },
  {
    id: "INV-1002",
    customer: "Mahmoud Kharouf",
    status: "Pending",
    amount: 800,
    date: "2026-04-02",
  },
  {
    id: "INV-1003",
    customer: "Saleem",
    status: "Partial",
    amount: 1050,
    date: "2026-04-03",
  },
];

export const recentPayments = [
  {
    customer: "Osid Barakat",
    method: "Cash",
    amount: 2400,
  },
  {
    customer: "Mahmoud Kharouf",
    method: "Card",
    amount: 800,
  },
  {
    customer: "Saleem",
    method: "Bank Transfer",
    amount: 1050,
  },
];