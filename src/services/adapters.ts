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
  FactoryOrderRow,
  FactoryQcRow,
  RawMaterialRow,
  FinishedGoodRow,
  WarehouseLocationRow,
  ImportOrderRow,
  ImportOrderLineRow,
  FactoryBatchRow,
  CostingEntryRow,
  FactoryBomRow,
  FactoryBomLineRow,
} from "../types/database";
import type {
  Customer,
  Supplier,
  Employee,
  Invoice,
  Expense,
  Department,
  ProductionOrder,
  QualityCheck,
  RawMaterial,
  FinishedGood,
  WarehouseLocation,
  ImportOrder,
  ProductionBatch,
  CostingEntry,
} from "../data/types";
import type { BomTemplate } from "../data/factoryMock";

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
    isDeleted: r.is_deleted,
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

// ── Factory adapters ──────────────────────────────────────────────────────────

export function factoryOrderFromRow(r: FactoryOrderRow): ProductionOrder {
  return {
    id: r.id,
    productId: r.product_id,
    quantity: r.quantity,
    startDate: r.start_date,
    dueDate: r.due_date,
    status: r.status,
    bom: [],
    isDeleted: r.is_deleted,
  };
}

export function qualityCheckFromRow(r: FactoryQcRow): QualityCheck {
  return {
    id: r.id,
    productionOrderId: r.production_order_id,
    productId: r.product_id,
    productName: r.product_name,
    batchId: r.batch_id,
    inspectionDate: r.inspection_date,
    inspector: r.inspector,
    status: r.status,
    defectRate: r.defect_rate,
    sampleSize: r.sample_size,
    failedUnits: r.failed_units,
    notes: r.notes ?? undefined,
  };
}

export function rawMaterialFromRow(r: RawMaterialRow): RawMaterial {
  return {
    id: r.id,
    name: r.name,
    nameAr: r.name_ar,
    category: r.category,
    unit: r.unit,
    onHand: r.on_hand,
    reorderPoint: r.reorder_point,
    unitCost: r.unit_cost,
    supplier: r.supplier,
    origin: r.origin,
    lastPurchaseDate: r.last_purchase_date ?? undefined,
  };
}

export function finishedGoodFromRow(r: FinishedGoodRow): FinishedGood {
  return {
    id: r.id,
    name: r.name,
    nameAr: r.name_ar,
    sku: r.sku,
    category: r.category,
    onHand: r.on_hand,
    reserved: r.reserved,
    unitCost: r.unit_cost,
    sellingPrice: r.selling_price,
    productionOrderId: r.production_order_id ?? undefined,
    lastProducedDate: r.last_produced_date ?? undefined,
  };
}

export function warehouseLocationFromRow(r: WarehouseLocationRow): WarehouseLocation {
  return {
    id: r.id,
    name: r.name,
    zone: r.zone,
    capacity: r.capacity,
    used: r.used,
    temperature: r.temperature ?? undefined,
    notes: r.notes ?? undefined,
  };
}

export function importOrderFromRow(
  r: ImportOrderRow & { factory_import_lines?: ImportOrderLineRow[] },
): ImportOrder {
  return {
    id: r.id,
    supplierName: r.supplier_name,
    origin: r.origin,
    items: (r.factory_import_lines ?? []).map((l) => ({
      name: l.name,
      quantity: l.quantity,
      unit: l.unit,
      unitCost: l.unit_cost,
    })),
    totalValue: r.total_value,
    currency: r.currency,
    orderDate: r.order_date,
    estimatedArrival: r.estimated_arrival,
    actualArrival: r.actual_arrival ?? undefined,
    status: r.status,
    customsRef: r.customs_ref ?? undefined,
    notes: r.notes ?? undefined,
  };
}

export function productionBatchFromRow(r: FactoryBatchRow): ProductionBatch {
  return {
    id: r.id,
    productionOrderId: r.production_order_id,
    productName: r.product_name,
    quantity: r.quantity,
    producedDate: r.produced_date,
    expiryDate: r.expiry_date,
    status: r.status,
    qcStatus: r.qc_status,
    unitCost: r.unit_cost,
    totalCost: r.total_cost,
    notes: r.notes ?? undefined,
  };
}

export function costingEntryFromRow(r: CostingEntryRow): CostingEntry {
  return {
    id: r.id,
    productionOrderId: r.production_order_id,
    productName: r.product_name,
    period: r.period,
    rawMaterialCost: r.raw_material_cost,
    laborCost: r.labor_cost,
    overheadCost: r.overhead_cost,
    totalCost: r.total_cost,
    unitsProduced: r.units_produced,
    costPerUnit: r.cost_per_unit,
    variance: r.variance,
  };
}

export function bomTemplateFromRow(
  r: FactoryBomRow & { factory_bom_lines?: FactoryBomLineRow[] },
): BomTemplate {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    productNameAr: r.product_name_ar,
    version: r.version,
    effectiveDate: r.effective_date,
    lines: (r.factory_bom_lines ?? []).map((l) => ({
      materialId: l.material_id,
      materialName: l.material_name,
      materialNameAr: "",
      quantity: l.quantity,
      unit: l.unit,
      unitCost: l.unit_cost,
    })),
  };
}
