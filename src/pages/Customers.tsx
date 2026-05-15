import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  Star,
  Truck,
  UserCircle2,
  X,
} from "lucide-react";
import "./Customers.css";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import type { Customer, Invoice, Payment } from "../data/types";
import { getCustomers, getInvoices, getPayments, saveCustomers } from "../data/storage";

type CustomerType = "Individual" | "Business" | "VIP";
type CustomerStatus = "Active" | "Inactive" | "VIP" | "Blocked" | "New";

type InvoiceTimeFilter = "all" | "today" | "week" | "month" | "year";
type DebtFilter = "all" | "hasDebt" | "noDebt";
type OrderFilter = "all" | "hasUnreceivedOrder" | "noUnreceivedOrder";
type CustomerFormTab = "profile" | "billing";

type SortOption =
  | "nameAsc"
  | "nameDesc"
  | "highestBalance"
  | "lowestBalance"
  | "newestInvoice"
  | "oldestInvoice"
  | "customerType"
  | "debtAmount"
  | "region";

type PalestineLocation = {
  name: string;
  type: "Governorate" | "City" | "Town" | "Village" | "Camp";
  governorate: string;
};

type BillingProfile = {
  invoiceType: string;
  taxEnabled: boolean;
  taxRate: number;
  discountType: "none" | "percentage" | "fixed";
  discountValue: number;
  companyName: string;
  taxNumber: string;
  customTerms: string;
};

type CustomerForm = {
  name: string;
  customerType: CustomerType;
  status: CustomerStatus;
  phone: string;
  email: string;
  region: string;
  companyName: string;
  taxNumber: string;
  invoiceType: string;
  taxEnabled: boolean;
  taxRate: string;
  discountType: "none" | "percentage" | "fixed";
  discountValue: string;
  openingBalance: string;
  hasUnreceivedOrder: boolean;
  noteText: string;
  recommendationText: string;
  customTerms: string;
};

type FormErrors = Partial<Record<keyof CustomerForm, string>>;

type ExtendedCustomer = Customer & {
  billingProfile?: Partial<BillingProfile>;
  hasUnreceivedOrder?: boolean;
  noteText?: string;
  recommendationText?: string;
};

type CustomerRow = Customer & {
  displayCode: string;
  region: string;
  customerTypeResolved: CustomerType;
  statusResolved: CustomerStatus;
  lastInvoiceDate: string;
  lastActivityDate: string;
  outstandingBalance: number;
  debtAmount: number;
  hasDebt: boolean;
  hasUnreceivedOrder: boolean;
  noteText: string;
  recommendationText: string;
  billingProfile: BillingProfile;
};

const DELETE_CONFIRMATION_CODE = "123";

const EMPTY_FORM: CustomerForm = {
  name: "",
  customerType: "Individual",
  status: "Active",
  phone: "",
  email: "",
  region: "",
  companyName: "",
  taxNumber: "",
  invoiceType: "Standard Invoice",
  taxEnabled: false,
  taxRate: "0",
  discountType: "none",
  discountValue: "0",
  openingBalance: "0",
  hasUnreceivedOrder: false,
  noteText: "",
  recommendationText: "",
  customTerms: "",
};

const PALESTINE_LOCATIONS: PalestineLocation[] = [
  { name: "Jerusalem (القدس)", type: "Governorate", governorate: "Jerusalem" },
  { name: "Ramallah and Al-Bireh (رام الله والبيرة)", type: "Governorate", governorate: "Ramallah and Al-Bireh" },
  { name: "Hebron (الخليل)", type: "Governorate", governorate: "Hebron" },
  { name: "Bethlehem (بيت لحم)", type: "Governorate", governorate: "Bethlehem" },
  { name: "Nablus (نابلس)", type: "Governorate", governorate: "Nablus" },
  { name: "Jenin (جنين)", type: "Governorate", governorate: "Jenin" },
  { name: "Tulkarm (طولكرم)", type: "Governorate", governorate: "Tulkarm" },
  { name: "Qalqilya (قلقيلية)", type: "Governorate", governorate: "Qalqilya" },
  { name: "Salfit (سلفيت)", type: "Governorate", governorate: "Salfit" },
  { name: "Tubas (طوباس)", type: "Governorate", governorate: "Tubas" },
  { name: "Jericho (أريحا)", type: "Governorate", governorate: "Jericho" },
  { name: "Gaza (غزة)", type: "Governorate", governorate: "Gaza" },
  { name: "North Gaza (شمال غزة)", type: "Governorate", governorate: "North Gaza" },
  { name: "Deir al-Balah (دير البلح)", type: "Governorate", governorate: "Deir al-Balah" },
  { name: "Khan Yunis (خان يونس)", type: "Governorate", governorate: "Khan Yunis" },
  { name: "Rafah (رفح)", type: "Governorate", governorate: "Rafah" },

  { name: "Al-Bireh (البيرة)", type: "City", governorate: "Ramallah and Al-Bireh" },
  { name: "Beitunia (بيتونيا)", type: "City", governorate: "Ramallah and Al-Bireh" },
  { name: "Rawabi (روابي)", type: "City", governorate: "Ramallah and Al-Bireh" },
  { name: "Birzeit (بيرزيت)", type: "Town", governorate: "Ramallah and Al-Bireh" },
  { name: "Silwad (سلواد)", type: "Town", governorate: "Ramallah and Al-Bireh" },
  { name: "Dura (دورا)", type: "City", governorate: "Hebron" },
  { name: "Yatta (يطا)", type: "City", governorate: "Hebron" },
  { name: "Halhul (حلحول)", type: "City", governorate: "Hebron" },
  { name: "Beit Ummar (بيت أمر)", type: "Town", governorate: "Hebron" },
  { name: "Al-Dhahiriya (الظاهرية)", type: "Town", governorate: "Hebron" },
  { name: "Beit Jala (بيت جالا)", type: "City", governorate: "Bethlehem" },
  { name: "Beit Sahour (بيت ساحور)", type: "City", governorate: "Bethlehem" },
  { name: "Al-Khader (الخضر)", type: "Town", governorate: "Bethlehem" },
  { name: "Al-Eizariya (العيزرية)", type: "Town", governorate: "Jerusalem" },
  { name: "Abu Dis (أبو ديس)", type: "Town", governorate: "Jerusalem" },
  { name: "Anata (عناتا)", type: "Town", governorate: "Jerusalem" },
  { name: "Beit Hanina (بيت حنينا)", type: "Town", governorate: "Jerusalem" },
  { name: "Asira ash-Shamaliya (عصيرة الشمالية)", type: "Town", governorate: "Nablus" },
  { name: "Beita (بيتا)", type: "Town", governorate: "Nablus" },
  { name: "Huwara (حوارة)", type: "Town", governorate: "Nablus" },
  { name: "Balata Camp (مخيم بلاطة)", type: "Camp", governorate: "Nablus" },
  { name: "Qabatiya (قباطية)", type: "Town", governorate: "Jenin" },
  { name: "Arraba (عرابة)", type: "Town", governorate: "Jenin" },
  { name: "Ya'bad (يعبد)", type: "Town", governorate: "Jenin" },
  { name: "Anabta (عنبتا)", type: "Town", governorate: "Tulkarm" },
  { name: "Attil (عتيل)", type: "Town", governorate: "Tulkarm" },
  { name: "Bala'a (بلعا)", type: "Town", governorate: "Tulkarm" },
  { name: "Azzun (عزون)", type: "Town", governorate: "Qalqilya" },
  { name: "Habla (حبلة)", type: "Town", governorate: "Qalqilya" },
  { name: "Bidya (بديا)", type: "Town", governorate: "Salfit" },
  { name: "Kifl Haris (كفل حارس)", type: "Village", governorate: "Salfit" },
  { name: "Aqaba (العقبة)", type: "Village", governorate: "Tubas" },
  { name: "Tammun (طمون)", type: "Town", governorate: "Tubas" },
  { name: "Al-Auja (العوجا)", type: "Town", governorate: "Jericho" },
  { name: "Aqabat Jaber Camp (مخيم عقبة جبر)", type: "Camp", governorate: "Jericho" },
  { name: "Jabalia (جباليا)", type: "City", governorate: "North Gaza" },
  { name: "Beit Lahia (بيت لاهيا)", type: "City", governorate: "North Gaza" },
  { name: "Beit Hanoun (بيت حانون)", type: "City", governorate: "North Gaza" },
  { name: "Al-Zahra (الزهراء)", type: "City", governorate: "Gaza" },
  { name: "Al-Maghazi (المغازي)", type: "Camp", governorate: "Deir al-Balah" },
  { name: "Nuseirat (النصيرات)", type: "Camp", governorate: "Deir al-Balah" },
  { name: "Bani Suheila (بني سهيلا)", type: "Town", governorate: "Khan Yunis" },
  { name: "Abasan al-Kabira (عبسان الكبيرة)", type: "Town", governorate: "Khan Yunis" },
];

function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function numericDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function isWithinInvoiceFilter(dateValue: string, filter: InvoiceTimeFilter) {
  if (filter === "all") return true;
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "today") {
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return target.getTime() === startOfToday.getTime();
  }

  const diffDays = (startOfToday.getTime() - date.getTime()) / 86400000;

  if (filter === "week") return diffDays <= 7;
  if (filter === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (filter === "year") return date.getFullYear() === now.getFullYear();

  return true;
}

function buildCustomerCode(customers: Customer[]) {
  const maxNumber = customers.reduce((max, customer) => {
    const rawId = String(customer.id || "");
    const match = rawId.match(/^CUST-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1000);

  return `CUST-${maxNumber + 1}`;
}

function getBillingProfile(customer: Customer): BillingProfile {
  const raw = customer as ExtendedCustomer;
  const profile = raw.billingProfile || {};

  return {
    invoiceType: profile.invoiceType || "Standard Invoice",
    taxEnabled: Boolean(profile.taxEnabled),
    taxRate: Number(profile.taxRate || 0),
    discountType: profile.discountType || "none",
    discountValue: Number(profile.discountValue || 0),
    companyName: profile.companyName || String((customer as any).companyName || ""),
    taxNumber: profile.taxNumber || String((customer as any).taxNumber || ""),
    customTerms: profile.customTerms || "",
  };
}

function normalizeCustomerRows(customers: Customer[], invoices: Invoice[], payments: Payment[]) {
  return customers
    .filter((customer) => !(customer as any).isDeleted)
    .map((customer): CustomerRow => {
      const rawCustomer = customer as ExtendedCustomer;

      const customerInvoices = invoices
        .filter((invoice) => invoice.customerId === customer.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const customerPayments = payments
        .filter((payment) => payment.customerId === customer.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const invoiceDebt = customerInvoices.reduce((sum, invoice) => {
        return sum + Number((invoice as any).remainingAmount ?? (invoice as any).remaining ?? 0);
      }, 0);

      const openingBalance = Number((customer as any).openingBalance ?? 0);
      const outstandingBalance = Math.max(roundMoney(openingBalance + invoiceDebt), 0);

      const lastInvoiceDate = customerInvoices[0]?.date ?? "";
      const lastPaymentDate = customerPayments[0]?.date ?? "";
      const lastActivityDate =
        [lastInvoiceDate, lastPaymentDate, (customer as any).joinedAt]
          .filter(Boolean)
          .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] ?? "";

      const customerTypeResolved = (((customer as any).customerType as CustomerType) || "Individual") as CustomerType;
      const statusResolved = (((customer as any).status as CustomerStatus) || "Active") as CustomerStatus;

      return {
        ...customer,
        displayCode: customer.id,
        region: String((customer as any).city || (customer as any).location || ""),
        customerTypeResolved,
        statusResolved,
        lastInvoiceDate,
        lastActivityDate,
        outstandingBalance,
        debtAmount: outstandingBalance,
        hasDebt: outstandingBalance > 0,
        hasUnreceivedOrder: Boolean(rawCustomer.hasUnreceivedOrder),
        noteText: rawCustomer.noteText || String((customer as any).notes || ""),
        recommendationText: rawCustomer.recommendationText || String((customer as any).internalNotes || ""),
        billingProfile: getBillingProfile(customer),
      };
    });
}

function statusClass(status: CustomerStatus) {
  if (status === "VIP") return "status-vip";
  if (status === "Blocked") return "status-blocked";
  if (status === "Inactive") return "status-inactive";
  if (status === "New") return "status-new";
  return "status-active";
}

function typeIcon(type: CustomerType) {
  if (type === "Business") return <Building2 size={13} />;
  if (type === "VIP") return <Star size={13} />;
  return <UserCircle2 size={13} />;
}

export default function Customers() {
  const settings = useSettings();
  const formatCurrency =
    settings.formatCurrency ||
    ((value: number, currency = "USD") =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(Number(value || 0)));

  const formatNumber =
    settings.formatNumber ||
    ((value: number) => new Intl.NumberFormat("en-US").format(Number(value || 0)));

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newestInvoice");
  const [invoiceTimeFilter, setInvoiceTimeFilter] = useState<InvoiceTimeFilter>("all");
  const [debtFilter, setDebtFilter] = useState<DebtFilter>("all");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [viewCustomer, setViewCustomer] = useState<CustomerRow | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [formState, setFormState] = useState<CustomerForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [activeFormTab, setActiveFormTab] = useState<CustomerFormTab>("profile");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [toast, setToast] = useState("");

  const filtersRef = useRef<HTMLDivElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  const isBusinessCustomer = formState.customerType === "Business";

  useEffect(() => {
    try {
      setCustomers(getCustomers());
      setInvoices(getInvoices());
      setPayments(getPayments());
      setLoadError("");
    } catch {
      setLoadError("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (showFilters && filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }

      if (showLocationDropdown && locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showFilters, showLocationDropdown]);

  const customerRows = useMemo(
    () => normalizeCustomerRows(customers, invoices, payments),
    [customers, invoices, payments]
  );

  const filteredLocations = useMemo(() => {
    const query = formState.region.trim().toLowerCase();

    return PALESTINE_LOCATIONS.filter((location) => {
      const haystack = `${location.name} ${location.type} ${location.governorate}`.toLowerCase();
      return query ? haystack.includes(query) : true;
    }).slice(0, 80);
  }, [formState.region]);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = customerRows.filter((customer) => {
      if (query) {
        const haystack = [
          customer.name,
          customer.displayCode,
          customer.phone,
          customer.email,
          customer.region,
          customer.customerTypeResolved,
          customer.statusResolved,
          customer.noteText,
          customer.recommendationText,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (invoiceTimeFilter !== "all" && !isWithinInvoiceFilter(customer.lastInvoiceDate, invoiceTimeFilter)) {
        return false;
      }

      if (debtFilter === "hasDebt" && !customer.hasDebt) return false;
      if (debtFilter === "noDebt" && customer.hasDebt) return false;

      if (orderFilter === "hasUnreceivedOrder" && !customer.hasUnreceivedOrder) return false;
      if (orderFilter === "noUnreceivedOrder" && customer.hasUnreceivedOrder) return false;

      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
      if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
      if (sortBy === "highestBalance") return b.outstandingBalance - a.outstandingBalance;
      if (sortBy === "lowestBalance") return a.outstandingBalance - b.outstandingBalance;
      if (sortBy === "newestInvoice") return new Date(b.lastInvoiceDate || 0).getTime() - new Date(a.lastInvoiceDate || 0).getTime();
      if (sortBy === "oldestInvoice") return new Date(a.lastInvoiceDate || 0).getTime() - new Date(b.lastInvoiceDate || 0).getTime();
      if (sortBy === "customerType") return a.customerTypeResolved.localeCompare(b.customerTypeResolved);
      if (sortBy === "debtAmount") return b.debtAmount - a.debtAmount;
      if (sortBy === "region") return a.region.localeCompare(b.region);
      return 0;
    });
  }, [customerRows, searchTerm, invoiceTimeFilter, debtFilter, orderFilter, sortBy]);

  const kpis = useMemo(() => {
    return {
      total: customerRows.length,
      debtors: customerRows.filter((customer) => customer.hasDebt).length,
      unreceived: customerRows.filter((customer) => customer.hasUnreceivedOrder).length,
      outstanding: roundMoney(customerRows.reduce((sum, customer) => sum + customer.outstandingBalance, 0)),
    };
  }, [customerRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  function getCustomerInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  const AVATAR_COLORS = ["#2563eb","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#db2777","#65a30d"];
  function getAvatarBg(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function updateForm<K extends keyof CustomerForm>(field: K, value: CustomerForm[K]) {
    setFormState((current) => {
      const next = { ...current, [field]: value };

      if (field === "customerType") {
        const type = value as CustomerType;

        if (type === "Business") {
          next.status = current.status === "VIP" ? "Active" : current.status;
          next.invoiceType = current.invoiceType === "VIP Invoice" ? "Company Invoice" : current.invoiceType;
        } else if (type === "VIP") {
          next.status = "VIP";
          next.invoiceType = "VIP Invoice";
          next.taxEnabled = false;
          next.taxRate = "0";
          next.taxNumber = "";
        } else {
          next.status = current.status === "VIP" ? "Active" : current.status;
          next.invoiceType = "Standard Invoice";
          next.taxEnabled = false;
          next.taxRate = "0";
          next.taxNumber = "";
        }
      }

      return next;
    });

    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateForm() {
    const errors: FormErrors = {};

    if (!formState.name.trim()) {
      errors.name = "Customer name is required.";
    }

    if (!formState.phone.trim() && !formState.email.trim()) {
      errors.phone = "Phone or email is required.";
      errors.email = "Phone or email is required.";
    }

    if (formState.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      errors.email = "Invalid email address.";
    }

    if (Number.isNaN(Number(formState.openingBalance || 0))) {
      errors.openingBalance = "Opening balance must be numeric.";
    }

    if (formState.discountType !== "none" && Number.isNaN(Number(formState.discountValue || 0))) {
      errors.discountValue = "Discount value must be numeric.";
    }

    if (isBusinessCustomer && formState.taxEnabled && Number.isNaN(Number(formState.taxRate || 0))) {
      errors.taxRate = "Tax rate must be numeric.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openCreateModal() {
    const nextCode = buildCustomerCode(customers);
    setGeneratedCode(nextCode);
    setEditingCustomer(null);
    setFormState(EMPTY_FORM);
    setFormErrors({});
    setActiveFormTab("profile");
    setShowCustomerModal(true);
  }

  function openEditModal(customer: CustomerRow) {
    setGeneratedCode(customer.displayCode);
    setEditingCustomer(customer);
    setFormErrors({});
    setActiveFormTab("profile");

    setFormState({
      name: customer.name || "",
      customerType: customer.customerTypeResolved,
      status: customer.statusResolved,
      phone: customer.phone || "",
      email: customer.email || "",
      region: customer.region || "",
      companyName: customer.billingProfile.companyName || "",
      taxNumber: customer.billingProfile.taxNumber || "",
      invoiceType: customer.billingProfile.invoiceType || "Standard Invoice",
      taxEnabled: customer.customerTypeResolved === "Business" ? customer.billingProfile.taxEnabled : false,
      taxRate: customer.customerTypeResolved === "Business" ? String(customer.billingProfile.taxRate || 0) : "0",
      discountType: customer.billingProfile.discountType || "none",
      discountValue: String(customer.billingProfile.discountValue || 0),
      openingBalance: String((customer as any).openingBalance || 0),
      hasUnreceivedOrder: customer.hasUnreceivedOrder,
      noteText: customer.noteText || "",
      recommendationText: customer.recommendationText || "",
      customTerms: customer.billingProfile.customTerms || "",
    });

    setShowCustomerModal(true);
  }

  function requestCloseModal() {
    setShowCustomerModal(false);
    setEditingCustomer(null);
    setGeneratedCode("");
    setFormState(EMPTY_FORM);
    setFormErrors({});
    setShowLocationDropdown(false);
  }

  function chooseLocation(location: PalestineLocation) {
    updateForm("region", location.name);
    setShowLocationDropdown(false);
  }

  function buildCustomerPayload(): Customer {
    const code = editingCustomer?.id || generatedCode || buildCustomerCode(customers);
    const businessBilling: BillingProfile = {
      invoiceType: formState.invoiceType,
      taxEnabled: isBusinessCustomer ? formState.taxEnabled : false,
      taxRate: isBusinessCustomer ? Number(formState.taxRate || 0) : 0,
      discountType: formState.discountType,
      discountValue: Number(formState.discountValue || 0),
      companyName: formState.companyName.trim(),
      taxNumber: isBusinessCustomer ? formState.taxNumber.trim() : "",
      customTerms: formState.customTerms.trim(),
    };

    return {
      ...(editingCustomer || {}),
      id: code,
      name: formState.name.trim(),
      phone: formState.phone.trim(),
      email: formState.email.trim(),
      city: formState.region.trim(),
      location: formState.region.trim(),
      customerType: formState.customerType,
      status: formState.status,
      openingBalance: Number(formState.openingBalance || 0),
      joinedAt: (editingCustomer as any)?.joinedAt || new Date().toISOString().split("T")[0],
      notes: formState.noteText.trim(),
      internalNotes: formState.recommendationText.trim(),
      hasUnreceivedOrder: formState.hasUnreceivedOrder,
      noteText: formState.noteText.trim(),
      recommendationText: formState.recommendationText.trim(),
      billingProfile: businessBilling,
      isDeleted: false,
    } as Customer;
  }

  function handleSaveCustomer() {
    if (!validateForm()) return;

    const payload = buildCustomerPayload();

    const nextCustomers = editingCustomer
      ? customers.map((customer) => (customer.id === editingCustomer.id ? payload : customer))
      : [payload, ...customers];

    saveCustomers(nextCustomers);
    setCustomers(nextCustomers);
    setToast(editingCustomer ? "Customer updated." : "Customer added.");
    requestCloseModal();
  }

  function requestDeleteCustomer(customer: CustomerRow) {
    setDeleteTarget(customer);
    setDeleteCode("");
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteCode("");
  }

  function confirmDeleteCustomer() {
    if (!deleteTarget) return;
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) return;

    const nextCustomers = customers.map((customer) =>
      customer.id === deleteTarget.id ? ({ ...customer, isDeleted: true } as Customer) : customer
    );

    saveCustomers(nextCustomers);
    setCustomers(nextCustomers);

    if (viewCustomer?.id === deleteTarget.id) {
      setViewCustomer(null);
    }

    closeDeleteModal();
    setToast("Customer deleted.");
  }

  function clearFilters() {
    setInvoiceTimeFilter("all");
    setDebtFilter("all");
    setOrderFilter("all");
    setPage(1);
  }

  if (loading) {
    return (
      <div className="customers-page">
        <div className="customers-state-card">
          <AlertCircle size={20} />
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="customers-page">
        <div className="customers-state-card error">
          <AlertCircle size={20} />
          <p>{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customers-page">
      <section className="customers-topbar">
        <div>
          <h1>Customers</h1>
          <p>Manage customer accounts, balances, billing preferences, and follow-up activity.</p>
        </div>

        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={17} />}>
          Add Customer
        </Button>
      </section>

      <section className="customers-kpis">
        <article>
          <div className="cust-kpi-icon blue"><UserCircle2 size={20} /></div>
          <div className="cust-kpi-body">
            <strong>{formatNumber(kpis.total)}</strong>
            <span>Customers</span>
            <small className="cust-kpi-desc">Total customers</small>
          </div>
        </article>
        <article>
          <div className="cust-kpi-icon amber"><AlertCircle size={20} /></div>
          <div className="cust-kpi-body">
            <strong>{formatNumber(kpis.debtors)}</strong>
            <span>Debtors</span>
            <small className="cust-kpi-desc">With outstanding</small>
          </div>
        </article>
        <article>
          <div className="cust-kpi-icon orange"><Truck size={20} /></div>
          <div className="cust-kpi-body">
            <strong>{formatNumber(kpis.unreceived)}</strong>
            <span>Unreceived Orders</span>
            <small className="cust-kpi-desc">Pending receipt</small>
          </div>
        </article>
        <article>
          <div className="cust-kpi-icon purple"><Receipt size={20} /></div>
          <div className="cust-kpi-body">
            <strong>{formatCurrency(kpis.outstanding, "USD")}</strong>
            <span>Total Outstanding</span>
            <small className="cust-kpi-desc">Across all customers</small>
          </div>
        </article>
      </section>

      <section className="customers-card">
        <div className="customers-controls">
          <div className="customer-search">
            <Input
              variant="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, code, phone, email, region, note..."
              leftIcon={<Search size={17} />}
              fullWidth
            />
          </div>

          <div className="customer-control-actions">
            <label className="customer-sort">
              <ArrowUpDown size={15} />
              <Select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                options={[
                  { value: "nameAsc", label: "Name A-Z" },
                  { value: "nameDesc", label: "Name Z-A" },
                  { value: "highestBalance", label: "Highest Balance" },
                  { value: "lowestBalance", label: "Lowest Balance" },
                  { value: "newestInvoice", label: "Newest Invoice" },
                  { value: "oldestInvoice", label: "Oldest Invoice" },
                  { value: "customerType", label: "Customer Type" },
                  { value: "debtAmount", label: "Debt Amount" },
                  { value: "region", label: "Region" },
                ]}
              />
            </label>

            <div className="customer-filter-anchor" ref={filtersRef}>
              <button
                type="button"
                className={`customer-filter-btn ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters((current) => !current)}
              >
                <Filter size={15} />
                Filters
                <ChevronDown size={14} />
              </button>

              {showFilters && (
                <div className="customer-filter-dropdown">
                  <div className="filter-dropdown-head">
                    <div>
                      <h3>Filters</h3>
                      <p>Refine customers without taking over the page.</p>
                    </div>

                    <button type="button" onClick={() => setShowFilters(false)} aria-label="Close filters">
                      <X size={15} />
                    </button>
                  </div>

                  <section>
                    <h4>Invoice Time</h4>
                    <div className="filter-options">
                      {[
                        ["all", "All Time"],
                        ["today", "Today"],
                        ["week", "This Week"],
                        ["month", "This Month"],
                        ["year", "This Year"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={invoiceTimeFilter === value ? "active" : ""}
                          onClick={() => setInvoiceTimeFilter(value as InvoiceTimeFilter)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4>Debt</h4>
                    <div className="filter-options">
                      {[
                        ["all", "All Customers"],
                        ["hasDebt", "Has Debt"],
                        ["noDebt", "No Debt"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={debtFilter === value ? "active" : ""}
                          onClick={() => setDebtFilter(value as DebtFilter)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4>Orders</h4>
                    <div className="filter-options">
                      {[
                        ["all", "All Customers"],
                        ["hasUnreceivedOrder", "Has Unreceived Order"],
                        ["noUnreceivedOrder", "No Unreceived Orders"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={orderFilter === value ? "active" : ""}
                          onClick={() => setOrderFilter(value as OrderFilter)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="filter-dropdown-actions">
                    <button type="button" className="secondary-action" onClick={clearFilters}>
                      Reset
                    </button>
                    <button type="button" className="primary-action" onClick={() => setShowFilters(false)}>
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Region</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Last Invoice / Activity</th>
                <th>Status</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-table-cell">
                    No matching customers found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-name-cell">
                        <div
                          className="cust-avatar"
                          style={{ background: getAvatarBg(customer.name) }}
                        >
                          {getCustomerInitials(customer.name)}
                        </div>
                        <div className="customer-name-info">
                          <strong>{customer.name}</strong>
                          <span>{customer.displayCode}</span>
                          {customer.email && (
                            <small>
                              <Mail size={13} />
                              {customer.email}
                            </small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      {customer.phone ? (
                        <span className="inline-icon-text">
                          <Phone size={14} />
                          {customer.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      {customer.region ? (
                        <span className="inline-icon-text">
                          <MapPin size={14} />
                          {customer.region}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <Badge
                        variant={customer.customerTypeResolved === "VIP" ? "warning" : customer.customerTypeResolved === "Business" ? "info" : "neutral"}
                        leftIcon={typeIcon(customer.customerTypeResolved)}
                        className={`customer-type-pill type-${customer.customerTypeResolved.toLowerCase()}`}
                      >
                        {customer.customerTypeResolved}
                      </Badge>
                    </td>

                    <td>
                      <strong>{formatCurrency(customer.outstandingBalance, "USD")}</strong>
                      <small className={customer.hasDebt ? "debt-text" : "clear-text"}>
                        {customer.hasDebt ? "Outstanding" : "Clear balance"}
                      </small>
                    </td>

                    <td>
                      <strong>{numericDate(customer.lastInvoiceDate || customer.lastActivityDate)}</strong>
                      <small>{customer.lastInvoiceDate ? "Last invoice" : "Last activity"}</small>
                    </td>

                    <td>
                      <div className="status-stack">
                        <Badge
                          variant={
                            customer.statusResolved === "VIP"
                              ? "warning"
                              : customer.statusResolved === "Blocked"
                              ? "danger"
                              : customer.statusResolved === "Inactive"
                              ? "neutral"
                              : customer.statusResolved === "New"
                              ? "info"
                              : "success"
                          }
                          className={`status-pill ${statusClass(customer.statusResolved)}`}
                        >
                          {customer.statusResolved}
                        </Badge>

                        {customer.hasUnreceivedOrder ? (
                          <Badge variant="warning" leftIcon={<Truck size={12} />} className="delivery-pill">
                            Pending order
                          </Badge>
                        ) : (
                          <Badge variant="success" leftIcon={<CheckCircle2 size={12} />} className="clear-pill">
                            Clear
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td>
                      {customer.noteText || customer.recommendationText ? (
                        <Badge variant="info" leftIcon={<Receipt size={13} />} className="note-pill">
                          Note
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="no-note-pill">No note</Badge>
                      )}
                    </td>

                    <td>
                      <div className="customer-row-actions">
                        <Button variant="icon" size="sm" title="View customer" onClick={() => setViewCustomer(customer)}>
                          <Eye size={15} />
                        </Button>
                        <Button variant="icon" size="sm" title="Edit customer" onClick={() => openEditModal(customer)}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="icon" size="sm" title="Delete customer" onClick={() => requestDeleteCustomer(customer)}>
                          <MoreVertical size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > rowsPerPage && (
          <div className="cust-pagination">
            <span className="cust-pagination-info">
              Showing {(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, filteredRows.length)} of {filteredRows.length} customers
            </span>
            <div className="cust-pagination-btns">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cust-page-btn"
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span key={`ellipsis-${idx}`} className="cust-page-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`cust-page-btn${safePage === p ? " active" : ""}`}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="cust-page-btn"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </section>

      <Modal
        isOpen={showCustomerModal}
        onClose={requestCloseModal}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        description="Customer code is generated automatically. Add only the details you need."
        size="lg"
        className="customer-modal customer-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={requestCloseModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveCustomer}>
              {editingCustomer ? "Save Changes" : "Add Customer"}
            </Button>
          </>
        }
      >
            <div className="customer-form-tabs">
              <button
                type="button"
                className={activeFormTab === "profile" ? "active" : ""}
                onClick={() => setActiveFormTab("profile")}
              >
                Customer Profile
              </button>

              <button
                type="button"
                className={activeFormTab === "billing" ? "active" : ""}
                onClick={() => setActiveFormTab("billing")}
              >
                Billing & Terms
              </button>
            </div>

            <div className="customer-modal-body">
              {activeFormTab === "profile" && (
                <>
                  <section className="form-section">
                    <div className="form-section-title">
                      <h3>Basic Information</h3>
                      <p>Name is required. Phone or email is required.</p>
                    </div>

                    <div className="form-grid customer-basic-grid">
                      <div className="field-span-2">
                        <Input
                          label="Customer Name *"
                          value={formState.name}
                          onChange={(event) => updateForm("name", event.target.value)}
                          placeholder="Enter customer name"
                          error={formErrors.name}
                          fullWidth
                        />
                      </div>

                      <Input
                        label="Customer Code"
                        value={generatedCode}
                        readOnly
                        fullWidth
                      />

                      <Select
                        label="Customer Type"
                        value={formState.customerType}
                        onChange={(event) => updateForm("customerType", event.target.value as CustomerType)}
                        options={[
                          { value: "Individual", label: "Individual" },
                          { value: "Business", label: "Business" },
                          { value: "VIP", label: "VIP" },
                        ]}
                        fullWidth
                      />

                      <Select
                        label="Status"
                        value={formState.status}
                        onChange={(event) => updateForm("status", event.target.value as CustomerStatus)}
                        options={[
                          { value: "Active", label: "Active" },
                          { value: "New", label: "New" },
                          { value: "VIP", label: "VIP" },
                          { value: "Inactive", label: "Inactive" },
                          { value: "Blocked", label: "Blocked" },
                        ]}
                        fullWidth
                      />
                    </div>
                  </section>

                  <section className="form-section">
                    <div className="form-section-title">
                      <h3>Contact & Location</h3>
                      <p>Email is optional if phone exists. Use smart search for Palestinian locations.</p>
                    </div>

                    <div className="form-grid">
                      <Input
                        label="Phone Number"
                        variant="tel"
                        value={formState.phone}
                        onChange={(event) => updateForm("phone", event.target.value)}
                        placeholder="059xxxxxxx"
                        error={formErrors.phone}
                        fullWidth
                      />

                      <Input
                        label="Email Address Optional"
                        variant="email"
                        value={formState.email}
                        onChange={(event) => updateForm("email", event.target.value)}
                        placeholder="example@email.com"
                        error={formErrors.email}
                        fullWidth
                      />

                      <div className="field-span-2 location-field" ref={locationRef}>
                        <Input
                          label="Region / Location"
                          variant="search"
                          value={formState.region}
                          onChange={(event) => {
                            updateForm("region", event.target.value);
                            setShowLocationDropdown(true);
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          placeholder="Search city, governorate, village, or camp..."
                          fullWidth
                        />

                        {showLocationDropdown && (
                          <div className="location-dropdown">
                            {filteredLocations.length === 0 ? (
                              <button type="button" disabled>
                                No matching location
                              </button>
                            ) : (
                              filteredLocations.map((location) => (
                                <button
                                  type="button"
                                  key={`${location.name}-${location.type}-${location.governorate}`}
                                  onClick={() => chooseLocation(location)}
                                >
                                  <MapPin size={14} />
                                  <span>{location.name}</span>
                                  <small>
                                    {location.type} · {location.governorate}
                                  </small>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="form-section">
                    <div className="form-section-title">
                      <h3>Notes & Follow-up</h3>
                      <p>Mark customers that need attention, recommendations, or unreceived orders.</p>
                    </div>

                    <div className="form-grid">
                      <label className="inline-check-card field-span-2">
                        <input
                          type="checkbox"
                          checked={formState.hasUnreceivedOrder}
                          onChange={(event) => updateForm("hasUnreceivedOrder", event.target.checked)}
                        />
                        <span>
                          Customer has an unreceived order
                          <small>This flag will appear in the customer status.</small>
                        </span>
                      </label>

                      <div className="field-span-2">
                        <Textarea
                          label="Note"
                          value={formState.noteText}
                          onChange={(event) => updateForm("noteText", event.target.value)}
                          placeholder="Customer note..."
                          fullWidth
                        />
                      </div>

                      <div className="field-span-2">
                        <Textarea
                          label="Recommendation"
                          value={formState.recommendationText}
                          onChange={(event) => updateForm("recommendationText", event.target.value)}
                          placeholder="Recommendation or follow-up..."
                          fullWidth
                        />
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeFormTab === "billing" && (
                <>
                  <section className="form-section">
                    <div className="form-section-title">
                      <h3>Billing Settings</h3>
                      <p>
                        Tax settings are shown only for business customers. Individual and VIP customers do not need tax fields.
                      </p>
                    </div>

                    <div className="form-grid">
                      <Input
                        label={isBusinessCustomer ? "Company Name" : "Account Name Optional"}
                        value={formState.companyName}
                        onChange={(event) => updateForm("companyName", event.target.value)}
                        placeholder={isBusinessCustomer ? "Company legal name" : "Optional display/account name"}
                        fullWidth
                      />

                      <Select
                        label="Invoice Type"
                        value={formState.invoiceType}
                        onChange={(event) => updateForm("invoiceType", event.target.value)}
                        options={[
                          { value: "Standard Invoice", label: "Standard Invoice" },
                          ...(isBusinessCustomer ? [{ value: "Company Invoice", label: "Company Invoice" }] : []),
                          ...(formState.customerType === "VIP" ? [{ value: "VIP Invoice", label: "VIP Invoice" }] : []),
                        ]}
                        fullWidth
                      />

                      <Input
                        label="Opening Balance"
                        variant="number"
                        value={formState.openingBalance}
                        onChange={(event) => updateForm("openingBalance", event.target.value)}
                        placeholder="0"
                        error={formErrors.openingBalance}
                        fullWidth
                      />

                      <Select
                        label="Discount Type"
                        value={formState.discountType}
                        onChange={(event) => {
                          const value = event.target.value as CustomerForm["discountType"];
                          updateForm("discountType", value);
                          if (value === "none") updateForm("discountValue", "0");
                        }}
                        options={[
                          { value: "none", label: "None" },
                          { value: "percentage", label: "Percentage" },
                          { value: "fixed", label: "Fixed" },
                        ]}
                        fullWidth
                      />

                      <Input
                        label="Discount Value"
                        variant="number"
                        disabled={formState.discountType === "none"}
                        value={formState.discountValue}
                        onChange={(event) => updateForm("discountValue", event.target.value)}
                        placeholder="0"
                        error={formErrors.discountValue}
                        fullWidth
                      />

                      {isBusinessCustomer && (
                        <div className="settings-card field-span-2">
                          <div className="settings-card-head">
                            <h4>Business Tax Settings</h4>
                            <label className="inline-check">
                              <input
                                type="checkbox"
                                checked={formState.taxEnabled}
                                onChange={(event) => updateForm("taxEnabled", event.target.checked)}
                              />
                              <span>Enable tax</span>
                            </label>
                          </div>

                          <div className="settings-grid">
                            <Input
                              label="Tax Number"
                              value={formState.taxNumber}
                              onChange={(event) => updateForm("taxNumber", event.target.value)}
                              placeholder="Company tax number"
                              fullWidth
                            />

                            <Input
                              label="Tax Rate"
                              variant="number"
                              disabled={!formState.taxEnabled}
                              value={formState.taxRate}
                              onChange={(event) => updateForm("taxRate", event.target.value)}
                              placeholder="0"
                              error={formErrors.taxRate}
                              fullWidth
                            />
                          </div>
                        </div>
                      )}

                      <div className="field-span-2">
                        <Textarea
                          label="Custom Terms"
                          value={formState.customTerms}
                          onChange={(event) => updateForm("customTerms", event.target.value)}
                          placeholder="Payment terms, tax notes, special invoice requirements..."
                          fullWidth
                        />
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

      </Modal>

      {viewCustomer && (
        <Modal
          isOpen={!!viewCustomer}
          onClose={() => setViewCustomer(null)}
          title={viewCustomer.name}
          description={`${viewCustomer.displayCode} · ${viewCustomer.customerTypeResolved} · ${viewCustomer.statusResolved}`}
          size="lg"
          className="customer-modal customer-view-modal"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  const target = viewCustomer;
                  setViewCustomer(null);
                  openEditModal(target);
                }}
              >
                Edit Customer
              </Button>
              <Button variant="danger" onClick={() => requestDeleteCustomer(viewCustomer)}>
                Delete Customer
              </Button>
            </>
          }
        >
            <div className="customer-modal-body">
              <section className="view-section">
                <h3>Customer Overview</h3>

                <div className="view-grid">
                  <div>
                    <span>Phone</span>
                    <strong>{viewCustomer.phone || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{viewCustomer.email || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Region</span>
                    <strong>{viewCustomer.region || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Balance</span>
                    <strong>{formatCurrency(viewCustomer.outstandingBalance, "USD")}</strong>
                  </div>
                  <div>
                    <span>Last Invoice</span>
                    <strong>{numericDate(viewCustomer.lastInvoiceDate)}</strong>
                  </div>
                  <div>
                    <span>Order Status</span>
                    <strong>{viewCustomer.hasUnreceivedOrder ? "Has unreceived order" : "Clear"}</strong>
                  </div>
                </div>
              </section>

              <section className="view-section">
                <h3>Billing & Terms</h3>

                <div className="view-grid">
                  <div>
                    <span>Invoice Type</span>
                    <strong>{viewCustomer.billingProfile.invoiceType}</strong>
                  </div>
                  <div>
                    <span>Tax</span>
                    <strong>
                      {viewCustomer.customerTypeResolved === "Business" && viewCustomer.billingProfile.taxEnabled
                        ? `${viewCustomer.billingProfile.taxRate}%`
                        : "Off"}
                    </strong>
                  </div>
                  <div>
                    <span>Tax Number</span>
                    <strong>
                      {viewCustomer.customerTypeResolved === "Business"
                        ? viewCustomer.billingProfile.taxNumber || "Not set"
                        : "Not applicable"}
                    </strong>
                  </div>
                  <div>
                    <span>Discount</span>
                    <strong>
                      {viewCustomer.billingProfile.discountType === "none"
                        ? "None"
                        : `${viewCustomer.billingProfile.discountValue}${
                            viewCustomer.billingProfile.discountType === "percentage" ? "%" : ""
                          }`}
                    </strong>
                  </div>
                </div>

                <div className="view-note-box">
                  <span>Custom Terms</span>
                  <p>{viewCustomer.billingProfile.customTerms || "No custom terms added."}</p>
                </div>
              </section>

              <section className="view-section">
                <h3>Notes & Recommendations</h3>

                <div className="view-note-box">
                  <span>Note</span>
                  <p>{viewCustomer.noteText || "No note added."}</p>
                </div>

                <div className="view-note-box">
                  <span>Recommendation</span>
                  <p>{viewCustomer.recommendationText || "No recommendation added."}</p>
                </div>
              </section>

            </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={closeDeleteModal}
          variant="alert"
          size="sm"
          title="Delete customer?"
          className="delete-confirm-card"
          footer={
            <>
              <Button variant="secondary" onClick={closeDeleteModal}>Cancel</Button>
              <Button
                variant="danger"
                disabled={deleteCode.trim() !== DELETE_CONFIRMATION_CODE}
                onClick={confirmDeleteCustomer}
              >
                Delete Customer
              </Button>
            </>
          }
        >
          <p>
            This will delete <strong>{deleteTarget.name}</strong>. To confirm deletion, type{" "}
            <strong>{DELETE_CONFIRMATION_CODE}</strong>.
          </p>

          <Input
            label="Confirmation Code"
            className="delete-code-field"
            value={deleteCode}
            onChange={(event) => setDeleteCode(event.target.value)}
            placeholder="Type 123 to delete"
            autoFocus
            fullWidth
          />
        </Modal>
      )}

      {toast && <div className="customers-toast">{toast}</div>}
    </div>
  );
}