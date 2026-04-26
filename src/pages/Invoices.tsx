import "./Invoices.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import {
  BadgeDollarSign,
  Building2,
  Check,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Save,
  Search,
  StickyNote,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import OverflowContent from "../components/ui/OverflowContent";
import TableFooter from "../components/ui/TableFooter";
import {
  getCustomers,
  getEmployees,
  getProducts,
  getPurchases,
  getSuppliers,
} from "../data/storage";
import type { Customer, Employee, Product, Purchase, Supplier } from "../data/types";

type TabKey = "customer" | "internal" | "supplier";
type InvoiceStatus =
  | "Paid"
  | "Partial"
  | "Unpaid";
type PaymentMethod =
  | "Bank Transfer"
  | "Cash"
  | "Card"
  | "Wire"
  | "Credit"
  | "Internal Transfer";
type Priority = "Low" | "Medium" | "High" | "Critical";
type Confidentiality = "Standard" | "Sensitive" | "Restricted";
type DetailTab = "overview" | "items" | "payments" | "notes" | "attachments" | "history";

type ActionMenuState = {
  id: string;
  top: number;
  left: number;
  placement: "down" | "up";
};

type NoteEntry = {
  id: string;
  author: string;
  createdAt: string;
  content: string;
};

type PaymentEntry = {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  status: "Paid" | "Partial" | "Pending";
  reference: string;
};

type ActivityEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
};

type InvoiceLine = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type InvoiceRecord = {
  id: string;
  type: TabKey;
  customerId?: string;
  supplierId?: string;
  title: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  lastUpdated: string;
  createdBy: string;
  updatedBy: string;
  attachments: string[];
  notesPreview: string;
  notesList: NoteEntry[];
  items: InvoiceLine[];
  paymentHistory: PaymentEntry[];
  activity: ActivityEntry[];
  linkedRecord: string;
  description: string;
  salesRepresentative?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  billingAddress?: string;
  linkedOrderNumber?: string;
  vendor?: string;
  department?: string;
  category?: string;
  requester?: string;
  approvedBy?: string;
  relatedProject?: string;
  costCenter?: string;
  priority?: Priority;
  confidentiality?: Confidentiality;
  internalNotes?: string;
  supplierName?: string;
  supplierCode?: string;
  supplierCompanyName?: string;
  supplierContactPerson?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierAddress?: string;
  taxNumber?: string;
  purchaseOrderReference?: string;
  deliveryNoteReference?: string;
  paymentTerms?: string;
  supplierRating?: number;
  latestNote?: string;
};

type InvoiceFormState = {
  id?: string;
  type: TabKey;
  customerId: string;
  supplierId: string;
  title: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  itemsText: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  tax: string;
  shipping: string;
  paidAmount: string;
  linkedRecord: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  billingAddress: string;
  salesRepresentative: string;
  linkedOrderNumber: string;
  department: string;
  category: string;
  requester: string;
  approvedBy: string;
  relatedProject: string;
  vendor: string;
  costCenter: string;
  priority: Priority;
  confidentiality: Confidentiality;
  internalNotes: string;
  supplierName: string;
  supplierCode: string;
  supplierCompanyName: string;
  supplierContactPerson: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierAddress: string;
  taxNumber: string;
  purchaseOrderReference: string;
  deliveryNoteReference: string;
  paymentTerms: string;
  supplierRating: string;
};

type FilterState = {
  search: string;
  status: string;
  paymentMethod: string;
  dateRange: string;
  dueDate: string;
  amountRange: string;
  overdueOnly: boolean;
  incompleteOnly: boolean;
  customer: string;
  salesRepresentative: string;
  department: string;
  category: string;
  priority: string;
  confidentiality: string;
  approvalStatus: string;
  paymentStatus: string;
  costCenter: string;
  relatedProject: string;
  supplier: string;
  supplierCode: string;
  paymentTerms: string;
  currency: string;
  linkedPurchaseRecord: string;
  supplierRating: string;
};

type PendingSaveState = {
  mode: "add" | "edit";
  title: string;
  message: string;
} | null;

type FilterKey = keyof FilterState;

const STORAGE_KEY = "dashboard_advanced_invoice_management_v1";
const DEFAULT_ITEMS_PER_PAGE = 5;
const TODAY = new Date().toISOString().split("T")[0];

const TAB_CONFIG: Record<
  TabKey,
  {
    label: string;
    subtitle: string;
    icon: typeof Users;
    accent: string;
  }
> = {
  customer: {
    label: "Customer Invoices",
    subtitle: "Track receivables, follow up collections, and review customer notes.",
    icon: Users,
    accent: "blue",
  },
  internal: {
    label: "Internal Invoices",
    subtitle: "Review internal costs, approvals, and company expense requests.",
    icon: Building2,
    accent: "slate",
  },
  supplier: {
    label: "Supplier Invoices",
    subtitle: "Manage payables, supplier terms, and linked purchase records.",
    icon: Truck,
    accent: "amber",
  },
};

const EMPTY_FILTERS: FilterState = {
  search: "",
  status: "",
  paymentMethod: "",
  dateRange: "",
  dueDate: "",
  amountRange: "",
  overdueOnly: false,
  incompleteOnly: false,
  customer: "",
  salesRepresentative: "",
  department: "",
  category: "",
  priority: "",
  confidentiality: "",
  approvalStatus: "",
  paymentStatus: "",
  costCenter: "",
  relatedProject: "",
  supplier: "",
  supplierCode: "",
  paymentTerms: "",
  currency: "",
  linkedPurchaseRecord: "",
  supplierRating: "",
};

const EMPTY_FORM: InvoiceFormState = {
  type: "customer",
  customerId: "",
  supplierId: "",
  title: "",
  issueDate: TODAY,
  dueDate: TODAY,
  currency: "USD",
  status: "Unpaid",
  paymentMethod: "Bank Transfer",
  itemsText: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
  tax: "0",
  shipping: "0",
  paidAmount: "0",
  linkedRecord: "",
  description: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  billingAddress: "",
  salesRepresentative: "",
  linkedOrderNumber: "",
  department: "",
  category: "",
  requester: "",
  approvedBy: "",
  relatedProject: "",
  vendor: "",
  costCenter: "",
  priority: "Medium",
  confidentiality: "Standard",
  internalNotes: "",
  supplierName: "",
  supplierCode: "",
  supplierCompanyName: "",
  supplierContactPerson: "",
  supplierPhone: "",
  supplierEmail: "",
  supplierAddress: "",
  taxNumber: "",
  purchaseOrderReference: "",
  deliveryNoteReference: "",
  paymentTerms: "",
  supplierRating: "4",
};

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function normalizeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function titleForType(type: TabKey) {
  if (type === "customer") return "Customer Invoice";
  if (type === "internal") return "Internal Invoice";
  return "Supplier Invoice";
}

function statusFromAmounts(paid: number, total: number) {
  if (paid >= total && total > 0) return "Paid";
  if (paid > 0 && paid < total) return "Partial";
  return "Unpaid";
}

function buildLines(itemsText: string, quantity: number, unitPrice: number) {
  return itemsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `line-${index + 1}-${label.replace(/\s+/g, "-").toLowerCase()}`,
      label,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    }));
}

function makeNote(author: string, content: string, id: string): NoteEntry {
  return {
    id,
    author,
    createdAt: new Date().toISOString(),
    content,
  };
}

function makeActivity(actor: string, action: string, id: string): ActivityEntry {
  return {
    id,
    actor,
    action,
    timestamp: new Date().toISOString(),
  };
}

function seedInvoices(
  customers: Customer[],
  suppliers: Supplier[],
  products: Product[],
  employees: Employee[]
): InvoiceRecord[] {
  const customerA = customers[0];
  const customerB = customers[1] ?? customers[0];
  const supplierA = suppliers[0];
  const supplierB = suppliers[1] ?? suppliers[0];
  const seller = employees[0]?.name ?? "Sales Desk";
  const approver = employees[1]?.name ?? employees[0]?.name ?? "Finance Manager";
  const requester = employees[2]?.name ?? "Operations Team";

  const customerItemsA = buildLines(
    `${products[0]?.name ?? "Premium Package"}, ${products[1]?.name ?? "Support Plan"}`,
    2,
    180
  );
  const customerItemsB = buildLines(
    `${products[2]?.name ?? "Consulting Session"}, ${products[3]?.name ?? "Hardware Upgrade"}`,
    1,
    240
  );
  const internalItems = buildLines("Cloud Subscription, Office Maintenance", 1, 420);
  const supplierItemsA = buildLines(
    `${products[0]?.name ?? "Inventory Batch"}, Packaging Materials`,
    4,
    95
  );
  const supplierItemsB = buildLines("Shipping Services, Spare Parts", 3, 130);

  return [
    {
      id: "CINV-2401",
      type: "customer",
      customerId: customerA?.id,
      title: "Enterprise onboarding package",
      status: "Partial",
      issueDate: "2026-04-08",
      dueDate: "2026-04-24",
      currency: "USD",
      subtotal: 720,
      discount: 35,
      tax: 58,
      shipping: 0,
      totalAmount: 743,
      paidAmount: 420,
      remainingAmount: 323,
      paymentMethod: "Bank Transfer",
      lastUpdated: "2026-04-21T09:40:00.000Z",
      createdBy: seller,
      updatedBy: "Finance Team",
      attachments: ["contract.pdf", "delivery-note.pdf"],
      notesPreview: "Client requested split payment and priority onboarding.",
      latestNote: "Awaiting final transfer after implementation sign-off.",
      notesList: [
        makeNote("Nour", "Client requested split payment and priority onboarding.", "n1"),
        makeNote("Finance Team", "Awaiting final transfer after implementation sign-off.", "n2"),
      ],
      items: customerItemsA,
      paymentHistory: [
        {
          id: "pay-1",
          date: "2026-04-10",
          amount: 220,
          method: "Bank Transfer",
          status: "Paid",
          reference: "BT-20991",
        },
        {
          id: "pay-2",
          date: "2026-04-16",
          amount: 200,
          method: "Card",
          status: "Partial",
          reference: "CC-44092",
        },
      ],
      activity: [
        makeActivity(seller, "Created invoice", "a1"),
        makeActivity("Finance Team", "Recorded first payment", "a2"),
        makeActivity("Finance Team", "Added client follow-up note", "a3"),
      ],
      linkedRecord: "SO-55391",
      description: "Full customer invoice with onboarding, setup, and support items.",
      customerName: customerA?.name ?? "Blue Horizon LLC",
      customerPhone: customerA?.phone ?? "+970 599 000 221",
      customerEmail: customerA?.email ?? "finance@bluehorizon.com",
      billingAddress: customerA?.address ?? "Ramallah, Al-Masyoun district",
      salesRepresentative: seller,
      linkedOrderNumber: "ORD-10812",
    },
    {
      id: "CINV-2402",
      type: "customer",
      customerId: customerB?.id,
      title: "Retail branch upgrade",
      status: "Unpaid",
      issueDate: "2026-03-28",
      dueDate: "2026-04-12",
      currency: "USD",
      subtotal: 480,
      discount: 0,
      tax: 38,
      shipping: 25,
      totalAmount: 543,
      paidAmount: 0,
      remainingAmount: 543,
      paymentMethod: "Credit",
      lastUpdated: "2026-04-20T13:10:00.000Z",
      createdBy: seller,
      updatedBy: "Collections Team",
      attachments: ["quotation.pdf"],
      notesPreview: "Customer promised settlement next week.",
      latestNote: "Marked overdue and escalated to collections team.",
      notesList: [
        makeNote("Maya", "Customer promised settlement next week.", "n3"),
        makeNote("Collections Team", "Marked overdue and escalated to collections team.", "n4"),
      ],
      items: customerItemsB,
      paymentHistory: [],
      activity: [
        makeActivity(seller, "Created invoice", "a4"),
        makeActivity("Collections Team", "Flagged overdue", "a5"),
      ],
      linkedRecord: "SO-55392",
      description: "Hardware and consulting services delivered to retail branch.",
      customerName: customerB?.name ?? "Atlas Retail",
      customerPhone: customerB?.phone ?? "+970 599 100 772",
      customerEmail: customerB?.email ?? "ap@atlasretail.com",
      billingAddress: customerB?.address ?? "Nablus, Business Center",
      salesRepresentative: seller,
      linkedOrderNumber: "ORD-10831",
    },
    {
      id: "IINV-1107",
      type: "internal",
      title: "Q2 cloud and maintenance allocation",
      status: "Partial",
      issueDate: "2026-04-03",
      dueDate: "2026-04-29",
      currency: "USD",
      subtotal: 840,
      discount: 0,
      tax: 67,
      shipping: 0,
      totalAmount: 907,
      paidAmount: 450,
      remainingAmount: 457,
      paymentMethod: "Internal Transfer",
      lastUpdated: "2026-04-21T08:05:00.000Z",
      createdBy: requester,
      updatedBy: approver,
      attachments: ["approval.pdf", "service-agreement.pdf"],
      notesPreview: "Sensitive operational cost approved in two tranches.",
      latestNote: "Second tranche scheduled with treasury on April 25.",
      notesList: [
        makeNote("Operations", "Sensitive operational cost approved in two tranches.", "n5"),
        makeNote("Treasury", "Second tranche scheduled with treasury on April 25.", "n6"),
      ],
      items: internalItems,
      paymentHistory: [
        {
          id: "pay-3",
          date: "2026-04-07",
          amount: 450,
          method: "Internal Transfer",
          status: "Partial",
          reference: "TR-3304",
        },
      ],
      activity: [
        makeActivity(requester, "Submitted internal expense", "a6"),
        makeActivity(approver, "Approved expense", "a7"),
      ],
      linkedRecord: "OPS-2026-44",
      description: "Infrastructure and office services allocated to operations and IT.",
      department: "Operations",
      category: "Technical",
      requester,
      approvedBy: approver,
      relatedProject: "ERP Expansion",
      vendor: "Northern Cloud Services",
      costCenter: "CC-OPS-17",
      priority: "High",
      confidentiality: "Sensitive",
      internalNotes: "Budget approved under infrastructure uplift plan.",
    },
    {
      id: "IINV-1108",
      type: "internal",
      title: "Marketing launch media plan",
      status: "Unpaid",
      issueDate: "2026-04-18",
      dueDate: "2026-05-03",
      currency: "USD",
      subtotal: 530,
      discount: 20,
      tax: 41,
      shipping: 0,
      totalAmount: 551,
      paidAmount: 0,
      remainingAmount: 551,
      paymentMethod: "Bank Transfer",
      lastUpdated: "2026-04-21T15:40:00.000Z",
      createdBy: requester,
      updatedBy: "Marketing Lead",
      attachments: ["brief.docx"],
      notesPreview: "Awaiting final approval from brand committee.",
      latestNote: "Need confirmation on campaign channels before payment.",
      notesList: [
        makeNote("Marketing", "Awaiting final approval from brand committee.", "n7"),
        makeNote("Brand Office", "Need confirmation on campaign channels before payment.", "n8"),
      ],
      items: buildLines("Campaign Media Buying, Creative Production", 1, 265),
      paymentHistory: [],
      activity: [
        makeActivity(requester, "Prepared draft invoice", "a8"),
      ],
      linkedRecord: "MKT-INIT-12",
      description: "Internal launch cost draft awaiting approval.",
      department: "Marketing",
      category: "Marketing",
      requester: "Brand Office",
      approvedBy: "",
      relatedProject: "Summer Launch",
      vendor: "Media House",
      costCenter: "CC-MKT-12",
      priority: "Medium",
      confidentiality: "Standard",
      internalNotes: "Will move to approved status once committee signs off.",
    },
    {
      id: "SINV-8801",
      type: "supplier",
      supplierId: supplierA?.id,
      title: "Inventory replenishment batch",
      status: "Unpaid",
      issueDate: "2026-04-11",
      dueDate: "2026-04-27",
      currency: "USD",
      subtotal: 760,
      discount: 40,
      tax: 52,
      shipping: 35,
      totalAmount: 807,
      paidAmount: 0,
      remainingAmount: 807,
      paymentMethod: "Wire",
      lastUpdated: "2026-04-20T11:50:00.000Z",
      createdBy: "Procurement Team",
      updatedBy: "Procurement Team",
      attachments: ["po-4407.pdf", "customs.pdf"],
      notesPreview: "Supplier requested earlier release due to shipment schedule.",
      latestNote: "Vendor rating remains high, delivery on track.",
      notesList: [
        makeNote("Procurement", "Supplier requested earlier release due to shipment schedule.", "n9"),
        makeNote("Procurement", "Vendor rating remains high, delivery on track.", "n10"),
      ],
      items: supplierItemsA,
      paymentHistory: [],
      activity: [
        makeActivity("Procurement Team", "Registered supplier invoice", "a9"),
      ],
      linkedRecord: "PUR-2026-4407",
      description: "Procurement invoice linked to replenishment stock order.",
      supplierName: supplierA?.name ?? "East Supply",
      supplierCode: "SUP-101",
      supplierCompanyName: "East Supply Co.",
      supplierContactPerson: "Lina Dawoud",
      supplierPhone: supplierA?.phone ?? "+970 599 670 220",
      supplierEmail: supplierA?.email ?? "accounting@eastsupply.com",
      supplierAddress: supplierA?.address ?? "Hebron Industrial Zone",
      taxNumber: "VAT-998210",
      purchaseOrderReference: "PO-4407",
      deliveryNoteReference: "DN-7781",
      paymentTerms: "Net 15",
      supplierRating: 4.8,
    },
    {
      id: "SINV-8802",
      type: "supplier",
      supplierId: supplierB?.id,
      title: "Logistics and spare parts",
      status: "Paid",
      issueDate: "2026-04-02",
      dueDate: "2026-04-15",
      currency: "USD",
      subtotal: 780,
      discount: 0,
      tax: 59,
      shipping: 20,
      totalAmount: 859,
      paidAmount: 859,
      remainingAmount: 0,
      paymentMethod: "Bank Transfer",
      lastUpdated: "2026-04-18T10:10:00.000Z",
      createdBy: "Procurement Team",
      updatedBy: "Accounts Payable",
      attachments: ["invoice.pdf", "delivery-confirmation.pdf", "receipt.pdf"],
      notesPreview: "Payment completed after delivery validation.",
      latestNote: "Reliable supplier with consistent lead times.",
      notesList: [
        makeNote("Accounts Payable", "Payment completed after delivery validation.", "n11"),
        makeNote("Procurement", "Reliable supplier with consistent lead times.", "n12"),
      ],
      items: supplierItemsB,
      paymentHistory: [
        {
          id: "pay-4",
          date: "2026-04-14",
          amount: 859,
          method: "Bank Transfer",
          status: "Paid",
          reference: "BT-99120",
        },
      ],
      activity: [
        makeActivity("Procurement Team", "Registered supplier invoice", "a10"),
        makeActivity("Accounts Payable", "Closed invoice as paid", "a11"),
      ],
      linkedRecord: "PUR-2026-4409",
      description: "Supplier invoice for delivered logistics and spare parts.",
      supplierName: supplierB?.name ?? "Prime Logistics",
      supplierCode: "SUP-102",
      supplierCompanyName: "Prime Logistics Ltd.",
      supplierContactPerson: "Omar Salem",
      supplierPhone: supplierB?.phone ?? "+970 599 450 711",
      supplierEmail: supplierB?.email ?? "billing@primelogistics.com",
      supplierAddress: supplierB?.address ?? "Jerusalem Road",
      taxNumber: "VAT-918822",
      purchaseOrderReference: "PO-4409",
      deliveryNoteReference: "DN-7795",
      paymentTerms: "Net 10",
      supplierRating: 4.3,
    },
  ];
}

function buildFormFromRecord(invoice: InvoiceRecord): InvoiceFormState {
  const firstItem = invoice.items[0];
  return {
    id: invoice.id,
    type: invoice.type,
    customerId: invoice.customerId ?? "",
    supplierId: invoice.supplierId ?? "",
    title: invoice.title,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    itemsText: invoice.items.map((item) => item.label).join(", "),
    quantity: String(firstItem?.quantity ?? 1),
    unitPrice: String(firstItem?.unitPrice ?? 0),
    discount: String(invoice.discount),
    tax: String(invoice.tax),
    shipping: String(invoice.shipping),
    paidAmount: String(invoice.paidAmount),
    linkedRecord: invoice.linkedRecord,
    description: invoice.description,
    customerName: invoice.customerName ?? "",
    customerPhone: invoice.customerPhone ?? "",
    customerEmail: invoice.customerEmail ?? "",
    billingAddress: invoice.billingAddress ?? "",
    salesRepresentative: invoice.salesRepresentative ?? "",
    linkedOrderNumber: invoice.linkedOrderNumber ?? "",
    department: invoice.department ?? "",
    category: invoice.category ?? "",
    requester: invoice.requester ?? "",
    approvedBy: invoice.approvedBy ?? "",
    relatedProject: invoice.relatedProject ?? "",
    vendor: invoice.vendor ?? "",
    costCenter: invoice.costCenter ?? "",
    priority: invoice.priority ?? "Medium",
    confidentiality: invoice.confidentiality ?? "Standard",
    internalNotes: invoice.internalNotes ?? "",
    supplierName: invoice.supplierName ?? "",
    supplierCode: invoice.supplierCode ?? "",
    supplierCompanyName: invoice.supplierCompanyName ?? "",
    supplierContactPerson: invoice.supplierContactPerson ?? "",
    supplierPhone: invoice.supplierPhone ?? "",
    supplierEmail: invoice.supplierEmail ?? "",
    supplierAddress: invoice.supplierAddress ?? "",
    taxNumber: invoice.taxNumber ?? "",
    purchaseOrderReference: invoice.purchaseOrderReference ?? "",
    deliveryNoteReference: invoice.deliveryNoteReference ?? "",
    paymentTerms: invoice.paymentTerms ?? "",
    supplierRating: String(invoice.supplierRating ?? 4),
  };
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function dueStateLabel(dueDate: string, remainingAmount: number, status: InvoiceStatus) {
  if (!dueDate) return "-";
  if (status === "Paid" || remainingAmount <= 0) return "Settled";

  const diffDays = Math.ceil(
    (new Date(dueDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

function dueStateTone(dueDate: string, remainingAmount: number, status: InvoiceStatus) {
  if (!dueDate || status === "Paid" || remainingAmount <= 0) return "settled";

  const diffDays = Math.ceil(
    (new Date(dueDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return "normal";
}

export default function Invoices() {
  const [customers] = useState<Customer[]>(() => getCustomers());
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());
  const [products] = useState<Product[]>(() => getProducts());
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [employees] = useState<Employee[]>(() => getEmployees());

  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("customer");
  const [filtersByTab, setFiltersByTab] = useState<Record<TabKey, FilterState>>({
    customer: { ...EMPTY_FILTERS },
    internal: { ...EMPTY_FILTERS },
    supplier: { ...EMPTY_FILTERS },
  });
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<InvoiceRecord | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formState, setFormState] = useState<InvoiceFormState>(EMPTY_FORM);
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [pendingSave, setPendingSave] = useState<PendingSaveState>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [noteTarget, setNoteTarget] = useState<InvoiceRecord | null>(null);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as InvoiceRecord[];
          setRecords(parsed);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
          setRecords(seedInvoices(customers, suppliers, products, employees));
        }
      } else {
        setRecords(seedInvoices(customers, suppliers, products, employees));
      }
      setViewError(null);
    } catch {
      setViewError("The invoice workspace could not be loaded. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [customers, employees, products, suppliers]);

  useEffect(() => {
    if (records.length === 0) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setActionMenu(null);
    setShowMoreFilters(false);
  }, [activeTab, filtersByTab]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!actionMenu) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (actionMenuRef.current?.contains(target)) return;
      setActionMenu(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActionMenu(null);
      }
    }

    function handleViewportChange() {
      setActionMenu(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [actionMenu]);

  const typedRecords = useMemo(
    () => records.filter((record) => record.type === activeTab),
    [activeTab, records]
  );

  const filters = filtersByTab[activeTab];

  const filteredRecords = useMemo(() => {
    return typedRecords.filter((record) => {
      const searchValue = filters.search.trim().toLowerCase();
      const isOverdue =
        record.remainingAmount > 0 &&
        record.dueDate < TODAY &&
        record.status !== "Paid";

      if (searchValue) {
        const haystack = [
          record.id,
          record.title,
          record.customerName,
          record.customerPhone,
          record.customerEmail,
          record.supplierName,
          record.supplierCompanyName,
          record.department,
          record.category,
          record.status,
          record.description,
          record.notesPreview,
          record.linkedRecord,
          record.linkedOrderNumber,
          record.purchaseOrderReference,
          record.taxNumber,
          record.items.map((item) => item.label).join(" "),
          record.latestNote ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchValue)) return false;
      }

      if (filters.status && record.status !== filters.status) return false;
      if (filters.paymentMethod && record.paymentMethod !== filters.paymentMethod) return false;
      if (filters.customer && record.customerName !== filters.customer) return false;
      if (filters.salesRepresentative && record.salesRepresentative !== filters.salesRepresentative) return false;
      if (filters.supplier && record.supplierName !== filters.supplier) return false;
      if (filters.supplierCode && record.supplierCode !== filters.supplierCode) return false;
      if (filters.department && record.department !== filters.department) return false;
      if (filters.category && record.category !== filters.category) return false;
      if (filters.priority && record.priority !== filters.priority) return false;
      if (filters.confidentiality && record.confidentiality !== filters.confidentiality) return false;
      if (
        filters.approvalStatus &&
        (filters.approvalStatus === "Approved" ? !record.approvedBy : Boolean(record.approvedBy))
      ) {
        return false;
      }
      if (filters.paymentStatus && record.status !== filters.paymentStatus) return false;
      if (filters.costCenter && record.costCenter !== filters.costCenter) return false;
      if (filters.relatedProject && record.relatedProject !== filters.relatedProject) return false;
      if (filters.paymentTerms && record.paymentTerms !== filters.paymentTerms) return false;
      if (filters.currency && record.currency !== filters.currency) return false;
      if (filters.linkedPurchaseRecord && record.linkedRecord !== filters.linkedPurchaseRecord) return false;
      if (filters.supplierRating) {
        const rating = Number(record.supplierRating || 0);
        if (filters.supplierRating === "4plus" && rating < 4) return false;
        if (filters.supplierRating === "3orless" && rating > 3) return false;
      }
      if (filters.overdueOnly && !isOverdue) return false;
      if (filters.incompleteOnly && record.remainingAmount <= 0) return false;

      if (filters.dateRange === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(record.issueDate) < sevenDaysAgo) return false;
      }

      if (filters.dateRange === "30d") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (new Date(record.issueDate) < thirtyDaysAgo) return false;
      }

      if (filters.dueDate === "overdue" && !isOverdue) return false;
      if (filters.dueDate === "7d") {
        const inSevenDays = new Date();
        inSevenDays.setDate(inSevenDays.getDate() + 7);
        if (new Date(record.dueDate) > inSevenDays) return false;
      }
      if (filters.dueDate === "30d") {
        const inThirtyDays = new Date();
        inThirtyDays.setDate(inThirtyDays.getDate() + 30);
        if (new Date(record.dueDate) > inThirtyDays) return false;
      }

      if (filters.amountRange === "lt500" && record.totalAmount >= 500) return false;
      if (
        filters.amountRange === "500to1000" &&
        (record.totalAmount < 500 || record.totalAmount > 1000)
      ) {
        return false;
      }
      if (filters.amountRange === "gt1000" && record.totalAmount <= 1000) return false;

      return true;
    });
  }, [filters, typedRecords]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const safePage = Math.min(page, pageCount);
  const paginatedRecords = filteredRecords.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const summary = useMemo(() => {
    const total = typedRecords.reduce((sum, record) => sum + record.totalAmount, 0);
    const remaining = typedRecords.reduce((sum, record) => sum + record.remainingAmount, 0);
    const overdue = typedRecords.filter(
      (record) =>
        record.remainingAmount > 0 &&
        record.dueDate < TODAY &&
        record.status !== "Paid"
    ).length;

    return {
      totalInvoices: typedRecords.length,
      totalAmount: total,
      remainingAmount: remaining,
      overdueInvoices: overdue,
    };
  }, [typedRecords]);

  const kpiCards = useMemo(() => {
    if (activeTab === "customer") {
      const collectedThisPeriod = typedRecords
        .filter((record) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return new Date(record.issueDate) >= thirtyDaysAgo;
        })
        .reduce((sum, record) => sum + record.paidAmount, 0);

      return [
        {
          title: "Total Receivables",
          value: money(summary.remainingAmount),
          helper: "",
          tone: "blue",
          icon: FileText,
        },
        {
          title: "Overdue Customer Invoices",
          value: String(summary.overdueInvoices),
          helper: "",
          tone: "amber",
          icon: Clock3,
        },
        {
          title: "Collected This Period",
          value: money(collectedThisPeriod),
          helper: "",
          tone: "green",
          icon: BadgeDollarSign,
        },
      ] as const;
    }

    if (activeTab === "internal") {
      const pendingApprovals = typedRecords.filter((record) => !record.approvedBy).length;
      const approvedAmount = typedRecords
        .filter((record) => Boolean(record.approvedBy))
        .reduce((sum, record) => sum + record.totalAmount, 0);

      return [
        {
          title: "Pending Approvals",
          value: String(pendingApprovals),
          helper: "",
          tone: "amber",
          icon: Clock3,
        },
        {
          title: "Approved Amount",
          value: money(approvedAmount),
          helper: "",
          tone: "green",
          icon: BadgeDollarSign,
        },
        {
          title: "Open Internal Expenses",
          value: money(summary.remainingAmount),
          helper: "",
          tone: "blue",
          icon: Building2,
        },
      ] as const;
    }

    const dueThisWeek = typedRecords.filter((record) => {
      if (record.remainingAmount <= 0 || record.status === "Paid") return false;
      const diffDays = Math.ceil(
        (new Date(record.dueDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    return [
      {
        title: "Total Payables",
        value: money(summary.remainingAmount),
        helper: "",
        tone: "blue",
        icon: Truck,
      },
      {
        title: "Due This Week",
        value: String(dueThisWeek),
        helper: "",
        tone: "amber",
        icon: Clock3,
      },
      {
        title: "Overdue Supplier Invoices",
        value: String(summary.overdueInvoices),
        helper: "",
        tone: "green",
        icon: BadgeDollarSign,
      },
    ] as const;
  }, [activeTab, summary.overdueInvoices, summary.remainingAmount, typedRecords]);

  const searchPlaceholder = useMemo(() => {
    if (activeTab === "customer") {
      return "Search by invoice number, customer, status, or note";
    }
    if (activeTab === "internal") {
      return "Search by invoice number, department, category, or note";
    }
    return "Search by invoice number, supplier, payment status, or note";
  }, [activeTab]);

  const decisionSummary = useMemo(() => {
    const dueSoonCount = typedRecords.filter((record) => {
      if (record.remainingAmount <= 0 || record.status === "Paid") return false;
      const diffDays = Math.ceil(
        (new Date(record.dueDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 0 && diffDays <= 1;
    }).length;

    if (activeTab === "customer") {
      if (summary.overdueInvoices > 0) {
        return `${summary.overdueInvoices} overdue invoice${summary.overdueInvoices === 1 ? "" : "s"}`;
      }
      if (dueSoonCount > 0) {
        return dueSoonCount === 1 ? "1 invoice due tomorrow" : `${dueSoonCount} invoices due within 24h`;
      }
      return `${money(summary.remainingAmount)} open balance`;
    }
    if (activeTab === "internal") {
      const pendingApprovals = typedRecords.filter((record) => !record.approvedBy).length;
      if (pendingApprovals > 0) {
        return `${pendingApprovals} pending approval`;
      }
      return `${money(summary.remainingAmount)} open expenses`;
    }

    const dueThisWeek = typedRecords.filter((record) => {
      if (record.remainingAmount <= 0 || record.status === "Paid") return false;
      const diffDays = Math.ceil(
        (new Date(record.dueDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    if (summary.overdueInvoices > 0) {
      return `${summary.overdueInvoices} overdue supplier invoice${summary.overdueInvoices === 1 ? "" : "s"}`;
    }
    if (dueThisWeek > 0) {
      return `${dueThisWeek} due this week`;
    }
    return `${money(summary.remainingAmount)} open payables`;
  }, [activeTab, summary.overdueInvoices, summary.remainingAmount, typedRecords]);

  const customerNames = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.customerName).filter(Boolean))).sort(),
    [records]
  );
  const supplierNames = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.supplierName).filter(Boolean))).sort(),
    [records]
  );
  const departments = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.department).filter(Boolean))).sort(),
    [records]
  );
  const categories = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.category).filter(Boolean))).sort(),
    [records]
  );
  const costCenters = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.costCenter).filter(Boolean))).sort(),
    [records]
  );
  const relatedProjects = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.relatedProject).filter(Boolean))).sort(),
    [records]
  );
  const linkedPurchaseRecords = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .filter((record) => record.type === "supplier")
            .map((record) => record.linkedRecord)
            .filter(Boolean)
        )
      ).sort(),
    [records]
  );

  const activeEmployees = useMemo(
    () => employees.filter((employee) => !employee.isDeleted),
    [employees]
  );

  const customerOptions = useMemo(
    () =>
      customers
        .filter((customer) => !customer.isDeleted)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [customers]
  );

  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((supplier) => !supplier.isDeleted)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const customerByName = useMemo(
    () => new Map(customerOptions.map((customer) => [customer.name, customer])),
    [customerOptions]
  );

  const supplierByName = useMemo(
    () => new Map(supplierOptions.map((supplier) => [supplier.name, supplier])),
    [supplierOptions]
  );

  function pushToast(message: string) {
    setToast({ id: Date.now(), message });
  }

  function clearActiveFilters() {
    setFiltersByTab((current) => ({
      ...current,
      [activeTab]: { ...EMPTY_FILTERS },
    }));
  }

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFiltersByTab((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        [key]: value,
      },
    }));
  }

  function clearSingleFilter(key: FilterKey) {
    updateFilter(key, typeof EMPTY_FILTERS[key] === "boolean" ? false as FilterState[FilterKey] : "" as FilterState[FilterKey]);
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? paginatedRecords.map((record) => record.id) : []);
  }

  function fillCustomerDetails(customerId: string, current: InvoiceFormState): InvoiceFormState {
    const customer =
      customerOptions.find((item) => item.id === customerId) ??
      customerByName.get(current.customerName);

    if (!customer) {
      return {
        ...current,
        customerId,
      };
    }

    const preferredRep = current.salesRepresentative || activeEmployees[0]?.name || "";
    const billingAddress = customer.address || customer.location || "";

    return {
      ...current,
      type: "customer",
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      customerEmail: customer.email || "",
      billingAddress,
      salesRepresentative: preferredRep,
      title:
        current.title.trim() === "" || current.title === titleForType("customer")
          ? `${customer.name} Invoice`
          : current.title,
    };
  }

  function fillSupplierDetails(supplierId: string, current: InvoiceFormState): InvoiceFormState {
    const supplier =
      supplierOptions.find((item) => item.id === supplierId) ??
      supplierByName.get(current.supplierName);

    if (!supplier) {
      return {
        ...current,
        supplierId,
      };
    }

    const supplierPurchases = purchases
      .filter((purchase) => purchase.supplierId === supplier.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const recentPurchase = supplierPurchases[0];
    const suggestedQuantity =
      current.quantity === "1" && recentPurchase?.quantity
        ? String(recentPurchase.quantity)
        : current.quantity;
    const suggestedUnitPrice =
      (current.unitPrice === "0" || current.unitPrice.trim() === "") &&
      recentPurchase?.quantity
        ? String(Math.round((recentPurchase.totalCost / recentPurchase.quantity) * 100) / 100)
        : current.unitPrice;
    const productNames = Array.from(
      new Set(
        supplierPurchases
          .slice(0, 3)
          .map((purchase) => productsById.get(purchase.productId)?.name)
          .filter((name): name is string => Boolean(name))
      )
    );

    return {
      ...current,
      type: "supplier",
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierCode: supplier.id,
      supplierCompanyName: supplier.name,
      supplierContactPerson: supplier.name,
      supplierPhone: supplier.phone || "",
      supplierEmail: supplier.email || "",
      supplierAddress: supplier.address || "",
      purchaseOrderReference: current.purchaseOrderReference || recentPurchase?.id || "",
      linkedRecord: current.linkedRecord || recentPurchase?.id || "",
      quantity: suggestedQuantity,
      unitPrice: suggestedUnitPrice,
      itemsText:
        current.itemsText.trim() !== "" || productNames.length === 0
          ? current.itemsText
          : productNames.join(", "),
      title:
        current.title.trim() === "" || current.title === titleForType("supplier")
          ? `${supplier.name} Invoice`
          : current.title,
    };
  }

  function openAddModal(type = activeTab) {
    setFormMode("add");
    const base = { ...EMPTY_FORM, type, title: titleForType(type) };
    const withDefaults =
      type === "customer"
        ? { ...base, salesRepresentative: activeEmployees[0]?.name || "" }
        : base;
    setAllowOverpayment(false);
    setFormState(withDefaults);
    setFormOpen(true);
  }

  function openEditModal(record: InvoiceRecord) {
    setFormMode("edit");
    let nextForm = buildFormFromRecord(record);

    if (record.type === "customer" && !nextForm.customerId && record.customerName) {
      const linkedCustomer = customerByName.get(record.customerName);
      if (linkedCustomer) {
        nextForm = fillCustomerDetails(linkedCustomer.id, nextForm);
      }
    }

    if (record.type === "supplier" && !nextForm.supplierId && record.supplierName) {
      const linkedSupplier = supplierByName.get(record.supplierName);
      if (linkedSupplier) {
        nextForm = fillSupplierDetails(linkedSupplier.id, nextForm);
      }
    }

    const firstItemTotal = nextForm.itemsText.trim()
      ? buildLines(
          nextForm.itemsText,
          Math.max(1, normalizeNumber(nextForm.quantity)),
          Math.max(0, normalizeNumber(nextForm.unitPrice))
        ).reduce((sum, item) => sum + item.total, 0)
      : 0;
    const estimatedTotal = Math.max(
      firstItemTotal - Math.max(0, normalizeNumber(nextForm.discount)) + Math.max(0, normalizeNumber(nextForm.tax)) + Math.max(0, normalizeNumber(nextForm.shipping)),
      0
    );
    setAllowOverpayment(normalizeNumber(nextForm.paidAmount) > estimatedTotal && estimatedTotal > 0);
    setFormState(nextForm);
    setFormOpen(true);
    setActionMenu(null);
  }

  function closeFormModal() {
    setFormOpen(false);
    setFormState(EMPTY_FORM);
    setAllowOverpayment(false);
    setPendingSave(null);
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setFormState((current) => {
      if (name === "type") {
        return {
          ...current,
          type: value as TabKey,
          title:
            current.title.trim() === "" ||
            current.title === titleForType(current.type)
              ? titleForType(value as TabKey)
              : current.title,
        };
      }

      if (name === "customerId") {
        return fillCustomerDetails(value, current);
      }

      if (name === "supplierId") {
        return fillSupplierDetails(value, current);
      }

      return { ...current, [name]: value };
    });
  }

  function requestSaveConfirmation() {
    setPendingSave({
      mode: formMode,
      title: formMode === "add" ? "Confirm New Invoice" : "Confirm Invoice Update",
      message:
        formMode === "add"
          ? "Are you sure you want to create this invoice with the current data?"
          : "Are you sure you want to save these changes to the invoice?",
    });
  }

  function saveForm() {
    const quantity = Math.max(1, normalizeNumber(formState.quantity));
    const unitPrice = Math.max(0, normalizeNumber(formState.unitPrice));
    const discount = Math.max(0, normalizeNumber(formState.discount));
    const tax = Math.max(0, normalizeNumber(formState.tax));
    const shipping = Math.max(0, normalizeNumber(formState.shipping));
    const items = buildLines(formState.itemsText, quantity, unitPrice);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = Math.max(subtotal - discount + tax + shipping, 0);
    const requestedPaidAmount = Math.max(0, normalizeNumber(formState.paidAmount));
    const paidAmount = allowOverpayment
      ? requestedPaidAmount
      : Math.min(requestedPaidAmount, totalAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const status = statusFromAmounts(paidAmount, totalAmount);

    if (requestedPaidAmount > totalAmount && !allowOverpayment) {
      pushToast("Paid amount cannot exceed the invoice total unless overpayment approval is enabled.");
    }

    const baseRecord: InvoiceRecord = {
      id:
        formMode === "edit" && formState.id
          ? formState.id
          : `${formState.type.toUpperCase().slice(0, 1)}INV-${Math.floor(Math.random() * 9000) + 1000}`,
      type: formState.type,
      customerId: formState.customerId || undefined,
      supplierId: formState.supplierId || undefined,
      title: formState.title || titleForType(formState.type),
      status,
      issueDate: formState.issueDate,
      dueDate: formState.dueDate,
      currency: formState.currency,
      subtotal,
      discount,
      tax,
      shipping,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMethod: formState.paymentMethod,
      lastUpdated: new Date().toISOString(),
      createdBy: formMode === "edit" ? records.find((record) => record.id === formState.id)?.createdBy ?? "Current User" : "Current User",
      updatedBy: "Current User",
      attachments: formMode === "edit"
        ? records.find((record) => record.id === formState.id)?.attachments ?? []
        : [],
      notesPreview: formState.description || "No notes yet.",
      latestNote: formState.description || "No notes yet.",
      notesList:
        formMode === "edit"
          ? records.find((record) => record.id === formState.id)?.notesList ?? []
          : [],
      items,
      paymentHistory:
        formMode === "edit"
          ? records.find((record) => record.id === formState.id)?.paymentHistory ?? []
          : [],
      activity: [
        makeActivity(
          "Current User",
          formMode === "edit" ? "Updated invoice details" : "Created invoice",
          `act-${Date.now()}`
        ),
        ...(
          formMode === "edit"
            ? records.find((record) => record.id === formState.id)?.activity ?? []
            : []
        ),
      ],
      linkedRecord: formState.linkedRecord,
      description: formState.description,
      customerName: formState.customerName,
      customerPhone: formState.customerPhone,
      customerEmail: formState.customerEmail,
      billingAddress: formState.billingAddress,
      salesRepresentative: formState.salesRepresentative,
      linkedOrderNumber: formState.linkedOrderNumber,
      department: formState.department,
      category: formState.category,
      requester: formState.requester,
      approvedBy: formState.approvedBy,
      relatedProject: formState.relatedProject,
      vendor: formState.vendor,
      costCenter: formState.costCenter,
      priority: formState.priority,
      confidentiality: formState.confidentiality,
      internalNotes: formState.internalNotes,
      supplierName: formState.supplierName,
      supplierCode: formState.supplierCode,
      supplierCompanyName: formState.supplierCompanyName,
      supplierContactPerson: formState.supplierContactPerson,
      supplierPhone: formState.supplierPhone,
      supplierEmail: formState.supplierEmail,
      supplierAddress: formState.supplierAddress,
      taxNumber: formState.taxNumber,
      purchaseOrderReference: formState.purchaseOrderReference,
      deliveryNoteReference: formState.deliveryNoteReference,
      paymentTerms: formState.paymentTerms,
      supplierRating: normalizeNumber(formState.supplierRating),
    };

    setRecords((current) => {
      if (formMode === "edit" && formState.id) {
        return current.map((record) => (record.id === formState.id ? baseRecord : record));
      }

      return [baseRecord, ...current];
    });

    pushToast(formMode === "edit" ? "Invoice updated successfully." : "Invoice created successfully.");
    setPendingSave(null);
    closeFormModal();
  }

  function updateRecord(id: string, updater: (record: InvoiceRecord) => InvoiceRecord, message: string) {
    setRecords((current) => current.map((record) => (record.id === id ? updater(record) : record)));
    pushToast(message);
    setActionMenu(null);
  }

  function addNote() {
    if (!noteTarget || !noteText.trim()) return;

    updateRecord(
      noteTarget.id,
      (record) => {
        const note = makeNote("Current User", noteText.trim(), `note-${Date.now()}`);
        return {
          ...record,
          notesPreview: note.content,
          latestNote: note.content,
          notesList: [note, ...record.notesList],
          lastUpdated: new Date().toISOString(),
          activity: [
            makeActivity("Current User", "Added note", `act-${Date.now()}`),
            ...record.activity,
          ],
        };
      },
      "Note added successfully."
    );

    setNoteTarget(null);
    setNoteText("");
  }

  function removeRecord() {
    if (!deleteTarget) return;
    if (deleteCode.trim() !== "123") {
      setDeleteError("Please type 123 to confirm deletion.");
      return;
    }
    setRecords((current) => current.filter((record) => record.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteCode("");
    setDeleteError("");
    pushToast("Invoice deleted.");
  }

  function performBulk(action: "paid" | "delete") {
    if (selectedIds.length === 0) return;

    if (action === "delete") {
      setRecords((current) => current.filter((record) => !selectedIds.includes(record.id)));
      pushToast("Selected invoices deleted.");
    } else {
      setRecords((current) =>
        current.map((record) => {
          if (!selectedIds.includes(record.id)) return record;
          return {
            ...record,
            status: "Paid",
            paidAmount: record.totalAmount,
            remainingAmount: 0,
            lastUpdated: new Date().toISOString(),
          };
        })
      );
      pushToast("Selected invoices marked as paid.");
    }

    setSelectedIds([]);
  }

  function exportCurrentView() {
    const header = ["ID", "Type", "Title", "Status", "Issue Date", "Due Date", "Total", "Remaining"];
    const lines = filteredRecords.map((record) =>
      [
        record.id,
        record.type,
        record.title,
        record.status,
        record.issueDate,
        record.dueDate,
        record.totalAmount,
        record.remainingAmount,
      ].join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeTab}-invoices.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast("Current invoice view exported.");
  }

  const allPageSelected =
    paginatedRecords.length > 0 &&
    paginatedRecords.every((record) => selectedIds.includes(record.id));

  const activeFilterEntries = useMemo(() => {
    const entries: Array<{ key: FilterKey; label: string; value: string }> = [];
    const labelMap: Partial<Record<FilterKey, string>> = {
      status: "Status",
      paymentMethod: "Payment Method",
      dateRange: "Date",
      dueDate: "Due Date",
      amountRange: "Amount",
      customer: "Customer",
      salesRepresentative: "Sales Rep",
      department: "Department",
      category: "Category",
      priority: "Priority",
      confidentiality: "Confidentiality",
      approvalStatus: "Approval",
      paymentStatus: "Payment Status",
      costCenter: "Cost Center",
      relatedProject: "Project",
      supplier: "Supplier",
      supplierCode: "Supplier Code",
      paymentTerms: "Payment Terms",
      currency: "Currency",
      linkedPurchaseRecord: "Purchase Record",
      supplierRating: "Supplier Rating",
      overdueOnly: "Overdue",
      incompleteOnly: "Incomplete",
    };

    (Object.keys(filters) as FilterKey[]).forEach((key) => {
      if (key === "search") return;
      const raw = filters[key];
      if (typeof raw === "boolean") {
        if (raw) entries.push({ key, label: labelMap[key] || key, value: "On" });
        return;
      }
      if (raw) entries.push({ key, label: labelMap[key] || key, value: String(raw) });
    });

    return entries;
  }, [filters]);

  const activeFilterCount = activeFilterEntries.length;
  const actionMenuRecord = actionMenu ? records.find((record) => record.id === actionMenu.id) ?? null : null;

  function openActionMenu(recordId: string, trigger: HTMLButtonElement) {
    if (actionMenu?.id === recordId) {
      setActionMenu(null);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 224;
    const estimatedHeight = 360;
    const gap = 8;
    const viewportPadding = 12;
    const placeUp = window.innerHeight - rect.bottom < estimatedHeight && rect.top > estimatedHeight / 2;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - viewportPadding - menuWidth
    );
    const top = placeUp
      ? Math.max(viewportPadding, rect.top - estimatedHeight - gap)
      : Math.max(
          viewportPadding,
          Math.min(window.innerHeight - viewportPadding - estimatedHeight, rect.bottom + gap)
        );

    setActionMenu({
      id: recordId,
      left,
      top,
      placement: placeUp ? "up" : "down",
    });
  }

  return (
    <>
      <div className="invoice-management-page">
        <section className="invoice-hero-card">
          <div className="invoice-hero-top">
            <div className="invoice-hero-main">
              <div className="invoice-hero-badge">
                <FileText size={20} />
              </div>
              <div className="invoice-hero-text">
                <h1>Invoice Management</h1>
                <p>Customer, internal, and supplier invoices.</p>
              </div>
            </div>

            <div className="invoice-hero-actions">
              <button className="primary-action" type="button" onClick={() => openAddModal()}>
                <Plus size={16} />
                New Invoice
              </button>
              <button className="secondary-action" type="button" onClick={exportCurrentView}>
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="hero-summary-inline">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className={`hero-summary-card ${card.tone === "amber" ? "warning" : ""}`}>
                  <div className={`hero-summary-icon ${card.tone}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <small>{card.title}</small>
                    <strong>{card.value}</strong>
                    {card.helper ? <em>{card.helper}</em> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`invoice-workspace ${showMoreFilters ? "filters-open" : ""}`}>
          <div className="workspace-topbar">
            <div className="invoice-tabs">
              {(Object.keys(TAB_CONFIG) as TabKey[]).map((tab) => {
                const config = TAB_CONFIG[tab];
                const Icon = config.icon;
                const count = records.filter((record) => record.type === tab).length;

                return (
                  <button
                    key={tab}
                    type="button"
                    className={`invoice-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    <Icon size={18} />
                    <div>
                      <strong>{config.label}</strong>
                      <span>{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="workspace-topbar-side">
              <div className="result-hint">
                <strong>{filteredRecords.length}</strong>
                <span>{filteredRecords.length === 1 ? "result" : "results"}</span>
                <i />
              </div>
            </div>
          </div>

          <div className="workspace-toolbar">
            <div className="search-shell">
              <Search size={17} />
              <input
                type="text"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>

            <div className="toolbar-actions">
              <button
                className={`toolbar-chip subtle ${showMoreFilters ? "active" : ""}`}
                type="button"
                onClick={() => setShowMoreFilters((current) => !current)}
                aria-expanded={showMoreFilters}
              >
                <Filter size={15} />
                Filters
              </button>
              <button
                className={`toolbar-chip ${showMoreFilters ? "active" : ""}`}
                type="button"
                onClick={() => setShowMoreFilters((current) => !current)}
                aria-expanded={showMoreFilters}
              >
                More Filters
                {activeFilterCount > 0 && <span className="toolbar-chip-count">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          <div className="contextual-filters-bar">
            <div className="contextual-filters-scroll">
              {activeTab === "customer" && (
                <>
                  <select className="compact-filter-select app-select-control" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
                    <option value="">Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.customer} onChange={(e) => updateFilter("customer", e.target.value)}>
                    <option value="">Customer</option>
                    {customerNames.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.dateRange} onChange={(e) => updateFilter("dateRange", e.target.value)}>
                    <option value="">Date</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>
                </>
              )}

              {activeTab === "internal" && (
                <>
                  <select className="compact-filter-select app-select-control" value={filters.department} onChange={(e) => updateFilter("department", e.target.value)}>
                    <option value="">Department</option>
                    {departments.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
                    <option value="">Category</option>
                    {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.priority} onChange={(e) => updateFilter("priority", e.target.value)}>
                    <option value="">Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.confidentiality} onChange={(e) => updateFilter("confidentiality", e.target.value)}>
                    <option value="">Confidentiality</option>
                    <option value="Standard">Standard</option>
                    <option value="Sensitive">Sensitive</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.paymentStatus} onChange={(e) => updateFilter("paymentStatus", e.target.value)}>
                    <option value="">Payment Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </>
              )}

              {activeTab === "supplier" && (
                <>
                  <select className="compact-filter-select app-select-control" value={filters.supplier} onChange={(e) => updateFilter("supplier", e.target.value)}>
                    <option value="">Supplier</option>
                    {supplierNames.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.paymentStatus} onChange={(e) => updateFilter("paymentStatus", e.target.value)}>
                    <option value="">Payment Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                  <select className="compact-filter-select app-select-control" value={filters.dueDate} onChange={(e) => updateFilter("dueDate", e.target.value)}>
                    <option value="">Due Date</option>
                    <option value="overdue">Overdue</option>
                    <option value="7d">Next 7 days</option>
                    <option value="30d">Next 30 days</option>
                  </select>
                </>
              )}
            </div>

            <div className="quick-filter-chips">
              <button type="button" className={`quick-chip ${filters.overdueOnly ? "active" : ""}`} onClick={() => updateFilter("overdueOnly", !filters.overdueOnly)}>
                Overdue
              </button>
              <button type="button" className={`quick-chip ${filters.status === "Unpaid" ? "active" : ""}`} onClick={() => updateFilter("status", filters.status === "Unpaid" ? "" : "Unpaid")}>
                Unpaid
              </button>
              <button type="button" className={`quick-chip ${filters.status === "Partial" || filters.paymentStatus === "Partial" ? "active" : ""}`} onClick={() => updateFilter(activeTab === "customer" ? "status" : "paymentStatus", (activeTab === "customer" ? filters.status : filters.paymentStatus) === "Partial" ? "" : "Partial")}>
                Partial
              </button>
              {(activeTab === "customer" || activeTab === "supplier") && (
                <button type="button" className={`quick-chip ${activeTab === "customer" ? filters.status === "Paid" : filters.paymentStatus === "Paid" ? true : false}`} onClick={() => updateFilter(activeTab === "customer" ? "status" : "paymentStatus", (activeTab === "customer" ? filters.status : filters.paymentStatus) === "Paid" ? "" : "Paid")}>
                  Paid
                </button>
              )}
              {activeTab === "internal" && (
                <button type="button" className={`quick-chip ${filters.priority === "High" ? "active" : ""}`} onClick={() => updateFilter("priority", filters.priority === "High" ? "" : "High")}>
                  High Priority
                </button>
              )}
              {activeFilterCount > 0 && (
                <button className="clear-filters-link" type="button" onClick={clearActiveFilters}>
                  Clear Filters
                </button>
              )}
            </div>

            {showMoreFilters && (
              <div className="more-filters-popover">
                <div className="more-filters-grid">
                  {activeTab === "customer" && (
                    <>
                      <label className="compact-filter-field">
                        <span>Due Date</span>
                        <select value={filters.dueDate} onChange={(e) => updateFilter("dueDate", e.target.value)}>
                          <option value="">Any</option>
                          <option value="overdue">Overdue</option>
                          <option value="7d">Next 7 days</option>
                          <option value="30d">Next 30 days</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Amount</span>
                        <select value={filters.amountRange} onChange={(e) => updateFilter("amountRange", e.target.value)}>
                          <option value="">All amounts</option>
                          <option value="lt500">Under 500</option>
                          <option value="500to1000">500 - 1000</option>
                          <option value="gt1000">Above 1000</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Quick State</span>
                        <select value={filters.incompleteOnly ? "incomplete" : ""} onChange={(e) => updateFilter("incompleteOnly", e.target.value === "incomplete")}>
                          <option value="">Any</option>
                          <option value="incomplete">Incomplete only</option>
                        </select>
                      </label>
                    </>
                  )}

                  {activeTab === "internal" && (
                    <>
                      <label className="compact-filter-field">
                        <span>Approval Status</span>
                        <select value={filters.approvalStatus} onChange={(e) => updateFilter("approvalStatus", e.target.value)}>
                          <option value="">All</option>
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Date</span>
                        <select value={filters.dateRange} onChange={(e) => updateFilter("dateRange", e.target.value)}>
                          <option value="">Any date</option>
                          <option value="7d">Last 7 days</option>
                          <option value="30d">Last 30 days</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Amount</span>
                        <select value={filters.amountRange} onChange={(e) => updateFilter("amountRange", e.target.value)}>
                          <option value="">All amounts</option>
                          <option value="lt500">Under 500</option>
                          <option value="500to1000">500 - 1000</option>
                          <option value="gt1000">Above 1000</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Cost Center</span>
                        <select value={filters.costCenter} onChange={(e) => updateFilter("costCenter", e.target.value)}>
                          <option value="">All cost centers</option>
                          {costCenters.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Related Project</span>
                        <select value={filters.relatedProject} onChange={(e) => updateFilter("relatedProject", e.target.value)}>
                          <option value="">All projects</option>
                          {relatedProjects.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                    </>
                  )}

                  {activeTab === "supplier" && (
                    <>
                      <label className="compact-filter-field">
                        <span>Due Date</span>
                        <select value={filters.dueDate} onChange={(e) => updateFilter("dueDate", e.target.value)}>
                          <option value="">Any</option>
                          <option value="overdue">Overdue</option>
                          <option value="7d">Next 7 days</option>
                          <option value="30d">Next 30 days</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Date</span>
                        <select value={filters.dateRange} onChange={(e) => updateFilter("dateRange", e.target.value)}>
                          <option value="">Any date</option>
                          <option value="7d">Last 7 days</option>
                          <option value="30d">Last 30 days</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Amount</span>
                        <select value={filters.amountRange} onChange={(e) => updateFilter("amountRange", e.target.value)}>
                          <option value="">All amounts</option>
                          <option value="lt500">Under 500</option>
                          <option value="500to1000">500 - 1000</option>
                          <option value="gt1000">Above 1000</option>
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Linked Purchase</span>
                        <select value={filters.linkedPurchaseRecord} onChange={(e) => updateFilter("linkedPurchaseRecord", e.target.value)}>
                          <option value="">All records</option>
                          {linkedPurchaseRecords.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="compact-filter-field">
                        <span>Supplier Rating</span>
                        <select value={filters.supplierRating} onChange={(e) => updateFilter("supplierRating", e.target.value)}>
                          <option value="">Any rating</option>
                          <option value="4plus">4 and above</option>
                          <option value="3orless">3 or less</option>
                        </select>
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeFilterCount > 0 && (
              <div className="active-filter-chips">
                {activeFilterEntries.map((entry) => (
                  <button key={`${entry.key}-${entry.value}`} type="button" className="active-filter-chip" onClick={() => clearSingleFilter(entry.key)}>
                    <span>{entry.label}: {entry.value}</span>
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="bulk-bar">
              <span>{selectedIds.length} invoices selected</span>
              <div className="bulk-actions">
                <button type="button" onClick={() => performBulk("paid")}>
                  Mark Paid
                </button>
                <button type="button" onClick={exportCurrentView}>
                  Export
                </button>
                <button type="button" onClick={() => pushToast("Selected invoices archived.")}>
                  Archive
                </button>
                <button type="button" className="danger" onClick={() => performBulk("delete")}>
                  Delete
                </button>
              </div>
            </div>
          )}

          <div className="decision-summary-strip">
            <span>{decisionSummary}</span>
            <button type="button" onClick={() => {
              if (activeTab === "internal") {
                updateFilter("approvalStatus", "Pending");
              } else if (activeTab === "supplier") {
                updateFilter("dueDate", "7d");
              } else {
                updateFilter("overdueOnly", true);
              }
            }}>
              Review now
            </button>
          </div>

          <div className="table-card">
            <div className="table-headline">
              <div>
                <h2>{TAB_CONFIG[activeTab].label}</h2>
                <p>{filteredRecords.length} result{filteredRecords.length === 1 ? "" : "s"}</p>
              </div>

              <div className="table-headline-meta">
                <span>{money(summary.remainingAmount)}</span>
              </div>
            </div>

            <div className="invoice-table-wrap app-table-wrap">
              <table className="invoice-table app-data-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>Invoice</th>
                    <th>{activeTab === "customer" ? "Client" : activeTab === "internal" ? "Department" : "Supplier"}</th>
                    <th>{activeTab === "customer" ? "Items" : activeTab === "internal" ? "Category / Priority" : "Terms / Code"}</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Remaining</th>
                    <th>{activeTab === "internal" ? "Approval / Status" : "Status"}</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    Array.from({ length: rowsPerPage }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="skeleton-row">
                        <td colSpan={9}>
                          <div className="table-skeleton">
                            <span />
                            <span />
                            <span />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : viewError ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <FileText size={34} />
                          <h3>Something went wrong</h3>
                          <p>{viewError}</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => {
                      const overdue =
                        record.remainingAmount > 0 &&
                        record.dueDate < TODAY &&
                        record.status !== "Paid";
                      const dueTone = dueStateTone(record.dueDate, record.remainingAmount, record.status);

                      return (
                        <tr
                          key={record.id}
                          className={`${overdue ? "is-overdue" : ""} row-clickable`}
                          onClick={() => {
                            setDetailInvoice(record);
                            setDetailTab("overview");
                          }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(record.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleSelect(record.id)}
                            />
                          </td>
                          <td>
                            <div className="invoice-id-cell app-cell-stack">
                              <strong>{record.id}</strong>
                              <span>{record.title || "Invoice"}</span>
                              <OverflowContent
                                title={record.id}
                                subtitle="Latest note"
                                preview={record.latestNote || "No notes"}
                                content={record.latestNote || "No notes"}
                                meta={[
                                  { label: "Status", value: record.status },
                                  { label: "Updated", value: formatDate(record.lastUpdated) },
                                ]}
                              />
                              <div className="mini-doc-pill">PDF</div>
                            </div>
                          </td>
                          <td>
                            <div className="party-cell">
                              <strong>
                                {record.type === "customer"
                                  ? record.customerName
                                  : record.type === "internal"
                                  ? record.department
                                  : record.supplierName}
                              </strong>
                              <span>
                                {record.type === "customer"
                                  ? record.customerEmail || "-"
                                  : record.type === "internal"
                                  ? `${record.category} - ${record.priority}`
                                  : record.supplierCompanyName || "-"}
                              </span>
                            </div>
                          </td>
                          <td>
                            {activeTab === "customer" && (
                              <div className="party-cell">
                                <strong>{record.items[0]?.label || "No items"}</strong>
                                <span>
                                  {record.items.length > 1
                                    ? `+${record.items.length - 1} more item${record.items.length > 2 ? "s" : ""}`
                                    : `${record.items.length || 0} item`}
                                </span>
                              </div>
                            )}
                            {activeTab === "internal" && (
                              <div className="party-cell">
                                <strong>{record.category || "Uncategorized"}</strong>
                                <span>{record.priority || "Normal"} priority</span>
                              </div>
                            )}
                            {activeTab === "supplier" && (
                              <div className="party-cell">
                                <strong>{record.paymentTerms || "No terms"}</strong>
                                <span>{record.supplierCode || "No code"}</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="due-date-cell">
                              <strong>{formatDate(record.dueDate)}</strong>
                              <span className={`due-text ${dueTone}`}>
                                {dueStateLabel(record.dueDate, record.remainingAmount, record.status)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="amount-cell">
                              <strong>{money(record.totalAmount, record.currency)}</strong>
                              <span>{record.currency}</span>
                            </div>
                          </td>
                          <td className="remaining-cell">
                            <div className="amount-cell amount-cell-emphasis">
                              <strong>{money(record.remainingAmount, record.currency)}</strong>
                              <span>{record.status === "Paid" ? "Closed" : record.currency}</span>
                            </div>
                          </td>
                          <td>
                            {activeTab === "internal" ? (
                              <div className="status-stack">
                                <span className={`status-pill ${record.approvedBy ? "approved" : "pending-approval"}`}>
                                  {record.approvedBy ? "Approved" : "Pending Approval"}
                                </span>
                                <small>{record.status}</small>
                              </div>
                            ) : (
                              <span className={`status-pill ${overdue ? "overdue" : record.status.toLowerCase()}`}>
                                {overdue ? "Overdue" : record.status}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="view-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailInvoice(record);
                                  setDetailTab("overview");
                                }}
                              >
                                <Eye size={15} />
                                Open
                              </button>

                              <div className="menu-shell">
                                <button
                                  type="button"
                                  className="menu-button"
                                  aria-label={`Open actions for ${record.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openActionMenu(record.id, e.currentTarget);
                                  }}
                                  aria-expanded={actionMenu?.id === record.id}
                                  aria-haspopup="menu"
                                >
                                  <MoreHorizontal size={15} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-state">
                          <FileText size={34} />
                          <h3>{activeFilterCount > 0 || filters.search ? "No results found" : "No invoices found"}</h3>
                          <p>
                            {activeFilterCount > 0 || filters.search
                              ? "Try changing the search or filters to broaden this view."
                              : "Create a new invoice to start working in this section."}
                          </p>
                          <button type="button" className="primary-action" onClick={() => openAddModal(activeTab)}>
                            <Plus size={16} />
                            Add Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <TableFooter
              className={`pagination-bar ${pageCount <= 1 ? "single-page" : ""}`}
              total={filteredRecords.length}
              page={safePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 15]}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(1);
              }}
              onPageChange={setPage}
            />

            <div className="table-tip-bar">
              <FileText size={16} />
              <span>Use filters to narrow this view.</span>
            </div>
          </div>
        </section>
      </div>

      {actionMenu && actionMenuRecord && createPortal(
        <div
          ref={actionMenuRef}
          className={`actions-menu portal-actions-menu ${actionMenu.placement === "up" ? "is-upward" : ""}`}
          style={{ top: actionMenu.top, left: actionMenu.left }}
          role="menu"
        >
          <button
            type="button"
            onClick={() => {
              setDetailInvoice(actionMenuRecord);
              setDetailTab("overview");
              setActionMenu(null);
            }}
          >
            <Eye size={15} />
            Open
          </button>
          <button type="button" onClick={() => openEditModal(actionMenuRecord)}>
            <Pencil size={15} />
            Edit Invoice
          </button>
          <button
            type="button"
            onClick={() => {
              setNoteTarget(actionMenuRecord);
              setActionMenu(null);
            }}
          >
            <StickyNote size={15} />
            Add Note
          </button>
          <button
            type="button"
            onClick={() => {
              setDetailInvoice(actionMenuRecord);
              setDetailTab("notes");
              setActionMenu(null);
            }}
          >
            <FileText size={15} />
            View Notes
          </button>
          <button
            type="button"
            onClick={() => {
              const cloned = {
                ...actionMenuRecord,
                id: `${actionMenuRecord.id}-COPY`,
                title: `${actionMenuRecord.title} Copy`,
                status: "Unpaid" as InvoiceStatus,
                lastUpdated: new Date().toISOString(),
              };
              setRecords((current) => [cloned, ...current]);
              setActionMenu(null);
              pushToast("Invoice duplicated.");
            }}
          >
            <Copy size={15} />
            Duplicate
          </button>
          <button
            type="button"
            onClick={() =>
              updateRecord(
                actionMenuRecord.id,
                (current) => ({
                  ...current,
                  status: "Paid",
                  paidAmount: current.totalAmount,
                  remainingAmount: 0,
                  lastUpdated: new Date().toISOString(),
                }),
                "Invoice marked as paid."
              )
            }
          >
            <Check size={15} />
            Mark as Paid
          </button>
          <button
            type="button"
            onClick={() =>
              updateRecord(
                actionMenuRecord.id,
                (current) => ({
                  ...current,
                  status: "Partial",
                  paidAmount: Math.max(current.paidAmount, current.totalAmount * 0.5),
                  remainingAmount: Math.max(
                    current.totalAmount - Math.max(current.paidAmount, current.totalAmount * 0.5),
                    0
                  ),
                  lastUpdated: new Date().toISOString(),
                }),
                "Invoice marked as partial."
              )
            }
          >
            <Check size={15} />
            Mark as Partial
          </button>
          <button
            type="button"
            onClick={() => {
              setActionMenu(null);
              pushToast("PDF download prepared.");
            }}
          >
            <Download size={15} />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => {
              setActionMenu(null);
              pushToast("Print command opened.");
            }}
          >
            <Printer size={15} />
            Print Invoice
          </button>
          <div className="menu-divider" />
          <button
            type="button"
            onClick={() => {
              setActionMenu(null);
              pushToast("Invoice archived.");
            }}
          >
            <FileText size={15} />
            Archive
          </button>
          <button
            type="button"
            className="danger-item"
            onClick={() => {
              setDeleteTarget(actionMenuRecord);
              setDeleteCode("");
              setDeleteError("");
              setActionMenu(null);
            }}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>,
        document.body
      )}

      {formOpen && (
        <div className="overlay-shell" onClick={closeFormModal}>
          <div className="modal-card large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{formMode === "add" ? "Add New Invoice" : "Edit Invoice"}</h2>
                <p>Invoice form.</p>
              </div>
              <button type="button" className="icon-close" onClick={closeFormModal}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="invoice-form-layout">
                <div className="invoice-form-main">
                  <section className="form-cluster">
                    <div className="form-cluster-head">
                      <div>
                        <h3>Invoice Setup</h3>
                      </div>
                    </div>

                    <div className="form-grid form-grid-top">
                      <label className="field-stack">
                        <span>Invoice Type</span>
                        <select name="type" value={formState.type} onChange={handleFormChange}>
                          <option value="customer">Customer Invoice</option>
                          <option value="internal">Internal Invoice</option>
                          <option value="supplier">Supplier Invoice</option>
                        </select>
                      </label>
                      <label className="field-stack">
                        <span>Title</span>
                        <input name="title" value={formState.title} onChange={handleFormChange} />
                      </label>
                      <label className="field-stack">
                        <span>Issue Date</span>
                        <input type="date" name="issueDate" value={formState.issueDate} onChange={handleFormChange} />
                      </label>
                      <label className="field-stack">
                        <span>Due Date</span>
                        <input type="date" name="dueDate" value={formState.dueDate} onChange={handleFormChange} />
                      </label>
                    </div>

                    <div className="form-grid form-grid-inline">
                      <label className="field-stack">
                        <span>Status</span>
                        <select name="status" value={formState.status} onChange={handleFormChange}>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Partial">Partial</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </label>
                      <label className="field-stack">
                        <span>Payment Method</span>
                        <select name="paymentMethod" value={formState.paymentMethod} onChange={handleFormChange}>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Wire">Wire</option>
                          <option value="Credit">Credit</option>
                          <option value="Internal Transfer">Internal Transfer</option>
                        </select>
                      </label>
                      <label className="field-stack">
                        <span>Linked Record</span>
                        <input name="linkedRecord" value={formState.linkedRecord} onChange={handleFormChange} />
                      </label>
                    </div>
                  </section>

                  <section className="form-cluster">
                    <div className="form-cluster-head">
                      <div>
                        <h3>Items and Amounts</h3>
                      </div>
                    </div>

                    <div className="form-grid">
                      <label className="field-stack full">
                        <span>Items / Products</span>
                        <textarea
                          name="itemsText"
                          value={formState.itemsText}
                          onChange={handleFormChange}
                          placeholder="Separate items with commas"
                          rows={3}
                        />
                      </label>
                    </div>

                    <div className="form-grid form-grid-financial">
                      <label className="field-stack">
                        <span>Quantity</span>
                        <input name="quantity" value={formState.quantity} onChange={handleFormChange} />
                      </label>
                      <label className="field-stack">
                        <span>Unit Price</span>
                        <input name="unitPrice" value={formState.unitPrice} onChange={handleFormChange} />
                      </label>
                      <label className="field-stack">
                        <span>Discount</span>
                        <input name="discount" value={formState.discount} onChange={handleFormChange} />
                      </label>
                      <label className="field-stack">
                        <span>Tax / VAT</span>
                        <input name="tax" value={formState.tax} onChange={handleFormChange} />
                      </label>
                      <label className="field-stack">
                        <span>Shipping / Charges</span>
                        <input name="shipping" value={formState.shipping} onChange={handleFormChange} />
                      </label>
                      <label className="field-stack">
                        <span>Paid Amount</span>
                        <input name="paidAmount" value={formState.paidAmount} onChange={handleFormChange} />
                      </label>
                    </div>

                    <div className="special-control-row">
                      <label className="special-approval-toggle">
                        <input
                          type="checkbox"
                          checked={allowOverpayment}
                          onChange={(e) => setAllowOverpayment(e.target.checked)}
                        />
                        <div>
                          <strong>Allow overpayment with special approval</strong>
                          <span>Use only for approved exceptions.</span>
                        </div>
                      </label>
                    </div>

                    <div className="form-grid">
                      <label className="field-stack full">
                        <span>Description / Notes</span>
                        <textarea
                          name="description"
                          value={formState.description}
                          onChange={handleFormChange}
                          rows={3}
                        />
                      </label>
                    </div>
                  </section>

                  {formState.type === "customer" && (
                    <div className="form-section">
                      <div className="form-cluster-head">
                        <div>
                          <h3>Customer Information</h3>
                        </div>
                      </div>
                      <div className="form-grid">
                        <label className="field-stack">
                          <span>Customer</span>
                          <select name="customerId" value={formState.customerId} onChange={handleFormChange}>
                            <option value="">Select customer</option>
                            {customerOptions.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field-stack">
                          <span>Customer Phone</span>
                          <input
                            name="customerPhone"
                            value={formState.customerPhone}
                            onChange={handleFormChange}
                            readOnly={Boolean(formState.customerId)}
                            className={formState.customerId ? "readonly-field" : ""}
                          />
                        </label>
                        <label className="field-stack">
                          <span>Customer Email</span>
                          <input
                            name="customerEmail"
                            value={formState.customerEmail}
                            onChange={handleFormChange}
                            readOnly={Boolean(formState.customerId)}
                            className={formState.customerId ? "readonly-field" : ""}
                          />
                        </label>
                        <label className="field-stack">
                          <span>Sales Representative</span>
                          <input name="salesRepresentative" value={formState.salesRepresentative} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Linked Order Number</span>
                          <input name="linkedOrderNumber" value={formState.linkedOrderNumber} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack full">
                          <span>Billing Address</span>
                          <textarea
                            name="billingAddress"
                            value={formState.billingAddress}
                            onChange={handleFormChange}
                            rows={2}
                            readOnly={Boolean(formState.customerId)}
                            className={formState.customerId ? "readonly-field" : ""}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {formState.type === "internal" && (
                    <div className="form-section">
                      <div className="form-cluster-head">
                        <div>
                          <h3>Internal Invoice Data</h3>
                        </div>
                      </div>
                      <div className="form-grid">
                        <label className="field-stack">
                          <span>Department</span>
                          <input name="department" value={formState.department} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Category</span>
                          <input name="category" value={formState.category} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Requester</span>
                          <input name="requester" value={formState.requester} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Approved By</span>
                          <input name="approvedBy" value={formState.approvedBy} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Related Project</span>
                          <input name="relatedProject" value={formState.relatedProject} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Vendor</span>
                          <input name="vendor" value={formState.vendor} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Cost Center</span>
                          <input name="costCenter" value={formState.costCenter} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Priority</span>
                          <select name="priority" value={formState.priority} onChange={handleFormChange}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </label>
                        <label className="field-stack">
                          <span>Confidentiality</span>
                          <select name="confidentiality" value={formState.confidentiality} onChange={handleFormChange}>
                            <option value="Standard">Standard</option>
                            <option value="Sensitive">Sensitive</option>
                            <option value="Restricted">Restricted</option>
                          </select>
                        </label>
                        <label className="field-stack full">
                          <span>Internal Notes</span>
                          <textarea name="internalNotes" value={formState.internalNotes} onChange={handleFormChange} rows={3} />
                        </label>
                      </div>
                    </div>
                  )}

                  {formState.type === "supplier" && (
                    <div className="form-section">
                      <div className="form-cluster-head">
                        <div>
                          <h3>Supplier Details</h3>
                        </div>
                      </div>
                      <div className="form-grid">
                        <label className="field-stack">
                          <span>Supplier</span>
                          <select name="supplierId" value={formState.supplierId} onChange={handleFormChange}>
                            <option value="">Select supplier</option>
                            {supplierOptions.map((supplier) => (
                              <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field-stack">
                          <span>Supplier Code</span>
                          <input
                            name="supplierCode"
                            value={formState.supplierCode}
                            onChange={handleFormChange}
                            readOnly={Boolean(formState.supplierId)}
                            className={formState.supplierId ? "readonly-field" : ""}
                          />
                        </label>
                        <label className="field-stack">
                          <span>Company Name</span>
                          <input
                            name="supplierCompanyName"
                            value={formState.supplierCompanyName}
                            onChange={handleFormChange}
                            readOnly={Boolean(formState.supplierId)}
                            className={formState.supplierId ? "readonly-field" : ""}
                          />
                        </label>
                        <label className="field-stack">
                          <span>Contact Person</span>
                          <input
                            name="supplierContactPerson"
                            value={formState.supplierContactPerson}
                            onChange={handleFormChange}
                            readOnly={Boolean(formState.supplierId)}
                            className={formState.supplierId ? "readonly-field" : ""}
                          />
                        </label>
                        <label className="field-stack">
                          <span>Phone</span>
                          <input
                            name="supplierPhone"
                            value={formState.supplierPhone}
                            onChange={handleFormChange}
                            readOnly={Boolean(formState.supplierId)}
                            className={formState.supplierId ? "readonly-field" : ""}
                          />
                        </label>
                        <label className="field-stack">
                          <span>Email</span>
                          <input
                            name="supplierEmail"
                            value={formState.supplierEmail}
                            onChange={handleFormChange}
                            readOnly={Boolean(formState.supplierId)}
                            className={formState.supplierId ? "readonly-field" : ""}
                          />
                        </label>
                        <label className="field-stack">
                          <span>VAT Number</span>
                          <input name="taxNumber" value={formState.taxNumber} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Purchase Order Ref</span>
                          <input name="purchaseOrderReference" value={formState.purchaseOrderReference} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Delivery Note Ref</span>
                          <input name="deliveryNoteReference" value={formState.deliveryNoteReference} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Payment Terms</span>
                          <input name="paymentTerms" value={formState.paymentTerms} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack">
                          <span>Supplier Rating</span>
                          <input name="supplierRating" value={formState.supplierRating} onChange={handleFormChange} />
                        </label>
                        <label className="field-stack full">
                          <span>Address</span>
                          <textarea
                            name="supplierAddress"
                            value={formState.supplierAddress}
                            onChange={handleFormChange}
                            rows={2}
                            readOnly={Boolean(formState.supplierId)}
                            className={formState.supplierId ? "readonly-field" : ""}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <aside className="invoice-form-aside">
                  <div className="form-aside-card">
                    <span className="form-aside-label">Quick Summary</span>
                    <strong>{titleForType(formState.type)}</strong>
                    <p>
                      Use the primary section for the core invoice data, then fill
                      only the relevant details for the selected invoice type.
                    </p>
                    <div className="form-aside-list">
                      <div>
                        <span>Status</span>
                        <b>{formState.status}</b>
                      </div>
                      <div>
                        <span>Payment Cap</span>
                        <b>{allowOverpayment ? "Special approval" : "Invoice total only"}</b>
                      </div>
                      <div>
                        <span>Method</span>
                        <b>{formState.paymentMethod}</b>
                      </div>
                      <div>
                        <span>Issue Date</span>
                        <b>{formState.issueDate}</b>
                      </div>
                      <div>
                        <span>Due Date</span>
                        <b>{formState.dueDate}</b>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-action" onClick={closeFormModal}>
                Cancel
              </button>
              <button type="button" className="primary-action" onClick={requestSaveConfirmation}>
                <Save size={16} />
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {detailInvoice && (
        <div className="overlay-shell drawer-shell" onClick={() => setDetailInvoice(null)}>
          <aside className="details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-id">{detailInvoice.id}</span>
                <h2>{detailInvoice.title}</h2>
              </div>
              <button type="button" className="icon-close" onClick={() => setDetailInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-tabs">
              {(["overview", "items", "payments", "notes", "attachments", "history"] as DetailTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={detailTab === tab ? "active" : ""}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="drawer-content">
              {detailTab === "overview" && (
                <div className="drawer-grid">
                  <div className="info-card">
                    <h3>Basic Information</h3>
                    <dl>
                      <div><dt>Status</dt><dd><span className={`status-pill ${detailInvoice.status.toLowerCase()}`}>{detailInvoice.status}</span></dd></div>
                      <div><dt>Issue Date</dt><dd>{formatDate(detailInvoice.issueDate)}</dd></div>
                      <div><dt>Due Date</dt><dd>{formatDate(detailInvoice.dueDate)}</dd></div>
                      <div><dt>Payment Method</dt><dd>{detailInvoice.paymentMethod}</dd></div>
                      <div><dt>Linked Record</dt><dd>{detailInvoice.linkedRecord || "-"}</dd></div>
                    </dl>
                  </div>

                  <div className="info-card">
                    <h3>Financial Summary</h3>
                    <dl>
                      <div><dt>Subtotal</dt><dd>{money(detailInvoice.subtotal, detailInvoice.currency)}</dd></div>
                      <div><dt>Tax</dt><dd>{money(detailInvoice.tax, detailInvoice.currency)}</dd></div>
                      <div><dt>Total</dt><dd>{money(detailInvoice.totalAmount, detailInvoice.currency)}</dd></div>
                      <div><dt>Paid</dt><dd>{money(detailInvoice.paidAmount, detailInvoice.currency)}</dd></div>
                      <div><dt>Remaining</dt><dd>{money(detailInvoice.remainingAmount, detailInvoice.currency)}</dd></div>
                    </dl>
                  </div>

                  <div className="info-card">
                    <h3>Party Details</h3>
                    <dl>
                      {detailInvoice.type === "customer" && (
                        <>
                          <div><dt>Customer</dt><dd>{detailInvoice.customerName || "-"}</dd></div>
                          <div><dt>Phone</dt><dd>{detailInvoice.customerPhone || "-"}</dd></div>
                          <div><dt>Email</dt><dd>{detailInvoice.customerEmail || "-"}</dd></div>
                          <div><dt>Address</dt><dd>{detailInvoice.billingAddress || "-"}</dd></div>
                        </>
                      )}
                      {detailInvoice.type === "internal" && (
                        <>
                          <div><dt>Department</dt><dd>{detailInvoice.department || "-"}</dd></div>
                          <div><dt>Category</dt><dd>{detailInvoice.category || "-"}</dd></div>
                          <div><dt>Requester</dt><dd>{detailInvoice.requester || "-"}</dd></div>
                          <div><dt>Confidentiality</dt><dd>{detailInvoice.confidentiality || "-"}</dd></div>
                        </>
                      )}
                      {detailInvoice.type === "supplier" && (
                        <>
                          <div><dt>Supplier</dt><dd>{detailInvoice.supplierName || "-"}</dd></div>
                          <div><dt>Company</dt><dd>{detailInvoice.supplierCompanyName || "-"}</dd></div>
                          <div><dt>Contact</dt><dd>{detailInvoice.supplierContactPerson || "-"}</dd></div>
                          <div><dt>Rating</dt><dd>{detailInvoice.supplierRating || "-"}</dd></div>
                        </>
                      )}
                    </dl>
                  </div>

                  <div className="info-card full">
                    <h3>Description</h3>
                    <p>{detailInvoice.description || "No additional description."}</p>
                  </div>
                </div>
              )}

              {detailTab === "items" && (
                <div className="stack-list">
                  {detailInvoice.items.map((item) => (
                    <div key={item.id} className="stack-card">
                      <strong>{item.label}</strong>
                        <span>{item.quantity} x {money(item.unitPrice, detailInvoice.currency)}</span>
                      <span>{money(item.total, detailInvoice.currency)}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === "payments" && (
                <div className="stack-list">
                  {detailInvoice.paymentHistory.length > 0 ? (
                    detailInvoice.paymentHistory.map((payment) => (
                      <div key={payment.id} className="stack-card">
                        <strong>{payment.reference}</strong>
                        <span>{formatDate(payment.date)} - {payment.method}</span>
                        <span>{money(payment.amount, detailInvoice.currency)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="stack-card empty">No payment records yet.</div>
                  )}
                </div>
              )}

              {detailTab === "notes" && (
                <div className="stack-list">
                  {detailInvoice.notesList.length > 0 ? (
                    detailInvoice.notesList.map((note) => (
                      <div key={note.id} className="stack-card">
                        <strong>{note.author}</strong>
                        <span>{formatDateTime(note.createdAt)}</span>
                        <p>{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="stack-card empty">No notes added yet.</div>
                  )}
                </div>
              )}

              {detailTab === "attachments" && (
                <div className="stack-list">
                  {detailInvoice.attachments.length > 0 ? (
                    detailInvoice.attachments.map((attachment) => (
                      <div key={attachment} className="stack-card">
                        <strong>{attachment}</strong>
                        <span>Available attachment</span>
                      </div>
                    ))
                  ) : (
                    <div className="stack-card empty">No attachments available.</div>
                  )}
                </div>
              )}

              {detailTab === "history" && (
                <div className="stack-list">
                  {detailInvoice.activity.map((entry) => (
                    <div key={entry.id} className="stack-card">
                      <strong>{entry.action}</strong>
                      <span>{entry.actor}</span>
                      <span>{formatDateTime(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {noteTarget && (
        <div className="overlay-shell" onClick={() => setNoteTarget(null)}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Note</h2>
                <p>{noteTarget.id} - Store an internal note for this invoice.</p>
              </div>
              <button type="button" className="icon-close" onClick={() => setNoteTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <textarea
                rows={5}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write the note here..."
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-action" onClick={() => setNoteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="primary-action" onClick={addNote}>
                <StickyNote size={16} />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="overlay-shell" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Invoice</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button type="button" className="icon-close" onClick={() => setDeleteTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body confirmation delete-confirmation-body">
              <Trash2 size={28} />
              <p>
                Are you sure you want to delete <strong>{deleteTarget.id}</strong>?
              </p>
              <div className="confirm-code-box">
                <label className="confirm-code-label">
                  <span>Type confirmation code</span>
                  <input
                    type="text"
                    value={deleteCode}
                    onChange={(e) => {
                      setDeleteCode(e.target.value);
                      setDeleteError("");
                    }}
                    placeholder="Enter 123"
                  />
                </label>
                {deleteError && <p className="confirm-error">{deleteError}</p>}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-action" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="danger-action" onClick={removeRecord}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingSave && (
        <div className="overlay-shell" onClick={() => setPendingSave(null)}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{pendingSave.title}</h2>
                <p>{pendingSave.message}</p>
              </div>
              <button type="button" className="icon-close" onClick={() => setPendingSave(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body confirmation">
              <Save size={28} />
              <p>
                {pendingSave.mode === "add"
                  ? "The invoice will be created and linked to the current workflow data."
                  : "The current invoice data will be updated with your latest changes."}
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-action" onClick={() => setPendingSave(null)}>
                Cancel
              </button>
              <button type="button" className="primary-action" onClick={saveForm}>
                <Save size={16} />
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-shell">
          <div className="toast-card">
            <Check size={16} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
