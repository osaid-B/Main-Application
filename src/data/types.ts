export type DashboardStat = {
  title: string;
  value: string;
};

export type Customer = {
  id: string;
  name: string;
  address?: string;
  location?: string;
  phone: string;
  email?: string;
  notes?: string;
  joinedAt?: string;
  isDeleted?: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isDeleted?: boolean;
};

export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  createdAt?: string;
  isDeleted?: boolean;
};

export type PurchaseStatus = "Received" | "Pending";

export type Purchase = {
  id: string;
  supplierId: string;
  productId: string;
  quantity: number;
  totalCost: number;
  status: PurchaseStatus;
  date: string;
  notes?: string;
  isDeleted?: boolean;
};

export type InvoiceStatus = "Paid" | "Partial" | "Debit";

export type Invoice = {
  id: string;
  customerId: string;
  amount: number;
  remainingAmount?: number;
  status: InvoiceStatus;
  date: string;
  notes?: string;
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PaymentMethod = "Cash" | "Card" | "Bank Transfer";

export type PaymentStatus = "Paid" | "Pending" | "Partial" | "Completed";

export type Payment = {
  id: string;
  paymentId?: string;
  invoiceId: string;
  customerId: string;
  method?: PaymentMethod;
  date: string;
  amount: number;
  status?: PaymentStatus;
  notes?: string;
};

export type SalaryType = "hourly" | "fixed";

export type Employee = {
  id: string;
  name: string;
  phone: string;
  workStart: string;
  workEnd: string;
  checkIn?: string;
  checkOut?: string;
  salaryType: SalaryType;
  hourlyRate?: number;
  fixedSalary?: number;
  advance: number;
  notes?: string;
  isDeleted?: boolean;
};