import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FolderUp,
  Info,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import "./DataImport.css";
import type {
  Customer,
  Employee,
  Invoice,
  Payment,
  Product,
  Purchase,
  Supplier,
} from "../data/types";
import {
  getCustomers,
  getEmployees,
  getInvoices,
  getPayments,
  getProducts,
  getPurchases,
  getSuppliers,
  saveCustomers,
  saveEmployees,
  saveInvoices,
  savePayments,
  saveProducts,
  savePurchases,
  saveSuppliers,
} from "../data/storage";

type ImportEntity =
  | "customers"
  | "products"
  | "purchases"
  | "suppliers"
  | "invoices"
  | "payments"
  | "employees";

type ImportMethod = "paste" | "upload";
type ParsedRow = Record<string, string>;
type IssueLevel = "error" | "warning";
type RowState = "valid" | "warning" | "error";

type ParsedCsv = {
  headers: string[];
  rows: ParsedRow[];
  rawHeaderLine: string;
  error: string | null;
};

type RowIssue = {
  field?: string;
  message: string;
  level: IssueLevel;
};

type ValidatedRow = {
  rowNumber: number;
  values: ParsedRow;
  issues: RowIssue[];
  state: RowState;
};

type ValidationSummary = {
  missingColumns: string[];
  unsupportedColumns: string[];
  rows: ValidatedRow[];
  issueCounts: Array<{ message: string; count: number; level: IssueLevel }>;
  validCount: number;
  warningCount: number;
  errorCount: number;
  canImport: boolean;
};

type ImportHistoryEntry = {
  id: string;
  entity: ImportEntity;
  importedBy: string;
  date: string;
  rowCount: number;
  status: "Success" | "Partial Success";
  skippedCount: number;
};

type SuccessState = {
  entity: ImportEntity;
  importedCount: number;
  skippedCount: number;
};

type EntityConfig = {
  label: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  sampleRow: string[];
  helper: string;
  previewColumns: string[];
  uniqueFields: string[];
};

type ReferenceData = {
  customers: Customer[];
  products: Product[];
  purchases: Purchase[];
  suppliers: Supplier[];
  invoices: Invoice[];
  payments: Payment[];
  employees: Employee[];
};

const HISTORY_KEY = "dashboard_import_history_v1";
const TODAY = new Date().toISOString().split("T")[0];
const VALID_PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer"];

const ENTITY_CONFIGS: Record<ImportEntity, EntityConfig> = {
  customers: {
    label: "Customers",
    description: "Required fields: Name, Phone, Email",
    requiredFields: ["name", "phone", "email"],
    optionalFields: ["address", "notes"],
    sampleRow: ["Ahmad", "0599999999", "ahmad@email.com", "Ramallah", "VIP client"],
    helper: "Import customer profiles with contact details and optional notes.",
    previewColumns: ["name", "phone", "email", "address", "notes"],
    uniqueFields: ["phone", "email"],
  },
  products: {
    label: "Products",
    description: "Required fields: Product Name, SKU, Price",
    requiredFields: ["name", "sku", "price"],
    optionalFields: ["category", "stock", "description"],
    sampleRow: ["Laptop Pro", "LP-1001", "4200", "Electronics", "12", "13-inch business laptop"],
    helper: "Use stock and price columns to prepare products for operational use.",
    previewColumns: ["name", "sku", "price", "stock", "category", "description"],
    uniqueFields: ["sku", "name"],
  },
  purchases: {
    label: "Purchases",
    description: "Required fields: Supplier, Product, Quantity, Unit Price, Order Date",
    requiredFields: ["supplier", "product", "quantity", "unit_price", "order_date"],
    optionalFields: ["total_cost", "status", "notes"],
    sampleRow: ["Tech Source", "Laptop", "10", "900", "2026-04-23", "9000", "Pending", "Restocking"],
    helper: "Link purchases to existing suppliers and products before import.",
    previewColumns: ["supplier", "product", "quantity", "unit_price", "total_cost", "order_date", "status"],
    uniqueFields: [],
  },
  suppliers: {
    label: "Suppliers",
    description: "Required fields: Supplier Name, Contact Person, Phone, Email",
    requiredFields: ["supplier_name", "contact_person", "phone", "email"],
    optionalFields: ["payment_terms", "address"],
    sampleRow: ["Tech Supplies Co.", "Ahmad Saleh", "0591111111", "contact@tech.com", "Net 30", "Ramallah"],
    helper: "Create supplier records ready for purchases, invoices, and payables workflows.",
    previewColumns: ["supplier_name", "contact_person", "phone", "email", "payment_terms", "address"],
    uniqueFields: ["supplier_name", "phone", "email"],
  },
  invoices: {
    label: "Invoices",
    description: "Required fields: Invoice Number, Customer, Total, Due Date",
    requiredFields: ["invoice_number", "customer", "total", "due_date"],
    optionalFields: ["remaining", "status", "date"],
    sampleRow: ["INV-2026-0012", "Osid Barakat", "1250", "2026-04-30", "450", "Partial", "2026-04-23"],
    helper: "Import payables or receivables snapshots with remaining balances and due dates.",
    previewColumns: ["invoice_number", "customer", "total", "remaining", "due_date", "status", "date"],
    uniqueFields: ["invoice_number"],
  },
  payments: {
    label: "Payments",
    description: "Required fields: Payment Reference, Invoice Number, Amount, Payment Date",
    requiredFields: ["payment_reference", "invoice_number", "amount", "payment_date"],
    optionalFields: ["payment_method", "notes"],
    sampleRow: ["PAY-3201", "INV-1001", "1200", "2026-04-23", "Bank Transfer", "Advance settlement"],
    helper: "Map payments to existing invoices for safer reconciliation.",
    previewColumns: ["payment_reference", "invoice_number", "amount", "payment_method", "payment_date", "notes"],
    uniqueFields: ["payment_reference"],
  },
  employees: {
    label: "Employees",
    description: "Required fields: Name, Role, Phone, Salary",
    requiredFields: ["name", "role", "phone", "salary"],
    optionalFields: ["email", "department"],
    sampleRow: ["Ahmad Saleh", "Procurement Officer", "0591234567", "2800", "ahmad@company.com", "Operations"],
    helper: "Import employee profiles with salary and department basics.",
    previewColumns: ["name", "role", "phone", "email", "salary", "department"],
    uniqueFields: ["phone", "email"],
  },
};

function normalizeHeader(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function humanizeHeader(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string): ParsedCsv {
  if (!text.trim()) {
    return { headers: [], rows: [], rawHeaderLine: "", error: null };
  }

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { headers: [], rows: [], rawHeaderLine: "", error: null };
  }

  const rawHeaders = parseCsvLine(lines[0]).map(normalizeHeader);

  if (rawHeaders.some((header) => !header)) {
    return {
      headers: [],
      rows: [],
      rawHeaderLine: lines[0],
      error: "Header row contains empty column names.",
    };
  }

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: ParsedRow = {};

    rawHeaders.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });

  return {
    headers: rawHeaders,
    rows,
    rawHeaderLine: lines[0],
    error: null,
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+?[0-9\s-]{8,16}$/.test(value);
}

function isValidDate(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function readHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ImportHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: ImportHistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 8)));
}

function resolveCustomerId(referenceData: ReferenceData, value: string) {
  const target = value.trim().toLowerCase();
  return (
    referenceData.customers.find(
      (customer) =>
        customer.id.toLowerCase() === target || customer.name.trim().toLowerCase() === target
    )?.id || ""
  );
}

function resolveSupplierId(referenceData: ReferenceData, value: string) {
  const target = value.trim().toLowerCase();
  return (
    referenceData.suppliers.find(
      (supplier) =>
        supplier.id.toLowerCase() === target || supplier.name.trim().toLowerCase() === target
    )?.id || ""
  );
}

function resolveProductId(referenceData: ReferenceData, value: string) {
  const target = value.trim().toLowerCase();
  return (
    referenceData.products.find(
      (product) =>
        product.id.toLowerCase() === target || product.name.trim().toLowerCase() === target
    )?.id || ""
  );
}

function resolveInvoice(referenceData: ReferenceData, value: string) {
  const target = value.trim().toLowerCase();
  return (
    referenceData.invoices.find(
      (invoice) => invoice.id.toLowerCase() === target || String(invoice.id).toLowerCase() === target
    ) || null
  );
}

function validateRows(
  entity: ImportEntity,
  parsed: ParsedCsv,
  referenceData: ReferenceData
): ValidationSummary {
  const config = ENTITY_CONFIGS[entity];
  const allowedFields = [...config.requiredFields, ...config.optionalFields];
  const missingColumns = config.requiredFields.filter((field) => !parsed.headers.includes(field));
  const unsupportedColumns = parsed.headers.filter((field) => !allowedFields.includes(field));
  const rows: ValidatedRow[] = [];
  const messageCounts = new Map<string, { count: number; level: IssueLevel }>();
  const duplicateTracker = new Map<string, number[]>();

  config.uniqueFields.forEach((field) => {
    duplicateTracker.set(field, []);
  });

  parsed.rows.forEach((row, index) => {
    const issues: RowIssue[] = [];

    config.requiredFields.forEach((field) => {
      if (!String(row[field] || "").trim()) {
        issues.push({ field, message: `${humanizeHeader(field)} is required`, level: "error" });
      }
    });

    if (entity === "customers") {
      if (row.email && !isValidEmail(row.email)) {
        issues.push({ field: "email", message: "Invalid email format", level: "error" });
      }
      if (row.phone && !isValidPhone(row.phone)) {
        issues.push({ field: "phone", message: "Invalid phone format", level: "error" });
      }

      const phoneExists = referenceData.customers.some(
        (customer) => customer.phone.trim() === row.phone?.trim()
      );
      if (row.phone && phoneExists) {
        issues.push({ field: "phone", message: "Duplicate phone found in system", level: "warning" });
      }
    }

    if (entity === "products") {
      if (row.price && toNumber(row.price) === null) {
        issues.push({ field: "price", message: "Product price must be numeric", level: "error" });
      }
      if (row.stock && toNumber(row.stock) === null) {
        issues.push({ field: "stock", message: "Stock must be numeric", level: "error" });
      }

      const existingName = referenceData.products.some(
        (product) => product.name.trim().toLowerCase() === row.name?.trim().toLowerCase()
      );
      if (row.name && existingName) {
        issues.push({ field: "name", message: "Product name already exists", level: "warning" });
      }
    }

    if (entity === "purchases") {
      if (row.quantity && (!toNumber(row.quantity) || Number(row.quantity) <= 0)) {
        issues.push({ field: "quantity", message: "Quantity must be greater than 0", level: "error" });
      }
      if (row.unit_price && (!toNumber(row.unit_price) || Number(row.unit_price) <= 0)) {
        issues.push({ field: "unit_price", message: "Unit price must be numeric", level: "error" });
      }
      if (row.order_date && !isValidDate(row.order_date)) {
        issues.push({ field: "order_date", message: "Order date is invalid", level: "error" });
      }
      if (row.supplier && !resolveSupplierId(referenceData, row.supplier)) {
        issues.push({ field: "supplier", message: "Unknown supplier", level: "error" });
      }
      if (row.product && !resolveProductId(referenceData, row.product)) {
        issues.push({ field: "product", message: "Unknown product", level: "error" });
      }
    }

    if (entity === "suppliers") {
      if (row.email && !isValidEmail(row.email)) {
        issues.push({ field: "email", message: "Invalid email format", level: "error" });
      }
      if (row.phone && !isValidPhone(row.phone)) {
        issues.push({ field: "phone", message: "Invalid phone format", level: "error" });
      }

      const duplicateEmail = referenceData.suppliers.some(
        (supplier) => supplier.email?.trim().toLowerCase() === row.email?.trim().toLowerCase()
      );
      if (row.email && duplicateEmail) {
        issues.push({ field: "email", message: "Supplier email already exists", level: "warning" });
      }
    }

    if (entity === "invoices") {
      if (row.total && toNumber(row.total) === null) {
        issues.push({ field: "total", message: "Invoice total must be numeric", level: "error" });
      }
      if (row.remaining && toNumber(row.remaining) === null) {
        issues.push({ field: "remaining", message: "Remaining value must be numeric", level: "error" });
      }
      if (row.due_date && !isValidDate(row.due_date)) {
        issues.push({ field: "due_date", message: "Due date is invalid", level: "error" });
      }
      if (row.date && !isValidDate(row.date)) {
        issues.push({ field: "date", message: "Invoice date is invalid", level: "error" });
      }
      if (row.customer && !resolveCustomerId(referenceData, row.customer)) {
        issues.push({ field: "customer", message: "Unknown customer", level: "error" });
      }
    }

    if (entity === "payments") {
      if (row.amount && toNumber(row.amount) === null) {
        issues.push({ field: "amount", message: "Amount must be numeric", level: "error" });
      }
      if (row.payment_date && !isValidDate(row.payment_date)) {
        issues.push({ field: "payment_date", message: "Payment date is invalid", level: "error" });
      }
      if (row.payment_method && !VALID_PAYMENT_METHODS.includes(row.payment_method)) {
        issues.push({ field: "payment_method", message: "Unsupported payment method", level: "warning" });
      }
      if (row.invoice_number && !resolveInvoice(referenceData, row.invoice_number)) {
        issues.push({ field: "invoice_number", message: "Unknown invoice", level: "error" });
      }
    }

    if (entity === "employees") {
      if (row.phone && !isValidPhone(row.phone)) {
        issues.push({ field: "phone", message: "Invalid phone format", level: "error" });
      }
      if (row.email && !isValidEmail(row.email)) {
        issues.push({ field: "email", message: "Invalid email format", level: "error" });
      }
      if (row.salary && toNumber(row.salary) === null) {
        issues.push({ field: "salary", message: "Salary must be numeric", level: "error" });
      }
    }

    config.uniqueFields.forEach((field) => {
      const value = String(row[field] || "").trim().toLowerCase();
      if (!value) return;
      const key = `${field}:${value}`;
      const list = duplicateTracker.get(key) ?? [];
      list.push(index + 2);
      duplicateTracker.set(key, list);
    });

    const state: RowState = issues.some((issue) => issue.level === "error")
      ? "error"
      : issues.some((issue) => issue.level === "warning")
      ? "warning"
      : "valid";

    rows.push({
      rowNumber: index + 2,
      values: row,
      issues,
      state,
    });
  });

  duplicateTracker.forEach((rowNumbers, key) => {
    if (rowNumbers.length < 2) return;
    const [field] = key.split(":");
    rowNumbers.forEach((rowNumber) => {
      const targetRow = rows.find((row) => row.rowNumber === rowNumber);
      if (!targetRow) return;
      targetRow.issues.push({
        field,
        message: `Duplicate ${humanizeHeader(field)} found`,
        level: "error",
      });
      targetRow.state = "error";
    });
  });

  rows.forEach((row) => {
    row.issues.forEach((issue) => {
      const current = messageCounts.get(issue.message);
      if (current) {
        current.count += 1;
      } else {
        messageCounts.set(issue.message, { count: 1, level: issue.level });
      }
    });
  });

  missingColumns.forEach((column) => {
    messageCounts.set(`Missing required column: ${humanizeHeader(column)}`, {
      count: 1,
      level: "error",
    });
  });

  unsupportedColumns.forEach((column) => {
    messageCounts.set(`Unsupported column: ${humanizeHeader(column)}`, {
      count: 1,
      level: "warning",
    });
  });

  const validCount = rows.filter((row) => row.state === "valid").length;
  const warningCount = rows.filter((row) => row.state === "warning").length;
  const errorCount = rows.filter((row) => row.state === "error").length;

  return {
    missingColumns,
    unsupportedColumns,
    rows,
    issueCounts: Array.from(messageCounts.entries()).map(([message, payload]) => ({
      message,
      count: payload.count,
      level: payload.level,
    })),
    validCount,
    warningCount,
    errorCount,
    canImport:
      parsed.rows.length > 0 &&
      missingColumns.length === 0 &&
      rows.every((row) => !row.issues.some((issue) => issue.level === "error")),
  };
}

export default function DataImport() {
  const [entity, setEntity] = useState<ImportEntity>("customers");
  const [method, setMethod] = useState<ImportMethod>("paste");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [processingState, setProcessingState] = useState<
    "idle" | "parsing" | "importing" | "success" | "error"
  >("idle");
  const [pageError, setPageError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const [history, setHistory] = useState<ImportHistoryEntry[]>(() => readHistory());
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [purchases, setPurchases] = useState<Purchase[]>(() => getPurchases());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [payments, setPayments] = useState<Payment[]>(() => getPayments());
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [showGuide, setShowGuide] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const referenceData = useMemo<ReferenceData>(
    () => ({
      customers,
      products,
      purchases,
      suppliers,
      invoices,
      payments,
      employees,
    }),
    [customers, employees, invoices, payments, products, purchases, suppliers]
  );

  const config = ENTITY_CONFIGS[entity];
  const parsed = useMemo(() => parseCsv(rawText), [rawText]);
  const validation = useMemo(
    () => validateRows(entity, parsed, referenceData),
    [entity, parsed, referenceData]
  );

  const previewColumns = useMemo(() => {
    const baseColumns = parsed.headers.length ? parsed.headers : config.previewColumns;
    return baseColumns;
  }, [config.previewColumns, parsed.headers]);

  const templateCsv = useMemo(
    () =>
      [[...config.requiredFields, ...config.optionalFields].join(","), config.sampleRow.join(",")].join(
        "\n"
      ),
    [config]
  );

  const noInput = !rawText.trim() && !fileName;

  function clearInput() {
    setRawText("");
    setFileName("");
    setPageError(null);
    setSuccessState(null);
    setProcessingState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleEntityChange(nextEntity: ImportEntity) {
    setEntity(nextEntity);
    setSuccessState(null);
    setPageError(null);
  }

  function handleTemplateDownload() {
    downloadTextFile(`${entity}-template.csv`, templateCsv);
  }

  async function loadCsvFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setPageError("Unsupported file type. Please upload a CSV file only.");
      setProcessingState("error");
      return;
    }

    setProcessingState("parsing");
    setPageError(null);
    setSuccessState(null);

    try {
      const text = await file.text();
      setRawText(text);
      setFileName(file.name);
      setMethod("upload");
      setProcessingState("idle");
    } catch {
      setPageError("The selected file could not be parsed. Please check the CSV structure.");
      setProcessingState("error");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void loadCsvFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void loadCsvFile(file);
  }

  function pushHistory(entry: ImportHistoryEntry) {
    setHistory((current) => [entry, ...current].slice(0, 6));
  }

  function importRows() {
    if (!validation.canImport) return;

    setProcessingState("importing");
    setPageError(null);

    window.setTimeout(() => {
      const cleanRows = validation.rows.filter((row) => row.state !== "error").map((row) => row.values);
      const importedCount = cleanRows.length;
      const skippedCount = validation.rows.length - importedCount;

      if (entity === "customers") {
        const prepared: Customer[] = cleanRows.map((row, index) => ({
          id: `CUST-${1000 + customers.length + index + 1}`,
          name: row.name.trim(),
          phone: row.phone.trim(),
          email: row.email.trim(),
          address: row.address?.trim() || "",
          notes: row.notes?.trim() || "",
          joinedAt: TODAY,
          isDeleted: false,
        }));
        const next = [...prepared, ...customers];
        setCustomers(next);
        saveCustomers(next);
      }

      if (entity === "products") {
        const prepared = cleanRows.map((row, index) => ({
          id: `PROD-${1000 + products.length + index + 1}`,
          name: row.name.trim(),
          category: row.category?.trim() || "General",
          price: Number(row.price || 0),
          stock: Number(row.stock || 0),
          isDeleted: false,
          sku: row.sku?.trim() || "",
          description: row.description?.trim() || "",
        })) as Product[];
        const next = [...prepared, ...products];
        setProducts(next);
        saveProducts(next);
      }

      if (entity === "purchases") {
        const prepared: Purchase[] = cleanRows.map((row, index) => {
          const quantity = Number(row.quantity || 0);
          const unitPrice = Number(row.unit_price || 0);
          const totalCost = row.total_cost ? Number(row.total_cost) : quantity * unitPrice;

          return {
            id: `PUR-${3000 + purchases.length + index + 1}`,
            supplierId: resolveSupplierId(referenceData, row.supplier),
            productId: resolveProductId(referenceData, row.product),
            quantity,
            totalCost,
            status:
              row.status === "Received" || row.status === "Pending"
                ? row.status
                : "Pending",
            date: row.order_date || TODAY,
            notes: row.notes?.trim() || "",
            isDeleted: false,
          };
        });
        const next = [...prepared, ...purchases];
        setPurchases(next);
        savePurchases(next);
      }

      if (entity === "suppliers") {
        const prepared: Supplier[] = cleanRows.map((row, index) => ({
          id: `SUP-${1000 + suppliers.length + index + 1}`,
          name: row.supplier_name.trim(),
          phone: row.phone?.trim() || "",
          email: row.email?.trim() || "",
          address: row.address?.trim() || "",
          notes: [row.contact_person, row.payment_terms].filter(Boolean).join(" • "),
          isDeleted: false,
        }));
        const next = [...prepared, ...suppliers];
        setSuppliers(next);
        saveSuppliers(next);
      }

      if (entity === "invoices") {
        const prepared: Invoice[] = cleanRows.map((row, index) => ({
          id: row.invoice_number.trim() || `INV-${1000 + invoices.length + index + 1}`,
          customerId: resolveCustomerId(referenceData, row.customer),
          total: Number(row.total || 0),
          remainingAmount: Number(row.remaining || row.total || 0),
          status: (row.status as Invoice["status"]) || "Pending",
          date: row.date || TODAY,
          notes: `Due: ${row.due_date || "-"}${row.notes ? ` • ${row.notes}` : ""}`,
        })) as Invoice[];
        const next = [...prepared, ...invoices];
        setInvoices(next);
        saveInvoices(next);
      }

      if (entity === "payments") {
        const prepared: Payment[] = cleanRows.map((row, index) => {
          const linkedInvoice = resolveInvoice(referenceData, row.invoice_number);
          return {
            id: row.payment_reference.trim() || `PAY-${2000 + payments.length + index + 1}`,
            paymentId: row.payment_reference.trim() || `PAY-${2000 + payments.length + index + 1}`,
            invoiceId: linkedInvoice?.id || "",
            customerId: linkedInvoice?.customerId || "",
            amount: Number(row.amount || 0),
            method:
              row.payment_method === "Card" || row.payment_method === "Bank Transfer"
                ? row.payment_method
                : "Cash",
            date: row.payment_date || TODAY,
            status: "Completed",
            notes: row.notes?.trim() || "",
          };
        });
        const next = [...prepared, ...payments];
        setPayments(next);
        savePayments(next);
      }

      if (entity === "employees") {
        const prepared: Employee[] = cleanRows.map((row, index) => ({
          id: `EMP-${1000 + employees.length + index + 1}`,
          name: row.name.trim(),
          phone: row.phone.trim(),
          workStart: "08:00",
          workEnd: "17:00",
          salaryType: "fixed",
          fixedSalary: Number(row.salary || 0),
          advance: 0,
          notes: [row.role, row.department, row.email].filter(Boolean).join(" • "),
          isDeleted: false,
        }));
        const next = [...prepared, ...employees];
        setEmployees(next);
        saveEmployees(next);
      }

      pushHistory({
        id: `import-${Date.now()}`,
        entity,
        importedBy: "admin",
        date: new Date().toISOString(),
        rowCount: importedCount,
        status: skippedCount > 0 ? "Partial Success" : "Success",
        skippedCount,
      });

      setSuccessState({ entity, importedCount, skippedCount });
      setProcessingState("success");
    }, 650);
  }

  return (
    <div className="data-import-page">
      <section className="data-import-header">
        <div className="data-import-header-copy">
          <span className="data-import-badge">
            <Upload size={15} />
            Import Workspace
          </span>
          <h1>Data Import</h1>
          <p>Import structured records into your system using CSV paste or file upload</p>
        </div>

        <div className="data-import-header-actions">
          <button type="button" className="import-secondary-btn" onClick={handleTemplateDownload}>
            <Download size={16} />
            Download Template
          </button>
          <button
            type="button"
            className="import-secondary-btn"
            onClick={() => guideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <Info size={16} />
            View Format Guide
          </button>
        </div>
      </section>

      <section className="data-import-card entity-selector-card">
        <div className="card-heading">
          <div>
            <h2>Choose entity type</h2>
            <p>{config.helper}</p>
          </div>
          <div className="entity-count-pill">{config.label}</div>
        </div>

        <div className="entity-pill-row">
          {(Object.keys(ENTITY_CONFIGS) as ImportEntity[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`entity-pill ${entity === key ? "active" : ""}`}
              onClick={() => handleEntityChange(key)}
            >
              <strong>{ENTITY_CONFIGS[key].label}</strong>
              <span>{ENTITY_CONFIGS[key].description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="data-import-layout">
        <section className="data-import-main">
          <section className="data-import-card import-method-card">
            <div className="card-heading">
              <div>
                <h2>Choose import method</h2>
                <p>Paste CSV directly or upload a CSV file and review records before import.</p>
              </div>
            </div>

            <div className="method-toggle-row">
              <button
                type="button"
                className={`method-toggle ${method === "paste" ? "active" : ""}`}
                onClick={() => setMethod("paste")}
              >
                <FileSpreadsheet size={16} />
                Paste CSV
              </button>
              <button
                type="button"
                className={`method-toggle ${method === "upload" ? "active" : ""}`}
                onClick={() => setMethod("upload")}
              >
                <FolderUp size={16} />
                Upload CSV File
              </button>
            </div>

            <div className="import-input-grid">
              <div className={`input-panel ${method === "paste" ? "active" : ""}`}>
                <div className="input-panel-head">
                  <h3>Paste CSV</h3>
                  <span>Header row first</span>
                </div>
                <textarea
                  className="csv-textarea"
                  value={method === "paste" ? rawText : rawText}
                  onChange={(event) => {
                    setMethod("paste");
                    setRawText(event.target.value);
                    setFileName("");
                    setSuccessState(null);
                    setPageError(null);
                    setProcessingState("idle");
                  }}
                  placeholder={templateCsv}
                />
                <div className="csv-tips">
                  <span>First row must contain column headers</span>
                  <span>Use commas to separate values</span>
                  <span>One record per line</span>
                </div>
              </div>

              <div
                className={`upload-dropzone ${method === "upload" ? "active" : ""} ${dragActive ? "dragging" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="upload-dropzone-inner">
                  <Upload size={26} />
                  <h3>Drop CSV file here or browse</h3>
                  <p>CSV only. Keep headers exactly as shown in the format guide.</p>
                  <button
                    type="button"
                    className="import-secondary-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={handleFileChange}
                  />
                </div>

                {fileName && (
                  <div className="uploaded-file-card">
                    <div>
                      <strong>{fileName}</strong>
                      <span>{parsed.rows.length} detected rows</span>
                    </div>
                    <button type="button" className="icon-action-btn" onClick={clearInput}>
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section ref={guideRef} className="data-import-card template-guide-card">
            <div className="card-heading">
              <div>
                <h2>Template and format guide</h2>
                <p>Use the required columns exactly as shown for safer validation and preview mapping.</p>
              </div>
              <div className="card-heading-actions">
                <button
                  type="button"
                  className="import-secondary-btn compact"
                  onClick={() => setShowGuide((current) => !current)}
                >
                  <ChevronRight size={16} className={showGuide ? "chevron-open" : ""} />
                  {showGuide ? "Collapse" : "Expand"}
                </button>
                <button type="button" className="import-secondary-btn" onClick={handleTemplateDownload}>
                  <Download size={16} />
                  Download Template
                </button>
              </div>
            </div>

            {showGuide ? <div className="template-guide-grid">
              <div className="template-guide-block">
                <span className="guide-label">Required fields</span>
                <div className="guide-chip-row">
                  {config.requiredFields.map((field) => (
                    <span key={field} className="guide-chip strong">
                      {humanizeHeader(field)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="template-guide-block">
                <span className="guide-label">Optional fields</span>
                <div className="guide-chip-row">
                  {config.optionalFields.map((field) => (
                    <span key={field} className="guide-chip">
                      {humanizeHeader(field)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="template-guide-block full">
                <span className="guide-label">Sample header</span>
                <code>{[...config.requiredFields, ...config.optionalFields].join(",")}</code>
              </div>

              <div className="template-guide-block full">
                <span className="guide-label">Sample row</span>
                <code>{config.sampleRow.join(",")}</code>
              </div>
            </div> : null}
          </section>

          <section className="data-import-card preview-card">
            <div className="card-heading">
              <div>
                <h2>Preview records</h2>
                <p>
                  {noInput
                    ? "Nothing to preview yet. Paste CSV or upload a file to review records."
                    : `${parsed.rows.length} records detected for ${config.label.toLowerCase()}.`}
                </p>
              </div>
              {!noInput && (
                <div className="preview-summary-pills">
                  <span className="summary-pill success">{validation.validCount} valid</span>
                  <span className="summary-pill warning">{validation.warningCount} warnings</span>
                  <span className="summary-pill danger">{validation.errorCount} errors</span>
                </div>
              )}
            </div>

            {processingState === "parsing" ? (
              <div className="preview-loading">
                <div className="import-skeleton-row" />
                <div className="import-skeleton-row" />
                <div className="import-skeleton-row" />
              </div>
            ) : parsed.error ? (
              <div className="preview-empty-state error">
                <AlertCircle size={22} />
                <div>
                  <strong>CSV structure issue</strong>
                  <span>{parsed.error}</span>
                </div>
              </div>
            ) : noInput ? (
              <div className="preview-empty-state">
                <SearchCheck size={22} />
                <div>
                  <strong>No preview yet</strong>
                  <span>Preview rows will appear here after you provide CSV input.</span>
                </div>
              </div>
            ) : (
              <div className="preview-table-wrap app-table-wrap">
                <table className="preview-table app-data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      {previewColumns.map((header) => (
                        <th key={header}>{humanizeHeader(header)}</th>
                      ))}
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.rows.slice(0, 6).map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="row-number-cell">{row.rowNumber}</td>
                        {previewColumns.map((header) => {
                          const hasIssue = row.issues.some((issue) => issue.field === header);
                          return (
                            <td key={header} className={hasIssue ? "cell-error" : ""}>
                              {row.values[header] || "—"}
                            </td>
                          );
                        })}
                        <td>
                          <span className={`row-status-badge ${row.state}`}>
                            {row.state === "valid"
                              ? "Valid"
                              : row.issues[0]?.message || "Needs review"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="data-import-card actions-card">
            <div className="card-heading compact">
              <div>
                <h2>Import actions</h2>
                <p>Import only after the preview is clean and required columns are valid.</p>
              </div>
            </div>

            <div className="import-actions-row">
              <button type="button" className="import-secondary-btn" onClick={clearInput}>
                Cancel
              </button>
              <button type="button" className="import-secondary-btn" onClick={clearInput}>
                Clear Input
              </button>
              <button type="button" className="import-secondary-btn" onClick={handleTemplateDownload}>
                <Download size={16} />
                Download Template
              </button>
              <button
                type="button"
                className="import-primary-btn"
                disabled={!validation.canImport || processingState === "importing"}
                onClick={importRows}
              >
                {processingState === "importing" ? "Importing..." : "Import Data"}
              </button>
            </div>
          </section>

          {successState && (
            <section className="data-import-card success-card">
              <div className="success-card-main">
                <div className="success-icon">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3>
                    {successState.importedCount} {ENTITY_CONFIGS[successState.entity].label.toLowerCase()} imported successfully
                  </h3>
                  <p>
                    {successState.skippedCount > 0
                      ? `${successState.skippedCount} rows were skipped during validation.`
                      : "All previewed rows passed validation and were imported."}
                  </p>
                </div>
              </div>

              <div className="success-actions">
                <button type="button" className="import-secondary-btn" onClick={clearInput}>
                  Import another file
                </button>
                <button type="button" className="import-secondary-btn" onClick={handleTemplateDownload}>
                  Download import report
                </button>
                <button type="button" className="import-primary-btn">
                  Go to {ENTITY_CONFIGS[successState.entity].label}
                </button>
              </div>
            </section>
          )}
        </section>

        <aside className="data-import-side">
          <section className="data-import-card validation-card">
            <div className="card-heading compact">
              <div>
                <h2>Validation summary</h2>
                <p>Critical errors must be resolved before import. Warnings can still be reviewed safely.</p>
              </div>
            </div>

            {pageError ? (
              <div className="validation-alert danger">
                <AlertCircle size={16} />
                <span>{pageError}</span>
              </div>
            ) : (
              <>
                <div className="validation-stat-grid">
                  <div className="validation-stat">
                    <span>Critical errors</span>
                    <strong>{validation.errorCount + validation.missingColumns.length}</strong>
                  </div>
                  <div className="validation-stat">
                    <span>Warnings</span>
                    <strong>{validation.warningCount + validation.unsupportedColumns.length}</strong>
                  </div>
                  <div className="validation-stat">
                    <span>Ready rows</span>
                    <strong>{validation.validCount}</strong>
                  </div>
                </div>

                <div className="issue-list">
                  {validation.issueCounts.length === 0 ? (
                    <div className="issue-list-empty">
                      <ShieldCheck size={18} />
                      <span>No validation issues detected yet.</span>
                    </div>
                  ) : (
                    validation.issueCounts.slice(0, 8).map((issue) => (
                      <div key={issue.message} className={`issue-item ${issue.level}`}>
                        {issue.level === "error" ? (
                          <AlertCircle size={15} />
                        ) : (
                          <TriangleAlert size={15} />
                        )}
                        <div>
                          <strong>{issue.message}</strong>
                          <span>{issue.count} row(s)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>

          <section className="data-import-card history-card">
            <div className="card-heading compact">
              <div>
                <h2>Recent imports</h2>
                <p>Recent import activity and quick status checks.</p>
              </div>
              <button
                type="button"
                className="import-secondary-btn compact"
                onClick={() => setShowHistory((current) => !current)}
              >
                <ChevronRight size={16} className={showHistory ? "chevron-open" : ""} />
                {showHistory ? "Hide" : "Show"}
              </button>
            </div>

            {showHistory ? <div className="history-list">
              {history.length === 0 ? (
                <div className="history-empty">
                  <RefreshCcw size={16} />
                  <span>No recent import history yet.</span>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div>
                      <strong>{ENTITY_CONFIGS[item.entity].label}</strong>
                      <span>
                        {item.rowCount} rows · {item.status}
                      </span>
                    </div>
                    <div className="history-meta">
                      <span>{item.importedBy}</span>
                      <span>{formatDateTime(item.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
