export type DashboardStat = {
  title: string;
  value: string;
};

export type Customer = {
  id: string;
  name: string;
  companyName?: string;
  address?: string;
  location?: string;
  city?: string;
  governorate?: string;
  locationNotes?: string;
  phone: string;
  email?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  alerts?: string[];
  code?: string;
  taxId?: string;
  type?: "individual" | "company" | "institution";
  customerType?: "Individual" | "Business" | "VIP";
  classification?: "standard" | "vip" | "risk";
  paymentTerms?: "cash" | "net30" | "net60" | "net90";
  status?: "Active" | "Inactive" | "VIP" | "Blocked" | "New" | "active" | "inactive" | "archived";
  preferredContactMethod?: "Phone" | "Email" | "WhatsApp";
  openingBalance?: number;
  outstandingBalance?: number;
  creditLimit?: number;
  currency?: string;
  joinedAt?: string;
  lastOrderDate?: string;
  salesRep?: string;
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
export type ProductType =
  | "Stocked"
  | "Stock Product"
  | "Service"
  | "Digital"
  | "Bundle"
  | "Raw Material"
  | "Finished Product"
  | "Variant Product";
export type ProductPricingMode = "fixed-price" | "target-margin" | "markup";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status?: ProductStatus;
  productType?: ProductType;
  brand?: string;
  model?: string;
  isActive?: boolean;
  code?: string;
  image?: string;
  purchasePrice?: number;
  salePrice?: number;
  minStock?: number;
  reorderThreshold?: number;
  description?: string;
  barcode?: string;
  barcodeImage?: string;
  taxClass?: string;
  createdAt?: string;
  addedAt?: string | number;
  currency?: string;
  taxRate?: number;
  unit?: string;
  purchaseUnit?: string;
  warehouse?: string;
  stockTracking?: boolean;
  serialTracking?: boolean;
  batchTracking?: boolean;
  pricingMode?: ProductPricingMode;
  targetMargin?: number;
  supplierLink?: string;
  supplierSku?: string;
  leadTimeDays?: number;
  paymentTerms?: string;
  incomeAccount?: string;
  expenseAccount?: string;
  attachments?: string[];
  tags?: string[];
  internalNotes?: string;
  variantAttributes?: string;
  archived?: boolean;
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

export type InvoiceStatus = "Paid" | "Partial" | "Debit" | "Pending";

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Invoice = {
  id: string;
  customerId: string;
  amount?: number;
  total?: number;
  remainingAmount?: number;
  status?: InvoiceStatus;
  date: string;
  notes?: string;
  items?: InvoiceItem[];
};

export type PaymentMethod =
  | "Cash"
  | "Card"
  | "Bank Transfer"
  | "Wallet"
  | "Cheque";

export type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Partial"
  | "Completed"
  | "Failed"
  | "Refunded"
  | "Cancelled";

export type Payment = {
  id: string;
  paymentId?: string;
  invoiceId: string;
  customerId: string;
  customerName?: string;
  method?: PaymentMethod;
  date: string;
  amount: number;
  status?: PaymentStatus;
  notes?: string;
  referenceNumber?: string;
  receiptId?: string;
  createdBy?: string;
  updatedAt?: string;
};

export type TreasuryStatusTone =
  | "Draft"
  | "Pending Verification"
  | "Verified"
  | "Rejected"
  | "Partially Applied"
  | "Fully Applied"
  | "Created"
  | "Received"
  | "Held"
  | "Deposited"
  | "Under Collection"
  | "Cleared"
  | "Bounced"
  | "Returned"
  | "Cancelled"
  | "Approved"
  | "Issued"
  | "Delivered"
  | "Voided";

export type BankAccount = {
  id: string;
  name: string;
  bankName: string;
  branchName: string;
  accountNumberMasked: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  pendingInstrumentValue: number;
  reconciledBalance: number;
  branchScope: string;
  linkedMethods: PaymentMethod[];
  isPrimary?: boolean;
  isDeleted?: boolean;
};

export type Attachment = {
  id: string;
  fileName: string;
  fileType: "image" | "pdf" | "document";
  uploadedAt: string;
  uploadedBy: string;
  sizeLabel: string;
  previewLabel?: string;
  secure: boolean;
};

export type OCRFieldReview = {
  field: string;
  extractedValue: string;
  correctedValue?: string;
  confidence: number;
  approved: boolean;
};

export type OCRExtraction = {
  id: string;
  sourceType: "incoming-cheque" | "outgoing-cheque" | "bank-transfer";
  sourceId: string;
  provider: string;
  capturedAt: string;
  capturedBy: string;
  averageConfidence: number;
  status: "Pending Review" | "Reviewed" | "Corrected";
  fields: OCRFieldReview[];
};

export type AuditEvent = {
  id: string;
  entityType:
    | "incoming-cheque"
    | "outgoing-cheque"
    | "bank-transfer"
    | "ocr-extraction"
    | "reconciliation";
  entityId: string;
  action: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  details: string;
};

export type JournalLink = {
  journalEntryId: string;
  accountName: string;
  postingState: "Draft" | "Ready" | "Posted";
};

export type ChequeDirection = "incoming" | "outgoing";

export type ChequeInstrument = {
  id: string;
  direction: ChequeDirection;
  chequeNumber: string;
  bankName: string;
  branchName: string;
  accountHolder: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  bankAccountId?: string;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  paymentId?: string;
  linkedPurchaseId?: string;
  depositBatchId?: string;
  custodyLocation: string;
  status: TreasuryStatusTone;
  notes?: string;
  imageFrontId?: string;
  imageBackId?: string;
  attachmentIds: string[];
  ocrExtractionId?: string;
  journalLink?: JournalLink;
  reconciled?: boolean;
  createdBy: string;
  approvedBy?: string;
  updatedAt: string;
  isDeleted?: boolean;
};

export type BankTransfer = {
  id: string;
  transferReference: string;
  direction: "incoming" | "outgoing";
  bankAccountId: string;
  senderOrReceiver: string;
  sourceBank: string;
  destinationBank: string;
  amount: number;
  currency: string;
  transferDate: string;
  settlementDate?: string;
  invoiceId?: string;
  paymentId?: string;
  supplierId?: string;
  customerId?: string;
  linkedJournal?: JournalLink;
  attachmentIds: string[];
  ocrExtractionId?: string;
  notes?: string;
  status: TreasuryStatusTone;
  createdBy: string;
  approvedBy?: string;
  updatedAt: string;
  reconciled?: boolean;
  isDeleted?: boolean;
};

export type DepositBatch = {
  id: string;
  bankAccountId: string;
  batchNumber: string;
  date: string;
  totalAmount: number;
  chequeIds: string[];
  status: "Draft" | "Submitted" | "Collected" | "Partially Collected";
};

export type ReconciliationItem = {
  id: string;
  sourceType: "bank-transfer" | "incoming-cheque" | "outgoing-cheque" | "payment";
  sourceId: string;
  bankAccountId: string;
  date: string;
  amount: number;
  currency: string;
  matchStatus: "Unmatched" | "Suggested" | "Partially Matched" | "Matched";
  suggestedTarget?: string;
  suggestedBy?: "AI" | "System" | "Manual";
  notes?: string;
};

export type SalaryType = "hourly" | "fixed" | "daily";

export type ContractType = "full-time" | "part-time" | "daily" | "temporary";

export type EmployeeGender = "male" | "female";

export type AttendanceRecordStatus =
  | "not-started"
  | "working"
  | "finished"
  | "late"
  | "absent";

export type DailyAttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "half-day"
  | "leave";

export type AttendanceRecord = {
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceRecordStatus;
  actualHours: number;
  notes?: string;
};

export type EmployeeAdvance = {
  id: string;
  amount: number;
  date: string;
  notes?: string;
};

export type DailyAttendanceEntry = {
  date: string;
  status: DailyAttendanceStatus;
  workedHours: number;
  advanceAmount: number;
  notes?: string;
};

export type Employee = {
  id: string;
  name: string;
  phone: string;
  workStart: string;
  workEnd: string;
  salaryType: SalaryType;
  hourlyRate?: number;
  fixedSalary?: number;
  dailyRate?: number;
  advance: number;
  advances?: EmployeeAdvance[];
  notes?: string;
  departmentId?: string;
  attendanceRecords?: AttendanceRecord[];
  dailyAttendance?: DailyAttendanceEntry[];
  isDeleted?: boolean;

  // Palestinian HR fields
  nationalId?: string;
  gender?: EmployeeGender;
  city?: string;
  jobTitle?: string;
  hireDate?: string;
  contractType?: ContractType;
  insuranceNumber?: string;
  bankAccount?: string;
  emergencyContact?: string;
  currency?: "ILS" | "USD" | "JOD";
};

// ── General Ledger ────────────────────────────────────────────────────────────

export type JournalEntryStatus = "draft" | "posted" | "reversed";

export type JournalLine = {
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  status: JournalEntryStatus;
  postedBy?: string;
  isDeleted?: boolean;
};

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type NormalBalance = "debit" | "credit";

export type ChartAccount = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId?: string;
  isParent?: boolean;
  isActive: boolean;
  balance?: number;
};

// ── Inventory ─────────────────────────────────────────────────────────────────

export type StockLevel = {
  productId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  lastCountDate?: string;
};

export type MovementType = "receive" | "issue" | "adjustment" | "damage" | "transfer";

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantityIn: number;
  quantityOut: number;
  stockAfter: number;
  reference?: string;
  reason?: string;
  notes?: string;
  date: string;
  createdBy?: string;
};

// ── Manufacturing ─────────────────────────────────────────────────────────────

export type ProductionOrderStatus = "planned" | "in-progress" | "done" | "cancelled";

export type BomLine = {
  productId: string;
  quantity: number;
};

export type ProductionOrder = {
  id: string;
  productId: string;
  quantity: number;
  startDate: string;
  dueDate: string;
  status: ProductionOrderStatus;
  bom: BomLine[];
  isDeleted?: boolean;
};

// ── Quotes ────────────────────────────────────────────────────────────────────

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export type QuoteLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPct?: number;
};

export type Quote = {
  id: string;
  customerId: string;
  date: string;
  validUntil: string;
  lines: QuoteLine[];
  subtotal: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  convertedInvoiceId?: string;
  isDeleted?: boolean;
};

// ── Expenses ──────────────────────────────────────────────────────────────────

export type ExpensePaymentMethod = "cash" | "bank" | "card" | "cheque";
export type ExpenseStatus = "approved" | "pending" | "rejected";

export type Expense = {
  id: string;
  date: string;
  description?: string;
  category: string;
  amount: number;
  currency: "ILS" | "USD" | "EUR";
  vendor?: string;
  /** Display name of the payee / beneficiary */
  payee?: string;
  paymentMethod: ExpensePaymentMethod;
  receiptUrl?: string;
  notes?: string;
  isDeleted?: boolean;
  status?: ExpenseStatus;
};

// ── System Audit Log ──────────────────────────────────────────────────────────
// Note: AuditEvent is already used by Treasury (different shape). This is the
// app-wide activity log for the dedicated Audit Log page.

export type SystemAuditAction = "create" | "update" | "delete" | "login" | "export";

export type SystemAuditEntry = {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: SystemAuditAction;
  entity: string;
  entityId: string;
  diff?: Record<string, { from: unknown; to: unknown }>;
  ip?: string;
};

// ─── Departments ──────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  nameAr: string;
  headId?: string;
  headName?: string;
  parentId?: string;
  headcount: number;
  openPositions: number;
  monthlyRevenue: number;
  status: "active" | "inactive";
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export";

export interface PermissionModule {
  module: string;
  label: string;
  labelAr: string;
  actions: Record<PermissionAction, boolean>;
}

export interface Role {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  userCount: number;
  isSystem: boolean;
  permissions: PermissionModule[];
}

// ── Factory ───────────────────────────────────────────────────────────────────

export type QcStatus = "pass" | "fail" | "pending" | "conditional";

export type QualityCheck = {
  id: string;
  productionOrderId: string;
  productId: string;
  productName: string;
  batchId: string;
  inspectionDate: string;
  inspector: string;
  status: QcStatus;
  defectRate: number; // percentage 0–100
  sampleSize: number;
  failedUnits: number;
  notes?: string;
};

export type RawMaterialCategory = "oil" | "packaging" | "additives" | "labeling" | "cleaning";

export type RawMaterial = {
  id: string;
  name: string;
  nameAr: string;
  category: RawMaterialCategory;
  unit: string;
  onHand: number;
  reorderPoint: number;
  unitCost: number;
  supplier: string;
  supplierAr?: string;
  origin: "local" | "imported";
  lastPurchaseDate?: string;
};

export type FinishedGood = {
  id: string;
  name: string;
  nameAr: string;
  sku: string;
  category: string;
  onHand: number;
  reserved: number;
  unitCost: number;
  sellingPrice: number;
  productionOrderId?: string;
  lastProducedDate?: string;
};

export type WarehouseZone = "raw" | "finished" | "packaging" | "quarantine";

export type WarehouseLocation = {
  id: string;
  name: string;
  zone: WarehouseZone;
  capacity: number;
  used: number;
  temperature?: string;
  notes?: string;
};

export type ImportOrderStatus = "ordered" | "in-transit" | "customs" | "received" | "cancelled";

export type ImportOrder = {
  id: string;
  supplierName: string;
  origin: string;
  items: Array<{ name: string; quantity: number; unit: string; unitCost: number }>;
  totalValue: number;
  currency: string;
  orderDate: string;
  estimatedArrival: string;
  actualArrival?: string;
  status: ImportOrderStatus;
  customsRef?: string;
  notes?: string;
};

export type BatchStatus = "open" | "closed" | "quarantine" | "recalled";

export type ProductionBatch = {
  id: string;
  productionOrderId: string;
  productName: string;
  quantity: number;
  producedDate: string;
  expiryDate: string;
  status: BatchStatus;
  qcStatus: QcStatus;
  unitCost: number;
  totalCost: number;
  notes?: string;
};

export type CostingEntry = {
  id: string;
  productionOrderId: string;
  productName: string;
  period: string; // YYYY-MM
  rawMaterialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  unitsProduced: number;
  costPerUnit: number;
  variance: number; // actual - standard
};


// ─── Leave Management ─────────────────────────────────────────────────────────

export type LeaveType =
  | "annual"
  | "sick"
  | "maternity"
  | "paternity"
  | "emergency"
  | "hajj"
  | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentName?: string;
  status: LeaveStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
};

export type LeaveBalanceEntry = {
  entitled: number;
  used: number;
  pending: number;
};

export type LeaveBalance = {
  employeeId: string;
  year: number;
  annual: LeaveBalanceEntry;
  sick: LeaveBalanceEntry;
  maternity: LeaveBalanceEntry;
  paternity: LeaveBalanceEntry;
  emergency: LeaveBalanceEntry;
  hajj: LeaveBalanceEntry;
  unpaid: LeaveBalanceEntry;
  hajjEverUsed: boolean;
};

export type LeavePolicy = {
  annualEntitlement: number;
  sickEntitlement: number;
  maternityDays: number;
  paternityDays: number;
  emergencyDaysLimit: number;
  medCertAfterDays: number;
  advanceNoticeDays: number;
  minServiceForHajjMonths: number;
};
