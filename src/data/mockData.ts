import type {
  Customer,
  DashboardStat,
  Employee,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  ProductStatus,
  Purchase,
  Supplier,
} from "./types";

function getProductStatus(stock: number): ProductStatus {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 15) return "Low Stock";
  return "In Stock";
}

export const dashboardStats: DashboardStat[] = [
  { title: "Customers", value: "3" },
  { title: "Products", value: "3" },
  { title: "Invoices", value: "3" },
  { title: "Payments", value: "3" },
];

export const customersData: Customer[] = [
  {
    id: "CUST-1001",
    name: "Osid Barakat",
    address: "Palestine",
    location: "Palestine",
    phone: "0590000000",
    email: "osid@email.com",
    notes: "VIP customer",
    joinedAt: "2026-04-01",
    isDeleted: false,
  },
  {
    id: "CUST-1002",
    name: "Mahmoud Kharouf",
    address: "Palestine",
    location: "Palestine",
    phone: "0561231231",
    email: "mahmoud@email.com",
    notes: "Repeat buyer",
    joinedAt: "2026-04-02",
    isDeleted: false,
  },
  {
    id: "CUST-1003",
    name: "Saleem",
    address: "Palestine",
    location: "Palestine",
    phone: "0597777777",
    email: "saleem@email.com",
    notes: "",
    joinedAt: "2026-04-03",
    isDeleted: false,
  },
];

export const suppliersData: Supplier[] = [
  {
    id: "SUP-1001",
    name: "Tech Source",
    phone: "0591111111",
    email: "sales@techsource.com",
    address: "Ramallah",
    notes: "Primary electronics supplier",
    isDeleted: false,
  },
  {
    id: "SUP-1002",
    name: "Digital Hub",
    phone: "0562222222",
    email: "orders@digitalhub.com",
    address: "Nablus",
    notes: "",
    isDeleted: false,
  },
];

export const productsData: Product[] = [
  {
    id: "PROD-1001",
    name: "Laptop",
    category: "Electronics",
    price: 1200,
    stock: 8,
    status: getProductStatus(8),
    createdAt: "2026-04-01",
    isDeleted: false,
  },
  {
    id: "PROD-1002",
    name: "Phone",
    category: "Electronics",
    price: 800,
    stock: 12,
    status: getProductStatus(12),
    createdAt: "2026-04-02",
    isDeleted: false,
  },
  {
    id: "PROD-1003",
    name: "Monitor",
    category: "Accessories",
    price: 350,
    stock: 4,
    status: getProductStatus(4),
    createdAt: "2026-04-03",
    isDeleted: false,
  },
];

export const purchasesData: Purchase[] = [
  {
    id: "PUR-3001",
    supplierId: "SUP-1001",
    productId: "PROD-1001",
    quantity: 10,
    totalCost: 9000,
    status: "Received",
    date: "2026-04-01",
    notes: "Initial stock",
    isDeleted: false,
  },
  {
    id: "PUR-3002",
    supplierId: "SUP-1001",
    productId: "PROD-1002",
    quantity: 15,
    totalCost: 9000,
    status: "Received",
    date: "2026-04-02",
    notes: "",
    isDeleted: false,
  },
  {
    id: "PUR-3003",
    supplierId: "SUP-1002",
    productId: "PROD-1003",
    quantity: 6,
    totalCost: 1500,
    status: "Pending",
    date: "2026-04-03",
    notes: "",
    isDeleted: false,
  },
];

export const invoicesData: Invoice[] = [
  {
    id: "INV-1001",
    customerId: "CUST-1001",
    status: "Paid",
    amount: 2400,
    remainingAmount: 0,
    date: "2026-04-03",
    notes: "",
  },
  {
    id: "INV-1002",
    customerId: "CUST-1002",
    status: "Paid",
    amount: 800,
    remainingAmount: 0,
    date: "2026-04-02",
    notes: "",
  },
  {
    id: "INV-1003",
    customerId: "CUST-1003",
    status: "Partial",
    amount: 1050,
    remainingAmount: 250,
    date: "2026-04-01",
    notes: "",
  },
];

export const invoiceItemsData: InvoiceItem[] = [
  {
    id: "ITEM-1001",
    invoiceId: "INV-1001",
    productId: "PROD-1001",
    quantity: 2,
    unitPrice: 1200,
    total: 2400,
  },
  {
    id: "ITEM-1002",
    invoiceId: "INV-1002",
    productId: "PROD-1002",
    quantity: 1,
    unitPrice: 800,
    total: 800,
  },
  {
    id: "ITEM-1003",
    invoiceId: "INV-1003",
    productId: "PROD-1003",
    quantity: 3,
    unitPrice: 350,
    total: 1050,
  },
];

export const paymentsData: Payment[] = [
  {
    id: "PAY-2001",
    paymentId: "PAY-2001",
    invoiceId: "INV-1001",
    customerId: "CUST-1001",
    method: "Cash",
    date: "2026-04-03",
    amount: 2400,
    status: "Completed",
    notes: "",
  },
  {
    id: "PAY-2002",
    paymentId: "PAY-2002",
    invoiceId: "INV-1002",
    customerId: "CUST-1002",
    method: "Card",
    date: "2026-04-02",
    amount: 800,
    status: "Completed",
    notes: "",
  },
  {
    id: "PAY-2003",
    paymentId: "PAY-2003",
    invoiceId: "INV-1003",
    customerId: "CUST-1003",
    method: "Bank Transfer",
    date: "2026-04-01",
    amount: 800,
    status: "Completed",
    notes: "",
  },
];

export const employeesData: Employee[] = [
  {
    id: "EMP-1001",
    name: "Ahmad Saleh",
    phone: "0591234567",
    workStart: "08:00",
    workEnd: "17:00",
    salaryType: "hourly",
    hourlyRate: 15,
    advance: 500,
    notes: "Front desk and daily operations",
    isDeleted: false,
  },
  {
    id: "EMP-1002",
    name: "Mohammad Khaled",
    phone: "0569876543",
    workStart: "09:00",
    workEnd: "18:00",
    salaryType: "fixed",
    fixedSalary: 2500,
    advance: 1000,
    notes: "Accounts assistant",
    isDeleted: false,
  },
];