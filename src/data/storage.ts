import type {
  Attachment,
  AuditEvent,
  BankAccount,
  BankTransfer,
  Customer,
  DepositBatch,
  Employee,
  Invoice,
  InvoiceItem,
  OCRExtraction,
  Payment,
  Product,
  Purchase,
  ReconciliationItem,
  Supplier,
  ChequeInstrument,
} from "./types";

import {
  customersData,
  attachmentsData,
  auditEventsData,
  bankAccountsData,
  bankTransfersData,
  depositBatchesData,
  employeesData,
  invoicesData,
  invoiceItemsData,
  incomingChequesData,
  ocrExtractionsData,
  paymentsData,
  productsData,
  purchasesData,
  reconciliationItemsData,
  suppliersData,
  outgoingChequesData,
} from "./mockData";

const CUSTOMERS_KEY = "dashboard_customers";
const SUPPLIERS_KEY = "dashboard_suppliers";
const PRODUCTS_KEY = "dashboard_products";
const PRODUCT_CATEGORIES_KEY = "dashboard_product_categories";
const PURCHASES_KEY = "dashboard_purchases";
const INVOICES_KEY = "dashboard_invoices";
const INVOICE_ITEMS_KEY = "dashboard_invoice_items";
const PAYMENTS_KEY = "dashboard_payments";
const EMPLOYEES_KEY = "dashboard_employees";
const BANK_ACCOUNTS_KEY = "dashboard_bank_accounts";
const INCOMING_CHEQUES_KEY = "dashboard_incoming_cheques";
const OUTGOING_CHEQUES_KEY = "dashboard_outgoing_cheques";
const BANK_TRANSFERS_KEY = "dashboard_bank_transfers";
const ATTACHMENTS_KEY = "dashboard_attachments";
const OCR_EXTRACTIONS_KEY = "dashboard_ocr_extractions";
const AUDIT_EVENTS_KEY = "dashboard_audit_events";
const DEPOSIT_BATCHES_KEY = "dashboard_deposit_batches";
const RECONCILIATION_ITEMS_KEY = "dashboard_reconciliation_items";

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

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function deriveCategoriesFromProducts(products: Product[]): string[] {
  return Array.from(
    new Set(
      products
        .map((product) => normalizeCategoryName(product.category || ""))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function normalizeEmployees(employees: Employee[]): Employee[] {
  return employees.map((employee) => ({
    ...employee,
    advance: Number(employee.advance || 0),
    advances: Array.isArray(employee.advances)
      ? employee.advances.map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
        }))
      : [],
    attendanceRecords: Array.isArray(employee.attendanceRecords)
      ? employee.attendanceRecords.map((record) => ({
          ...record,
          actualHours: Number(record.actualHours || 0),
        }))
      : [],
    dailyAttendance: Array.isArray(employee.dailyAttendance)
      ? employee.dailyAttendance.map((entry) => ({
          ...entry,
          workedHours: Number(entry.workedHours || 0),
          advanceAmount: Number(entry.advanceAmount || 0),
        }))
      : [],
  }));
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

  const existingCategories = getProductCategories();
  const derivedCategories = deriveCategoriesFromProducts(products);

  const mergedCategories = Array.from(
    new Set([...existingCategories, ...derivedCategories].map(normalizeCategoryName))
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  writeStorage(PRODUCT_CATEGORIES_KEY, mergedCategories);
}

export function resetProducts() {
  writeStorage(PRODUCTS_KEY, productsData);
  writeStorage(
    PRODUCT_CATEGORIES_KEY,
    deriveCategoriesFromProducts(productsData)
  );
}

/* Product Categories */
export function getProductCategories(): string[] {
  const stored = readStorage<string[]>(PRODUCT_CATEGORIES_KEY, []);

  if (stored.length > 0) {
    return Array.from(new Set(stored.map(normalizeCategoryName)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  const fallback = deriveCategoriesFromProducts(getProducts());
  writeStorage(PRODUCT_CATEGORIES_KEY, fallback);
  return fallback;
}

export function saveProductCategories(categories: string[]) {
  const cleaned = Array.from(new Set(categories.map(normalizeCategoryName)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  writeStorage(PRODUCT_CATEGORIES_KEY, cleaned);
}

export function resetProductCategories() {
  writeStorage(
    PRODUCT_CATEGORIES_KEY,
    deriveCategoriesFromProducts(getProducts())
  );
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
  const employees = readStorage<Employee[]>(EMPLOYEES_KEY, employeesData);
  return normalizeEmployees(employees);
}

export function saveEmployees(employees: Employee[]) {
  writeStorage(EMPLOYEES_KEY, normalizeEmployees(employees));
}

export function resetEmployees() {
  writeStorage(EMPLOYEES_KEY, normalizeEmployees(employeesData));
}

/* Treasury */
export function getBankAccounts(): BankAccount[] {
  return readStorage<BankAccount[]>(BANK_ACCOUNTS_KEY, bankAccountsData);
}

export function saveBankAccounts(bankAccounts: BankAccount[]) {
  writeStorage(BANK_ACCOUNTS_KEY, bankAccounts);
}

export function getIncomingCheques(): ChequeInstrument[] {
  return readStorage<ChequeInstrument[]>(INCOMING_CHEQUES_KEY, incomingChequesData);
}

export function saveIncomingCheques(items: ChequeInstrument[]) {
  writeStorage(INCOMING_CHEQUES_KEY, items);
}

export function getOutgoingCheques(): ChequeInstrument[] {
  return readStorage<ChequeInstrument[]>(OUTGOING_CHEQUES_KEY, outgoingChequesData);
}

export function saveOutgoingCheques(items: ChequeInstrument[]) {
  writeStorage(OUTGOING_CHEQUES_KEY, items);
}

export function getBankTransfers(): BankTransfer[] {
  return readStorage<BankTransfer[]>(BANK_TRANSFERS_KEY, bankTransfersData);
}

export function saveBankTransfers(items: BankTransfer[]) {
  writeStorage(BANK_TRANSFERS_KEY, items);
}

export function getAttachments(): Attachment[] {
  return readStorage<Attachment[]>(ATTACHMENTS_KEY, attachmentsData);
}

export function saveAttachments(items: Attachment[]) {
  writeStorage(ATTACHMENTS_KEY, items);
}

export function getOCRExtractions(): OCRExtraction[] {
  return readStorage<OCRExtraction[]>(OCR_EXTRACTIONS_KEY, ocrExtractionsData);
}

export function saveOCRExtractions(items: OCRExtraction[]) {
  writeStorage(OCR_EXTRACTIONS_KEY, items);
}

export function getAuditEvents(): AuditEvent[] {
  return readStorage<AuditEvent[]>(AUDIT_EVENTS_KEY, auditEventsData);
}

export function saveAuditEvents(items: AuditEvent[]) {
  writeStorage(AUDIT_EVENTS_KEY, items);
}

export function getDepositBatches(): DepositBatch[] {
  return readStorage<DepositBatch[]>(DEPOSIT_BATCHES_KEY, depositBatchesData);
}

export function saveDepositBatches(items: DepositBatch[]) {
  writeStorage(DEPOSIT_BATCHES_KEY, items);
}

export function getReconciliationItems(): ReconciliationItem[] {
  return readStorage<ReconciliationItem[]>(
    RECONCILIATION_ITEMS_KEY,
    reconciliationItemsData
  );
}

export function saveReconciliationItems(items: ReconciliationItem[]) {
  writeStorage(RECONCILIATION_ITEMS_KEY, items);
}

/* Optional helper: reset everything */
export function resetAllStorage() {
  resetCustomers();
  resetSuppliers();
  resetProducts();
  resetProductCategories();
  resetPurchases();
  resetInvoices();
  resetInvoiceItems();
  resetPayments();
  resetEmployees();
  writeStorage(BANK_ACCOUNTS_KEY, bankAccountsData);
  writeStorage(INCOMING_CHEQUES_KEY, incomingChequesData);
  writeStorage(OUTGOING_CHEQUES_KEY, outgoingChequesData);
  writeStorage(BANK_TRANSFERS_KEY, bankTransfersData);
  writeStorage(ATTACHMENTS_KEY, attachmentsData);
  writeStorage(OCR_EXTRACTIONS_KEY, ocrExtractionsData);
  writeStorage(AUDIT_EVENTS_KEY, auditEventsData);
  writeStorage(DEPOSIT_BATCHES_KEY, depositBatchesData);
  writeStorage(RECONCILIATION_ITEMS_KEY, reconciliationItemsData);
}
