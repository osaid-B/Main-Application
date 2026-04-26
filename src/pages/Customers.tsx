import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Building2,
  CreditCard,
  Download,
  Eye,
  FilePlus2,
  Filter,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Receipt,
  Search,
  StickyNote,
  Trash2,
  UserCircle2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import "./Customers.css";
import TableFooter from "../components/ui/TableFooter";
import { useSettings } from "../context/SettingsContext";
import type { AppLanguage } from "../i18n/translations";
import type { Customer, Invoice, Payment, PaymentMethod, PaymentStatus } from "../data/types";
import { getCustomers, getInvoices, getPayments, saveCustomers } from "../data/storage";
import { roundMoney } from "../data/relations";

type CustomerStatus = "Active" | "Inactive" | "VIP" | "Blocked" | "New" | "Debtor";
type CustomerType = "Individual" | "Business" | "VIP";
type PreferredContactMethod = "Phone" | "Email" | "WhatsApp";
type SortKey = "name" | "status" | "balance" | "lastActivity" | "joinedAt";
type SortDirection = "asc" | "desc";
type DetailsTab = "overview" | "orders" | "payments" | "invoices" | "notes" | "activity";
type JoinedFilter = "all" | "30d" | "90d" | "year";
type BalanceFilter = "all" | "debtor" | "clear" | "high";
type MoreFilter = {
  customerType: string;
  tag: string;
  creditStatus: string;
  lastOrder: string;
  lastPayment: string;
};
type QuickFilter = "active" | "debtor" | "vip" | "new" | "inactive";
type ActionMenuState = {
  customerId: string;
  top: number;
  left: number;
};
type ToastState = { type: "success" | "warning" | "error" | "info"; message: string } | null;

type CustomerForm = {
  name: string;
  id: string;
  status: Exclude<CustomerStatus, "Debtor">;
  customerType: CustomerType;
  companyName: string;
  phone: string;
  email: string;
  preferredContactMethod: PreferredContactMethod;
  city: string;
  address: string;
  locationNotes: string;
  openingBalance: string;
  creditLimit: string;
  currency: string;
  notes: string;
  tags: string;
  internalNotes: string;
};

type FormErrors = Partial<Record<keyof CustomerForm, string>>;

type DerivedInvoice = {
  id: string;
  date: string;
  total: number;
  remaining: number;
  status: string;
};

type DerivedPayment = {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
};

type CustomerRecord = Customer & {
  statusLabel: CustomerStatus;
  outstandingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  activeInvoices: number;
  joinedLabel: string;
  lastActivityLabel: string;
  lastActivityDate: string;
  lastOrderLabel: string;
  lastPaymentLabel: string;
  balanceState: "Debtor" | "Clear";
  tagsResolved: string[];
  notesPreview: string;
  invoices: DerivedInvoice[];
  payments: DerivedPayment[];
  averageOrderValue: number;
  creditUsage: number;
};

type PersistedCustomerStatus = Customer["status"];

const EMPTY_FORM: CustomerForm = {
  name: "",
  id: "",
  status: "Active",
  customerType: "Individual",
  companyName: "",
  phone: "",
  email: "",
  preferredContactMethod: "Phone",
  city: "",
  address: "",
  locationNotes: "",
  openingBalance: "0",
  creditLimit: "0",
  currency: "USD",
  notes: "",
  tags: "",
  internalNotes: "",
};

const DELETE_CONFIRMATION_CODE = "123";

function formatMoney(value: number, currency = "USD", locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(roundMoney(value));
}

function formatDate(value?: string, locale = "en-US") {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getRelativeDate(value?: string, language: AppLanguage = "en") {
  if (!value) return "No activity";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (language === "ar") {
    if (diff === 0) return "اليوم";
    if (diff === 1) return "أمس";
    if (diff < 30) return `منذ ${diff} يومًا`;
    if (diff < 365) return `منذ ${Math.floor(diff / 30)} شهر`;
    return `منذ ${Math.floor(diff / 365)} سنة`;
  }

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} mo ago`;
  return `${Math.floor(diff / 365)} yr ago`;
}

function validatePhone(phone: string) {
  return /^(059|056)\d{7}$/.test(phone);
}

function validateEmail(email: string) {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildCustomerId(index: number) {
  return `CUST-${1001 + index}`;
}

function buildCustomerCode(name: string, index: number) {
  const seed = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
  return `${seed}-${200 + index}`;
}

function normalizePaymentStatus(status?: string): PaymentStatus {
  if (
    status === "Paid" ||
    status === "Pending" ||
    status === "Partial" ||
    status === "Completed" ||
    status === "Failed" ||
    status === "Refunded" ||
    status === "Cancelled"
  ) {
    return status;
  }

  return "Completed";
}

function normalizeMethod(method?: string): PaymentMethod {
  if (
    method === "Cash" ||
    method === "Card" ||
    method === "Bank Transfer" ||
    method === "Wallet" ||
    method === "Cheque"
  ) {
    return method;
  }

  return "Cash";
}

function deriveCustomerStatus(customer: Customer, outstandingBalance: number, joinedAt?: string): CustomerStatus {
  if (customer.status === "Blocked") return "Blocked";
  if (customer.status === "Inactive") return "Inactive";
  if (customer.status === "VIP" || customer.customerType === "VIP") return "VIP";
  if (outstandingBalance > 0) return "Debtor";

  if (joinedAt) {
    const parsed = new Date(joinedAt);
    const diff = (Date.now() - parsed.getTime()) / 86400000;
    if (diff <= 30) return "New";
  }

  return "Active";
}

function makeNotePreview(text?: string) {
  if (!text?.trim()) return "No notes yet";
  return text.length > 96 ? `${text.slice(0, 96)}...` : text;
}

function normalizeCustomerRecords(
  customers: Customer[],
  invoices: Invoice[],
  payments: Payment[],
  locale: string,
  language: AppLanguage
) {
  return customers
    .filter((customer) => !customer.isDeleted)
    .map((customer, index): CustomerRecord => {
      const customerInvoices = invoices
        .filter((invoice) => invoice.customerId === customer.id)
        .map((invoice) => ({
          id: invoice.id,
          date: invoice.date,
          total: roundMoney(Number(invoice.total ?? invoice.amount ?? 0)),
          remaining: roundMoney(Number(invoice.remainingAmount ?? 0)),
          status: invoice.status ?? "Unpaid",
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const customerPayments = payments
        .filter((payment) => payment.customerId === customer.id)
        .map((payment) => ({
          id: payment.paymentId ?? payment.id,
          amount: roundMoney(Number(payment.amount ?? 0)),
          date: payment.date,
          method: normalizeMethod(payment.method),
          status: normalizePaymentStatus(payment.status),
          reference: payment.referenceNumber ?? payment.paymentId ?? payment.id,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalInvoiced = roundMoney(customerInvoices.reduce((sum, invoice) => sum + invoice.total, 0));
      const totalPaid = roundMoney(
        customerPayments
          .filter((payment) => payment.status === "Completed" || payment.status === "Paid" || payment.status === "Partial")
          .reduce((sum, payment) => sum + payment.amount, 0)
      );
      const openingBalance = roundMoney(Number(customer.openingBalance ?? 0));
      const outstandingBalance = roundMoney(
        Math.max(openingBalance + customerInvoices.reduce((sum, invoice) => sum + invoice.remaining, 0), 0)
      );
      const lastOrderDate = customerInvoices[0]?.date ?? "";
      const lastPaymentDate = customerPayments[0]?.date ?? "";
      const lastActivityDate = [lastOrderDate, lastPaymentDate, customer.joinedAt]
        .filter(Boolean)
        .sort((left, right) => new Date(right!).getTime() - new Date(left!).getTime())[0];
      const creditLimit = Number(customer.creditLimit ?? 0);
      const creditUsage =
        creditLimit > 0 ? Math.min(100, Math.round((outstandingBalance / creditLimit) * 100)) : 0;

      return {
        ...customer,
        id: customer.id || buildCustomerId(index),
        city: customer.city ?? customer.location ?? "",
        statusLabel: deriveCustomerStatus(customer, outstandingBalance, customer.joinedAt),
        outstandingBalance,
        totalInvoiced,
        totalPaid,
        activeInvoices: customerInvoices.filter((invoice) => invoice.remaining > 0).length,
        joinedLabel: formatDate(customer.joinedAt, locale),
        lastActivityLabel: getRelativeDate(lastActivityDate, language),
        lastActivityDate: lastActivityDate ?? "",
        lastOrderLabel: lastOrderDate ? formatDate(lastOrderDate, locale) : language === "ar" ? "لا توجد طلبات" : "No orders",
        lastPaymentLabel: lastPaymentDate ? formatDate(lastPaymentDate, locale) : language === "ar" ? "لا توجد دفعات" : "No payments",
        balanceState: outstandingBalance > 0 ? "Debtor" : "Clear",
        tagsResolved:
          customer.tags && customer.tags.length > 0
            ? customer.tags
            : [
                customer.customerType ?? "Individual",
                deriveCustomerStatus(customer, outstandingBalance, customer.joinedAt),
              ],
        notesPreview: makeNotePreview(customer.notes),
        invoices: customerInvoices,
        payments: customerPayments,
        averageOrderValue:
          customerInvoices.length > 0 ? roundMoney(totalInvoiced / customerInvoices.length) : 0,
        creditUsage,
      };
    });
}

function getStatusTone(status: CustomerStatus) {
  switch (status) {
    case "VIP":
      return "status-vip";
    case "Debtor":
      return "status-debtor";
    case "Blocked":
      return "status-blocked";
    case "Inactive":
      return "status-inactive";
    case "New":
      return "status-new";
    default:
      return "status-active";
  }
}

const CUSTOMER_PAGE_COPY = {
  en: {
    eyebrow: "Customer workspace",
    title: "Customers",
    subtitle: "A cleaner customer ledger for accounts, balances, and follow-up activity.",
    addCustomer: "Add Customer",
    export: "Export",
    summary: {
      total: "Customers",
      active: "Active",
      debtors: "Debtors",
      due: "Balance due",
    },
    searchPlaceholder: "Search customer, code, phone, email, or note",
    filters: "Filters",
    filtersLabel: "Advanced filters",
    filtersApplied: "applied",
    clear: "Clear",
    close: "Close",
    bulk: {
      selected: "selected",
      export: "Export selected",
      tag: "Tag selected",
      vip: "Mark as VIP",
      archive: "Archive",
      delete: "Delete",
    },
    quick: {
      active: "Active",
      debtor: "Debtor",
      vip: "VIP",
      new: "New",
    },
    advanced: {
      title: "Refine customer view",
      subtitle: "Keep the page compact and reveal secondary filters only when needed.",
      status: "Status",
      location: "Location",
      balance: "Balance state",
      joined: "Joined date",
      type: "Customer type",
      tags: "Tag",
      credit: "Credit status",
      lastOrder: "Last order",
      lastPayment: "Last payment",
      allStatuses: "All statuses",
      allLocations: "All locations",
      allBalances: "All balances",
      allTime: "All time",
      anyType: "Any type",
      anyTag: "Any tag",
      anyStatus: "Any status",
      anyValue: "Any",
      debtorsOnly: "Debtors only",
      clearBalance: "Clear balance",
      highBalance: "High balance",
      last30: "Last 30 days",
      last90: "Last 90 days",
      last12Months: "Last 12 months",
      nearLimit: "Near credit limit",
      overLimit: "Over credit limit",
      noOrders: "No orders",
      noPayments: "No payments",
    },
    table: {
      title: "Customer directory",
      count: "in current view",
      customer: "Customer",
      contact: "Contact",
      status: "Status",
      balance: "Balance",
      activity: "Last activity",
      actions: "Actions",
      customerFallback: "Customer account",
      noEmail: "No email",
      noPhone: "No phone",
      joined: "Joined",
      openInvoices: "open invoices",
      clearBalance: "Clear balance",
      noActivity: "No activity",
      noNotes: "No notes yet",
      noLocation: "No location",
      open: "Open",
      moreActions: "More actions",
      selectAll: "Select all visible customers",
      selectRow: "Select",
    },
    states: {
      loadError: "Unable to load customers",
      emptyTitle: "No matching customers found",
      emptyText: "Adjust filters or add a new customer.",
    },
    statuses: {
      Active: "Active",
      Debtor: "Debtor",
      VIP: "VIP",
      New: "New",
      Inactive: "Inactive",
      Blocked: "Blocked",
      Clear: "Clear",
      Individual: "Individual",
      Business: "Business",
    },
  },
  ar: {
    eyebrow: "مساحة العملاء",
    title: "العملاء",
    subtitle: "دفتر عملاء أنظف لإدارة الحسابات والأرصدة والمتابعة اليومية.",
    addCustomer: "إضافة عميل",
    export: "تصدير",
    summary: {
      total: "العملاء",
      active: "النشطون",
      debtors: "المدينون",
      due: "الرصيد المستحق",
    },
    searchPlaceholder: "ابحث بالعميل أو الرمز أو الهاتف أو البريد أو الملاحظة",
    filters: "الفلاتر",
    filtersLabel: "فلاتر متقدمة",
    filtersApplied: "مفعلة",
    clear: "مسح",
    close: "إغلاق",
    bulk: {
      selected: "محدد",
      export: "تصدير المحدد",
      tag: "وسم المحدد",
      vip: "تعيين كمميز",
      archive: "أرشفة",
      delete: "حذف",
    },
    quick: {
      active: "نشط",
      debtor: "مدين",
      vip: "مميز",
      new: "جديد",
    },
    advanced: {
      title: "تخصيص عرض العملاء",
      subtitle: "أبق الصفحة مدمجة وأظهر الفلاتر الثانوية فقط عند الحاجة.",
      status: "الحالة",
      location: "الموقع",
      balance: "حالة الرصيد",
      joined: "تاريخ الانضمام",
      type: "نوع العميل",
      tags: "الوسم",
      credit: "حالة الائتمان",
      lastOrder: "آخر طلب",
      lastPayment: "آخر دفعة",
      allStatuses: "كل الحالات",
      allLocations: "كل المواقع",
      allBalances: "كل الأرصدة",
      allTime: "كل الفترات",
      anyType: "أي نوع",
      anyTag: "أي وسم",
      anyStatus: "أي حالة",
      anyValue: "أي",
      debtorsOnly: "المدينون فقط",
      clearBalance: "رصيد صاف",
      highBalance: "رصيد مرتفع",
      last30: "آخر 30 يومًا",
      last90: "آخر 90 يومًا",
      last12Months: "آخر 12 شهرًا",
      nearLimit: "قريب من الحد",
      overLimit: "متجاوز الحد",
      noOrders: "لا توجد طلبات",
      noPayments: "لا توجد دفعات",
    },
    table: {
      title: "دليل العملاء",
      count: "ضمن العرض الحالي",
      customer: "العميل",
      contact: "التواصل",
      status: "الحالة",
      balance: "الرصيد",
      activity: "آخر نشاط",
      actions: "الإجراءات",
      customerFallback: "حساب عميل",
      noEmail: "لا يوجد بريد",
      noPhone: "لا يوجد هاتف",
      joined: "انضم",
      openInvoices: "فواتير مفتوحة",
      clearBalance: "رصيد صاف",
      noActivity: "لا يوجد نشاط",
      noNotes: "لا توجد ملاحظات",
      noLocation: "لا يوجد موقع",
      open: "فتح",
      moreActions: "إجراءات إضافية",
      selectAll: "تحديد كل العملاء الظاهرين",
      selectRow: "تحديد",
    },
    states: {
      loadError: "تعذر تحميل العملاء",
      emptyTitle: "لا يوجد عملاء مطابقون",
      emptyText: "عدّل الفلاتر أو أضف عميلًا جديدًا.",
    },
    statuses: {
      Active: "نشط",
      Debtor: "مدين",
      VIP: "مميز",
      New: "جديد",
      Inactive: "غير نشط",
      Blocked: "محظور",
      Clear: "صاف",
      Individual: "فردي",
      Business: "شركة",
    },
  },
} as const;

function getActivityTimeline(customer: CustomerRecord) {
  const invoiceEvents = customer.invoices.map((invoice) => ({
    id: `invoice-${invoice.id}`,
    type: "invoice" as const,
    title: `Invoice ${invoice.id} created`,
    description: `${formatMoney(invoice.total, customer.currency ?? "USD")} • ${invoice.status}`,
    date: invoice.date,
  }));

  const paymentEvents = customer.payments.map((payment) => ({
    id: `payment-${payment.id}`,
    type: "payment" as const,
    title: `Payment ${payment.id} recorded`,
    description: `${formatMoney(payment.amount, customer.currency ?? "USD")} via ${payment.method}`,
    date: payment.date,
  }));

  const noteEvents = customer.notesPreview !== "No notes yet"
    ? [
        {
          id: `note-${customer.id}`,
          type: "note" as const,
          title: "Customer note updated",
          description: customer.notesPreview,
          date: customer.joinedAt ?? new Date().toISOString().split("T")[0],
        },
      ]
    : [];

  return [
    {
      id: `created-${customer.id}`,
      type: "created" as const,
      title: "Customer profile created",
      description: `${customer.name} was added to the CRM workspace.`,
      date: customer.joinedAt ?? new Date().toISOString().split("T")[0],
    },
    ...invoiceEvents,
    ...paymentEvents,
    ...noteEvents,
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

function CustomerFormModal({
  mode,
  values,
  errors,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  values: CustomerForm;
  errors: FormErrors;
  onChange: (field: keyof CustomerForm, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const currency = values.currency || "USD";
  const openingBalance = Number(values.openingBalance || 0);
  const creditLimit = Number(values.creditLimit || 0);
  const tagsPreview = values.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="customer-modal-overlay" onClick={onClose}>
      <div className="customer-form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="customer-modal-header">
          <div>
            <span className="modal-eyebrow">{mode === "create" ? "New Customer" : "Edit Customer"}</span>
            <h2>{mode === "create" ? "Add Customer" : "Update Customer"}</h2>
            <p>Create a richer customer profile with contact, financial, and lifecycle details.</p>
          </div>
          <button type="button" className="icon-btn subtle" onClick={onClose} aria-label="Close customer form">
            <X size={18} />
          </button>
        </div>

        <div className="customer-form-body">
          <div className="customer-form-sections">
            <section className="customer-form-section">
              <div className="section-title">
                <h3>Basic information</h3>
                <p>Define how this customer should appear across invoices and CRM workflows.</p>
              </div>
              <div className="customer-form-grid">
                <label className="field-block">
                  <span>Customer name</span>
                  <input value={values.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Enter customer name" />
                  {errors.name && <small className="field-error">{errors.name}</small>}
                </label>
                <label className="field-block">
                  <span>Customer code</span>
                  <input value={values.id} onChange={(e) => onChange("id", e.target.value)} placeholder="Auto-generated customer code" />
                  {errors.id && <small className="field-error">{errors.id}</small>}
                </label>
                <label className="field-block">
                  <span>Status</span>
                  <select className="app-select-control" value={values.status} onChange={(e) => onChange("status", e.target.value)}>
                    {["Active", "Inactive", "VIP", "Blocked", "New"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="field-block">
                  <span>Customer type</span>
                  <select className="app-select-control" value={values.customerType} onChange={(e) => onChange("customerType", e.target.value)}>
                    {["Individual", "Business", "VIP"].map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="field-block field-span-full">
                  <span>Company name</span>
                  <input value={values.companyName} onChange={(e) => onChange("companyName", e.target.value)} placeholder="Optional company or account name" />
                </label>
              </div>
            </section>

            <section className="customer-form-section">
              <div className="section-title">
                <h3>Contact information</h3>
                <p>Capture the contact details used for invoices, collections, and follow-up.</p>
              </div>
              <div className="customer-form-grid">
                <label className="field-block">
                  <span>Phone</span>
                  <input value={values.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="Enter phone number" />
                  <small className="field-hint">Must start with 059 or 056</small>
                  {errors.phone && <small className="field-error">{errors.phone}</small>}
                </label>
                <label className="field-block">
                  <span>Email</span>
                  <input value={values.email} onChange={(e) => onChange("email", e.target.value)} placeholder="Enter email address" />
                  {errors.email && <small className="field-error">{errors.email}</small>}
                </label>
                <label className="field-block">
                  <span>Preferred contact</span>
                  <select className="app-select-control" value={values.preferredContactMethod} onChange={(e) => onChange("preferredContactMethod", e.target.value)}>
                    {["Phone", "Email", "WhatsApp"].map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="customer-form-section">
              <div className="section-title">
                <h3>Address</h3>
                <p>Keep location details ready for delivery, billing, and internal notes.</p>
              </div>
              <div className="customer-form-grid">
                <label className="field-block">
                  <span>City / Area</span>
                  <input value={values.city} onChange={(e) => onChange("city", e.target.value)} placeholder="Enter city or area" />
                </label>
                <label className="field-block field-span-full">
                  <span>Address</span>
                  <input value={values.address} onChange={(e) => onChange("address", e.target.value)} placeholder="Enter address" />
                </label>
                <label className="field-block field-span-full">
                  <span>Location notes</span>
                  <textarea
                    rows={3}
                    value={values.locationNotes}
                    onChange={(e) => onChange("locationNotes", e.target.value)}
                    placeholder="Optional location notes"
                  />
                </label>
              </div>
            </section>

            <section className="customer-form-section">
              <div className="section-title">
                <h3>Financial information</h3>
                <p>Define opening balance, credit exposure, and preferred working currency.</p>
              </div>
              <div className="customer-form-grid">
                <label className="field-block">
                  <span>Opening balance</span>
                  <input value={values.openingBalance} onChange={(e) => onChange("openingBalance", e.target.value)} placeholder="Enter opening balance" />
                </label>
                <label className="field-block">
                  <span>Credit limit</span>
                  <input value={values.creditLimit} onChange={(e) => onChange("creditLimit", e.target.value)} placeholder="Enter credit limit" />
                </label>
                <label className="field-block">
                  <span>Currency</span>
                  <select className="app-select-control" value={values.currency} onChange={(e) => onChange("currency", e.target.value)}>
                    {["USD", "ILS", "EUR"].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="customer-form-section">
              <div className="section-title">
                <h3>Additional information</h3>
                <p>Use notes and tags to make follow-up and segmentation easier later.</p>
              </div>
              <div className="customer-form-grid">
                <label className="field-block field-span-full">
                  <span>Notes</span>
                  <textarea rows={3} value={values.notes} onChange={(e) => onChange("notes", e.target.value)} placeholder="Optional customer notes" />
                </label>
                <label className="field-block field-span-full">
                  <span>Tags</span>
                  <input value={values.tags} onChange={(e) => onChange("tags", e.target.value)} placeholder="VIP, contractor, retail" />
                </label>
                <label className="field-block field-span-full">
                  <span>Internal notes</span>
                  <textarea rows={3} value={values.internalNotes} onChange={(e) => onChange("internalNotes", e.target.value)} placeholder="Internal team notes" />
                </label>
              </div>
            </section>
          </div>

          <aside className="customer-form-summary">
            <div className="summary-card">
              <span className="summary-label">Profile preview</span>
              <strong>{values.name || "Customer name"}</strong>
              <ul className="summary-list">
                <li><span>Code</span><b>{values.id || "Auto"}</b></li>
                <li><span>Status</span><b>{values.status}</b></li>
                <li><span>Type</span><b>{values.customerType}</b></li>
                <li><span>Opening balance</span><b>{formatMoney(Number(openingBalance || 0), currency)}</b></li>
                <li><span>Credit limit</span><b>{formatMoney(Number(creditLimit || 0), currency)}</b></li>
                <li><span>Preferred contact</span><b>{values.preferredContactMethod}</b></li>
              </ul>
            </div>
            <div className="summary-card subtle-surface">
              <span className="summary-label">Tags</span>
              <div className="tag-list">
                {tagsPreview.length > 0 ? tagsPreview.map((tag) => <span key={tag} className="tag-chip">{tag}</span>) : <span className="muted-text">No tags yet</span>}
              </div>
            </div>
          </aside>
        </div>

        <div className="customer-modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="secondary-btn" onClick={onSubmit}>Save & add another</button>
          <button type="button" className="primary-btn" onClick={onSubmit}>
            {mode === "create" ? "Save customer" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsModal({
  customer,
  activeTab,
  onChangeTab,
  onClose,
  onEdit,
  onCreateInvoice,
  onRecordPayment,
  onAddNote,
}: {
  customer: CustomerRecord | null;
  activeTab: DetailsTab;
  onChangeTab: (tab: DetailsTab) => void;
  onClose: () => void;
  onEdit: () => void;
  onCreateInvoice: () => void;
  onRecordPayment: () => void;
  onAddNote: () => void;
}) {
  if (!customer) return null;

  const timeline = getActivityTimeline(customer);

  return (
    <div className="customer-modal-overlay" onClick={onClose}>
      <div className="customer-details-modal" onClick={(event) => event.stopPropagation()}>
        <div className="customer-details-header">
          <div className="customer-profile-main">
            <div className="customer-avatar">{customer.name.charAt(0).toUpperCase()}</div>
            <div className="customer-profile-copy">
              <div className="customer-title-row">
                <h2>{customer.name}</h2>
                <span className={`customer-status-badge ${getStatusTone(customer.statusLabel)}`}>{customer.statusLabel}</span>
              </div>
              <p>{customer.companyName || customer.customerType || "Customer account"}</p>
              <div className="customer-meta-row">
                <span>{customer.id}</span>
                <span>{customer.joinedLabel}</span>
                {customer.phone && <span>{customer.phone}</span>}
                {customer.email && <span>{customer.email}</span>}
              </div>
            </div>
          </div>

          <div className="customer-profile-actions">
            <button type="button" className="secondary-btn" onClick={onEdit}>Edit customer</button>
            <button type="button" className="secondary-btn" onClick={onCreateInvoice}>Create invoice</button>
            <button type="button" className="secondary-btn" onClick={onRecordPayment}>Record payment</button>
            <button type="button" className="primary-btn" onClick={onAddNote}>Add note</button>
          </div>
        </div>

        <div className="customer-kpi-grid">
          <article className="mini-kpi-card"><span>Total orders</span><strong>{customer.invoices.length}</strong></article>
          <article className="mini-kpi-card"><span>Total paid</span><strong>{formatMoney(customer.totalPaid, customer.currency ?? "USD")}</strong></article>
          <article className="mini-kpi-card"><span>Balance due</span><strong>{formatMoney(customer.outstandingBalance, customer.currency ?? "USD")}</strong></article>
          <article className="mini-kpi-card"><span>Avg. order value</span><strong>{formatMoney(customer.averageOrderValue, customer.currency ?? "USD")}</strong></article>
        </div>

        <div className="details-tabs">
          {(["overview", "orders", "payments", "invoices", "notes", "activity"] as DetailsTab[]).map((tab) => (
            <button key={tab} type="button" className={`details-tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => onChangeTab(tab)}>
              {tab === "overview" && "Overview"}
              {tab === "orders" && "Orders"}
              {tab === "payments" && "Payments"}
              {tab === "invoices" && "Invoices"}
              {tab === "notes" && "Notes"}
              {tab === "activity" && "Activity"}
            </button>
          ))}
        </div>

        <div className="details-content-scroll">
          {activeTab === "overview" && (
            <div className="details-grid">
              <section className="details-card">
                <h3>Contact details</h3>
                <dl className="key-value-grid">
                  <div><dt>Customer code</dt><dd>{customer.id}</dd></div>
                  <div><dt>Phone</dt><dd>{customer.phone || "Not set"}</dd></div>
                  <div><dt>Email</dt><dd>{customer.email || "Not set"}</dd></div>
                  <div><dt>Preferred contact</dt><dd>{customer.preferredContactMethod || "Phone"}</dd></div>
                </dl>
              </section>
              <section className="details-card">
                <h3>Address</h3>
                <dl className="key-value-grid">
                  <div><dt>City / Area</dt><dd>{customer.city || customer.location || "Not set"}</dd></div>
                  <div><dt>Address</dt><dd>{customer.address || "Not set"}</dd></div>
                  <div><dt>Location notes</dt><dd>{customer.locationNotes || "No location notes"}</dd></div>
                </dl>
              </section>
              <section className="details-card">
                <h3>Financial summary</h3>
                <dl className="key-value-grid">
                  <div><dt>Opening balance</dt><dd>{formatMoney(Number(customer.openingBalance ?? 0), customer.currency ?? "USD")}</dd></div>
                  <div><dt>Outstanding balance</dt><dd>{formatMoney(customer.outstandingBalance, customer.currency ?? "USD")}</dd></div>
                  <div><dt>Credit limit</dt><dd>{formatMoney(Number(customer.creditLimit ?? 0), customer.currency ?? "USD")}</dd></div>
                  <div><dt>Credit usage</dt><dd>{customer.creditUsage}%</dd></div>
                </dl>
              </section>
              <section className="details-card">
                <h3>Activity summary</h3>
                <dl className="key-value-grid">
                  <div><dt>Last order</dt><dd>{customer.lastOrderLabel}</dd></div>
                  <div><dt>Last payment</dt><dd>{customer.lastPaymentLabel}</dd></div>
                  <div><dt>Last activity</dt><dd>{customer.lastActivityLabel}</dd></div>
                  <div><dt>Open invoices</dt><dd>{customer.activeInvoices}</dd></div>
                </dl>
              </section>
              <section className="details-card full-span">
                <h3>Notes preview</h3>
                <p className="details-text">{customer.notes || "No customer notes yet."}</p>
                {customer.internalNotes && <p className="details-text secondary">{customer.internalNotes}</p>}
              </section>
            </div>
          )}

          {activeTab === "orders" && (
            <section className="details-card">
              <h3>Orders</h3>
              {customer.invoices.length === 0 ? (
                <p className="muted-text">No orders linked yet.</p>
              ) : (
                <table className="details-table">
                  <thead>
                    <tr><th>Order</th><th>Date</th><th>Total</th><th>Remaining</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {customer.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{formatDate(invoice.date)}</td>
                        <td>{formatMoney(invoice.total, customer.currency ?? "USD")}</td>
                        <td>{formatMoney(invoice.remaining, customer.currency ?? "USD")}</td>
                        <td><span className={`table-badge ${invoice.remaining > 0 ? "badge-debtor" : "badge-success"}`}>{invoice.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {activeTab === "payments" && (
            <section className="details-card">
              <h3>Payments</h3>
              {customer.payments.length === 0 ? (
                <p className="muted-text">No payments recorded yet.</p>
              ) : (
                <table className="details-table">
                  <thead>
                    <tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {customer.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.date)}</td>
                        <td>{formatMoney(payment.amount, customer.currency ?? "USD")}</td>
                        <td>{payment.method}</td>
                        <td>{payment.reference}</td>
                        <td><span className={`table-badge ${payment.status === "Completed" || payment.status === "Paid" ? "badge-success" : "badge-warning"}`}>{payment.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {activeTab === "invoices" && (
            <section className="details-card">
              <h3>Invoices</h3>
              {customer.invoices.length === 0 ? (
                <p className="muted-text">No invoices recorded.</p>
              ) : (
                <table className="details-table">
                  <thead>
                    <tr><th>Invoice</th><th>Date</th><th>Total</th><th>Balance</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {customer.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{formatDate(invoice.date)}</td>
                        <td>{formatMoney(invoice.total, customer.currency ?? "USD")}</td>
                        <td>{formatMoney(invoice.remaining, customer.currency ?? "USD")}</td>
                        <td><span className={`table-badge ${invoice.remaining > 0 ? "badge-debtor" : "badge-success"}`}>{invoice.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {activeTab === "notes" && (
            <section className="details-card">
              <h3>Notes</h3>
              <div className="notes-stack">
                <article className="note-card">
                  <strong>Customer note</strong>
                  <p>{customer.notes || "No note yet."}</p>
                </article>
                <article className="note-card">
                  <strong>Internal note</strong>
                  <p>{customer.internalNotes || "No internal note yet."}</p>
                </article>
              </div>
            </section>
          )}

          {activeTab === "activity" && (
            <section className="details-card">
              <h3>Activity timeline</h3>
              <div className="activity-timeline">
                {timeline.map((item) => (
                  <article key={item.id} className="timeline-item">
                    <span className={`timeline-icon ${item.type}`}></span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                      <span>{formatDate(item.date)} · {getRelativeDate(item.date)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
  const { language, locale, dir, formatCurrency, formatDate: formatLocaleDate, formatNumber } = useSettings();
  const pageCopy = CUSTOMER_PAGE_COPY[language];
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>("all");
  const [joinedFilter, setJoinedFilter] = useState<JoinedFilter>("all");
  const [moreFilters, setMoreFilters] = useState<MoreFilter>({
    customerType: "",
    tag: "",
    creditStatus: "",
    lastOrder: "",
    lastPayment: "",
  });
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "joinedAt",
    direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formState, setFormState] = useState<CustomerForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerRecord | null>(null);
  const [detailsTab, setDetailsTab] = useState<DetailsTab>("overview");
  const [toast, setToast] = useState<ToastState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [deleteCode, setDeleteCode] = useState("");

  useEffect(() => {
    const sync = () => {
      try {
        setCustomers(getCustomers());
        setInvoices(getInvoices());
        setPayments(getPayments());
        setError("");
      } catch {
        setError("Unable to load customers right now.");
      } finally {
        window.setTimeout(() => setLoading(false), 120);
      }
    };

    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!actionMenu) return;

    const handleOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionMenu(null);
    };

    const closeMenu = () => setActionMenu(null);
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenu]);

  useEffect(() => {
    if (!showMoreFilters) return;

    const handleOutside = (event: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setShowMoreFilters(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMoreFilters(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMoreFilters]);

  const customerRows = useMemo(
    () => normalizeCustomerRecords(customers, invoices, payments, locale, language),
    [customers, invoices, language, locale, payments]
  );

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = customerRows.filter((customer) => {
      if (query) {
        const haystack = [
          customer.name,
          customer.id,
          customer.email,
          customer.phone,
          customer.city,
          customer.notes,
          customer.tagsResolved.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (statusFilter && customer.statusLabel !== statusFilter) return false;
      if (locationFilter && (customer.city || customer.location || "") !== locationFilter) return false;
      if (balanceFilter === "debtor" && customer.outstandingBalance <= 0) return false;
      if (balanceFilter === "clear" && customer.outstandingBalance > 0) return false;
      if (balanceFilter === "high" && customer.outstandingBalance < 1000) return false;

      if (joinedFilter !== "all" && customer.joinedAt) {
        const diff = (Date.now() - new Date(customer.joinedAt).getTime()) / 86400000;
        if (joinedFilter === "30d" && diff > 30) return false;
        if (joinedFilter === "90d" && diff > 90) return false;
        if (joinedFilter === "year" && diff > 365) return false;
      }

      if (moreFilters.customerType && customer.customerType !== moreFilters.customerType) return false;
      if (moreFilters.tag && !customer.tagsResolved.some((tag) => tag.toLowerCase() === moreFilters.tag.toLowerCase())) return false;
      if (moreFilters.creditStatus === "over-limit" && customer.creditUsage < 100) return false;
      if (moreFilters.creditStatus === "near-limit" && (customer.creditUsage < 75 || customer.creditUsage >= 100)) return false;
      if (moreFilters.lastOrder === "none" && customer.invoices.length > 0) return false;
      if (moreFilters.lastPayment === "none" && customer.payments.length > 0) return false;

      if (quickFilters.includes("active") && customer.statusLabel !== "Active") return false;
      if (quickFilters.includes("debtor") && customer.outstandingBalance <= 0) return false;
      if (quickFilters.includes("vip") && customer.statusLabel !== "VIP") return false;
      if (quickFilters.includes("new") && customer.statusLabel !== "New") return false;
      if (quickFilters.includes("inactive") && customer.statusLabel !== "Inactive") return false;

      return true;
    });

    return [...result].sort((left, right) => {
      const valueFor = (customer: CustomerRecord) => {
        switch (sortConfig.key) {
          case "name":
            return customer.name;
          case "status":
            return customer.statusLabel;
          case "balance":
            return customer.outstandingBalance;
          case "lastActivity":
            return customer.lastActivityDate ?? "";
          case "joinedAt":
          default:
            return customer.joinedAt ?? "";
        }
      };

      const leftValue = valueFor(left);
      const rightValue = valueFor(right);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortConfig.direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortConfig.direction === "asc"
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue));
    });
  }, [balanceFilter, customerRows, joinedFilter, locationFilter, moreFilters, quickFilters, searchTerm, sortConfig, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage));
  const paginatedCustomers = filteredCustomers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, locationFilter, balanceFilter, joinedFilter, moreFilters, quickFilters, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const kpis = useMemo(() => {
    const total = customerRows.length;
    const active = customerRows.filter(
      (customer) => customer.statusLabel !== "Inactive" && customer.statusLabel !== "Blocked"
    ).length;
    const debtors = customerRows.filter((customer) => customer.outstandingBalance > 0).length;
    const newThisMonth = customerRows.filter((customer) => {
      if (!customer.joinedAt) return false;
      const date = new Date(customer.joinedAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const outstanding = customerRows.reduce((sum, customer) => sum + customer.outstandingBalance, 0);

    return { total, active, debtors, newThisMonth, outstanding };
  }, [customerRows]);

  const activeFilterCount = useMemo(
    () =>
      [
        statusFilter,
        locationFilter,
        balanceFilter !== "all" ? balanceFilter : "",
        joinedFilter !== "all" ? joinedFilter : "",
        moreFilters.customerType,
        moreFilters.tag,
        moreFilters.creditStatus,
        moreFilters.lastOrder,
        moreFilters.lastPayment,
        ...quickFilters,
      ].filter(Boolean).length,
    [balanceFilter, joinedFilter, locationFilter, moreFilters, quickFilters, statusFilter]
  );

  const allVisibleSelected =
    paginatedCustomers.length > 0 &&
    paginatedCustomers.every((customer) => selectedRows.includes(customer.id));

  const uniqueCities = Array.from(new Set(customerRows.map((customer) => customer.city || customer.location).filter(Boolean))).sort();
  const uniqueTags = Array.from(new Set(customerRows.flatMap((customer) => customer.tagsResolved))).sort();
  const labelStatus = (value: string) =>
    pageCopy.statuses[value as keyof typeof pageCopy.statuses] ?? value;
  const quickFiltersList: Array<{ key: QuickFilter; label: string }> = [
    { key: "active", label: pageCopy.quick.active },
    { key: "debtor", label: pageCopy.quick.debtor },
    { key: "vip", label: pageCopy.quick.vip },
    { key: "new", label: pageCopy.quick.new },
  ];

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setLocationFilter("");
    setBalanceFilter("all");
    setJoinedFilter("all");
    setMoreFilters({
      customerType: "",
      tag: "",
      creditStatus: "",
      lastOrder: "",
      lastPayment: "",
    });
    setQuickFilters([]);
  };

  const requestSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "balance" ? "desc" : "asc" };
    });
  };

  const openCreate = () => {
    setFormMode("create");
    setEditingCustomerId(null);
    setFormState(EMPTY_FORM);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEdit = (customer: CustomerRecord) => {
    setFormMode("edit");
    setEditingCustomerId(customer.id);
    setFormState({
      name: customer.name,
      id: customer.id,
      status: customer.statusLabel === "Debtor" ? "Active" : customer.statusLabel,
      customerType: (customer.customerType as CustomerType) ?? "Individual",
      companyName: customer.companyName ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      preferredContactMethod: (customer.preferredContactMethod as PreferredContactMethod) ?? "Phone",
      city: customer.city ?? customer.location ?? "",
      address: customer.address ?? "",
      locationNotes: customer.locationNotes ?? "",
      openingBalance: String(customer.openingBalance ?? 0),
      creditLimit: String(customer.creditLimit ?? 0),
      currency: customer.currency ?? "USD",
      notes: customer.notes ?? "",
      tags: customer.tagsResolved.join(", "),
      internalNotes: customer.internalNotes ?? "",
    });
    setFormErrors({});
    setShowFormModal(true);
    setActionMenu(null);
  };

  const openDetails = (customer: CustomerRecord) => {
    setActiveCustomer(customer);
    setDetailsTab("overview");
    setActionMenu(null);
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formState.name.trim()) errors.name = "Customer name is required.";
    if (!formState.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!validatePhone(formState.phone.trim())) {
      errors.phone = "Phone must start with 059 or 056.";
    }
    if (formState.email.trim() && !validateEmail(formState.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!formState.id.trim()) errors.id = "Customer code is required.";
    const phoneExists = customerRows.some(
      (customer) => customer.phone === formState.phone.trim() && customer.id !== editingCustomerId
    );
    if (phoneExists) errors.phone = "This phone number is already used by another customer.";

    const emailExists = customerRows.some(
      (customer) => customer.email?.toLowerCase() === formState.email.trim().toLowerCase() && customer.id !== editingCustomerId
    );
    if (formState.email.trim() && emailExists) errors.email = "This email is already used by another customer.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = () => {
    if (!validateForm()) return;

    const parsedTags = formState.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload: Customer = {
      id: formState.id.trim(),
      name: formState.name.trim(),
      companyName: formState.companyName.trim(),
      status: formState.status as PersistedCustomerStatus,
      customerType: formState.customerType as CustomerType,
      phone: formState.phone.trim(),
      email: formState.email.trim(),
      preferredContactMethod: formState.preferredContactMethod as PreferredContactMethod,
      city: formState.city.trim(),
      location: formState.city.trim(),
      address: formState.address.trim(),
      locationNotes: formState.locationNotes.trim(),
      openingBalance: Number(formState.openingBalance || 0),
      creditLimit: Number(formState.creditLimit || 0),
      currency: formState.currency,
      notes: formState.notes.trim(),
      tags: parsedTags,
      internalNotes: formState.internalNotes.trim(),
      joinedAt:
        formMode === "create"
          ? new Date().toISOString().split("T")[0]
          : customerRows.find((customer) => customer.id === editingCustomerId)?.joinedAt ?? new Date().toISOString().split("T")[0],
      isDeleted: false,
    };

    const next = formMode === "create"
      ? [payload, ...customers]
      : customers.map((customer) => (customer.id === editingCustomerId ? { ...customer, ...payload } : customer));

    saveCustomers(next);
    setCustomers(next);
    setShowFormModal(false);
    setToast({
      type: "success",
      message: formMode === "create" ? "Customer saved successfully." : "Customer updated successfully.",
    });

    if (formMode === "create") {
      setFormState({
        ...EMPTY_FORM,
        id: buildCustomerCode("", next.length),
      });
    }
  };

  const handleDeleteCustomer = () => {
    if (!deleteTarget) return;
    const next = customers.map((customer) =>
      customer.id === deleteTarget.id ? { ...customer, isDeleted: true } : customer
    );
    saveCustomers(next);
    setCustomers(next);
    setDeleteTarget(null);
    setDeleteCode("");
    setToast({ type: "success", message: "Customer archived successfully." });
    if (activeCustomer?.id === deleteTarget.id) setActiveCustomer(null);
  };

  const handleBulkAction = (action: "export" | "vip" | "archive" | "delete" | "tag") => {
    if (selectedRows.length === 0) return;

    if (action === "export" || action === "tag") {
      setToast({ type: "success", message: action === "export" ? "Selected customers exported." : "Tag workflow ready for selected customers." });
      return;
    }

    if (action === "delete") {
      setToast({ type: "warning", message: "Review deletions individually before removing customers." });
      return;
    }

    const next = customers.map((customer) => {
      if (!selectedRows.includes(customer.id)) return customer;
      if (action === "vip") return { ...customer, status: "VIP" as PersistedCustomerStatus, customerType: "VIP" as CustomerType };
      if (action === "archive") return { ...customer, status: "Inactive" as PersistedCustomerStatus };
      return customer;
    });
    saveCustomers(next);
    setCustomers(next);
    setToast({ type: "success", message: action === "vip" ? "Selected customers marked as VIP." : "Selected customers archived." });
  };

  const toggleQuickFilter = (value: QuickFilter) => {
    setQuickFilters((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  return (
    <>
      <div className="customers-workspace">
        <section className="customers-header">
          <div className="customers-header-main">
            <div className="hero-copy">
              <span className="eyebrow">{pageCopy.eyebrow}</span>
              <h1>{pageCopy.title}</h1>
              <p>{pageCopy.subtitle}</p>
            </div>
            <div className="hero-actions">
              <button type="button" className="secondary-btn compact" onClick={() => setToast({ type: "success", message: "Customer export prepared." })}>
                <Download size={15} />
                {pageCopy.export}
              </button>
              <button type="button" className="primary-btn compact" onClick={openCreate}>
                <Plus size={15} />
                {pageCopy.addCustomer}
              </button>
            </div>
          </div>
          <div className="customers-summary-strip" dir={dir}>
            <div className="summary-item">
              <span>{pageCopy.summary.total}</span>
              <strong>{formatNumber(kpis.total)}</strong>
            </div>
            <div className="summary-item">
              <span>{pageCopy.summary.active}</span>
              <strong>{formatNumber(kpis.active)}</strong>
            </div>
            <div className="summary-item">
              <span>{pageCopy.summary.debtors}</span>
              <strong>{formatNumber(kpis.debtors)}</strong>
            </div>
            <div className="summary-item emphasis">
              <span>{pageCopy.summary.due}</span>
              <strong>{formatCurrency(kpis.outstanding, "USD")}</strong>
            </div>
          </div>
        </section>

        <section className="customers-main compact-surface">
          <div className="customers-toolbar">
            <div className="toolbar-primary-row">
              <div className="search-wrap compact">
                <Search size={16} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={pageCopy.searchPlaceholder}
                />
              </div>
              <button
                type="button"
                className={`toolbar-btn compact ${showMoreFilters ? "active" : ""}`}
                onClick={() => setShowMoreFilters((prev) => !prev)}
                aria-expanded={showMoreFilters}
                aria-label={pageCopy.filtersLabel}
              >
                <Filter size={15} />
                {pageCopy.filters}
                {activeFilterCount > 0 && <span className="count-pill">{formatNumber(activeFilterCount)}</span>}
              </button>
            </div>

            <div className="toolbar-secondary-row">
              <div className="chip-row compact">
                {quickFiltersList.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`quick-chip compact ${quickFilters.includes(item.key) ? "active" : ""}`}
                    onClick={() => toggleQuickFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {activeFilterCount > 0 && (
                <button type="button" className="clear-link-btn" onClick={clearFilters}>
                  {pageCopy.clear}
                </button>
              )}
            </div>

            {showMoreFilters && (
              <div ref={filterPopoverRef} className="advanced-filter-popover" dir={dir}>
                <div className="advanced-filter-header">
                  <div>
                    <strong>{pageCopy.advanced.title}</strong>
                    <p>{pageCopy.advanced.subtitle}</p>
                  </div>
                  <button type="button" className="icon-btn subtle quiet" onClick={() => setShowMoreFilters(false)} aria-label={pageCopy.close}>
                    <X size={15} />
                  </button>
                </div>
                <div className="advanced-filter-grid">
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.status}</span>
                    <select className="app-select-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="">{pageCopy.advanced.allStatuses}</option>
                      {["Active", "Debtor", "VIP", "New", "Inactive", "Blocked"].map((status) => (
                        <option key={status} value={status}>{labelStatus(status)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.location}</span>
                    <select className="app-select-control" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                      <option value="">{pageCopy.advanced.allLocations}</option>
                      {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.balance}</span>
                    <select className="app-select-control" value={balanceFilter} onChange={(e) => setBalanceFilter(e.target.value as BalanceFilter)}>
                      <option value="all">{pageCopy.advanced.allBalances}</option>
                      <option value="debtor">{pageCopy.advanced.debtorsOnly}</option>
                      <option value="clear">{pageCopy.advanced.clearBalance}</option>
                      <option value="high">{pageCopy.advanced.highBalance}</option>
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.joined}</span>
                    <select className="app-select-control" value={joinedFilter} onChange={(e) => setJoinedFilter(e.target.value as JoinedFilter)}>
                      <option value="all">{pageCopy.advanced.allTime}</option>
                      <option value="30d">{pageCopy.advanced.last30}</option>
                      <option value="90d">{pageCopy.advanced.last90}</option>
                      <option value="year">{pageCopy.advanced.last12Months}</option>
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.type}</span>
                    <select className="app-select-control" value={moreFilters.customerType} onChange={(e) => setMoreFilters((prev) => ({ ...prev, customerType: e.target.value }))}>
                      <option value="">{pageCopy.advanced.anyType}</option>
                      {["Individual", "Business", "VIP"].map((type) => <option key={type} value={type}>{labelStatus(type)}</option>)}
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.tags}</span>
                    <select className="app-select-control" value={moreFilters.tag} onChange={(e) => setMoreFilters((prev) => ({ ...prev, tag: e.target.value }))}>
                      <option value="">{pageCopy.advanced.anyTag}</option>
                      {uniqueTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.credit}</span>
                    <select className="app-select-control" value={moreFilters.creditStatus} onChange={(e) => setMoreFilters((prev) => ({ ...prev, creditStatus: e.target.value }))}>
                      <option value="">{pageCopy.advanced.anyStatus}</option>
                      <option value="near-limit">{pageCopy.advanced.nearLimit}</option>
                      <option value="over-limit">{pageCopy.advanced.overLimit}</option>
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.lastOrder}</span>
                    <select className="app-select-control" value={moreFilters.lastOrder} onChange={(e) => setMoreFilters((prev) => ({ ...prev, lastOrder: e.target.value }))}>
                      <option value="">{pageCopy.advanced.anyValue}</option>
                      <option value="none">{pageCopy.advanced.noOrders}</option>
                    </select>
                  </label>
                  <label className="filter-block compact">
                    <span>{pageCopy.advanced.lastPayment}</span>
                    <select className="app-select-control" value={moreFilters.lastPayment} onChange={(e) => setMoreFilters((prev) => ({ ...prev, lastPayment: e.target.value }))}>
                      <option value="">{pageCopy.advanced.anyValue}</option>
                      <option value="none">{pageCopy.advanced.noPayments}</option>
                    </select>
                  </label>
                </div>
                <div className="advanced-filter-footer">
                  <span>{formatNumber(activeFilterCount)} {pageCopy.filtersApplied}</span>
                  <button type="button" className="clear-link-btn" onClick={clearFilters}>{pageCopy.clear}</button>
                </div>
              </div>
            )}
          </div>

          {selectedRows.length > 0 && (
            <div className="bulk-bar compact">
              <span>{formatNumber(selectedRows.length)} {pageCopy.bulk.selected}</span>
              <div className="bulk-actions">
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("export")}>{pageCopy.bulk.export}</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("tag")}>{pageCopy.bulk.tag}</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("vip")}>{pageCopy.bulk.vip}</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("archive")}>{pageCopy.bulk.archive}</button>
                <button type="button" className="toolbar-btn danger-lite" onClick={() => handleBulkAction("delete")}>{pageCopy.bulk.delete}</button>
              </div>
            </div>
          )}

          <div className="table-card premium">
            <div className="table-card-header">
              <div>
                <h2>{pageCopy.table.title}</h2>
                <p>{formatNumber(filteredCustomers.length)} {pageCopy.table.count}</p>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                {Array.from({ length: 5 }).map((_, index) => <div key={index} className="skeleton-row" />)}
              </div>
            ) : error ? (
              <div className="state-card error">
                <AlertCircle size={18} />
                <div><strong>{pageCopy.states.loadError}</strong><p>{error}</p></div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="state-card empty">
                <Users size={18} />
                <div><strong>{pageCopy.states.emptyTitle}</strong><p>{pageCopy.states.emptyText}</p></div>
              </div>
            ) : (
              <>
                <div className="customers-table-wrap app-table-wrap">
                  <table className="customers-table-v2 app-data-table">
                    <colgroup>
                      <col className="checkbox-col" />
                      <col className="customer-col" />
                      <col className="contact-col" />
                      <col className="status-col" />
                      <col className="balance-col" />
                      <col className="activity-col" />
                      <col className="actions-col" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={(e) => setSelectedRows(e.target.checked ? paginatedCustomers.map((item) => item.id) : [])}
                            aria-label={pageCopy.table.selectAll}
                          />
                        </th>
                        <th><button type="button" className="sort-btn" onClick={() => requestSort("name")}>{pageCopy.table.customer} <ArrowUpDown size={13} /></button></th>
                        <th>{pageCopy.table.contact}</th>
                        <th><button type="button" className="sort-btn" onClick={() => requestSort("status")}>{pageCopy.table.status} <ArrowUpDown size={13} /></button></th>
                        <th className="align-right"><button type="button" className="sort-btn align-right" onClick={() => requestSort("balance")}>{pageCopy.table.balance} <ArrowUpDown size={13} /></button></th>
                        <th><button type="button" className="sort-btn" onClick={() => requestSort("lastActivity")}>{pageCopy.table.activity} <ArrowUpDown size={13} /></button></th>
                        <th className="actions-col">{pageCopy.table.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCustomers.map((customer) => (
                        <tr key={customer.id} onClick={() => openDetails(customer)}>
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(customer.id)}
                              onChange={(e) =>
                                setSelectedRows((current) =>
                                  e.target.checked ? [...current, customer.id] : current.filter((id) => id !== customer.id)
                                )
                              }
                              aria-label={`${pageCopy.table.selectRow} ${customer.name}`}
                            />
                          </td>
                          <td>
                            <div className="customer-cell app-cell-stack compact">
                              <strong>{customer.name}</strong>
                              <small>{pageCopy.table.joined} {customer.joinedLabel}</small>
                              <span>{customer.id} | {customer.companyName || labelStatus(customer.customerType || "") || pageCopy.table.customerFallback}</span>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell compact">
                              <span><Mail size={13} /> {customer.email || pageCopy.table.noEmail}</span>
                              <span><Phone size={13} /> {customer.phone || pageCopy.table.noPhone}</span>
                            </div>
                          </td>
                          <td>
                            <div className="status-stack compact">
                              <span className={`customer-status-badge refined ${getStatusTone(customer.statusLabel)}`}>{labelStatus(customer.statusLabel)}</span>
                              {customer.tagsResolved.slice(0, 2).map((tag) => <small key={tag}>{labelStatus(tag)}</small>)}
                            </div>
                          </td>
                          <td className="align-right">
                            <div className="balance-cell compact">
                              <strong className={customer.outstandingBalance > 0 ? "danger-text" : ""}>{formatCurrency(customer.outstandingBalance, customer.currency ?? "USD")}</strong>
                              <span>
                                {customer.balanceState === "Debtor"
                                  ? `${formatNumber(customer.activeInvoices)} ${pageCopy.table.openInvoices}`
                                  : pageCopy.table.clearBalance}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="activity-cell app-cell-stack compact">
                              <strong>{customer.lastActivityDate ? formatLocaleDate(customer.lastActivityDate) : pageCopy.table.noActivity}</strong>
                              <span>{customer.lastActivityLabel}</span>
                              <small>{customer.notes?.trim() ? customer.notesPreview : pageCopy.table.noNotes}</small>
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="row-actions compact">
                              <button type="button" className="details-btn compact" onClick={() => openDetails(customer)}>
                                <Eye size={14} />
                                {pageCopy.table.open}
                              </button>
                              <button
                                type="button"
                                className="icon-btn quiet"
                                aria-label={pageCopy.table.moreActions}
                                onClick={(event) => {
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const menuWidth = 220;
                                  const shouldFlip = rect.bottom + 340 > window.innerHeight - 12;
                                  setActionMenu({
                                    customerId: customer.id,
                                    top: shouldFlip ? rect.top - 8 : rect.bottom + 10,
                                    left: Math.max(12, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)),
                                  });
                                }}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TableFooter
                  className="table-footer"
                  total={filteredCustomers.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(value) => {
                    setRowsPerPage(value);
                    setPage(1);
                  }}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </section>
      </div>

      {showFormModal && (
        <CustomerFormModal
          mode={formMode}
          values={formState}
          errors={formErrors}
          onChange={(field, value) => {
            setFormState((current) => {
              const next = { ...current, [field]: value };
              if (field === "name" && !editingCustomerId && !current.id) {
                next.id = buildCustomerCode(value, customers.length + 1);
              }
              return next;
            });
            setFormErrors((current) => ({ ...current, [field]: undefined }));
          }}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleSaveCustomer}
        />
      )}

      {activeCustomer && (
        <CustomerDetailsModal
          customer={activeCustomer}
          activeTab={detailsTab}
          onChangeTab={setDetailsTab}
          onClose={() => setActiveCustomer(null)}
          onEdit={() => openEdit(activeCustomer)}
          onCreateInvoice={() => setToast({ type: "info", message: `Open invoice workflow for ${activeCustomer.name}.` })}
          onRecordPayment={() => setToast({ type: "info", message: `Open payment workflow for ${activeCustomer.name}.` })}
          onAddNote={() => setToast({ type: "success", message: `Notes opened for ${activeCustomer.name}.` })}
        />
      )}

      {deleteTarget && (
        <div className="customer-modal-overlay" onClick={() => { setDeleteTarget(null); setDeleteCode(""); }}>
          <div className="delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-modal-header">
              <div>
                <span className="modal-eyebrow">Archive Customer</span>
                <h2>Confirm customer archive</h2>
                <p>To archive {deleteTarget.name}, enter the confirmation code below.</p>
              </div>
              <button type="button" className="icon-btn subtle" onClick={() => { setDeleteTarget(null); setDeleteCode(""); }}>
                <X size={18} />
              </button>
            </div>
            <div className="delete-modal-body">
              <p>Type <strong>{DELETE_CONFIRMATION_CODE}</strong> to continue.</p>
              <input value={deleteCode} onChange={(e) => setDeleteCode(e.target.value)} placeholder="Enter confirmation code" />
            </div>
            <div className="customer-modal-footer">
              <button type="button" className="secondary-btn" onClick={() => { setDeleteTarget(null); setDeleteCode(""); }}>Cancel</button>
              <button type="button" className="danger-btn" disabled={deleteCode !== DELETE_CONFIRMATION_CODE} onClick={handleDeleteCustomer}>Archive customer</button>
            </div>
          </div>
        </div>
      )}

      {actionMenu &&
        createPortal(
          <div
            ref={actionMenuRef}
            className="customer-action-menu"
            style={{
              top: actionMenu.top,
              left: actionMenu.left,
              transform: actionMenu.top > window.innerHeight / 2 ? "translateY(-100%)" : "none",
            }}
          >
            {(() => {
              const customer = customerRows.find((item) => item.id === actionMenu.customerId);
              if (!customer) return null;
              return (
                <>
                  <button type="button" onClick={() => openDetails(customer)}><Eye size={15} />View Customer</button>
                  <button type="button" onClick={() => openEdit(customer)}><UserCircle2 size={15} />Edit Customer</button>
                  <button type="button" onClick={() => { setToast({ type: "success", message: `Note flow opened for ${customer.name}.` }); setActionMenu(null); }}><StickyNote size={15} />Add Note</button>
                  <button type="button" onClick={() => { openDetails(customer); setDetailsTab("notes"); }}><Receipt size={15} />View Notes</button>
                  <button type="button" onClick={() => { setToast({ type: "info", message: `Invoice workflow opened for ${customer.name}.` }); setActionMenu(null); }}><FilePlus2 size={15} />Create Invoice</button>
                  <button type="button" onClick={() => { setToast({ type: "info", message: `Payment workflow opened for ${customer.name}.` }); setActionMenu(null); }}><CreditCard size={15} />Record Payment</button>
                  <button type="button" onClick={() => { openDetails(customer); setDetailsTab("orders"); }}><Building2 size={15} />View Orders</button>
                  <button type="button" onClick={() => {
                    const next = customers.map((entry) => entry.id === customer.id ? { ...entry, status: "Inactive" as PersistedCustomerStatus } : entry);
                    saveCustomers(next);
                    setCustomers(next);
                    setToast({ type: "success", message: `${customer.name} archived.` });
                    setActionMenu(null);
                  }}><Wallet size={15} />Archive</button>
                  <button type="button" className="danger" onClick={() => { setDeleteTarget(customer); setDeleteCode(""); setActionMenu(null); }}><Trash2 size={15} />Delete</button>
                </>
              );
            })()}
          </div>,
          document.body
        )}

      {toast && <div className={`app-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
