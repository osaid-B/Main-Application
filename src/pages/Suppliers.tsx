import "./Suppliers.css";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  AlertTriangle,
  ArrowUpDown,
  BadgeCheck,
  Building2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import OverflowContent from "../components/ui/OverflowContent";
import TableFooter from "../components/ui/TableFooter";
import { getPurchases, getSuppliers, saveSuppliers } from "../data/storage";
import type { Purchase, Supplier } from "../data/types";

type SupplierStatus = "Active" | "Inactive" | "Preferred" | "Blocked";
type DetailTab =
  | "overview"
  | "purchases"
  | "invoices"
  | "payments"
  | "contacts"
  | "notes"
  | "documents"
  | "history";

type SupplierContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
};

type SupplierNote = {
  id: string;
  author: string;
  date: string;
  text: string;
};

type SupplierDocument = {
  id: string;
  fileName: string;
  type: string;
  uploadedDate: string;
  uploadedBy: string;
};

type SupplierHistory = {
  id: string;
  action: string;
  user: string;
  date: string;
};

type SupplierPurchaseEntry = {
  id: string;
  poNumber: string;
  date: string;
  total: number;
  received: string;
  paymentStatus: "Paid" | "Partial" | "Unpaid";
  status: "Received" | "Pending" | "Partially Received";
};

type SupplierInvoiceEntry = {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  total: number;
  remaining: number;
  status: "Paid" | "Partial" | "Unpaid";
};

type SupplierPaymentEntry = {
  id: string;
  paymentDate: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
};

type SupplierProfile = {
  supplierId: string;
  code: string;
  companyName: string;
  companyType: string;
  category: string;
  status: SupplierStatus;
  paymentTerms: string;
  currency: string;
  country: string;
  city: string;
  taxNumber: string;
  registrationNumber: string;
  contactPerson: string;
  website: string;
  outstandingBalance: number;
  totalPurchased: number;
  rating: number;
  verified: boolean;
  taxRegistered: boolean;
  contractSigned: boolean;
  onTimeRate: number;
  qualityScore: number;
  returnRate: number;
  reliabilityLevel: "High" | "Medium" | "Low";
  lastPurchaseDate: string;
  lastPaymentDate: string;
  createdDate: string;
  tags: string[];
  notes: SupplierNote[];
  contacts: SupplierContact[];
  documents: SupplierDocument[];
  history: SupplierHistory[];
  purchases: SupplierPurchaseEntry[];
  invoices: SupplierInvoiceEntry[];
  payments: SupplierPaymentEntry[];
};

type SupplierView = SupplierProfile & {
  supplierName: string;
  phone: string;
  email: string;
  address: string;
};

type SupplierFormState = {
  supplierName: string;
  supplierCode: string;
  companyName: string;
  category: string;
  status: SupplierStatus;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  country: string;
  city: string;
  address: string;
  paymentTerms: string;
  currency: string;
  taxNumber: string;
  registrationNumber: string;
  notes: string;
  tags: string;
  attachmentName: string;
};

type FormErrors = Partial<
  Record<"supplierName" | "supplierCode" | "contactPerson" | "phone" | "email", string>
>;

type FilterState = {
  status: string;
  paymentTerms: string;
  currency: string;
  category: string;
  rating: string;
  country: string;
  city: string;
  taxRegistered: string;
  outstandingBalance: string;
  lastPurchaseDate: string;
  createdDate: string;
};

type ActionMenuState = {
  id: string;
  top: number;
  left: number;
  placement: "down" | "up";
};

type SortField =
  | "supplierName"
  | "code"
  | "contactPerson"
  | "paymentTerms"
  | "outstandingBalance"
  | "lastPurchaseDate"
  | "rating"
  | "status";

const PROFILE_STORAGE_KEY = "dashboard_supplier_profiles_v2";
const TODAY = new Date().toISOString().split("T")[0];
const EMPTY_FILTERS: FilterState = {
  status: "",
  paymentTerms: "",
  currency: "",
  category: "",
  rating: "",
  country: "",
  city: "",
  taxRegistered: "",
  outstandingBalance: "",
  lastPurchaseDate: "",
  createdDate: "",
};

const EMPTY_FORM: SupplierFormState = {
  supplierName: "",
  supplierCode: "",
  companyName: "",
  category: "Electronics",
  status: "Active",
  contactPerson: "",
  phone: "",
  email: "",
  website: "",
  country: "Palestine",
  city: "",
  address: "",
  paymentTerms: "Net 30",
  currency: "USD",
  taxNumber: "",
  registrationNumber: "",
  notes: "",
  tags: "",
  attachmentName: "",
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function addDays(date: string, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next.toISOString().split("T")[0];
}

function buildDefaultProfile(
  supplier: Supplier,
  index: number,
  purchases: Purchase[]
): SupplierProfile {
  const supplierPurchases = purchases
    .filter((purchase) => purchase.supplierId === supplier.id && !purchase.isDeleted)
    .map((purchase, purchaseIndex) => {
      const status = (["Received", "Pending", "Partially Received"] as const)[
        (purchaseIndex + index) % 3
      ];
      const paymentStatus = (["Paid", "Partial", "Unpaid"] as const)[
        (purchaseIndex + index) % 3
      ];
      const receivedPct = status === "Received" ? 100 : status === "Partially Received" ? 56 : 0;

      return {
        id: `${supplier.id}-PO-${purchaseIndex}`,
        poNumber: `PO-2026-${String(410 + index * 3 + purchaseIndex).padStart(4, "0")}`,
        date: purchase.date,
        total: purchase.totalCost,
        received: `${receivedPct}%`,
        paymentStatus,
        status,
      };
    });

  const totalPurchased = supplierPurchases.reduce((sum, entry) => sum + entry.total, 0);
  const outstandingBalance = supplierPurchases
    .filter((entry) => entry.paymentStatus !== "Paid")
    .reduce((sum, entry) => sum + entry.total * (entry.paymentStatus === "Partial" ? 0.45 : 1), 0);

  const invoices = supplierPurchases.map((purchase, purchaseIndex) => ({
    id: `${supplier.id}-INV-${purchaseIndex}`,
    invoiceNumber: `SINV-2026-${String(740 + index * 4 + purchaseIndex).padStart(4, "0")}`,
    date: purchase.date,
    dueDate: addDays(purchase.date, 15 + ((purchaseIndex + index) % 20)),
    total: purchase.total,
    remaining:
      purchase.paymentStatus === "Paid"
        ? 0
        : purchase.paymentStatus === "Partial"
        ? Number((purchase.total * 0.4).toFixed(2))
        : purchase.total,
    status: purchase.paymentStatus,
  }));

  const payments = invoices
    .filter((invoice) => invoice.status !== "Unpaid")
    .map((invoice, paymentIndex) => ({
      id: `${supplier.id}-PAY-${paymentIndex}`,
      paymentDate: addDays(invoice.date, 4 + paymentIndex),
      amount: invoice.status === "Paid" ? invoice.total : Number((invoice.total * 0.6).toFixed(2)),
      method: ["Bank Transfer", "Wire", "Card"][paymentIndex % 3],
      reference: `PAY-${invoice.invoiceNumber.slice(-4)}`,
      notes: invoice.status === "Paid" ? "Paid in full" : "Partially settled",
    }));

  const statuses: SupplierStatus[] = ["Preferred", "Active", "Blocked", "Inactive"];
  const categories = ["Electronics", "Packaging", "Raw Materials", "Services", "Logistics"];
  const cities = ["Ramallah", "Nablus", "Hebron", "Jerusalem", "Amman"];
  const countries = ["Palestine", "Jordan", "UAE", "Saudi Arabia"];
  const rating = Number((4.1 + ((index % 6) * 0.15)).toFixed(1));

  return {
    supplierId: supplier.id,
    code: supplier.id,
    companyName: supplier.name,
    companyType: categories[index % categories.length],
    category: categories[index % categories.length],
    status: statuses[index % statuses.length],
    paymentTerms: ["Net 7", "Net 15", "Net 30", "Due on Receipt"][index % 4],
    currency: ["USD", "EUR", "ILS"][index % 3],
    country: countries[index % countries.length],
    city: cities[index % cities.length],
    taxNumber: `TAX-${5000 + index}`,
    registrationNumber: `REG-${8000 + index}`,
    contactPerson: ["Ahmad Saleh", "Rana Nasser", "Omar Yassin", "Lina Hamed"][index % 4],
    website: `https://supplier${index + 1}.example.com`,
    outstandingBalance: Number(outstandingBalance.toFixed(2)),
    totalPurchased: Number(totalPurchased.toFixed(2)),
    rating,
    verified: index % 2 === 0,
    taxRegistered: index % 3 !== 0,
    contractSigned: index % 4 !== 0,
    onTimeRate: 78 + (index % 5) * 4,
    qualityScore: 82 + (index % 4) * 4,
    returnRate: Number((1.2 + (index % 4) * 0.6).toFixed(1)),
    reliabilityLevel: rating >= 4.6 ? "High" : rating >= 4.3 ? "Medium" : "Low",
    lastPurchaseDate: supplierPurchases[0]?.date || addDays(TODAY, -(12 + index)),
    lastPaymentDate: payments[0]?.paymentDate || addDays(TODAY, -(7 + index)),
    createdDate: addDays(TODAY, -(80 + index * 7)),
    tags: index % 2 === 0 ? ["Preferred", "Key Account"] : ["Operational"],
    notes: [
      {
        id: `${supplier.id}-note-1`,
        author: "Procurement Lead",
        date: addDays(TODAY, -(6 + index)),
        text: "Supplier remains stable on quality and payment coordination.",
      },
      {
        id: `${supplier.id}-note-2`,
        author: "Finance Team",
        date: addDays(TODAY, -(18 + index)),
        text: "Review credit terms before the next large purchase order.",
      },
    ],
    contacts: [
      {
        id: `${supplier.id}-contact-1`,
        name: ["Ahmad Saleh", "Rana Nasser", "Omar Yassin", "Lina Hamed"][index % 4],
        role: "Sales Manager",
        phone: supplier.phone || "0590000000",
        email: supplier.email || "sales@example.com",
        notes: "Primary commercial contact",
      },
      {
        id: `${supplier.id}-contact-2`,
        name: "Finance Desk",
        role: "Accounts",
        phone: "0560000000",
        email: `finance${index + 1}@supplier.com`,
        notes: "Invoices and settlements",
      },
    ],
    documents: [
      {
        id: `${supplier.id}-doc-1`,
        fileName: "Vendor Agreement.pdf",
        type: "Contract",
        uploadedDate: addDays(TODAY, -(20 + index)),
        uploadedBy: "Admin",
      },
      {
        id: `${supplier.id}-doc-2`,
        fileName: "Tax Certificate.pdf",
        type: "Tax",
        uploadedDate: addDays(TODAY, -(42 + index)),
        uploadedBy: "Finance Team",
      },
    ],
    history: [
      {
        id: `${supplier.id}-history-1`,
        action: "Supplier created",
        user: "Admin",
        date: addDays(TODAY, -(60 + index)),
      },
      {
        id: `${supplier.id}-history-2`,
        action: "Payment terms changed",
        user: "Finance Team",
        date: addDays(TODAY, -(12 + index)),
      },
      {
        id: `${supplier.id}-history-3`,
        action: "New purchase added",
        user: "Procurement Lead",
        date: addDays(TODAY, -(4 + index)),
      },
    ],
    purchases: supplierPurchases,
    invoices,
    payments,
  };
}

function readProfiles(suppliers: Supplier[], purchases: Purchase[]) {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SupplierProfile[]) : [];
    const map = new Map(parsed.map((profile) => [profile.supplierId, profile]));

    return suppliers
      .filter((supplier) => !supplier.isDeleted)
      .map((supplier, index) => map.get(supplier.id) || buildDefaultProfile(supplier, index, purchases));
  } catch {
    return suppliers
      .filter((supplier) => !supplier.isDeleted)
      .map((supplier, index) => buildDefaultProfile(supplier, index, purchases));
  }
}

function saveProfiles(profiles: SupplierProfile[]) {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
}

function statusTone(status: SupplierStatus) {
  switch (status) {
    case "Active":
      return "positive";
    case "Preferred":
      return "info";
    case "Blocked":
      return "danger";
    default:
      return "neutral";
  }
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers());
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [profiles, setProfiles] = useState<SupplierProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("supplierName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [menuState, setMenuState] = useState<ActionMenuState | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [formState, setFormState] = useState<SupplierFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      setViewError(null);
      setProfiles(readProfiles(suppliers, purchases));
    } catch {
      setViewError("The suppliers workspace could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [purchases, suppliers]);

  useEffect(() => {
    if (profiles.length > 0) saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    saveSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    setPage(1);
  }, [filters, quickFilters, rowsPerPage, searchTerm]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!menuState) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (menuRef.current?.contains(target)) return;
      setMenuState(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuState(null);
    }

    function closeMenu() {
      setMenuState(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [menuState]);

  const supplierViews = useMemo<SupplierView[]>(() => {
    const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
    return profiles.map((profile) => {
      const supplier = supplierMap.get(profile.supplierId);
      return {
        ...profile,
        supplierName: supplier?.name || profile.companyName,
        phone: supplier?.phone || "",
        email: supplier?.email || "",
        address: supplier?.address || "",
      };
    });
  }, [profiles, suppliers]);

  const filteredSuppliers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return supplierViews.filter((supplier) => {
      if (query) {
        const haystack = [
          supplier.supplierName,
          supplier.code,
          supplier.phone,
          supplier.email,
          supplier.category,
          supplier.companyType,
          supplier.notes.map((item) => item.text).join(" "),
          supplier.purchases.map((item) => item.poNumber).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (filters.status && supplier.status !== filters.status) return false;
      if (filters.paymentTerms && supplier.paymentTerms !== filters.paymentTerms) return false;
      if (filters.currency && supplier.currency !== filters.currency) return false;
      if (filters.category && supplier.category !== filters.category) return false;
      if (filters.rating) {
        if (filters.rating === "4plus" && supplier.rating < 4) return false;
        if (filters.rating === "3orless" && supplier.rating > 3) return false;
      }
      if (filters.country && supplier.country !== filters.country) return false;
      if (filters.city && supplier.city !== filters.city) return false;
      if (filters.taxRegistered) {
        const expected = filters.taxRegistered === "yes";
        if (supplier.taxRegistered !== expected) return false;
      }
      if (filters.outstandingBalance) {
        if (filters.outstandingBalance === "open" && supplier.outstandingBalance <= 0) return false;
        if (filters.outstandingBalance === "high" && supplier.outstandingBalance < 5000) return false;
      }
      if (filters.lastPurchaseDate) {
        if (filters.lastPurchaseDate === "30d" && supplier.lastPurchaseDate < addDays(TODAY, -30)) return false;
        if (filters.lastPurchaseDate === "90d" && supplier.lastPurchaseDate < addDays(TODAY, -90)) return false;
      }
      if (filters.createdDate) {
        if (filters.createdDate === "30d" && supplier.createdDate < addDays(TODAY, -30)) return false;
        if (filters.createdDate === "90d" && supplier.createdDate < addDays(TODAY, -90)) return false;
      }

      if (quickFilters.includes("Active") && supplier.status !== "Active") return false;
      if (quickFilters.includes("Inactive") && supplier.status !== "Inactive") return false;
      if (quickFilters.includes("Preferred") && supplier.status !== "Preferred") return false;
      if (quickFilters.includes("Outstanding Balance") && supplier.outstandingBalance <= 0) return false;
      if (quickFilters.includes("New Suppliers") && supplier.createdDate < addDays(TODAY, -30)) return false;

      return true;
    });
  }, [filters, quickFilters, searchTerm, supplierViews]);

  const sortedSuppliers = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...filteredSuppliers].sort((a, b) => {
      switch (sortField) {
        case "outstandingBalance":
          return (a.outstandingBalance - b.outstandingBalance) * factor;
        case "rating":
          return (a.rating - b.rating) * factor;
        case "lastPurchaseDate":
          return (new Date(a.lastPurchaseDate).getTime() - new Date(b.lastPurchaseDate).getTime()) * factor;
        default:
          return String(a[sortField]).localeCompare(String(b[sortField])) * factor;
      }
    });
  }, [filteredSuppliers, sortDirection, sortField]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(sortedSuppliers.length / rowsPerPage)));
  const pagedSuppliers = sortedSuppliers.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const detailSupplier = detailSupplierId
    ? supplierViews.find((supplier) => supplier.supplierId === detailSupplierId) || null
    : null;

  const summary = useMemo(() => {
    const totalSuppliers = supplierViews.length;
    const activeSuppliers = supplierViews.filter((supplier) => supplier.status === "Active" || supplier.status === "Preferred").length;
    const outstandingPayables = supplierViews.reduce((sum, supplier) => sum + supplier.outstandingBalance, 0);
    const topRatedSuppliers = supplierViews.filter((supplier) => supplier.rating >= 4.6).length;
    const preferred = supplierViews.filter((supplier) => supplier.status === "Preferred").length;
    const blocked = supplierViews.filter((supplier) => supplier.status === "Blocked").length;
    const riskAlerts = supplierViews.filter(
      (supplier) => supplier.status === "Blocked" || supplier.rating < 4 || supplier.outstandingBalance > 7000
    ).length;

    return {
      totalSuppliers,
      activeSuppliers,
      outstandingPayables,
      topRatedSuppliers,
      preferred,
      blocked,
      riskAlerts,
    };
  }, [supplierViews]);

  const topSuppliers = useMemo(() => {
    const maxPurchased = Math.max(...supplierViews.map((supplier) => supplier.totalPurchased), 1);
    return [...supplierViews]
      .sort((a, b) => b.totalPurchased - a.totalPurchased)
      .slice(0, 5)
      .map((supplier) => ({
        ...supplier,
        purchaseRatio: (supplier.totalPurchased / maxPurchased) * 100,
      }));
  }, [supplierViews]);

  const activeFilterEntries = useMemo(() => {
    const entries: Array<{ key: keyof FilterState; label: string; value: string }> = [];
    const labels: Record<keyof FilterState, string> = {
      status: "Status",
      paymentTerms: "Terms",
      currency: "Currency",
      category: "Category",
      rating: "Rating",
      country: "Country",
      city: "City",
      taxRegistered: "Tax",
      outstandingBalance: "Balance",
      lastPurchaseDate: "Last Purchase",
      createdDate: "Created",
    };
    (Object.keys(filters) as Array<keyof FilterState>).forEach((key) => {
      if (filters[key]) entries.push({ key, label: labels[key], value: filters[key] });
    });
    return entries;
  }, [filters]);

  const menuSupplier = menuState
    ? supplierViews.find((supplier) => supplier.supplierId === menuState.id) || null
    : null;

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setQuickFilters([]);
    setSearchTerm("");
  }

  function openMenu(id: string, trigger: HTMLButtonElement) {
    if (menuState?.id === id) {
      setMenuState(null);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 250;
    const gap = 8;
    const placeUp = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;
    setMenuState({
      id,
      left: Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth)),
      top: placeUp ? rect.top - menuHeight - gap : rect.bottom + gap,
      placement: placeUp ? "up" : "down",
    });
  }

  function openAddModal() {
    setFormMode("add");
    setEditingSupplierId(null);
    setFormState(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEditModal(supplierId: string) {
    const supplier = supplierViews.find((item) => item.supplierId === supplierId);
    if (!supplier) return;

    setFormMode("edit");
    setEditingSupplierId(supplierId);
    setFormState({
      supplierName: supplier.supplierName,
      supplierCode: supplier.code,
      companyName: supplier.companyName,
      category: supplier.category,
      status: supplier.status,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      website: supplier.website,
      country: supplier.country,
      city: supplier.city,
      address: supplier.address,
      paymentTerms: supplier.paymentTerms,
      currency: supplier.currency,
      taxNumber: supplier.taxNumber,
      registrationNumber: supplier.registrationNumber,
      notes: supplier.notes[0]?.text || "",
      tags: supplier.tags.join(", "),
      attachmentName: supplier.documents[0]?.fileName || "",
    });
    setFormErrors({});
    setFormOpen(true);
    setMenuState(null);
  }

  function validateSupplierForm() {
    const nextErrors: FormErrors = {};

    if (!formState.supplierName.trim()) nextErrors.supplierName = "Supplier name is required.";
    if (!formState.supplierCode.trim() && !editingSupplierId) {
      nextErrors.supplierCode = "Supplier code is required.";
    }
    if (formState.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function saveSupplierForm(saveAsDraft = false) {
    if (!validateSupplierForm()) return;

    const code = formState.supplierCode.trim() || `SUP-${Date.now().toString().slice(-4)}`;
    const supplierId = editingSupplierId || code;

    const nextSupplier: Supplier = {
      id: supplierId,
      name: formState.supplierName.trim() || "Supplier",
      phone: formState.phone.trim(),
      email: formState.email.trim(),
      address: formState.address.trim(),
      notes: formState.notes.trim(),
      isDeleted: false,
    };

    const profile: SupplierProfile = {
      supplierId,
      code,
      companyName: formState.companyName.trim() || formState.supplierName.trim(),
      companyType: formState.category,
      category: formState.category,
      status: saveAsDraft ? "Inactive" : formState.status,
      paymentTerms: formState.paymentTerms,
      currency: formState.currency,
      country: formState.country.trim() || "Palestine",
      city: formState.city.trim(),
      taxNumber: formState.taxNumber.trim(),
      registrationNumber: formState.registrationNumber.trim(),
      contactPerson: formState.contactPerson.trim(),
      website: formState.website.trim(),
      outstandingBalance: 0,
      totalPurchased: 0,
      rating: 4.4,
      verified: false,
      taxRegistered: Boolean(formState.taxNumber.trim()),
      contractSigned: false,
      onTimeRate: 88,
      qualityScore: 90,
      returnRate: 1.6,
      reliabilityLevel: "Medium",
      lastPurchaseDate: TODAY,
      lastPaymentDate: TODAY,
      createdDate: TODAY,
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: formState.notes.trim()
        ? [
            {
              id: `${supplierId}-note`,
              author: "Admin",
              date: TODAY,
              text: formState.notes.trim(),
            },
          ]
        : [],
      contacts: [
        {
          id: `${supplierId}-contact`,
          name: formState.contactPerson.trim() || "Primary Contact",
          role: "Primary Contact",
          phone: formState.phone.trim(),
          email: formState.email.trim(),
          notes: "",
        },
      ],
      documents: formState.attachmentName.trim()
        ? [
            {
              id: `${supplierId}-doc`,
              fileName: formState.attachmentName.trim(),
              type: "Attachment",
              uploadedDate: TODAY,
              uploadedBy: "Admin",
            },
          ]
        : [],
      history: [
        {
          id: `${supplierId}-history-create`,
          action: editingSupplierId ? "Supplier updated" : "Supplier created",
          user: "Admin",
          date: TODAY,
        },
      ],
      purchases: [],
      invoices: [],
      payments: [],
    };

    setSuppliers((current) => {
      const exists = current.some((supplier) => supplier.id === supplierId);
      if (exists) {
        return current.map((supplier) => (supplier.id === supplierId ? nextSupplier : supplier));
      }
      return [nextSupplier, ...current];
    });

    setProfiles((current) => {
      const exists = current.some((item) => item.supplierId === supplierId);
      if (exists) {
        return current.map((item) => (item.supplierId === supplierId ? { ...item, ...profile } : item));
      }
      return [profile, ...current];
    });

    setFormOpen(false);
    setToast(saveAsDraft ? "Supplier saved as draft" : editingSupplierId ? "Supplier updated" : "Supplier added");
  }

  function deleteSupplierItem(supplierId: string) {
    setSuppliers((current) => current.filter((supplier) => supplier.id !== supplierId));
    setProfiles((current) => current.filter((profile) => profile.supplierId !== supplierId));
    setMenuState(null);
    setToast("Supplier deleted");
  }

  function toggleQuickFilter(value: string) {
    setQuickFilters((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("asc");
  }

  return (
    <>
      <div className="suppliers-page">
        <section className="suppliers-header-card">
          <div className="suppliers-header-copy">
            <div className="suppliers-page-badge">
              <Truck size={16} />
              Suppliers
            </div>
            <h1>Suppliers</h1>
            <p>Manage supplier profiles, purchase history, payment terms, and vendor performance</p>
          </div>

          <div className="suppliers-header-actions">
            <button className="suppliers-primary-btn" type="button" onClick={openAddModal}>
              <Plus size={16} />
              Add Supplier
            </button>
            <button className="suppliers-secondary-btn" type="button" onClick={() => setToast("Import flow is ready")}>
              <Download size={16} />
              Import
            </button>
            <button className="suppliers-secondary-btn" type="button" onClick={() => setToast("Export prepared")}>
              <Download size={16} />
              Export
            </button>
          </div>
        </section>

        <section className="suppliers-kpi-grid">
          <article className="suppliers-kpi-card">
            <div className="kpi-icon blue"><Building2 size={18} /></div>
            <div>
              <span>Total Suppliers</span>
              <strong>{summary.totalSuppliers}</strong>
              <small>This month</small>
            </div>
          </article>
          <article className="suppliers-kpi-card">
            <div className="kpi-icon green"><BadgeCheck size={18} /></div>
            <div>
              <span>Active Suppliers</span>
              <strong>{summary.activeSuppliers}</strong>
              <small>Updated today</small>
            </div>
          </article>
          <article className="suppliers-kpi-card">
            <div className="kpi-icon amber"><Wallet size={18} /></div>
            <div>
              <span>Outstanding Payables</span>
              <strong>{money(summary.outstandingPayables)}</strong>
              <small>Across all vendors</small>
            </div>
          </article>
          <article className="suppliers-kpi-card">
            <div className="kpi-icon slate"><Star size={18} /></div>
            <div>
              <span>Top Rated Suppliers</span>
              <strong>{summary.topRatedSuppliers}</strong>
              <small>4.6 and above</small>
            </div>
          </article>
        </section>

        <div className="suppliers-layout">
          <section className="suppliers-main-column">
            <div className={`suppliers-filter-card ${moreFiltersOpen ? "filters-open" : ""}`}>
              <div className="supplier-toolbar">
                <label className="supplier-search-field">
                  <Search size={18} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by supplier name, code, phone, email, product, or note"
                  />
                </label>

                <div className="supplier-toolbar-actions">
                  <button
                    className={`supplier-toolbar-btn ${moreFiltersOpen ? "active" : ""}`}
                    type="button"
                    onClick={() => setMoreFiltersOpen((current) => !current)}
                    aria-expanded={moreFiltersOpen}
                  >
                    <Filter size={15} />
                    Filters
                  </button>
                  <button
                    className={`supplier-toolbar-btn subtle ${moreFiltersOpen ? "active" : ""}`}
                    type="button"
                    onClick={() => setMoreFiltersOpen((current) => !current)}
                    aria-expanded={moreFiltersOpen}
                  >
                    More Filters
                    {activeFilterEntries.filter((entry) =>
                      ["country", "city", "taxRegistered", "outstandingBalance", "lastPurchaseDate", "createdDate"].includes(entry.key)
                    ).length > 0 && (
                      <span className="toolbar-count">
                        {
                          activeFilterEntries.filter((entry) =>
                            ["country", "city", "taxRegistered", "outstandingBalance", "lastPurchaseDate", "createdDate"].includes(entry.key)
                          ).length
                        }
                      </span>
                    )}
                    <ChevronDown size={15} />
                  </button>
                </div>
              </div>

              <div className="supplier-primary-filters">
                <label className="supplier-field">
                  <span>Status</span>
                  <select className="app-select-control" value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}>
                    <option value="">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </label>
                <label className="supplier-field">
                  <span>Payment Terms</span>
                  <select className="app-select-control" value={filters.paymentTerms} onChange={(e) => setFilters((c) => ({ ...c, paymentTerms: e.target.value }))}>
                    <option value="">All</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </label>
                <label className="supplier-field">
                  <span>Currency</span>
                  <select className="app-select-control" value={filters.currency} onChange={(e) => setFilters((c) => ({ ...c, currency: e.target.value }))}>
                    <option value="">All</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ILS">ILS</option>
                  </select>
                </label>
                <label className="supplier-field">
                  <span>Category</span>
                  <select className="app-select-control" value={filters.category} onChange={(e) => setFilters((c) => ({ ...c, category: e.target.value }))}>
                    <option value="">All</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Services">Services</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </label>
                <label className="supplier-field">
                  <span>Rating</span>
                  <select className="app-select-control" value={filters.rating} onChange={(e) => setFilters((c) => ({ ...c, rating: e.target.value }))}>
                    <option value="">All</option>
                    <option value="4plus">4+ / 5</option>
                    <option value="3orless">3 or less</option>
                  </select>
                </label>
                {(activeFilterEntries.length > 0 || quickFilters.length > 0 || searchTerm) && (
                  <button className="supplier-clear-btn" type="button" onClick={clearFilters}>
                    Clear
                  </button>
                )}
              </div>

              {moreFiltersOpen && (
                <div className="supplier-primary-filters secondary">
                  <label className="supplier-field">
                    <span>Country</span>
                    <select className="app-select-control" value={filters.country} onChange={(e) => setFilters((c) => ({ ...c, country: e.target.value }))}>
                      <option value="">All</option>
                      <option value="Palestine">Palestine</option>
                      <option value="Jordan">Jordan</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                    </select>
                  </label>
                  <label className="supplier-field">
                    <span>City</span>
                    <select className="app-select-control" value={filters.city} onChange={(e) => setFilters((c) => ({ ...c, city: e.target.value }))}>
                      <option value="">All</option>
                      <option value="Ramallah">Ramallah</option>
                      <option value="Nablus">Nablus</option>
                      <option value="Hebron">Hebron</option>
                      <option value="Jerusalem">Jerusalem</option>
                      <option value="Amman">Amman</option>
                    </select>
                  </label>
                  <label className="supplier-field">
                    <span>Tax Registered</span>
                    <select className="app-select-control" value={filters.taxRegistered} onChange={(e) => setFilters((c) => ({ ...c, taxRegistered: e.target.value }))}>
                      <option value="">All</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="supplier-field">
                    <span>Outstanding Balance</span>
                    <select className="app-select-control" value={filters.outstandingBalance} onChange={(e) => setFilters((c) => ({ ...c, outstandingBalance: e.target.value }))}>
                      <option value="">All</option>
                      <option value="open">Outstanding only</option>
                      <option value="high">High balance</option>
                    </select>
                  </label>
                  <label className="supplier-field">
                    <span>Last Purchase Date</span>
                    <select className="app-select-control" value={filters.lastPurchaseDate} onChange={(e) => setFilters((c) => ({ ...c, lastPurchaseDate: e.target.value }))}>
                      <option value="">All</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </label>
                  <label className="supplier-field">
                    <span>Created Date</span>
                    <select className="app-select-control" value={filters.createdDate} onChange={(e) => setFilters((c) => ({ ...c, createdDate: e.target.value }))}>
                      <option value="">All</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="supplier-quick-filters">
                {["Active", "Inactive", "Preferred", "Outstanding Balance", "New Suppliers"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`supplier-quick-chip ${quickFilters.includes(chip) ? "active" : ""}`}
                    onClick={() => toggleQuickFilter(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {(activeFilterEntries.length > 0 || quickFilters.length > 0) && (
                <div className="active-filter-row">
                  {activeFilterEntries.map((entry) => (
                    <button
                      key={`${entry.key}-${entry.value}`}
                      type="button"
                      className="active-filter-chip"
                      onClick={() => setFilters((current) => ({ ...current, [entry.key]: "" }))}
                    >
                      {entry.label}: {entry.value}
                      <X size={12} />
                    </button>
                  ))}
                  {quickFilters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className="active-filter-chip"
                      onClick={() => toggleQuickFilter(filter)}
                    >
                      Quick: {filter}
                      <X size={12} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="suppliers-table-card">
              {selectedIds.length > 0 && (
                <div className="supplier-bulk-bar">
                  <span>{selectedIds.length} selected</span>
                  <div>
                    <button type="button" onClick={() => setToast("Selected suppliers exported")}>Export selected</button>
                    <button type="button" onClick={() => setToast("Selected suppliers archived")}>Archive selected</button>
                    <button type="button" onClick={() => setToast("Selected suppliers marked as preferred")}>Mark as Preferred</button>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="supplier-loading-state">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="supplier-skeleton-row" />
                  ))}
                </div>
              ) : viewError ? (
                <div className="supplier-empty-state">
                  <AlertTriangle size={28} />
                  <h3>Something went wrong</h3>
                  <p>{viewError}</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="supplier-empty-state">
                  <Building2 size={28} />
                  <h3>{searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0 ? "No results found" : "No suppliers yet"}</h3>
                  <p>
                    {searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0
                      ? "Try changing your filters or search."
                      : "Create your first supplier profile to start procurement workflows."}
                  </p>
                  {searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0 ? (
                    <button className="suppliers-secondary-btn" type="button" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  ) : (
                    <button className="suppliers-primary-btn" type="button" onClick={openAddModal}>
                      <Plus size={16} />
                      Add Supplier
                    </button>
                  )}
                </div>
              ) : (
                <div className="suppliers-table-wrap app-table-wrap">
                  <table className="suppliers-table app-data-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={pagedSuppliers.length > 0 && pagedSuppliers.every((supplier) => selectedIds.includes(supplier.supplierId))}
                            onChange={(event) =>
                              setSelectedIds(event.target.checked ? pagedSuppliers.map((supplier) => supplier.supplierId) : [])
                            }
                          />
                        </th>
                        <th><button type="button" className="table-sort-btn" onClick={() => handleSort("supplierName")}>Supplier <ArrowUpDown size={13} /></button></th>
                        <th><button type="button" className="table-sort-btn" onClick={() => handleSort("contactPerson")}>Contact <ArrowUpDown size={13} /></button></th>
                        <th><button type="button" className="table-sort-btn" onClick={() => handleSort("paymentTerms")}>Payment Terms <ArrowUpDown size={13} /></button></th>
                        <th><button type="button" className="table-sort-btn" onClick={() => handleSort("outstandingBalance")}>Outstanding Balance <ArrowUpDown size={13} /></button></th>
                        <th><button type="button" className="table-sort-btn" onClick={() => handleSort("rating")}>Rating <ArrowUpDown size={13} /></button></th>
                        <th><button type="button" className="table-sort-btn" onClick={() => handleSort("status")}>Status <ArrowUpDown size={13} /></button></th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSuppliers.map((supplier) => (
                        <tr key={supplier.supplierId} onClick={() => { setDetailSupplierId(supplier.supplierId); setDetailTab("overview"); }}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(supplier.supplierId)}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() =>
                                setSelectedIds((current) =>
                                  current.includes(supplier.supplierId)
                                    ? current.filter((id) => id !== supplier.supplierId)
                                    : [...current, supplier.supplierId]
                                )
                              }
                            />
                          </td>
                          <td>
                            <div className="supplier-main-cell app-cell-stack">
                              <strong>{supplier.supplierName}</strong>
                              <span>{supplier.code} · {supplier.companyType}</span>
                              <small>{supplier.category}</small>
                              <OverflowContent
                                title={supplier.supplierName}
                                subtitle={supplier.code}
                                preview={supplier.notes[0]?.text || "No recent notes"}
                                content={supplier.notes.map((item) => item.text).join("\n\n")}
                                meta={[
                                  { label: "Contact", value: supplier.contactPerson },
                                  { label: "Last purchase", value: formatDate(supplier.lastPurchaseDate) },
                                ]}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="contact-stack app-cell-stack">
                              <strong>{supplier.contactPerson}</strong>
                              <span>{supplier.phone || "-"}</span>
                              <small>{supplier.email || "-"}</small>
                            </div>
                          </td>
                          <td>
                            <div className="status-stack app-cell-stack supplier-terms-cell">
                              <strong>{supplier.paymentTerms}</strong>
                              <small>{supplier.currency}</small>
                            </div>
                          </td>
                          <td>
                            <div className="balance-stack app-cell-stack">
                              <strong className="balance-cell">{money(supplier.outstandingBalance)}</strong>
                              <small>Last purchase {formatDate(supplier.lastPurchaseDate)}</small>
                            </div>
                          </td>
                          <td>
                            <div className="rating-cell">
                              <Star size={14} />
                              <span>{supplier.rating.toFixed(1)} / 5</span>
                            </div>
                          </td>
                          <td>
                            <div className="status-stack">
                              <span className={`supplier-status-badge ${statusTone(supplier.status)}`}>{supplier.status}</span>
                              <div className="meta-badges">
                                {supplier.verified && <span className="meta-badge">Verified</span>}
                                {supplier.taxRegistered && <span className="meta-badge">Tax Registered</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="row-view-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDetailSupplierId(supplier.supplierId);
                                  setDetailTab("overview");
                                }}
                              >
                                <Eye size={15} />
                                Open
                              </button>
                              <button
                                type="button"
                                className="row-menu-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openMenu(supplier.supplierId, event.currentTarget);
                                }}
                              >
                                <MoreHorizontal size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <TableFooter
                className="suppliers-table-footer"
                total={filteredSuppliers.length}
                page={safePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(value) => {
                  setRowsPerPage(value);
                  setPage(1);
                }}
                onPageChange={setPage}
              />
            </div>
          </section>

          <aside className="suppliers-side-column">
            <section className="side-widget">
              <div className="side-widget-head">
                <h3>Supplier Summary</h3>
                <span>This month</span>
              </div>
              <div className="side-stat-list">
                <div><span>Total suppliers</span><strong>{summary.totalSuppliers}</strong></div>
                <div><span>Preferred</span><strong>{summary.preferred}</strong></div>
                <div><span>Blocked</span><strong>{summary.blocked}</strong></div>
                <div><span>Outstanding payables</span><strong>{money(summary.outstandingPayables)}</strong></div>
              </div>
            </section>

            <section className="side-widget">
              <div className="side-widget-head">
                <h3>Top Suppliers</h3>
                <span>By purchase value</span>
              </div>
              <div className="top-suppliers-list">
                {topSuppliers.map((supplier) => (
                  <div key={supplier.supplierId} className="top-supplier-item">
                    <div className="top-supplier-row">
                      <span>{supplier.supplierName}</span>
                      <strong>{money(supplier.totalPurchased)}</strong>
                    </div>
                    <div className="top-supplier-progress">
                      <div style={{ width: `${supplier.purchaseRatio}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </aside>
        </div>
      </div>

      {menuState && menuSupplier && createPortal(
        <div ref={menuRef} className="supplier-action-menu" style={{ top: menuState.top, left: menuState.left }}>
          <button type="button" onClick={() => { setDetailSupplierId(menuSupplier.supplierId); setDetailTab("overview"); setMenuState(null); }}>
            <Eye size={15} />
            Open
          </button>
          <button type="button" onClick={() => openEditModal(menuSupplier.supplierId)}>
            <FileText size={15} />
            Edit
          </button>
          <button type="button" onClick={() => setToast(`Ready to add purchase for ${menuSupplier.supplierName}`)}>
            <Plus size={15} />
            Add Purchase
          </button>
          <button type="button" onClick={() => { setDetailSupplierId(menuSupplier.supplierId); setDetailTab("purchases"); setMenuState(null); }}>
            <ArrowUpDown size={15} />
            View Purchases
          </button>
          <button type="button" onClick={() => { setToast("Supplier archived"); setMenuState(null); }}>
            <Archive size={15} />
            Archive
          </button>
          <button type="button" className="danger" onClick={() => deleteSupplierItem(menuSupplier.supplierId)}>
            <X size={15} />
            Delete
          </button>
        </div>,
        document.body
      )}

      {detailSupplier && (
        <div className="supplier-overlay" onClick={() => setDetailSupplierId(null)}>
          <aside className="supplier-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="supplier-drawer-head">
              <div>
                <span>{detailSupplier.code}</span>
                <h2>{detailSupplier.supplierName}</h2>
                <p>{detailSupplier.companyType}</p>
              </div>
              <button type="button" className="drawer-icon-btn" onClick={() => setDetailSupplierId(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="supplier-drawer-tabs">
              {(["overview", "purchases", "invoices", "payments", "contacts", "notes", "documents", "history"] as DetailTab[]).map((tab) => (
                <button key={tab} type="button" className={detailTab === tab ? "active" : ""} onClick={() => setDetailTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="supplier-drawer-body">
              {detailTab === "overview" && (
                <div className="detail-card-grid">
                  <section className="detail-card">
                    <h3>Basic Information</h3>
                    <dl>
                      <div><dt>Supplier Name</dt><dd>{detailSupplier.supplierName}</dd></div>
                      <div><dt>Supplier Code</dt><dd>{detailSupplier.code}</dd></div>
                      <div><dt>Company Name</dt><dd>{detailSupplier.companyName}</dd></div>
                      <div><dt>Category</dt><dd>{detailSupplier.category}</dd></div>
                      <div><dt>Tax Number</dt><dd>{detailSupplier.taxNumber}</dd></div>
                      <div><dt>Registration Number</dt><dd>{detailSupplier.registrationNumber}</dd></div>
                      <div><dt>Status</dt><dd>{detailSupplier.status}</dd></div>
                      <div><dt>Rating</dt><dd>{detailSupplier.rating.toFixed(1)} / 5</dd></div>
                    </dl>
                  </section>
                  <section className="detail-card">
                    <h3>Contact Information</h3>
                    <dl>
                      <div><dt>Contact Person</dt><dd>{detailSupplier.contactPerson}</dd></div>
                      <div><dt>Phone</dt><dd>{detailSupplier.phone || "-"}</dd></div>
                      <div><dt>Email</dt><dd>{detailSupplier.email || "-"}</dd></div>
                      <div><dt>Website</dt><dd>{detailSupplier.website || "-"}</dd></div>
                      <div><dt>Address</dt><dd>{detailSupplier.address || "-"}</dd></div>
                      <div><dt>Country</dt><dd>{detailSupplier.country}</dd></div>
                      <div><dt>City</dt><dd>{detailSupplier.city}</dd></div>
                    </dl>
                  </section>
                  <section className="detail-card">
                    <h3>Financial Information</h3>
                    <dl>
                      <div><dt>Payment Terms</dt><dd>{detailSupplier.paymentTerms}</dd></div>
                      <div><dt>Preferred Currency</dt><dd>{detailSupplier.currency}</dd></div>
                      <div><dt>Outstanding Balance</dt><dd>{money(detailSupplier.outstandingBalance)}</dd></div>
                      <div><dt>Total Purchased</dt><dd>{money(detailSupplier.totalPurchased)}</dd></div>
                      <div><dt>Last Payment</dt><dd>{formatDate(detailSupplier.lastPaymentDate)}</dd></div>
                      <div><dt>Last Purchase</dt><dd>{formatDate(detailSupplier.lastPurchaseDate)}</dd></div>
                    </dl>
                  </section>
                  <section className="detail-card">
                    <h3>Performance Summary</h3>
                    <dl>
                      <div><dt>On-time delivery rate</dt><dd>{detailSupplier.onTimeRate}%</dd></div>
                      <div><dt>Quality score</dt><dd>{detailSupplier.qualityScore}%</dd></div>
                      <div><dt>Return rate</dt><dd>{detailSupplier.returnRate}%</dd></div>
                      <div><dt>Reliability level</dt><dd>{detailSupplier.reliabilityLevel}</dd></div>
                    </dl>
                  </section>
                </div>
              )}

              {detailTab === "purchases" && (
                <div className="detail-table-card">
                  <div className="detail-card-head">
                    <h3>Purchases</h3>
                    <button type="button" className="drawer-primary-btn">Add Purchase</button>
                  </div>
                  <table className="detail-table">
                    <thead><tr><th>PO Number</th><th>Date</th><th>Total</th><th>Received</th><th>Payment Status</th><th>Status</th></tr></thead>
                    <tbody>
                      {detailSupplier.purchases.map((item) => (
                        <tr key={item.id}>
                          <td>{item.poNumber}</td><td>{formatDate(item.date)}</td><td>{money(item.total)}</td><td>{item.received}</td><td>{item.paymentStatus}</td><td>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "invoices" && (
                <div className="detail-table-card">
                  <h3>Invoices</h3>
                  <table className="detail-table">
                    <thead><tr><th>Invoice Number</th><th>Date</th><th>Due Date</th><th>Total</th><th>Remaining</th><th>Status</th></tr></thead>
                    <tbody>
                      {detailSupplier.invoices.map((item) => (
                        <tr key={item.id}>
                          <td>{item.invoiceNumber}</td><td>{formatDate(item.date)}</td><td>{formatDate(item.dueDate)}</td><td>{money(item.total)}</td><td>{money(item.remaining)}</td><td>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "payments" && (
                <div className="detail-table-card">
                  <h3>Payments</h3>
                  <table className="detail-table">
                    <thead><tr><th>Payment Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th></tr></thead>
                    <tbody>
                      {detailSupplier.payments.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.paymentDate)}</td><td>{money(item.amount)}</td><td>{item.method}</td><td>{item.reference}</td><td><OverflowContent title={item.reference} preview={item.notes} content={item.notes} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "contacts" && (
                <div className="detail-table-card">
                  <div className="detail-card-head">
                    <h3>Contacts</h3>
                    <button type="button" className="drawer-secondary-btn">Add Contact</button>
                  </div>
                  <table className="detail-table">
                    <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Notes</th></tr></thead>
                    <tbody>
                      {detailSupplier.contacts.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td><td>{item.role}</td><td>{item.phone}</td><td>{item.email}</td><td><OverflowContent title={item.name} subtitle={item.role} preview={item.notes} content={item.notes} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "notes" && (
                <div className="detail-list-card">
                  {detailSupplier.notes.map((note) => (
                    <article key={note.id} className="timeline-card">
                      <div className="timeline-head">
                        <strong>{note.author}</strong>
                        <span>{formatDate(note.date)}</span>
                      </div>
                      <p>{note.text}</p>
                    </article>
                  ))}
                </div>
              )}

              {detailTab === "documents" && (
                <div className="detail-table-card">
                  <h3>Documents</h3>
                  <table className="detail-table">
                    <thead><tr><th>File Name</th><th>Type</th><th>Uploaded Date</th><th>Uploaded By</th><th>Action</th></tr></thead>
                    <tbody>
                      {detailSupplier.documents.map((document) => (
                        <tr key={document.id}>
                          <td>{document.fileName}</td><td>{document.type}</td><td>{formatDate(document.uploadedDate)}</td><td>{document.uploadedBy}</td><td>Download</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "history" && (
                <div className="detail-list-card">
                  {detailSupplier.history.map((event) => (
                    <article key={event.id} className="timeline-card">
                      <div className="timeline-head">
                        <strong>{event.action}</strong>
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <p>{event.user}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {formOpen && (
        <div className="supplier-overlay" onClick={() => setFormOpen(false)}>
          <div className="supplier-modal" onClick={(event) => event.stopPropagation()}>
            <div className="supplier-drawer-head">
              <div>
                <span>{formMode === "add" ? "Add Supplier" : "Edit Supplier"}</span>
                <h2>{formMode === "add" ? "New Supplier" : "Update Supplier"}</h2>
                <p>Supplier profile, terms, contacts, and finance details</p>
              </div>
              <button type="button" className="drawer-icon-btn" onClick={() => setFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="supplier-form-body">
              <section className="supplier-form-section">
                <h3>Basic Information</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field"><span>Supplier Name *</span><input placeholder="Enter supplier name" value={formState.supplierName} onChange={(e) => { const value = e.target.value; setFormState((c) => ({ ...c, supplierName: value })); setFormErrors((c) => ({ ...c, supplierName: undefined })); }} />{formErrors.supplierName && <small className="field-error-text">{formErrors.supplierName}</small>}</label>
                  <label className="supplier-field"><span>Supplier Code {editingSupplierId ? "" : "*"}</span><input placeholder="Enter supplier code" value={formState.supplierCode} onChange={(e) => { const value = e.target.value; setFormState((c) => ({ ...c, supplierCode: value })); setFormErrors((c) => ({ ...c, supplierCode: undefined })); }} />{formErrors.supplierCode && <small className="field-error-text">{formErrors.supplierCode}</small>}</label>
                  <label className="supplier-field"><span>Company Name</span><input placeholder="Enter company name" value={formState.companyName} onChange={(e) => setFormState((c) => ({ ...c, companyName: e.target.value }))} /></label>
                  <label className="supplier-field"><span>Category</span><input placeholder="e.g. Electronics" value={formState.category} onChange={(e) => setFormState((c) => ({ ...c, category: e.target.value }))} /></label>
                  <label className="supplier-field"><span>Status</span><select className="app-select-control" value={formState.status} onChange={(e) => setFormState((c) => ({ ...c, status: e.target.value as SupplierStatus }))}><option>Active</option><option>Inactive</option><option>Preferred</option><option>Blocked</option></select></label>
                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Contact Information</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field"><span>Contact Person</span><input placeholder="Primary contact name" value={formState.contactPerson} onChange={(e) => setFormState((c) => ({ ...c, contactPerson: e.target.value }))} /></label>
                  <label className="supplier-field"><span>Phone</span><input placeholder="Supplier phone number" value={formState.phone} onChange={(e) => setFormState((c) => ({ ...c, phone: e.target.value }))} /></label>
                  <label className="supplier-field"><span>Email</span><input placeholder="contact@supplier.com" value={formState.email} onChange={(e) => { const value = e.target.value; setFormState((c) => ({ ...c, email: value })); setFormErrors((c) => ({ ...c, email: undefined })); }} />{formErrors.email && <small className="field-error-text">{formErrors.email}</small>}</label>
                  <label className="supplier-field"><span>Website</span><input placeholder="https://supplier.com" value={formState.website} onChange={(e) => setFormState((c) => ({ ...c, website: e.target.value }))} /></label>
                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Address</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field"><span>Country</span><input placeholder="Country" value={formState.country} onChange={(e) => setFormState((c) => ({ ...c, country: e.target.value }))} /></label>
                  <label className="supplier-field"><span>City</span><input placeholder="City" value={formState.city} onChange={(e) => setFormState((c) => ({ ...c, city: e.target.value }))} /></label>
                  <label className="supplier-field full"><span>Address</span><input placeholder="Business address" value={formState.address} onChange={(e) => setFormState((c) => ({ ...c, address: e.target.value }))} /></label>
                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Financial Details</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field"><span>Payment Terms</span><select className="app-select-control" value={formState.paymentTerms} onChange={(e) => setFormState((c) => ({ ...c, paymentTerms: e.target.value }))}><option>Net 7</option><option>Net 15</option><option>Net 30</option><option>Due on Receipt</option></select></label>
                  <label className="supplier-field"><span>Currency</span><select className="app-select-control" value={formState.currency} onChange={(e) => setFormState((c) => ({ ...c, currency: e.target.value }))}><option>USD</option><option>EUR</option><option>ILS</option></select></label>
                  <label className="supplier-field"><span>Tax Number</span><input placeholder="Tax registration number" value={formState.taxNumber} onChange={(e) => setFormState((c) => ({ ...c, taxNumber: e.target.value }))} /></label>
                  <label className="supplier-field"><span>Registration Number</span><input placeholder="Company registration number" value={formState.registrationNumber} onChange={(e) => setFormState((c) => ({ ...c, registrationNumber: e.target.value }))} /></label>
                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Additional Information</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field full"><span>Notes</span><textarea placeholder="Optional internal notes" rows={4} value={formState.notes} onChange={(e) => setFormState((c) => ({ ...c, notes: e.target.value }))} /></label>
                  <label className="supplier-field"><span>Tags</span><input placeholder="Preferred, Tax Registered" value={formState.tags} onChange={(e) => setFormState((c) => ({ ...c, tags: e.target.value }))} /></label>
                  <label className="supplier-field"><span>Attachment</span><input placeholder="Contract.pdf" value={formState.attachmentName} onChange={(e) => setFormState((c) => ({ ...c, attachmentName: e.target.value }))} /></label>
                </div>
              </section>
            </div>

            <div className="supplier-form-footer">
              <button className="suppliers-secondary-btn" type="button" onClick={() => setFormOpen(false)}>Cancel</button>
              <button className="suppliers-secondary-btn" type="button" onClick={() => saveSupplierForm(true)}>Save as Draft</button>
              <button className="suppliers-primary-btn" type="button" onClick={() => saveSupplierForm(false)}>Save Supplier</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="supplier-toast">
          <ShieldCheck size={16} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}
