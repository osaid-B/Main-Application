import "./Suppliers.css";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  AlertTriangle,
  ArrowUpDown,
  BadgeCheck,
  Building2,
  ChevronDown,
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
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge, type BadgeVariant } from "../components/ui/Badge";
import {
  getProductCategories,
  getPurchases,
} from "../data/storage";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
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
  Record<
    "supplierName" | "contactPerson" | "phone" | "email",
    string
  >
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
};

type SupplierConfirmAction = {
  type: "archive" | "delete";
  supplierId: string;
} | null;

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
const DEFAULT_PRODUCT_CATEGORY = "Uncategorized";

const PALESTINIAN_LOCATIONS = [
  "Jerusalem",
  "Ramallah",
  "Al-Bireh",
  "Nablus",
  "Hebron",
  "Bethlehem",
  "Jenin",
  "Tulkarm",
  "Qalqilya",
  "Salfit",
  "Tubas",
  "Jericho",
  "Gaza",
  "Khan Younis",
  "Rafah",
  "Deir al-Balah",
  "Jabalia",
  "Beit Lahia",
  "Beit Hanoun",
  "Yatta",
  "Dura",
  "Halhul",
  "Beit Jala",
  "Beit Sahour",
  "Birzeit",
  "Rawabi",
  "Anabta",
  "Azzun",
  "Ya'bad",
  "Qabatiya",
  "Arraba",
  "Beita",
  "Huwara",
  "Asira al-Shamaliya",
  "Bani Naim",
  "Idhna",
  "Tarqumiyah",
  "Beit Ummar",
  "Al-Khader",
  "Dheisheh",
  "Abu Dis",
  "Al-Eizariya",
  "Biddu",
  "Qatanna",
  "Silwad",
  "Al-Mazra'a ash-Sharqiya",
  "Sinjil",
  "Deir Dibwan",
  "Ni'lin",
  "Bil'in",
  "Kafr Qaddum",
  "Zababdeh",
  "Burqin",
  "Ajja",
  "Meithalun",
  "Tammun",
  "Aqqaba",
  "Beit Furik",
  "Awarta",
  "Qusra",
  "Aqraba",
  "Biddya",
  "Deir Ballut",
  "Kifl Haris",
  "Hizma",
  "Jaba",
  "Surif",
  "Sa'ir",
  "Al-Dhahiriya",
  "Beit Awwa",
  "Al-Samu",
  "Taffuh",
  "Bani Suheila",
  "Abasan al-Kabira",
  "Al-Qarara",
  "Al-Maghazi",
  "Al-Bureij",
  "Nuseirat",
].sort((a, b) => a.localeCompare(b));

const LOCATION_AR_LABELS: Record<string, string> = {
  Jerusalem: "القدس",
  Ramallah: "رام الله",
  "Al-Bireh": "البيرة",
  Nablus: "نابلس",
  Hebron: "الخليل",
  Bethlehem: "بيت لحم",
  Jenin: "جنين",
  Tulkarm: "طولكرم",
  Qalqilya: "قلقيلية",
  Salfit: "سلفيت",
  Tubas: "طوباس",
  Jericho: "أريحا",
  Gaza: "غزة",
  "Khan Younis": "خان يونس",
  Rafah: "رفح",
  "Deir al-Balah": "دير البلح",
  Jabalia: "جباليا",
  "Beit Lahia": "بيت لاهيا",
  "Beit Hanoun": "بيت حانون",
  Yatta: "يطا",
  Dura: "دورا",
  Halhul: "حلحول",
  "Beit Jala": "بيت جالا",
  "Beit Sahour": "بيت ساحور",
  Birzeit: "بيرزيت",
  Rawabi: "روابي",
  Anabta: "عنبتا",
  Azzun: "عزون",
  "Ya'bad": "يعبد",
  Qabatiya: "قباطية",
  Arraba: "عرابة",
  Beita: "بيتا",
  Huwara: "حوارة",
  "Asira al-Shamaliya": "عصيرة الشمالية",
  "Bani Naim": "بني نعيم",
  Idhna: "إذنا",
  Tarqumiyah: "ترقوميا",
  "Beit Ummar": "بيت أمر",
  "Al-Khader": "الخضر",
  Dheisheh: "الدهيشة",
  "Abu Dis": "أبو ديس",
  "Al-Eizariya": "العيزرية",
  Biddu: "بدو",
  Qatanna: "قطنة",
  Silwad: "سلواد",
  "Al-Mazra'a ash-Sharqiya": "المزرعة الشرقية",
  Sinjil: "سنجل",
  "Deir Dibwan": "دير دبوان",
  "Ni'lin": "نعلين",
  "Bil'in": "بلعين",
  "Kafr Qaddum": "كفر قدوم",
  Zababdeh: "الزبابدة",
  Burqin: "برقين",
  Ajja: "عجة",
  Meithalun: "ميثلون",
  Tammun: "طمون",
  Aqqaba: "عقابا",
  "Beit Furik": "بيت فوريك",
  Awarta: "عورتا",
  Qusra: "قصرى",
  Aqraba: "عقربا",
  Biddya: "بديا",
  "Deir Ballut": "دير بلوط",
  "Kifl Haris": "كفل حارس",
  Hizma: "حزما",
  Jaba: "جبع",
  Surif: "صوريف",
  "Sa'ir": "سعير",
  "Al-Dhahiriya": "الظاهرية",
  "Beit Awwa": "بيت عوا",
  "Al-Samu": "السموع",
  Taffuh: "تفوح",
  "Bani Suheila": "بني سهيلا",
  "Abasan al-Kabira": "عبسان الكبيرة",
  "Al-Qarara": "القرارة",
  "Al-Maghazi": "المغازي",
  "Al-Bureij": "البريج",
  Nuseirat: "النصيرات",
};

const formatLocationOption = (location: string) =>
  `${location} - ${LOCATION_AR_LABELS[location] || location}`;

const PAYMENT_TERM_PRESETS = [
  "Cash - كاش",
  "Partial payment - دفع جزئي",
  "Half payment - دفع نصفي",
  "Cheque - شيك",
  "Due on Receipt",
  "Net 7",
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "50% upfront / 50% on delivery",
  "Custom agreement",
];

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
  category: DEFAULT_PRODUCT_CATEGORY,
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

function buildNextSupplierCode(suppliers: Supplier[], profiles: SupplierProfile[]) {
  const maxCodeNumber = [...suppliers.map((supplier) => supplier.id), ...profiles.map((profile) => profile.code)]
    .reduce((max, value) => {
      const match = String(value || "").match(/^SUP-(\d+)$/i);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 1000);

  return `SUP-${maxCodeNumber + 1}`;
}

function buildNextRegistrationNumber(profiles: SupplierProfile[]) {
  const maxRegistrationNumber = profiles.reduce((max, profile) => {
    const match = String(profile.registrationNumber || "").match(/^REG-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 8000);

  return `REG-${maxRegistrationNumber + 1}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
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
      const receivedPct =
        status === "Received" ? 100 : status === "Partially Received" ? 56 : 0;

      return {
        id: `${supplier.id}-PO-${purchaseIndex}`,
        poNumber: `PO-2026-${String(410 + index * 3 + purchaseIndex).padStart(
          4,
          "0"
        )}`,
        date: purchase.date,
        total: purchase.totalCost,
        received: `${receivedPct}%`,
        paymentStatus,
        status,
      };
    });

  const totalPurchased = supplierPurchases.reduce(
    (sum, entry) => sum + entry.total,
    0
  );

  const outstandingBalance = supplierPurchases
    .filter((entry) => entry.paymentStatus !== "Paid")
    .reduce(
      (sum, entry) =>
        sum + entry.total * (entry.paymentStatus === "Partial" ? 0.45 : 1),
      0
    );

  const invoices = supplierPurchases.map((purchase, purchaseIndex) => ({
    id: `${supplier.id}-INV-${purchaseIndex}`,
    invoiceNumber: `SINV-2026-${String(740 + index * 4 + purchaseIndex).padStart(
      4,
      "0"
    )}`,
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
      amount:
        invoice.status === "Paid"
          ? invoice.total
          : Number((invoice.total * 0.6).toFixed(2)),
      method: ["Bank Transfer", "Wire", "Card"][paymentIndex % 3],
      reference: `PAY-${invoice.invoiceNumber.slice(-4)}`,
      notes: invoice.status === "Paid" ? "Paid in full" : "Partially settled",
    }));

  const statuses: SupplierStatus[] = ["Preferred", "Active", "Blocked", "Inactive"];
  const categories = ["Electronics", "Packaging", "Raw Materials", "Services", "Logistics"];
  const cities = ["Ramallah", "Nablus", "Hebron", "Jerusalem", "Amman"];
  const countries = ["Palestine", "Jordan", "UAE", "Saudi Arabia"];
  const rating = Number((4.1 + (index % 6) * 0.15).toFixed(1));

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
    contactPerson: ["Ahmad Saleh", "Rana Nasser", "Omar Yassin", "Lina Hamed"][
      index % 4
    ],
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
        name: ["Ahmad Saleh", "Rana Nasser", "Omar Yassin", "Lina Hamed"][
          index % 4
        ],
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
      .map(
        (supplier, index) =>
          map.get(supplier.id) || buildDefaultProfile(supplier, index, purchases)
      );
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
  const { t } = useSettings();
  const navigate = useNavigate();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier: deleteSupplierCtx } = useData();
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [productCategories] = useState<string[]>(() => getProductCategories());
  const [profiles, setProfiles] = useState<SupplierProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("supplierName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [menuState, setMenuState] = useState<ActionMenuState | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<SupplierConfirmAction>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [formState, setFormState] = useState<SupplierFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const formInitialSnapshotRef = useRef("");

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
      if (filters.paymentTerms && supplier.paymentTerms !== filters.paymentTerms) {
        return false;
      }
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
        if (filters.outstandingBalance === "open" && supplier.outstandingBalance <= 0) {
          return false;
        }

        if (filters.outstandingBalance === "high" && supplier.outstandingBalance < 5000) {
          return false;
        }
      }

      if (filters.lastPurchaseDate) {
        if (
          filters.lastPurchaseDate === "30d" &&
          supplier.lastPurchaseDate < addDays(TODAY, -30)
        ) {
          return false;
        }

        if (
          filters.lastPurchaseDate === "90d" &&
          supplier.lastPurchaseDate < addDays(TODAY, -90)
        ) {
          return false;
        }
      }

      if (filters.createdDate) {
        if (filters.createdDate === "30d" && supplier.createdDate < addDays(TODAY, -30)) {
          return false;
        }

        if (filters.createdDate === "90d" && supplier.createdDate < addDays(TODAY, -90)) {
          return false;
        }
      }

      if (quickFilters.includes("Active") && supplier.status !== "Active") return false;
      if (quickFilters.includes("Inactive") && supplier.status !== "Inactive") {
        return false;
      }
      if (quickFilters.includes("Preferred") && supplier.status !== "Preferred") {
        return false;
      }
      if (
        quickFilters.includes("Outstanding Balance") &&
        supplier.outstandingBalance <= 0
      ) {
        return false;
      }
      if (
        quickFilters.includes("New Suppliers") &&
        supplier.createdDate < addDays(TODAY, -30)
      ) {
        return false;
      }

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
          return (
            (new Date(a.lastPurchaseDate).getTime() -
              new Date(b.lastPurchaseDate).getTime()) *
            factor
          );
        default:
          return String(a[sortField]).localeCompare(String(b[sortField])) * factor;
      }
    });
  }, [filteredSuppliers, sortDirection, sortField]);

  const visibleSuppliers = sortedSuppliers;

  const detailSupplier = detailSupplierId
    ? supplierViews.find((supplier) => supplier.supplierId === detailSupplierId) || null
    : null;

  const summary = useMemo(() => {
    const totalSuppliers = supplierViews.length;
    const activeSuppliers = supplierViews.filter(
      (supplier) => supplier.status === "Active" || supplier.status === "Preferred"
    ).length;
    const outstandingPayables = supplierViews.reduce(
      (sum, supplier) => sum + supplier.outstandingBalance,
      0
    );
    const topRatedSuppliers = supplierViews.filter(
      (supplier) => supplier.rating >= 4.6
    ).length;
    const preferred = supplierViews.filter(
      (supplier) => supplier.status === "Preferred"
    ).length;
    const blocked = supplierViews.filter(
      (supplier) => supplier.status === "Blocked"
    ).length;

    return {
      totalSuppliers,
      activeSuppliers,
      outstandingPayables,
      topRatedSuppliers,
      preferred,
      blocked,
    };
  }, [supplierViews]);

  const topSuppliers = useMemo(() => {
    const maxPurchased = Math.max(
      ...supplierViews.map((supplier) => supplier.totalPurchased),
      1
    );

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
      if (filters[key]) {
        entries.push({ key, label: labels[key], value: filters[key] });
      }
    });

    return entries;
  }, [filters]);

  const categoryOptions = useMemo(() => {
    const fromProfiles = supplierViews.map((supplier) => supplier.category).filter(Boolean);
    const merged = Array.from(
      new Set([...productCategories, ...fromProfiles, DEFAULT_PRODUCT_CATEGORY])
    );
    return merged.sort((a, b) => a.localeCompare(b));
  }, [productCategories, supplierViews]);

  const menuSupplier = menuState
    ? supplierViews.find((supplier) => supplier.supplierId === menuState.id) || null
    : null;

  const confirmSupplier = confirmAction
    ? supplierViews.find((supplier) => supplier.supplierId === confirmAction.supplierId) || null
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
    const gap = 8;

    setMenuState({
      id,
      top: rect.bottom + gap,
      left: Math.min(
        window.innerWidth - menuWidth - 12,
        Math.max(12, rect.right - menuWidth)
      ),
    });
  }

  function openAddModal() {
    const nextCode = buildNextSupplierCode(suppliers, profiles);
    const nextForm = {
      ...EMPTY_FORM,
      supplierCode: nextCode,
      category: categoryOptions[0] || DEFAULT_PRODUCT_CATEGORY,
    };

    setFormMode("add");
    setEditingSupplierId(null);
    setFormState(nextForm);
    formInitialSnapshotRef.current = JSON.stringify(nextForm);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEditModal(supplierId: string) {
    const supplier = supplierViews.find((item) => item.supplierId === supplierId);
    if (!supplier) return;

    setFormMode("edit");
    setEditingSupplierId(supplierId);
    const nextForm = {
      supplierName: supplier.supplierName,
      supplierCode: supplier.code,
      companyName: supplier.companyName,
      category: supplier.category,
      status: supplier.status,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      website: "",
      country: supplier.country,
      city: supplier.city,
      address: "",
      paymentTerms: supplier.paymentTerms,
      currency: supplier.currency,
      taxNumber: supplier.taxNumber,
      registrationNumber: supplier.registrationNumber,
      notes: supplier.notes[0]?.text || "",
      tags: "",
      attachmentName: "",
    };

    setFormState(nextForm);
    formInitialSnapshotRef.current = JSON.stringify(nextForm);
    setFormErrors({});
    setFormOpen(true);
    setMenuState(null);
  }

  function requestCloseForm() {
    const isDirty = JSON.stringify(formState) !== formInitialSnapshotRef.current;

    if (isDirty) {
      setDiscardConfirmOpen(true);
      return;
    }

    closeFormNow();
  }

  function closeFormNow() {
    setFormOpen(false);
    setDiscardConfirmOpen(false);
    setFormErrors({});
  }

  function validateSupplierForm() {
    const nextErrors: FormErrors = {};

    if (!formState.supplierName.trim()) {
      nextErrors.supplierName = "Supplier name is required.";
    }

    if (!formState.phone.trim() && !formState.email.trim()) {
      nextErrors.phone = "Enter a phone number or email address.";
    }

    if (
      formState.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function saveSupplierForm(saveAsDraft = false) {
    if (!validateSupplierForm()) return;

    const code = editingSupplierId
      ? formState.supplierCode.trim()
      : buildNextSupplierCode(suppliers, profiles);
    const supplierId = editingSupplierId || code;
    const registrationNumber =
      formState.companyName.trim() && !editingSupplierId
        ? buildNextRegistrationNumber(profiles)
        : formState.registrationNumber.trim();

    const nextSupplier = {
      id: supplierId,
      name: formState.supplierName.trim() || "Supplier",
      phone: formState.phone.trim(),
      email: formState.email.trim(),
      address: formState.city.trim(),
      isDeleted: false,
    } as Supplier;

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
      registrationNumber,
      contactPerson: "",
      website: "",
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
      tags: [],
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
          name: formState.supplierName.trim() || "Primary Contact",
          role: "Primary Contact",
          phone: formState.phone.trim(),
          email: formState.email.trim(),
          notes: "",
        },
      ],
      documents: [],
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

    const supplierExists = suppliers.some((s) => s.id === supplierId);
    if (supplierExists) {
      updateSupplier(nextSupplier);
    } else {
      addSupplier(nextSupplier);
    }

    setProfiles((current) => {
      const exists = current.some((item) => item.supplierId === supplierId);

      if (exists) {
        return current.map((item) =>
          item.supplierId === supplierId ? { ...item, ...profile } : item
        );
      }

      return [profile, ...current];
    });

    setFormOpen(false);
    setToast(
      saveAsDraft
        ? t.common.saveAsDraft
        : editingSupplierId
          ? t.suppliers.toast.updated
          : t.suppliers.toast.created
    );
  }

  function deleteSupplierItem(supplierId: string) {
    deleteSupplierCtx(supplierId);
    setProfiles((current) =>
      current.filter((profile) => profile.supplierId !== supplierId)
    );
    setMenuState(null);
    setConfirmAction(null);
    setToast(t.suppliers.toast.deleted);
  }

  function confirmSupplierAction() {
    if (!confirmAction) return;

    const supplier = supplierViews.find(
      (item) => item.supplierId === confirmAction.supplierId
    );

    if (confirmAction.type === "delete") {
      deleteSupplierItem(confirmAction.supplierId);
      return;
    }

    setProfiles((prev) =>
      prev.map((p) => p.supplierId === confirmAction.supplierId ? { ...p, status: "Inactive" as SupplierStatus } : p),
    );
    saveProfiles(profiles.map((p) => p.supplierId === confirmAction.supplierId ? { ...p, status: "Inactive" as SupplierStatus } : p));
    setConfirmAction(null);
    setMenuState(null);
    setToast(`${supplier?.supplierName || "Supplier"} archived`);
  }

  function toggleQuickFilter(value: string) {
    setQuickFilters((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
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
              {t.suppliers.pageTitle}
            </div>
            <h1>{t.suppliers.pageTitle}</h1>
            <p>{t.suppliers.pageSubtitle}</p>
          </div>

          <div className="suppliers-header-actions">
            <Button variant="primary" size="md" type="button" onClick={openAddModal} leftIcon={<Plus size={16} />}>
              {t.suppliers.addSupplier}
            </Button>
          </div>
        </section>

        <section className="suppliers-kpi-grid">
          <article className="suppliers-kpi-card">
            <div className="kpi-icon blue">
              <Building2 size={18} />
            </div>
            <div>
              <span>Total Suppliers</span>
              <strong>{summary.totalSuppliers}</strong>
              <small>This month</small>
            </div>
          </article>

          <article className="suppliers-kpi-card">
            <div className="kpi-icon green">
              <BadgeCheck size={18} />
            </div>
            <div>
              <span>Active Suppliers</span>
              <strong>{summary.activeSuppliers}</strong>
              <small>Updated today</small>
            </div>
          </article>

          <article className="suppliers-kpi-card">
            <div className="kpi-icon amber">
              <Wallet size={18} />
            </div>
            <div>
              <span>Outstanding Payables</span>
              <strong>{money(summary.outstandingPayables)}</strong>
              <small>Across all vendors</small>
            </div>
          </article>

          <article className="suppliers-kpi-card">
            <div className="kpi-icon slate">
              <Star size={18} />
            </div>
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
                <Input
                  variant="search"
                  size="md"
                  leftIcon={<Search size={18} />}
                  className="supplier-search-field"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.suppliers.searchPlaceholder}
                />

                <div className="supplier-toolbar-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    className={`supplier-toolbar-btn ${moreFiltersOpen ? "active" : ""}`}
                    type="button"
                    onClick={() => setMoreFiltersOpen((current) => !current)}
                    aria-expanded={moreFiltersOpen}
                    leftIcon={<Filter size={15} />}
                    rightIcon={<ChevronDown size={15} />}
                  >
                    {t.suppliers.filterBtn}
                  </Button>
                </div>
              </div>

              {moreFiltersOpen && (
                <div className="supplier-filter-popover">
                  <div className="supplier-filter-popover-head">
                    <div>
                      <strong>{t.suppliers.filterBtn}</strong>
                      <span>Keep the list focused with essential supplier fields.</span>
                    </div>
                    <Button
                      variant="icon"
                      size="sm"
                      type="button"
                      onClick={() => setMoreFiltersOpen(false)}
                      aria-label="Close filters"
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  <div className="supplier-filter-popover-grid">
                    <div className="supplier-field">
                      <span>Status</span>
                      <Select
                        size="md"
                        fullWidth
                        value={filters.status}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "All statuses" },
                          { value: "Active", label: "Active" },
                          { value: "Inactive", label: "Inactive" },
                          { value: "Preferred", label: "Preferred" },
                          { value: "Blocked", label: "Blocked" },
                        ]}
                      />
                    </div>

                    <div className="supplier-field">
                      <span>Category</span>
                      <Select
                        size="md"
                        fullWidth
                        value={filters.category}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            category: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "All categories" },
                          ...categoryOptions.map((category) => ({
                            value: category,
                            label: category,
                          })),
                        ]}
                      />
                    </div>

                    <div className="supplier-field">
                      <span>Balance</span>
                      <Select
                        size="md"
                        fullWidth
                        value={filters.outstandingBalance}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            outstandingBalance: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "All balances" },
                          { value: "open", label: "Outstanding only" },
                          { value: "high", label: "High balance" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="supplier-filter-popover-footer">
                    <Button variant="secondary" size="md" type="button" onClick={clearFilters}>
                      {t.common.reset}
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      type="button"
                      onClick={() => setMoreFiltersOpen(false)}
                    >
                      {t.common.apply}
                    </Button>
                  </div>
                </div>
              )}

              {(activeFilterEntries.length > 0 || quickFilters.length > 0) && (
                <div className="active-filter-row">
                  {activeFilterEntries.map((entry) => (
                    <button
                      key={`${entry.key}-${entry.value}`}
                      type="button"
                      className="active-filter-chip"
                      onClick={() =>
                        setFilters((current) => ({ ...current, [entry.key]: "" }))
                      }
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
                  <h3>
                    {searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0
                      ? "No results found"
                      : "No suppliers yet"}
                  </h3>
                  <p>
                    {searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0
                      ? "Try changing your filters or search."
                      : "Create your first supplier profile to start procurement workflows."}
                  </p>

                  {searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0 ? (
                    <Button
                      variant="secondary"
                      size="md"
                      type="button"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      type="button"
                      onClick={openAddModal}
                      leftIcon={<Plus size={16} />}
                    >
                      {t.suppliers.addSupplier}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="suppliers-table-wrap app-table-wrap">
                  <table className="suppliers-table app-data-table">
                    <colgroup>
                      <col className="supplier-col" />
                      <col className="phone-col" />
                      <col className="location-col" />
                      <col className="balance-col" />
                      <col className="status-col" />
                      <col className="actions-col" />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>
                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() => handleSort("supplierName")}
                          >
                            {t.suppliers.cols.supplier} <ArrowUpDown size={13} />
                          </button>
                        </th>

                        <th>{t.common.phone}</th>

                        <th>Location</th>

                        <th>
                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() => handleSort("outstandingBalance")}
                          >
                            {t.suppliers.cols.balance} <ArrowUpDown size={13} />
                          </button>
                        </th>

                        <th>
                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() => handleSort("status")}
                          >
                            {t.suppliers.cols.status} <ArrowUpDown size={13} />
                          </button>
                        </th>

                        <th>{t.suppliers.cols.actions}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleSuppliers.map((supplier) => (
                        <tr
                          key={supplier.supplierId}
                          onClick={() => {
                            setDetailSupplierId(supplier.supplierId);
                            setDetailTab("overview");
                          }}
                        >
                          <td>
                            <div className="supplier-table-cell supplier-main-cell">
                              <strong>{supplier.supplierName}</strong>
                              <span>
                                {supplier.code} · {supplier.companyType}
                              </span>
                              <small>{supplier.category}</small>
                            </div>
                          </td>

                          <td>
                            <div className="supplier-table-cell phone-stack">
                              <strong>{supplier.phone || "No phone"}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="supplier-table-cell location-stack">
                              <strong>{supplier.city || "No location"}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="supplier-table-cell balance-stack">
                              <strong className="balance-cell">
                                {money(supplier.outstandingBalance)}
                              </strong>
                            </div>
                          </td>

                          <td>
                            <div className="supplier-table-cell status-stack">
                              <Badge
                                variant={
                                  (
                                    {
                                      positive: "success",
                                      info: "info",
                                      danger: "danger",
                                      neutral: "neutral",
                                    } as const
                                  )[statusTone(supplier.status)] as BadgeVariant
                                }
                                size="sm"
                                className={`supplier-status-badge ${statusTone(
                                  supplier.status
                                )}`}
                              >
                                {supplier.status}
                              </Badge>

                            </div>
                          </td>

                          <td className="supplier-actions-cell">
                            <div className="supplier-actions-menu-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                className={`supplier-sticker-action ${
                                  menuState?.id === supplier.supplierId ? "active" : ""
                                }`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openMenu(supplier.supplierId, event.currentTarget);
                                }}
                                aria-label="Open supplier actions"
                                title="Actions"
                              >
                                <MoreHorizontal size={17} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="simple-suppliers-footer">
                <span>Showing all {filteredSuppliers.length} suppliers</span>
              </div>
            </div>
          </section>

          <aside className="suppliers-side-column">
            <section className="side-widget">
              <div className="side-widget-head">
                <h3>Supplier Summary</h3>
                <span>This month</span>
              </div>

              <div className="side-stat-list">
                <div>
                  <span>Total suppliers</span>
                  <strong>{summary.totalSuppliers}</strong>
                </div>
                <div>
                  <span>Preferred</span>
                  <strong>{summary.preferred}</strong>
                </div>
                <div>
                  <span>Blocked</span>
                  <strong>{summary.blocked}</strong>
                </div>
                <div>
                  <span>Outstanding payables</span>
                  <strong>{money(summary.outstandingPayables)}</strong>
                </div>
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

      {menuState &&
        menuSupplier &&
        createPortal(
          <div
            ref={menuRef}
            className="supplier-action-menu"
            style={{ top: menuState.top, left: menuState.left }}
          >
            <div className="supplier-action-menu-head">
              <strong>Supplier Actions</strong>
              <span>{menuSupplier.supplierName}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="view"
              leftIcon={<Eye size={15} />}
              onClick={() => {
                setDetailSupplierId(menuSupplier.supplierId);
                setDetailTab("overview");
                setMenuState(null);
              }}
            >
              View Supplier
            </Button>

            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="edit"
              leftIcon={<FileText size={15} />}
              onClick={() => openEditModal(menuSupplier.supplierId)}
            >
              Edit Supplier
            </Button>

            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="archive"
              leftIcon={<Archive size={15} />}
              onClick={() => {
                setConfirmAction({
                  type: "archive",
                  supplierId: menuSupplier.supplierId,
                });
                setMenuState(null);
              }}
            >
              Archive Supplier
            </Button>

            <Button
              variant="danger"
              size="sm"
              type="button"
              className="danger"
              leftIcon={<X size={15} />}
              onClick={() => {
                setConfirmAction({
                  type: "delete",
                  supplierId: menuSupplier.supplierId,
                });
                setMenuState(null);
              }}
            >
              Delete Supplier
            </Button>
          </div>,
          document.body
        )}

      {detailSupplier &&
        createPortal(
        <div className="supplier-overlay" onClick={() => setDetailSupplierId(null)}>
          <aside className="supplier-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="supplier-drawer-head">
              <div>
                <span>{detailSupplier.code}</span>
                <h2>{detailSupplier.supplierName}</h2>
                <p>{detailSupplier.companyType}</p>
              </div>
              <Button
                variant="icon"
                size="sm"
                type="button"
                onClick={() => setDetailSupplierId(null)}
                aria-label="Close supplier details"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="supplier-drawer-tabs">
              {(
                [
                  "overview",
                  "purchases",
                  "invoices",
                  "payments",
                  "contacts",
                  "notes",
                  "documents",
                  "history",
                ] as DetailTab[]
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={detailTab === tab ? "active" : ""}
                  onClick={() => setDetailTab(tab)}
                >
                  {t.suppliers.tabs[tab]}
                </button>
              ))}
            </div>

            <div className="supplier-drawer-body">
              {detailTab === "overview" && (
                <div className="detail-card-grid">
                  <section className="detail-card">
                    <h3>Basic Information</h3>
                    <dl>
                      <div>
                        <dt>Supplier Name</dt>
                        <dd>{detailSupplier.supplierName}</dd>
                      </div>
                      <div>
                        <dt>Supplier Code</dt>
                        <dd>{detailSupplier.code}</dd>
                      </div>
                      <div>
                        <dt>Company Name</dt>
                        <dd>{detailSupplier.companyName}</dd>
                      </div>
                      <div>
                        <dt>Category</dt>
                        <dd>{detailSupplier.category}</dd>
                      </div>
                      <div>
                        <dt>Tax Number</dt>
                        <dd>{detailSupplier.taxNumber}</dd>
                      </div>
                      <div>
                        <dt>Registration Number</dt>
                        <dd>{detailSupplier.registrationNumber}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{detailSupplier.status}</dd>
                      </div>
                      <div>
                        <dt>Rating</dt>
                        <dd>{detailSupplier.rating.toFixed(1)} / 5</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card">
                    <h3>Contact Information</h3>
                    <dl>
                      <div>
                        <dt>Phone</dt>
                        <dd>{detailSupplier.phone || "-"}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{detailSupplier.email || "-"}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{detailSupplier.city || detailSupplier.country || "-"}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card">
                    <h3>Financial Information</h3>
                    <dl>
                      <div>
                        <dt>Payment Terms</dt>
                        <dd>{detailSupplier.paymentTerms}</dd>
                      </div>
                      <div>
                        <dt>Preferred Currency</dt>
                        <dd>{detailSupplier.currency}</dd>
                      </div>
                      <div>
                        <dt>Outstanding Balance</dt>
                        <dd>{money(detailSupplier.outstandingBalance)}</dd>
                      </div>
                      <div>
                        <dt>Total Purchased</dt>
                        <dd>{money(detailSupplier.totalPurchased)}</dd>
                      </div>
                      <div>
                        <dt>Last Payment</dt>
                        <dd>{formatDate(detailSupplier.lastPaymentDate)}</dd>
                      </div>
                      <div>
                        <dt>Last Purchase</dt>
                        <dd>{formatDate(detailSupplier.lastPurchaseDate)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card">
                    <h3>Performance Summary</h3>
                    <dl>
                      <div>
                        <dt>On-time delivery rate</dt>
                        <dd>{detailSupplier.onTimeRate}%</dd>
                      </div>
                      <div>
                        <dt>Quality score</dt>
                        <dd>{detailSupplier.qualityScore}%</dd>
                      </div>
                      <div>
                        <dt>Return rate</dt>
                        <dd>{detailSupplier.returnRate}%</dd>
                      </div>
                      <div>
                        <dt>Reliability level</dt>
                        <dd>{detailSupplier.reliabilityLevel}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              )}

              {detailTab === "purchases" && (
                <div className="detail-table-card">
                  <div className="detail-card-head">
                    <h3>{t.suppliers.tabs.purchases}</h3>
                    <Button
                      variant="primary"
                      size="md"
                      type="button"
                      className="drawer-primary-btn"
                      onClick={() => navigate(`/purchases?supplierId=${detailSupplier?.supplierId ?? ""}`)}
                    >
                      Add Purchase
                    </Button>
                  </div>
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>{t.common.date}</th>
                        <th>Total</th>
                        <th>Received</th>
                        <th>Payment Status</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailSupplier.purchases.map((item) => (
                        <tr key={item.id}>
                          <td>{item.poNumber}</td>
                          <td>{formatDate(item.date)}</td>
                          <td>{money(item.total)}</td>
                          <td>{item.received}</td>
                          <td>{item.paymentStatus}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "invoices" && (
                <div className="detail-table-card">
                  <h3>{t.suppliers.tabs.invoices}</h3>
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Invoice Number</th>
                        <th>{t.common.date}</th>
                        <th>Due Date</th>
                        <th>{t.common.total}</th>
                        <th>Remaining</th>
                        <th>{t.common.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailSupplier.invoices.map((item) => (
                        <tr key={item.id}>
                          <td>{item.invoiceNumber}</td>
                          <td>{formatDate(item.date)}</td>
                          <td>{formatDate(item.dueDate)}</td>
                          <td>{money(item.total)}</td>
                          <td>{money(item.remaining)}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "payments" && (
                <div className="detail-table-card">
                  <h3>{t.suppliers.tabs.payments}</h3>
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Payment Date</th>
                        <th>{t.common.amount}</th>
                        <th>{t.common.method}</th>
                        <th>Reference</th>
                        <th>{t.common.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailSupplier.payments.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.paymentDate)}</td>
                          <td>{money(item.amount)}</td>
                          <td>{item.method}</td>
                          <td>{item.reference}</td>
                          <td>
                            <OverflowContent
                              title={item.reference}
                              preview={item.notes}
                              content={item.notes}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === "contacts" && (
                <div className="detail-table-card">
                  <div className="detail-card-head">
                    <h3>{t.suppliers.tabs.contacts}</h3>
                    <Button variant="secondary" size="md" type="button" className="drawer-secondary-btn">
                      Add Contact
                    </Button>
                  </div>
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>{t.common.name}</th>
                        <th>Role</th>
                        <th>{t.common.phone}</th>
                        <th>{t.common.email}</th>
                        <th>{t.common.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailSupplier.contacts.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.role}</td>
                          <td>{item.phone}</td>
                          <td>{item.email}</td>
                          <td>
                            <OverflowContent
                              title={item.name}
                              subtitle={item.role}
                              preview={item.notes}
                              content={item.notes}
                            />
                          </td>
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
                  <h3>{t.suppliers.tabs.documents}</h3>
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Uploaded Date</th>
                        <th>Uploaded By</th>
                        <th>{t.suppliers.cols.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailSupplier.documents.map((document) => (
                        <tr key={document.id}>
                          <td>{document.fileName}</td>
                          <td>{document.type}</td>
                          <td>{formatDate(document.uploadedDate)}</td>
                          <td>{document.uploadedBy}</td>
                          <td>Download</td>
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
        </div>,
        document.body
      )}

      {formOpen && createPortal(
        <div className="supplier-overlay" onClick={requestCloseForm}>
          <div className="supplier-modal" onClick={(event) => event.stopPropagation()}>
            <div className="supplier-drawer-head">
              <div>
                <span>{formMode === "add" ? t.suppliers.form.createTitle : t.suppliers.form.editTitle}</span>
                <h2>{formMode === "add" ? t.suppliers.form.createTitle : t.suppliers.form.editTitle}</h2>
                <p>Supplier profile, terms, contacts, and finance details</p>
              </div>
              <Button
                variant="icon"
                size="sm"
                type="button"
                onClick={requestCloseForm}
                aria-label="Close supplier form"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="supplier-form-body">
              <section className="supplier-form-section">
                <h3>Basic Information</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field">
                    <span>Supplier Name *</span>
                    <input
                      placeholder="Enter supplier name"
                      value={formState.supplierName}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormState((current) => ({
                          ...current,
                          supplierName: value,
                        }));
                        setFormErrors((current) => ({
                          ...current,
                          supplierName: undefined,
                        }));
                      }}
                    />
                    {formErrors.supplierName && (
                      <small className="field-error-text">
                        {formErrors.supplierName}
                      </small>
                    )}
                  </label>

                  <label className="supplier-field">
                    <span>Supplier Code</span>
                    <input
                      placeholder="Auto-generated"
                      value={formState.supplierCode}
                      readOnly
                    />
                  </label>

                  <label className="supplier-field">
                    <span>Company Name Optional</span>
                    <input
                      placeholder="Optional company name"
                      value={formState.companyName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          companyName: event.target.value,
                          registrationNumber:
                            !editingSupplierId && event.target.value.trim()
                              ? current.registrationNumber || buildNextRegistrationNumber(profiles)
                              : current.registrationNumber,
                        }))
                      }
                    />
                  </label>

                  <label className="supplier-field">
                    <span>Category</span>
                    <select
                      className="app-select-control"
                      value={formState.category}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="supplier-field">
                    <span>Status</span>
                    <select
                      className="app-select-control"
                      value={formState.status}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          status: event.target.value as SupplierStatus,
                        }))
                      }
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Preferred</option>
                      <option>Blocked</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Contact Information</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field">
                    <span>Phone or Email *</span>
                    <input
                      placeholder="Supplier phone number"
                      value={formState.phone}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormState((current) => ({
                          ...current,
                          phone: value,
                        }));
                        setFormErrors((current) => ({
                          ...current,
                          phone: undefined,
                        }));
                      }}
                    />
                    {formErrors.phone && (
                      <small className="field-error-text">{formErrors.phone}</small>
                    )}
                  </label>

                  <label className="supplier-field">
                    <span>Email Optional</span>
                    <input
                      placeholder="Optional email address"
                      value={formState.email}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormState((current) => ({
                          ...current,
                          email: value,
                        }));
                        setFormErrors((current) => ({
                          ...current,
                          email: undefined,
                          phone: undefined,
                        }));
                      }}
                    />
                    {formErrors.email && (
                      <small className="field-error-text">{formErrors.email}</small>
                    )}
                  </label>

                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Location</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field full">
                    <span>Location</span>
                    <input
                      list="supplier-location-options"
                      placeholder="Search Palestinian city or village"
                      value={formState.city}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          country: "Palestine",
                          city: event.target.value,
                        }))
                      }
                    />
                    <datalist id="supplier-location-options">
                      {PALESTINIAN_LOCATIONS.map((location) => (
                        <option key={location} value={formatLocationOption(location)} />
                      ))}
                    </datalist>
                  </label>
                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Financial Details</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field">
                    <span>Payment Terms</span>
                    <input
                      list="supplier-payment-term-options"
                      placeholder="Cash, partial payment, cheque, or custom terms"
                      value={formState.paymentTerms}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          paymentTerms: event.target.value,
                        }))
                      }
                    />
                    <datalist id="supplier-payment-term-options">
                      {PAYMENT_TERM_PRESETS.map((term) => (
                        <option key={term} value={term} />
                      ))}
                    </datalist>
                  </label>

                  <label className="supplier-field">
                    <span>Currency</span>
                    <select
                      className="app-select-control"
                      value={formState.currency}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          currency: event.target.value,
                        }))
                      }
                    >
                      <option>USD</option>
                      <option>EUR</option>
                      <option>ILS</option>
                    </select>
                  </label>

                  <label className="supplier-field">
                    <span>Tax Number</span>
                    <input
                      placeholder="Tax registration number"
                      value={formState.taxNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          taxNumber: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="supplier-field">
                    <span>Registration Number</span>
                    <input
                      placeholder="Auto-generated for company suppliers"
                      value={
                        formState.registrationNumber ||
                        (!editingSupplierId && formState.companyName.trim()
                          ? buildNextRegistrationNumber(profiles)
                          : "")
                      }
                      readOnly
                    />
                  </label>
                </div>
              </section>

              <section className="supplier-form-section">
                <h3>Notes</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field full">
                    <span>Notes</span>
                    <textarea
                      placeholder="Optional internal notes"
                      rows={4}
                      value={formState.notes}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </section>
            </div>

            <div className="supplier-form-footer">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={requestCloseForm}
              >
                {t.common.cancel}
              </Button>
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => saveSupplierForm(true)}
              >
                {t.common.saveAsDraft}
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => saveSupplierForm(false)}
              >
                {t.suppliers.addSupplier}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {discardConfirmOpen &&
        createPortal(
          <div className="supplier-overlay supplier-confirm-overlay" onClick={() => setDiscardConfirmOpen(false)}>
            <div className="supplier-confirm-modal" onClick={(event) => event.stopPropagation()}>
              <div className="supplier-confirm-icon">
                <AlertTriangle size={22} />
              </div>
              <div>
                <span>Unsaved changes</span>
                <h3>Discard supplier information?</h3>
                <p>
                  You have entered supplier details that have not been saved yet.
                  Closing now will remove those changes.
                </p>
              </div>
              <div className="supplier-confirm-actions">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setDiscardConfirmOpen(false)}
                >
                  {t.common.keepEditing}
                </Button>
                <Button variant="danger" size="md" type="button" className="supplier-danger-btn" onClick={closeFormNow}>
                  {t.common.discard}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {confirmAction &&
        createPortal(
          <div className="supplier-overlay supplier-confirm-overlay" onClick={() => setConfirmAction(null)}>
            <div className="supplier-confirm-modal" onClick={(event) => event.stopPropagation()}>
              <div className="supplier-confirm-icon">
                {confirmAction.type === "delete" ? <X size={22} /> : <Archive size={22} />}
              </div>
              <div>
                <span>Supplier action</span>
                <h3>
                  {confirmAction.type === "delete"
                    ? "Delete this supplier?"
                    : "Archive this supplier?"}
                </h3>
                <p>
                  {confirmAction.type === "delete"
                    ? `This will remove ${confirmSupplier?.supplierName || "this supplier"} from the suppliers table.`
                    : `${confirmSupplier?.supplierName || "This supplier"} will be marked as archived for your workflow.`}
                </p>
              </div>
              <div className="supplier-confirm-actions">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setConfirmAction(null)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  variant={confirmAction.type === "delete" ? "danger" : "primary"}
                  size="md"
                  type="button"
                  className={
                    confirmAction.type === "delete"
                      ? "supplier-danger-btn"
                      : "suppliers-primary-btn"
                  }
                  onClick={confirmSupplierAction}
                >
                  {confirmAction.type === "delete" ? `${t.common.delete} ${t.suppliers.cols.supplier}` : `${t.common.archived} ${t.suppliers.cols.supplier}`}
                </Button>
              </div>
            </div>
          </div>,
          document.body
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
