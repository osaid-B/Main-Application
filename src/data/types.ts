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
  locationNotes?: string;
  phone: string;
  email?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  customerType?: "Individual" | "Business" | "VIP";
  status?: "Active" | "Inactive" | "VIP" | "Blocked" | "New";
  preferredContactMethod?: "Phone" | "Email" | "WhatsApp";
  openingBalance?: number;
  creditLimit?: number;
  currency?: string;
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

export type SalaryType = "hourly" | "fixed";

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
  checkIn?: string;
  checkOut?: string;
  salaryType: SalaryType;
  hourlyRate?: number;
  fixedSalary?: number;
  advance: number;
  advances?: EmployeeAdvance[];
  notes?: string;
  attendanceRecords?: AttendanceRecord[];
  dailyAttendance?: DailyAttendanceEntry[];
  isDeleted?: boolean;
};
