import "./Invoices.css";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "../context/SettingsContext";
import {
  Building2,
  Check,
  Eye,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import {
  getCustomers,
  getEmployees,
  getSuppliers,
} from "../data/storage";
import { useData } from "../context/DataContext";
import type { Customer, Employee, Product, Supplier } from "../data/types";
import { formatCurrencyValue } from "../utils/displayFormatters";

type TabKey = "customer" | "supplier" | "internal";
type InvoiceStatus = "Paid" | "Partial" | "Unpaid";
type PaymentMethod = "Cash" | "Card" | "Bank Transfer";
type Priority = "Low" | "Medium" | "High" | "Critical";
type DueFilter = "all" | "late" | "today" | "week";
type SortKey =
  | "newest"
  | "oldest"
  | "dueSoon"
  | "amountHigh"
  | "amountLow"
  | "amountDueHigh";

type InvoiceLine = {
  id: string;
  productId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type InvoiceRecord = {
  id: string;
  type: TabKey;
  title: string;
  partyName: string;
  partySubtext: string;
  customerId?: string;
  supplierId?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  items: InvoiceLine[];
  notes: string;
  linkedRecord: string;
  department?: string;
  category?: string;
  priority?: Priority;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
};

type InvoiceFormState = {
  id?: string;
  type: TabKey;
  title: string;
  partyName: string;
  partySubtext: string;
  customerId: string;
  supplierId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentMethod: PaymentMethod;
  productId: string;
  quantity: string;
  unitPrice: string;
  paidAmount: string;
  vatEnabled: boolean;
  vatRate: string;
  notes: string;
  linkedRecord: string;
  department: string;
  category: string;
  priority: Priority;
  approvedBy: string;
};

type FilterState = {
  search: string;
  status: "all" | InvoiceStatus;
  due: DueFilter;
  paymentMethod: "all" | PaymentMethod;
  minAmount: string;
  maxAmount: string;
  sortBy: SortKey;
};

const STORAGE_KEY = "dashboard_invoice_management_final_v10";
const TODAY = new Date().toISOString().split("T")[0];

const EMPTY_FILTERS: FilterState = {
  search: "",
  status: "all",
  due: "all",
  paymentMethod: "all",
  minAmount: "",
  maxAmount: "",
  sortBy: "newest",
};

const EMPTY_FORM: InvoiceFormState = {
  type: "customer",
  title: "",
  partyName: "",
  partySubtext: "",
  customerId: "",
  supplierId: "",
  issueDate: TODAY,
  dueDate: TODAY,
  currency: "ILS",
  paymentMethod: "Bank Transfer",
  productId: "",
  quantity: "1",
  unitPrice: "0",
  paidAmount: "0",
  vatEnabled: true,
  vatRate: "16",
  notes: "",
  linkedRecord: "",
  department: "",
  category: "",
  priority: "Medium",
  approvedBy: "",
};

const TAB_ORDER: TabKey[] = ["customer", "supplier", "internal"];


function ModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function money(value: number, currency = "ILS") {
  return formatCurrencyValue(Number.isFinite(value) ? value : 0, currency as "USD" | "ILS" | "JOD");
}

function normalizeNumber(value: string | number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (value === "Cash" || value === "Card" || value === "Bank Transfer") {
    return value;
  }

  return "Bank Transfer";
}

type T = ReturnType<typeof useSettings>["t"];

function paymentLabel(method: PaymentMethod, t: T) {
  if (method === "Cash") return t.invoices.methods.cash;
  if (method === "Card") return t.invoices.methods.card;
  return t.invoices.methods.bankTransfer;
}

function getDefaultTitle(type: TabKey, t: T) {
  return t.invoices.getDefaultTitle[type];
}

function getPartyLabel(type: TabKey, t: T) {
  if (type === "customer") return t.invoices.cols.customer;
  if (type === "supplier") return t.invoices.cols.supplier;
  return t.invoices.cols.department;
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function isLate(invoice: InvoiceRecord) {
  return invoice.remainingAmount > 0 && invoice.status !== "Paid" && invoice.dueDate < TODAY;
}

function isDueToday(invoice: InvoiceRecord) {
  return invoice.remainingAmount > 0 && invoice.status !== "Paid" && invoice.dueDate === TODAY;
}

function isDueThisWeek(invoice: InvoiceRecord) {
  if (invoice.remainingAmount <= 0 || invoice.status === "Paid") return false;

  const diffDays = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date(TODAY).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return diffDays >= 0 && diffDays <= 7;
}


function statusFromAmounts(paidAmount: number, totalAmount: number): InvoiceStatus {
  if (totalAmount > 0 && paidAmount >= totalAmount) return "Paid";
  if (paidAmount > 0 && paidAmount < totalAmount) return "Partial";
  return "Unpaid";
}

function buildInvoiceId(type: TabKey) {
  const prefix =
    type === "customer"
      ? "CINV"
      : type === "supplier"
      ? "SINV"
      : "IINV";

  return `${prefix}-${Math.floor(Math.random() * 900000) + 100000}`;
}

function buildLinkedRecord(type: TabKey, invoiceId: string) {
  const prefix =
    type === "customer" ? "AUTO-CUST" : type === "supplier" ? "AUTO-SUP" : "AUTO-INT";
  const numericPart = invoiceId.match(/\d+/)?.[0] ?? String(Date.now()).slice(-6);

  return `${prefix}-${numericPart}`;
}

function normalizeInvoiceRecord(invoice: InvoiceRecord): InvoiceRecord {
  const subtotal = invoice.subtotal ?? invoice.totalAmount;
  const vatRate = invoice.vatRate ?? 0;
  const vatAmount = invoice.vatAmount ?? 0;
  return {
    ...invoice,
    dueDate: invoice.dueDate || invoice.issueDate || TODAY,
    issueDate: invoice.issueDate || invoice.dueDate || TODAY,
    currency: invoice.currency || "ILS",
    paymentMethod: normalizePaymentMethod(invoice.paymentMethod),
    linkedRecord: invoice.linkedRecord || buildLinkedRecord(invoice.type, invoice.id),
    subtotal,
    vatRate,
    vatAmount,
  };
}


function getCustomerId(customer: Customer, index: number) {
  const item = customer as Customer & Record<string, unknown>;
  return String(item.id ?? item.customerId ?? `customer-${index}`);
}

function getCustomerName(customer: Customer) {
  const item = customer as Customer & Record<string, unknown>;
  return String(item.name ?? item.customerName ?? item.fullName ?? "Unnamed Customer");
}

function getCustomerEmail(customer: Customer) {
  const item = customer as Customer & Record<string, unknown>;
  return String(item.email ?? item.customerEmail ?? "");
}

function getCustomerPhone(customer: Customer) {
  const item = customer as Customer & Record<string, unknown>;
  return String(item.phone ?? item.customerPhone ?? item.mobile ?? "");
}

function getSupplierId(supplier: Supplier, index: number) {
  const item = supplier as Supplier & Record<string, unknown>;
  return String(item.id ?? item.supplierId ?? `supplier-${index}`);
}

function getSupplierName(supplier: Supplier) {
  const item = supplier as Supplier & Record<string, unknown>;
  return String(item.name ?? item.supplierName ?? item.companyName ?? "Unnamed Supplier");
}

function getSupplierEmail(supplier: Supplier) {
  const item = supplier as Supplier & Record<string, unknown>;
  return String(item.email ?? item.supplierEmail ?? "");
}

function getProductName(product: Product) {
  const item = product as Product & Record<string, unknown>;

  return String(
    item.name ??
      item.productName ??
      item.title ??
      item.label ??
      "Unnamed Product"
  );
}

function getProductPrice(product: Product) {
  const item = product as Product & Record<string, unknown>;

  const possiblePrice =
    item.price ??
    item.sellingPrice ??
    item.salePrice ??
    item.unitPrice ??
    item.costPrice ??
    item.totalCost ??
    0;

  return normalizeNumber(String(possiblePrice));
}

function getProductId(product: Product, index: number) {
  const item = product as Product & Record<string, unknown>;
  return String(item.id ?? item.productId ?? `product-${index}`);
}

function getProductById(products: Product[], productId: string) {
  return products.find((product, index) => getProductId(product, index) === productId);
}

function buildLine(
  product: Product | undefined,
  productId: string,
  quantity: number,
  unitPrice: number
): InvoiceLine {
  const label = product ? getProductName(product) : "General item";

  return {
    id: `line-${Date.now()}`,
    productId,
    label,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  };
}

function seedInvoices(
  customers: Customer[],
  suppliers: Supplier[],
  products: Product[],
  employees: Employee[]
): InvoiceRecord[] {
  const firstProduct = products[0];
  const secondProduct = products[1] ?? products[0];
  const thirdProduct = products[2] ?? products[0];

  const customerA = customers[0];
  const customerB = customers[1] ?? customers[0];
  const supplierA = suppliers[0];
  const supplierB = suppliers[1] ?? suppliers[0];
  const approver = employees[1]?.name ?? employees[0]?.name ?? "Finance Manager";

  const firstPrice = firstProduct ? getProductPrice(firstProduct) || 743 : 743;
  const secondPrice = secondProduct ? getProductPrice(secondProduct) || 543 : 543;
  const thirdPrice = thirdProduct ? getProductPrice(thirdProduct) || 807 : 807;

  return [
    {
      id: "CINV-2401",
      type: "customer",
      title: "Customer Invoice",
      partyName: customerA ? getCustomerName(customerA) : "Osid Barakat",
      partySubtext: customerA ? getCustomerEmail(customerA) : "customer@email.com",
      customerId: customerA ? getCustomerId(customerA, 0) : "",
      issueDate: "2026-04-08",
      dueDate: "2026-04-08",
      currency: "ILS",
      status: "Partial",
      paymentMethod: "Bank Transfer",
      subtotal: firstPrice,
      vatRate: 16,
      vatAmount: Math.round(firstPrice * 16) / 100,
      totalAmount: firstPrice + Math.round(firstPrice * 16) / 100,
      paidAmount: Math.min(420, firstPrice + Math.round(firstPrice * 16) / 100),
      remainingAmount: Math.max(firstPrice + Math.round(firstPrice * 16) / 100 - 420, 0),
      items: [
        {
          id: "line-customer-1",
          productId: firstProduct ? getProductId(firstProduct, 0) : "",
          label: firstProduct ? getProductName(firstProduct) : "Laptop",
          quantity: 1,
          unitPrice: firstPrice,
          total: firstPrice,
        },
      ],
      notes: "Awaiting payment.",
      linkedRecord: buildLinkedRecord("customer", "CINV-2401"),
      createdAt: "2026-04-08T09:00:00.000Z",
      updatedAt: "2026-04-21T09:40:00.000Z",
    },
    {
      id: "CINV-2402",
      type: "customer",
      title: "Customer Invoice",
      partyName: customerB ? getCustomerName(customerB) : "Mahmoud Kharouf",
      partySubtext: customerB ? getCustomerEmail(customerB) : "customer@email.com",
      customerId: customerB ? getCustomerId(customerB, 1) : "",
      issueDate: "2026-03-28",
      dueDate: "2026-03-28",
      currency: "ILS",
      status: "Unpaid",
      paymentMethod: "Card",
      subtotal: secondPrice,
      vatRate: 16,
      vatAmount: Math.round(secondPrice * 16) / 100,
      totalAmount: secondPrice + Math.round(secondPrice * 16) / 100,
      paidAmount: 0,
      remainingAmount: secondPrice + Math.round(secondPrice * 16) / 100,
      items: [
        {
          id: "line-customer-2",
          productId: secondProduct ? getProductId(secondProduct, 1) : "",
          label: secondProduct ? getProductName(secondProduct) : "Monitor",
          quantity: 1,
          unitPrice: secondPrice,
          total: secondPrice,
        },
      ],
      notes: "Not paid yet.",
      linkedRecord: buildLinkedRecord("customer", "CINV-2402"),
      createdAt: "2026-03-28T11:00:00.000Z",
      updatedAt: "2026-04-20T13:10:00.000Z",
    },
    {
      id: "SINV-8801",
      type: "supplier",
      title: "Supplier Invoice",
      partyName: supplierA ? getSupplierName(supplierA) : "Tech Source",
      partySubtext: supplierA ? getSupplierEmail(supplierA) : "billing@supplier.com",
      supplierId: supplierA ? getSupplierId(supplierA, 0) : "",
      issueDate: "2026-04-11",
      dueDate: "2026-04-11",
      currency: "ILS",
      status: "Unpaid",
      paymentMethod: "Bank Transfer",
      subtotal: thirdPrice,
      vatRate: 16,
      vatAmount: Math.round(thirdPrice * 16) / 100,
      totalAmount: thirdPrice + Math.round(thirdPrice * 16) / 100,
      paidAmount: 0,
      remainingAmount: thirdPrice + Math.round(thirdPrice * 16) / 100,
      items: [
        {
          id: "line-supplier-1",
          productId: thirdProduct ? getProductId(thirdProduct, 2) : "",
          label: thirdProduct ? getProductName(thirdProduct) : "Inventory Item",
          quantity: 1,
          unitPrice: thirdPrice,
          total: thirdPrice,
        },
      ],
      notes: "Supplier invoice waiting for payment.",
      linkedRecord: buildLinkedRecord("supplier", "SINV-8801"),
      createdAt: "2026-04-11T10:00:00.000Z",
      updatedAt: "2026-04-20T11:50:00.000Z",
    },
    {
      id: "SINV-8802",
      type: "supplier",
      title: "Supplier Invoice",
      partyName: supplierB ? getSupplierName(supplierB) : "Digital Hub",
      partySubtext: supplierB ? getSupplierEmail(supplierB) : "billing@digitalhub.com",
      supplierId: supplierB ? getSupplierId(supplierB, 1) : "",
      issueDate: "2026-04-02",
      dueDate: "2026-04-02",
      currency: "ILS",
      status: "Paid",
      paymentMethod: "Cash",
      subtotal: 741,
      vatRate: 16,
      vatAmount: 118,
      totalAmount: 859,
      paidAmount: 859,
      remainingAmount: 0,
      items: [
        {
          id: "line-supplier-2",
          productId: "",
          label: "Logistics Service",
          quantity: 1,
          unitPrice: 859,
          total: 859,
        },
      ],
      notes: "Paid.",
      linkedRecord: buildLinkedRecord("supplier", "SINV-8802"),
      createdAt: "2026-04-02T10:00:00.000Z",
      updatedAt: "2026-04-18T10:10:00.000Z",
    },
    {
      id: "IINV-1107",
      type: "internal",
      title: "Internal Invoice",
      partyName: "Operations",
      partySubtext: "Technical",
      issueDate: "2026-04-03",
      dueDate: "2026-04-03",
      currency: "ILS",
      status: "Partial",
      paymentMethod: "Bank Transfer",
      subtotal: 782,
      vatRate: 16,
      vatAmount: 125,
      totalAmount: 907,
      paidAmount: 450,
      remainingAmount: 457,
      items: [
        {
          id: "line-internal-1",
          productId: "",
          label: "Maintenance",
          quantity: 1,
          unitPrice: 907,
          total: 907,
        },
      ],
      notes: "Partly settled.",
      linkedRecord: buildLinkedRecord("internal", "IINV-1107"),
      department: "Operations",
      category: "Technical",
      priority: "High",
      approvedBy: approver,
      createdAt: "2026-04-03T08:00:00.000Z",
      updatedAt: "2026-04-21T08:05:00.000Z",
    },
    {
      id: "IINV-1108",
      type: "internal",
      title: "Internal Invoice",
      partyName: "Marketing",
      partySubtext: "Marketing",
      issueDate: "2026-04-18",
      dueDate: "2026-04-18",
      currency: "ILS",
      status: "Unpaid",
      paymentMethod: "Bank Transfer",
      subtotal: 475,
      vatRate: 16,
      vatAmount: 76,
      totalAmount: 551,
      paidAmount: 0,
      remainingAmount: 551,
      items: [
        {
          id: "line-internal-2",
          productId: "",
          label: "Marketing Campaign",
          quantity: 1,
          unitPrice: 551,
          total: 551,
        },
      ],
      notes: "Needs approval.",
      linkedRecord: buildLinkedRecord("internal", "IINV-1108"),
      department: "Marketing",
      category: "Marketing",
      priority: "Medium",
      approvedBy: "",
      createdAt: "2026-04-18T14:00:00.000Z",
      updatedAt: "2026-04-21T15:40:00.000Z",
    },
  ];
}

export default function Invoices() {
  const { t } = useSettings();
  const { products } = useData();

  const TAB_CONFIG: Record<TabKey, { label: string; tableTitle: string; icon: typeof Users }> = {
    customer: { label: t.invoices.tabs.customer, tableTitle: t.invoices.tabs.customer, icon: Users },
    supplier: { label: t.invoices.tabs.supplier, tableTitle: t.invoices.tabs.supplier, icon: Truck },
    internal: { label: t.invoices.tabs.internal, tableTitle: t.invoices.tabs.internal, icon: Building2 },
  };

  const [customers] = useState<Customer[]>(() => getCustomers());
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());
  const [employees] = useState<Employee[]>(() => getEmployees());

  const [records, setRecords] = useState<InvoiceRecord[]>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedRecords = JSON.parse(stored) as InvoiceRecord[];
        return parsedRecords.map(normalizeInvoiceRecord);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        return seedInvoices(customers, suppliers, products, employees).map(normalizeInvoiceRecord);
      }
    }
    return seedInvoices(customers, suppliers, products, employees).map(normalizeInvoiceRecord);
  });
  const [hasLoaded] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>("customer");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formState, setFormState] = useState<InvoiceFormState>(EMPTY_FORM);

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerMenu, setShowCustomerMenu] = useState(false);
  const customerMenuRef = useRef<HTMLDivElement | null>(null);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [editDeleteCode, setEditDeleteCode] = useState("");
  const [editDeleteError, setEditDeleteError] = useState("");

  const [detailInvoice, setDetailInvoice] = useState<InvoiceRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const customerOptions = useMemo(
    () =>
      customers.map((customer, index) => ({
        id: getCustomerId(customer, index),
        name: getCustomerName(customer),
        email: getCustomerEmail(customer),
        phone: getCustomerPhone(customer),
      })),
    [customers]
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.map((supplier, index) => ({
        id: getSupplierId(supplier, index),
        name: getSupplierName(supplier),
        email: getSupplierEmail(supplier),
      })),
    [suppliers]
  );

  const productOptions = useMemo(
    () =>
      products.map((product, index) => ({
        id: getProductId(product, index),
        name: getProductName(product),
        price: getProductPrice(product),
      })),
    [products]
  );

  const filteredCustomerOptions = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();

    if (!search) return customerOptions;

    return customerOptions.filter((customer) =>
      [customer.name, customer.email, customer.phone]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [customerOptions, customerSearch]);


  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [hasLoaded, records]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customerMenuRef.current &&
        !customerMenuRef.current.contains(event.target as Node)
      ) {
        setShowCustomerMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const visibleByTab = useMemo(
    () => records.filter((invoice) => invoice.type === activeTab),
    [records, activeTab]
  );

  const filteredRecords = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const minAmount = filters.minAmount.trim() ? normalizeNumber(filters.minAmount) : null;
    const maxAmount = filters.maxAmount.trim() ? normalizeNumber(filters.maxAmount) : null;

    const filtered = visibleByTab.filter((invoice) => {
      if (filters.status !== "all" && invoice.status !== filters.status) return false;
      if (filters.paymentMethod !== "all" && invoice.paymentMethod !== filters.paymentMethod) return false;
      if (filters.due === "late" && !isLate(invoice)) return false;
      if (filters.due === "today" && !isDueToday(invoice)) return false;
      if (filters.due === "week" && !isDueThisWeek(invoice)) return false;
      if (minAmount !== null && invoice.totalAmount < minAmount) return false;
      if (maxAmount !== null && invoice.totalAmount > maxAmount) return false;

      if (search) {
        const haystack = [
          invoice.id,
          invoice.title,
          invoice.partyName,
          invoice.partySubtext,
          invoice.status,
          invoice.paymentMethod,
          invoice.notes,
          invoice.linkedRecord,
          invoice.department,
          invoice.category,
          invoice.priority,
          invoice.items.map((item) => item.label).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(search)) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (filters.sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      if (filters.sortBy === "dueSoon") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (filters.sortBy === "amountHigh") {
        return b.totalAmount - a.totalAmount;
      }

      if (filters.sortBy === "amountLow") {
        return a.totalAmount - b.totalAmount;
      }

      if (filters.sortBy === "amountDueHigh") {
        return b.remainingAmount - a.remainingAmount;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filters, visibleByTab]);

  const summary = useMemo(() => {
    const amountDue = visibleByTab.reduce((sum, invoice) => sum + invoice.remainingAmount, 0);
    const lateCount = visibleByTab.filter(isLate).length;
    const pendingApprovals = visibleByTab.filter(
      (invoice) => invoice.type === "internal" && !invoice.approvedBy
    ).length;

    return {
      amountDue,
      lateCount,
      pendingApprovals,
      count: visibleByTab.length,
    };
  }, [visibleByTab]);

  const activeFilterCount = [
    filters.status !== "all",
    filters.due !== "all",
    filters.paymentMethod !== "all",
    filters.minAmount.trim() !== "",
    filters.maxAmount.trim() !== "",
    filters.sortBy !== "newest",
  ].filter(Boolean).length;

  function pushToast(message: string) {
    setToast(message);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setShowFilterMenu(false);
  }

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function hasUnsavedInvoiceData() {
    if (formMode === "edit") return true;

    const fieldsToCheck: Array<keyof InvoiceFormState> = [
      "partyName",
      "partySubtext",
      "customerId",
      "supplierId",
      "productId",
      "notes",
      "department",
      "category",
      "approvedBy",
    ];

    const hasTextData = fieldsToCheck.some((key) => {
      const value = String(formState[key] ?? "").trim();
      return value !== "";
    });

    const hasChangedNumbers =
      formState.quantity !== "1" ||
      formState.unitPrice !== "0" ||
      formState.paidAmount !== "0";

    const hasChangedDates =
      formState.issueDate !== TODAY ||
      formState.dueDate !== TODAY;

    return hasTextData || hasChangedNumbers || hasChangedDates;
  }

  function requestCloseFormModal() {
    if (hasUnsavedInvoiceData()) {
      setShowDiscardConfirm(true);
      return;
    }

    closeFormModal();
  }

  function keepEditing() {
    setShowDiscardConfirm(false);
  }

  function confirmDiscardChanges() {
    setShowDiscardConfirm(false);
    closeFormModal();
  }

  function selectCustomer(customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  }) {
    setFormState((current) => ({
      ...current,
      customerId: customer.id,
      partyName: customer.name,
      partySubtext: customer.email || customer.phone,
      title:
        current.title.trim() === "" || current.title === getDefaultTitle("customer", t)
          ? `${customer.name} Invoice`
          : current.title,
    }));

    setCustomerSearch(customer.name);
    setShowCustomerMenu(false);
  }

  function openAddModal(type: TabKey = activeTab) {
    setFormMode("add");
    setFormState({
      ...EMPTY_FORM,
      type,
      title: getDefaultTitle(type, t),
      issueDate: TODAY,
      dueDate: TODAY,
      currency: "ILS",
      paymentMethod: "Bank Transfer",
    });

    setCustomerSearch("");
    setShowCustomerMenu(false);
    setEditDeleteCode("");
    setEditDeleteError("");
    setShowDiscardConfirm(false);
    setFormOpen(true);
  }

  function openEditModal(invoice: InvoiceRecord) {
    const firstLine = invoice.items[0];

    setFormMode("edit");
    setFormState({
      id: invoice.id,
      type: invoice.type,
      title: invoice.title,
      partyName: invoice.partyName,
      partySubtext: invoice.partySubtext,
      customerId: invoice.customerId ?? "",
      supplierId: invoice.supplierId ?? "",
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency || "ILS",
      paymentMethod: normalizePaymentMethod(invoice.paymentMethod),
      productId: firstLine?.productId ?? "",
      quantity: String(firstLine?.quantity ?? 1),
      unitPrice: String(firstLine?.unitPrice ?? invoice.subtotal ?? invoice.totalAmount),
      paidAmount: String(invoice.paidAmount),
      vatEnabled: (invoice.vatRate ?? 0) > 0,
      vatRate: String(invoice.vatRate ?? 16),
      notes: invoice.notes,
      linkedRecord: invoice.linkedRecord,
      department: invoice.department ?? "",
      category: invoice.category ?? "",
      priority: invoice.priority ?? "Medium",
      approvedBy: invoice.approvedBy ?? "",
    });

    setCustomerSearch(invoice.type === "customer" ? invoice.partyName : "");
    setShowCustomerMenu(false);
    setEditDeleteCode("");
    setEditDeleteError("");
    setShowDiscardConfirm(false);
    setDetailInvoice(null);
    setFormOpen(true);
  }

  function closeFormModal() {
    setFormOpen(false);
    setFormState(EMPTY_FORM);
    setCustomerSearch("");
    setShowCustomerMenu(false);
    setEditDeleteCode("");
    setEditDeleteError("");
  }

  function handleProductChange(productId: string) {
    const selectedProduct = getProductById(products, productId);
    const price = selectedProduct ? getProductPrice(selectedProduct) : 0;

    setFormState((current) => ({
      ...current,
      productId,
      unitPrice: String(price),
    }));
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    if (name === "productId") {
      handleProductChange(value);
      return;
    }

    setFormState((current) => {
      if (name === "type") {
        const nextType = value as TabKey;

        setCustomerSearch("");
        setShowCustomerMenu(false);

        return {
          ...current,
          type: nextType,
          title:
            current.title.trim() === "" || current.title === getDefaultTitle(current.type, t)
              ? getDefaultTitle(nextType, t)
              : current.title,
          paymentMethod: "Bank Transfer",
          customerId: nextType === "customer" ? current.customerId : "",
          supplierId: nextType === "supplier" ? current.supplierId : "",
          partyName: "",
          partySubtext: "",
          linkedRecord: "",
        };
      }

      if (name === "issueDate") {
        return {
          ...current,
          issueDate: value,
          dueDate: value,
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  }

  function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const quantity = Math.max(1, normalizeNumber(formState.quantity));
    const unitPrice = Math.max(0, normalizeNumber(formState.unitPrice));
    const subtotal = quantity * unitPrice;
    const vatRate = formState.vatEnabled ? Math.max(0, normalizeNumber(formState.vatRate)) : 0;
    const vatAmount = Math.round(subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;
    const paidAmount = Math.min(Math.max(0, normalizeNumber(formState.paidAmount)), totalAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const status = statusFromAmounts(paidAmount, totalAmount);
    const product = getProductById(products, formState.productId);
    const item = buildLine(product, formState.productId, quantity, unitPrice);

    const partyName =
      formState.partyName.trim() ||
      formState.department.trim() ||
      getPartyLabel(formState.type, t);

    const partySubtext =
      formState.type === "internal"
        ? formState.category.trim()
        : formState.partySubtext.trim();

    const nextId =
      formMode === "edit" && formState.id ? formState.id : buildInvoiceId(formState.type);

    const nextRecord: InvoiceRecord = {
      id: nextId,
      type: formState.type,
      title: formState.title.trim() || getDefaultTitle(formState.type, t),
      partyName,
      partySubtext,
      customerId: formState.type === "customer" ? formState.customerId : undefined,
      supplierId: formState.type === "supplier" ? formState.supplierId : undefined,
      issueDate: formState.issueDate,
      dueDate: formState.dueDate || formState.issueDate,
      currency: formState.currency || "ILS",
      status,
      paymentMethod: formState.paymentMethod,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      paidAmount,
      remainingAmount,
      items: [item],
      notes: formState.notes.trim(),
      linkedRecord: buildLinkedRecord(formState.type, nextId),
      department: formState.type === "internal" ? partyName : undefined,
      category: formState.type === "internal" ? formState.category.trim() : undefined,
      priority: formState.type === "internal" ? formState.priority : undefined,
      approvedBy: formState.type === "internal" ? formState.approvedBy.trim() : undefined,
      createdAt:
        formMode === "edit"
          ? records.find((invoice) => invoice.id === formState.id)?.createdAt ??
            new Date().toISOString()
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRecords((current) => {
      if (formMode === "edit" && formState.id) {
        return current.map((invoice) =>
          invoice.id === formState.id ? nextRecord : invoice
        );
      }

      return [nextRecord, ...current];
    });

    pushToast(formMode === "edit" ? t.invoices.toast.updated : t.invoices.toast.created);
    closeFormModal();
  }

  function requestDeleteFromEdit() {
    if (!formState.id) return;

    if (editDeleteCode.trim() !== "123") {
      setEditDeleteError(t.invoices.delete.error);
      return;
    }

    setRecords((current) => current.filter((record) => record.id !== formState.id));
    pushToast(t.invoices.toast.deleted);
    closeFormModal();
  }

  function markAsPaid(invoice: InvoiceRecord) {
    setRecords((current) =>
      current.map((record) =>
        record.id === invoice.id
          ? {
              ...record,
              status: "Paid",
              paidAmount: record.totalAmount,
              remainingAmount: 0,
              updatedAt: new Date().toISOString(),
            }
          : record
      )
    );

    setDetailInvoice((current) =>
      current?.id === invoice.id
        ? {
            ...current,
            status: "Paid",
            paidAmount: current.totalAmount,
            remainingAmount: 0,
            updatedAt: new Date().toISOString(),
          }
        : current
    );

    pushToast(t.invoices.toast.markedPaid);
  }

  return (
    <>
      <div className="invoice-page">
        {/* ── Page header ─────────────────────────── */}
        <div className="inv-page-header">
          <div className="inv-header-left">
            <div className="inv-page-icon">
              <FileText size={22} />
            </div>
            <div className="inv-header-copy">
              <h1>{t.invoices.pageTitle}</h1>
              <p>{t.invoices.pageSubtitle}</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => openAddModal(activeTab)} leftIcon={<Plus size={16} />} className="inv-new-btn">
            {t.invoices.newInvoice}
          </Button>
        </div>

        {/* ── Invoice type tabs ───────────────────── */}
        <div className="inv-type-grid">
          {TAB_ORDER.map((tab) => {
            const config = TAB_CONFIG[tab];
            const Icon = config.icon;
            const count = records.filter((invoice) => invoice.type === tab).length;

            return (
              <button
                key={tab}
                type="button"
                className={`inv-type-card ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                <div className={`inv-type-icon ${tab}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <span>{config.label}</span>
                  <strong>{count}</strong>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Search + filter ─────────────────────── */}
        <div className="inv-search-row">
          <div className="inv-search-box">
            <Input
              variant="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder={t.invoices.searchPlaceholder}
              leftIcon={<Search size={17} />}
              fullWidth
            />
          </div>

          <div className="invoice-filter-menu-wrap">
              <button
                className={`toolbar-chip ${showFilterMenu ? "active" : ""}`}
                type="button"
                onClick={() => setShowFilterMenu((current) => !current)}
              >
                <Filter size={15} />
                {t.invoices.filterBtn}
                {activeFilterCount > 0 && (
                  <span className="toolbar-chip-count">{activeFilterCount}</span>
                )}
              </button>

              {showFilterMenu && (
                <div className="invoice-filter-dropdown professional-filter-dropdown">
                  <Select
                    label={t.invoices.filter.status}
                    value={filters.status}
                    onChange={(event) =>
                      updateFilter("status", event.target.value as FilterState["status"])
                    }
                    options={[
                      { value: "all", label: t.invoices.filter.allStatuses },
                      { value: "Paid", label: t.invoices.status.paid },
                      { value: "Partial", label: t.invoices.status.partial },
                      { value: "Unpaid", label: t.invoices.status.unpaid },
                    ]}
                    fullWidth
                  />

                  <Select
                    label={t.invoices.filter.due}
                    value={filters.due}
                    onChange={(event) =>
                      updateFilter("due", event.target.value as DueFilter)
                    }
                    options={[
                      { value: "all", label: t.invoices.filter.allDue },
                      { value: "late", label: t.invoices.filter.late },
                      { value: "today", label: t.invoices.filter.dueToday },
                      { value: "week", label: t.invoices.filter.dueThisWeek },
                    ]}
                    fullWidth
                  />

                  <Select
                    label={t.invoices.filter.paymentMethod}
                    value={filters.paymentMethod}
                    onChange={(event) =>
                      updateFilter(
                        "paymentMethod",
                        event.target.value as FilterState["paymentMethod"]
                      )
                    }
                    options={[
                      { value: "all", label: t.invoices.filter.allMethods },
                      { value: "Cash", label: t.invoices.methods.cash },
                      { value: "Card", label: t.invoices.methods.card },
                      { value: "Bank Transfer", label: t.invoices.methods.bankTransfer },
                    ]}
                    fullWidth
                  />

                  <div className="filter-two-cols">
                    <Input
                      label={t.invoices.filter.minAmount}
                      variant="number"
                      min="0"
                      value={filters.minAmount}
                      onChange={(event) => updateFilter("minAmount", event.target.value)}
                      placeholder="0"
                      fullWidth
                    />

                    <Input
                      label={t.invoices.filter.maxAmount}
                      variant="number"
                      min="0"
                      value={filters.maxAmount}
                      onChange={(event) => updateFilter("maxAmount", event.target.value)}
                      placeholder={t.invoices.filter.anyPlaceholder}
                      fullWidth
                    />
                  </div>

                  <Select
                    label={t.invoices.filter.sortBy}
                    value={filters.sortBy}
                    onChange={(event) =>
                      updateFilter("sortBy", event.target.value as SortKey)
                    }
                    options={[
                      { value: "newest", label: t.invoices.filter.newest },
                      { value: "oldest", label: t.invoices.filter.oldest },
                      { value: "dueSoon", label: t.invoices.filter.dueSoon },
                      { value: "amountHigh", label: t.invoices.filter.amountHigh },
                      { value: "amountLow", label: t.invoices.filter.amountLow },
                      { value: "amountDueHigh", label: t.invoices.filter.amountDueHigh },
                    ]}
                    fullWidth
                  />

                  <div className="invoice-filter-actions">
                    <Button variant="secondary" onClick={resetFilters}>{t.common.reset}</Button>
                    <Button variant="primary" onClick={() => setShowFilterMenu(false)}>{t.common.apply}</Button>
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* ── Table card ──────────────────────────── */}
        <div className="inv-table-card">
          <div className="inv-table-header">
            <h2>{TAB_CONFIG[activeTab].tableTitle}</h2>
            <span className="inv-table-total">{money(summary.amountDue)}</span>
          </div>

            <div className="invoice-table-wrap app-table-wrap">
              <table className="invoice-table app-data-table">
                <thead>
                  <tr>
                    <th>{t.invoices.cols.invoice}</th>
                    <th>{getPartyLabel(activeTab, t)}</th>
                    <th>{t.invoices.cols.product}</th>
                    <th>{t.invoices.cols.issueDate}</th>
                    <th>{t.invoices.cols.total}</th>
                    <th>{t.invoices.cols.amountDue}</th>
                    <th>{activeTab === "internal" ? t.invoices.cols.approval : t.invoices.cols.status}</th>
                    <th>{t.invoices.cols.actions}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((invoice) => {
                      const late = isLate(invoice);
                      const firstItem = invoice.items[0];

                      return (
                        <tr
                          key={invoice.id}
                          className={`${late ? "is-overdue" : ""} row-clickable`}
                        >
                          <td>
                            <div className="invoice-id-cell app-cell-stack">
                              <strong>{invoice.id}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="party-cell">
                              <strong>{invoice.partyName}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="party-cell">
                              <strong>{firstItem?.label ?? t.invoices.noProduct}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="due-date-cell">
                              <strong>{formatDate(invoice.issueDate)}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="amount-cell">
                              <strong>{money(invoice.totalAmount, invoice.currency)}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="amount-cell amount-cell-emphasis">
                              <strong>{money(invoice.remainingAmount, invoice.currency)}</strong>
                            </div>
                          </td>

                          <td>
                            {activeTab === "internal" ? (
                              <div className="status-stack">
                                <Badge
                                  variant={invoice.approvedBy ? "success" : "warning"}
                                  className={`status-pill ${invoice.approvedBy ? "approved" : "pending-approval"}`}
                                >
                                  {invoice.approvedBy ? t.invoices.status.approved : t.invoices.status.needsApproval}
                                </Badge>
                              </div>
                            ) : (
                              <Badge
                                variant={
                                  late
                                    ? "danger"
                                    : invoice.status === "Paid"
                                    ? "success"
                                    : invoice.status === "Partial"
                                    ? "info"
                                    : "warning"
                                }
                                className={`status-pill ${late ? "overdue" : invoice.status.toLowerCase()}`}
                              >
                                {late ? t.invoices.status.late : invoice.status}
                              </Badge>
                            )}
                          </td>

                          <td>
                            <div className="row-actions">
                              <Button
                                variant="icon"
                                size="sm"
                                className="inv-action-btn view"
                                title={t.common.view}
                                onClick={() => setDetailInvoice(invoice)}
                              >
                                <Eye size={15} />
                              </Button>

                              <Button
                                variant="icon"
                                size="sm"
                                className="inv-action-btn edit"
                                title={t.common.edit}
                                onClick={() => openEditModal(invoice)}
                              >
                                <Pencil size={15} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <FileText size={34} />
                          <h3>{t.invoices.noInvoices}</h3>

                          <Button
                            variant="primary"
                            onClick={() => openAddModal(activeTab)}
                            leftIcon={<Plus size={16} />}
                            className="primary-action"
                          >
                            {t.invoices.addInvoice}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          <div className="inv-table-footer">
            <span>
              {t.invoices.showing} {filteredRecords.length} {filteredRecords.length === 1 ? t.invoices.invoice : t.invoices.invoices}
            </span>
          </div>
        </div>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={requestCloseFormModal}
        title={formMode === "add" ? t.invoices.form.createTitle : t.invoices.form.editTitle}
        size="lg"
        className="modal-card invoice-centered-modal"
        footer={
          <>
            <Button variant="secondary" onClick={requestCloseFormModal} className="secondary-action">
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="invoice-form"
              leftIcon={<Check size={16} />}
              className="primary-action"
            >
              {t.common.save}
            </Button>
          </>
        }
      >
              <form id="invoice-form" onSubmit={saveInvoice} autoComplete="off">
                <Input
                  variant="text"
                  name="fakeInvoiceUserField"
                  autoComplete="username"
                  tabIndex={-1}
                  className="browser-autofill-decoy"
                />

                <Input
                  variant="password"
                  name="fakeInvoicePasswordField"
                  autoComplete="new-password"
                  tabIndex={-1}
                  className="browser-autofill-decoy"
                />

                <div className="modal-body">
                  <div className="invoice-form-main">
                    <section className="form-cluster">
                      <div className="form-grid form-grid-top">
                        <label className="field-stack">
                          <span>{t.invoices.form.type}</span>
                          <select
                            name="type"
                            value={formState.type}
                            onChange={handleFormChange}
                            autoComplete="off"
                          >
                            <option value="customer">{t.invoices.tabs.customer}</option>
                            <option value="supplier">{t.invoices.tabs.supplier}</option>
                            <option value="internal">{t.invoices.tabs.internal}</option>
                          </select>
                        </label>

                        <label className="field-stack">
                          <span>{t.invoices.form.title}</span>
                          <input
                            name="invoiceTitleNoAutofill"
                            autoComplete="off"
                            value={formState.title}
                            onChange={(event) =>
                              setFormState((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                            required
                          />
                        </label>

                        <label className="field-stack">
                          <span>{t.invoices.form.issueDate}</span>
                          <input
                            type="date"
                            name="issueDate"
                            value={formState.issueDate}
                            onChange={handleFormChange}
                            autoComplete="off"
                            required
                          />
                        </label>
                      </div>

                      <div className="form-grid form-grid-inline">
                        {formState.type === "customer" ? (
                          <div className="field-stack smart-customer-field" ref={customerMenuRef}>
                            <span>{t.invoices.form.customer}</span>

                            <div className="smart-combobox">
                              <Search size={15} />
                              <input
                                id="invoiceCustomerSearchBox"
                                name="customerPickerNoBrowserAutofillV10"
                                type="search"
                                inputMode="search"
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                value={customerSearch}
                                onChange={(event) => {
                                  setCustomerSearch(event.target.value);
                                  setShowCustomerMenu(true);
                                  setFormState((current) => ({
                                    ...current,
                                    customerId: "",
                                    partyName: event.target.value,
                                    partySubtext: "",
                                  }));
                                }}
                                onFocus={() => setShowCustomerMenu(true)}
                                placeholder={t.invoices.form.searchCustomer}
                                required
                              />
                            </div>

                            {showCustomerMenu && (
                              <div className="smart-customer-menu">
                                {filteredCustomerOptions.length > 0 ? (
                                  filteredCustomerOptions.map((customer) => (
                                    <button
                                      key={customer.id}
                                      type="button"
                                      onClick={() => selectCustomer(customer)}
                                    >
                                      <strong>{customer.name}</strong>
                                      <span>
                                        {customer.email || customer.phone || t.invoices.form.noContactInfo}
                                      </span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="smart-customer-empty">
                                    {t.invoices.form.noCustomers}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : formState.type === "supplier" ? (
                          <label className="field-stack">
                            <span>{t.invoices.form.supplier}</span>
                            <select
                              name="supplierPickerNoBrowserAutofill"
                              value={formState.supplierId}
                              autoComplete="off"
                              onChange={(event) => {
                                const supplier = supplierOptions.find(
                                  (item) => item.id === event.target.value
                                );

                                setFormState((current) => ({
                                  ...current,
                                  supplierId: event.target.value,
                                  partyName: supplier?.name ?? "",
                                  partySubtext: supplier?.email ?? "",
                                }));
                              }}
                              required
                            >
                              <option value="">{t.invoices.form.selectSupplier}</option>
                              {supplierOptions.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <label className="field-stack">
                            <span>{t.invoices.form.department}</span>
                            <input
                              name="partyName"
                              value={formState.partyName}
                              onChange={handleFormChange}
                              autoComplete="off"
                              required
                            />
                          </label>
                        )}
                      </div>
                    </section>

                    <section className="form-cluster">
                      <div className="form-grid form-grid-financial">
                        <label className="field-stack">
                          <span>{t.invoices.form.product}</span>
                          <select
                            name="productId"
                            value={formState.productId}
                            onChange={handleFormChange}
                            autoComplete="off"
                            required
                          >
                            <option value="">{t.invoices.form.selectProduct}</option>
                            {productOptions.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {money(product.price, formState.currency)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field-stack">
                          <span>{t.invoices.form.quantity}</span>
                          <input
                            name="quantity"
                            type="number"
                            min="1"
                            value={formState.quantity}
                            onChange={handleFormChange}
                            autoComplete="off"
                            required
                          />
                        </label>

                        <label className="field-stack">
                          <span>{t.invoices.form.unitPrice}</span>
                          <input
                            name="unitPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formState.unitPrice}
                            readOnly
                            className="readonly-field"
                            autoComplete="off"
                          />
                        </label>

                        <label className="field-stack">
                          <span>{t.invoices.form.paidAmount}</span>
                          <input
                            name="paidAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formState.paidAmount}
                            onChange={handleFormChange}
                            autoComplete="off"
                          />
                        </label>

                        <label className="field-stack">
                          <span>{t.invoices.form.currency}</span>
                          <select
                            name="currency"
                            value={formState.currency}
                            onChange={handleFormChange}
                            autoComplete="off"
                          >
                            <option value="ILS">ILS</option>
                            <option value="USD">USD</option>
                            <option value="JOD">JOD</option>
                          </select>
                        </label>

                        <label className="field-stack">
                          <span>{t.invoices.form.paymentMethod}</span>
                          <select
                            name="paymentMethod"
                            value={formState.paymentMethod}
                            onChange={handleFormChange}
                            autoComplete="off"
                          >
                            <option value="Cash">{t.invoices.methods.cash}</option>
                            <option value="Card">{t.invoices.methods.card}</option>
                            <option value="Bank Transfer">{t.invoices.methods.bankTransfer}</option>
                          </select>
                        </label>
                      </div>

                      {/* VAT toggle */}
                      <div className="invoice-vat-row">
                        <label className="invoice-vat-toggle">
                          <input
                            type="checkbox"
                            checked={formState.vatEnabled}
                            onChange={(e) => setFormState((s) => ({ ...s, vatEnabled: e.target.checked }))}
                          />
                          <span>{t.invoices.form.vatEnabled}</span>
                        </label>
                        {formState.vatEnabled && (
                          <label className="invoice-vat-rate-label">
                            <span>%</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              className="invoice-vat-rate-input"
                              value={formState.vatRate}
                              onChange={(e) => setFormState((s) => ({ ...s, vatRate: e.target.value }))}
                            />
                          </label>
                        )}
                      </div>

                      <div className="invoice-auto-price-box">
                        <div>
                          <span>{t.invoices.form.subtotal}</span>
                          <strong>
                            {money(
                              normalizeNumber(formState.quantity) *
                                normalizeNumber(formState.unitPrice),
                              formState.currency
                            )}
                          </strong>
                        </div>

                        {formState.vatEnabled && (
                          <div>
                            <span>{t.invoices.form.vatLine} {formState.vatRate}%</span>
                            <strong>
                              {money(
                                Math.round(
                                  normalizeNumber(formState.quantity) *
                                    normalizeNumber(formState.unitPrice) *
                                    normalizeNumber(formState.vatRate)
                                ) / 100,
                                formState.currency
                              )}
                            </strong>
                          </div>
                        )}

                        <div>
                          <span>{t.invoices.form.total}</span>
                          <strong>
                            {money(
                              (() => {
                                const sub = normalizeNumber(formState.quantity) * normalizeNumber(formState.unitPrice);
                                const vat = formState.vatEnabled ? Math.round(sub * normalizeNumber(formState.vatRate)) / 100 : 0;
                                return sub + vat;
                              })(),
                              formState.currency
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>{t.invoices.form.paid}</span>
                          <strong>{money(normalizeNumber(formState.paidAmount), formState.currency)}</strong>
                        </div>

                        <div>
                          <span>{t.invoices.form.amountDue}</span>
                          <strong>
                            {money(
                              Math.max(
                                (() => {
                                  const sub = normalizeNumber(formState.quantity) * normalizeNumber(formState.unitPrice);
                                  const vat = formState.vatEnabled ? Math.round(sub * normalizeNumber(formState.vatRate)) / 100 : 0;
                                  return sub + vat;
                                })() - normalizeNumber(formState.paidAmount),
                                0
                              ),
                              formState.currency
                            )}
                          </strong>
                        </div>
                      </div>
                    </section>

                    {formState.type === "internal" && (
                      <section className="form-cluster">
                        <div className="form-grid">
                          <label className="field-stack">
                            <span>{t.invoices.form.department}</span>
                            <input
                              name="department"
                              value={formState.department}
                              onChange={handleFormChange}
                              autoComplete="off"
                            />
                          </label>

                          <label className="field-stack">
                            <span>{t.invoices.form.category}</span>
                            <input
                              name="category"
                              value={formState.category}
                              onChange={handleFormChange}
                              autoComplete="off"
                            />
                          </label>

                          <label className="field-stack">
                            <span>{t.invoices.form.priorityLabel}</span>
                            <select
                              name="priority"
                              value={formState.priority}
                              onChange={handleFormChange}
                              autoComplete="off"
                            >
                              <option value="Low">{t.invoices.priority.low}</option>
                              <option value="Medium">{t.invoices.priority.medium}</option>
                              <option value="High">{t.invoices.priority.high}</option>
                              <option value="Critical">{t.invoices.priority.critical}</option>
                            </select>
                          </label>

                          <label className="field-stack">
                            <span>{t.invoices.form.approvedBy}</span>
                            <input
                              name="approvedBy"
                              value={formState.approvedBy}
                              onChange={handleFormChange}
                              autoComplete="off"
                            />
                          </label>
                        </div>
                      </section>
                    )}

                    <section className="form-cluster">
                      <div className="form-grid">
                        <label className="field-stack full">
                          <span>{t.invoices.form.notes}</span>
                          <textarea
                            name="notes"
                            value={formState.notes}
                            onChange={handleFormChange}
                            rows={3}
                            autoComplete="off"
                          />
                        </label>
                      </div>
                    </section>

                    {formMode === "edit" && (
                      <section className="form-cluster edit-delete-zone">
                        <div className="edit-delete-zone-head">
                          <div>
                            <h3>{t.invoices.delete.title}</h3>
                            <p>{t.invoices.delete.hint}</p>
                          </div>
                        </div>

                        <div className="edit-delete-grid">
                          <input
                            value={editDeleteCode}
                            onChange={(event) => {
                              setEditDeleteCode(event.target.value);
                              setEditDeleteError("");
                            }}
                            placeholder={t.invoices.delete.placeholder}
                            autoComplete="off"
                          />

                          <button type="button" className="danger-action" onClick={requestDeleteFromEdit}>
                            <Trash2 size={16} />
                            {t.invoices.delete.confirmBtn}
                          </button>
                        </div>

                        {editDeleteError && <p className="confirm-error">{editDeleteError}</p>}
                      </section>
                    )}
                  </div>
                </div>
              </form>
      </Modal>

      {detailInvoice && (
        <ModalPortal>
          <div className="overlay-shell modal-center-shell" onClick={() => setDetailInvoice(null)}>
            <div
              className="modal-card invoice-detail-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>{detailInvoice.id}</h2>
                </div>

                <button
                  type="button"
                  className="icon-close"
                  onClick={() => setDetailInvoice(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="drawer-grid">
                  <section className="info-card">
                    <h3>{t.invoices.detail.invoiceSection}</h3>

                    <dl>
                      <div>
                        <dt>{t.invoices.detail.type}</dt>
                        <dd>{TAB_CONFIG[detailInvoice.type].label}</dd>
                      </div>

                      <div>
                        <dt>{getPartyLabel(detailInvoice.type, t)}</dt>
                        <dd>{detailInvoice.partyName}</dd>
                      </div>

                      <div>
                        <dt>{t.invoices.detail.status}</dt>
                        <dd>{isLate(detailInvoice) ? t.invoices.status.late : detailInvoice.status}</dd>
                      </div>

                      <div>
                        <dt>{t.invoices.detail.issueDate}</dt>
                        <dd>{formatDate(detailInvoice.issueDate)}</dd>
                      </div>

                      <div>
                        <dt>{t.invoices.detail.payment}</dt>
                        <dd>{paymentLabel(detailInvoice.paymentMethod, t)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="info-card">
                    <h3>{t.invoices.detail.amountsSection}</h3>

                    <dl>
                      <div>
                        <dt>{t.invoices.detail.total}</dt>
                        <dd>{money(detailInvoice.totalAmount, detailInvoice.currency)}</dd>
                      </div>

                      <div>
                        <dt>{t.invoices.detail.paid}</dt>
                        <dd>{money(detailInvoice.paidAmount, detailInvoice.currency)}</dd>
                      </div>

                      <div>
                        <dt>{t.invoices.detail.amountDue}</dt>
                        <dd>{money(detailInvoice.remainingAmount, detailInvoice.currency)}</dd>
                      </div>

                      <div>
                        <dt>{t.invoices.detail.linkedRecord}</dt>
                        <dd>{detailInvoice.linkedRecord}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="info-card full">
                    <h3>{t.invoices.detail.productSection}</h3>

                    <dl>
                      {detailInvoice.items.map((item) => (
                        <div key={item.id}>
                          <dt>{item.label}</dt>
                          <dd>
                            {item.quantity} × {money(item.unitPrice, detailInvoice.currency)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  {detailInvoice.notes && (
                    <section className="info-card full">
                      <h3>{t.invoices.detail.notesSection}</h3>
                      <p>{detailInvoice.notes}</p>
                    </section>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setDetailInvoice(null)}
                >
                  {t.invoices.detail.close}
                </button>

                {detailInvoice.status !== "Paid" && (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => markAsPaid(detailInvoice)}
                  >
                    <Check size={16} />
                    {t.invoices.detail.markPaid}
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showDiscardConfirm && (
        <ModalPortal>
          <div className="overlay-shell modal-center-shell" onClick={keepEditing}>
            <div
              className="modal-card discard-confirm-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="discard-confirm-icon">
                <X size={22} />
              </div>

              <div className="discard-confirm-content">
                <h2>{t.invoices.discard.title}</h2>
                <p>{t.invoices.discard.text}</p>
              </div>

              <div className="discard-confirm-actions">
                <button type="button" className="secondary-action" onClick={keepEditing}>
                  {t.invoices.discard.continueEditing}
                </button>

                <button type="button" className="danger-action" onClick={confirmDiscardChanges}>
                  {t.invoices.discard.discard}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {toast && (
        <ModalPortal>
          <div className="toast-shell">
            <div className="toast-card">
              <Check size={18} />
              <span>{toast}</span>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
