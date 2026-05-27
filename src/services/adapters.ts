/**
 * Type adapters between Supabase DB rows (snake_case) and app domain types (camelCase).
 * These are one-directional: DB → App. Inverse mapping happens in each service call.
 */

import type {
  CustomerRow,
  SupplierRow,
  EmployeeRow,
  InvoiceRow,
  ExpenseRow,
  DepartmentRow,
} from "../types/database";
import type {
  Customer,
  Supplier,
  Employee,
  Invoice,
  Expense,
  Department,
} from "../data/types";

export function customerFromRow(r: CustomerRow): Customer {
  return {
    id: r.id,
    name: r.name,
    code: r.code ?? undefined,
    taxId: r.tax_id ?? undefined,
    phone: r.phone,
    email: r.email ?? undefined,
    city: r.city ?? undefined,
    governorate: r.governorate ?? undefined,
    type: r.type ?? undefined,
    classification: r.classification ?? undefined,
    paymentTerms: r.payment_terms ?? undefined,
    currency: r.currency,
    creditLimit: r.credit_limit,
    outstandingBalance: r.outstanding_balance,
    status: r.status,
    salesRep: r.sales_rep ?? undefined,
    notes: r.notes ?? undefined,
    joinedAt: r.joined_at ?? undefined,
    lastOrderDate: r.last_order_date ?? undefined,
    isDeleted: r.is_deleted,
  };
}

export function supplierFromRow(r: SupplierRow): Supplier {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    address: r.address ?? undefined,
    notes: r.notes ?? undefined,
    isDeleted: r.is_deleted,
  };
}

export function employeeFromRow(r: EmployeeRow): Employee {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    departmentId: r.department_id ?? undefined,
    workStart: r.work_start,
    workEnd: r.work_end,
    salaryType: r.salary_type,
    hourlyRate: r.hourly_rate ?? undefined,
    fixedSalary: r.fixed_salary ?? undefined,
    advance: r.advance,
    notes: r.notes ?? undefined,
    isDeleted: r.is_deleted,
  };
}

export function invoiceFromRow(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    customerId: r.customer_id,
    amount: r.amount,
    remainingAmount: r.remaining_amount,
    status: r.status,
    date: r.date,
    notes: r.notes ?? undefined,
  };
}

export function expenseFromRow(r: ExpenseRow): Expense {
  return {
    id: r.id,
    date: r.date,
    description: r.description ?? undefined,
    category: r.category,
    amount: r.amount,
    currency: r.currency,
    vendor: r.vendor ?? undefined,
    payee: r.payee ?? undefined,
    paymentMethod: r.payment_method,
    receiptUrl: r.receipt_url ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status,
    isDeleted: r.is_deleted,
  };
}

export function departmentFromRow(r: DepartmentRow): Department {
  return {
    id: r.id,
    name: r.name,
    nameAr: r.name_ar,
    headId: r.head_id ?? undefined,
    headName: r.head_name ?? undefined,
    parentId: r.parent_id ?? undefined,
    headcount: r.headcount,
    openPositions: r.open_positions,
    monthlyRevenue: r.monthly_revenue,
    status: r.status,
  };
}
