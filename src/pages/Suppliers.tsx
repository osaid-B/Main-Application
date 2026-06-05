import "./Suppliers.css";
import { TableActions } from "../components/ui/TableActions";
import { Can } from "../components/Can";
import { useAuth } from "../context/AuthContext";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  AlertTriangle,
  ArrowUpDown,
  Ban,
  Building2,
  ChevronDown,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Truck,
  X,
} from "lucide-react";
import OverflowContent from "../components/ui/OverflowContent";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  getProductCategories,
  getPurchases,
} from "../data/storage";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import type { Purchase, Supplier } from "../data/types";
import { formatCurrencyValue } from "../utils/displayFormatters";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";

type SupplierStatus = "Active" | "Inactive" | "Preferred" | "Blocked";

type DetailTab =
  | "overview"
  | "purchases"
  | "invoices"
  | "payments"
  | "contacts"
  | "notes"
  | "documents"
  | "history"
  | "policy";

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
  returnPolicy?: string;
  returnDays?: number;
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


const EMPTY_FILTERS: FilterState = {
  status: "",
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

function isValidPhone(phone: string): boolean {
  const mobileRegex = /^0(5[0-9])\d{7}$/;
  const landlineRegex = /^0(2|8|9)\d{7}$/;
  return mobileRegex.test(phone) || landlineRegex.test(phone);
}

function buildNextRegistrationNumber(profiles: SupplierProfile[]) {
  const maxRegistrationNumber = profiles.reduce((max, profile) => {
    const match = String(profile.registrationNumber || "").match(/^REG-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 8000);

  return `REG-${maxRegistrationNumber + 1}`;
}

function money(value: number) {
  return formatCurrencyValue(value || 0, "ILS");
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
    returnPolicy: "",
    returnDays: 14,
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

function formatLocationDisplay(location: string, isArabic: boolean) {
  if (!location) {
    return isArabic ? "بدون موقع" : "No location";
  }

  return isArabic ? (LOCATION_AR_LABELS[location] || location) : location;
}

function formatSupplierStatusLabel(status: SupplierStatus, isArabic: boolean) {
  if (!isArabic) return status;

  switch (status) {
    case "Active":
      return "نشط";
    case "Inactive":
      return "غير نشط";
    case "Preferred":
      return "مفضل";
    case "Blocked":
      return "محظور";
    default:
      return status;
  }
}

function AnimatedNumber({ value, duration = 500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  const reduced = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduced.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }
    let startTime: number | null = null;
    ref.current = 0;
    function tick(now: number) {
      if (!startTime) startTime = now;
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ─── Supplier helpers ─────────────────────────────────────────────────────────

const AVATAR_PALETTE = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#14B8A6"];
function supplierAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

const CAT_BG_PALETTE = ["#EFF6FF","#F0FDF4","#FEF3C7","#F5F3FF","#FEF2F2","#F0FDFA","#FFF7ED"];
const CAT_FG_PALETTE = ["#2563EB","#16A34A","#D97706","#7C3AED","#DC2626","#0891B2","#EA580C"];
function catHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}
function getCatBg(cat?: string): string { return cat ? CAT_BG_PALETTE[catHash(cat) % CAT_BG_PALETTE.length] : "#F1F5F9"; }
function getCatColor(cat?: string): string { return cat ? CAT_FG_PALETTE[catHash(cat) % CAT_FG_PALETTE.length] : "#64748B"; }

const SUPPLIER_CATEGORIES = [
  { key: "food",        label: "مواد غذائية",      icon: "🥗" },
  { key: "electronics", label: "إلكترونيات",         icon: "💻" },
  { key: "clothing",    label: "ملابس وأقمشة",      icon: "👕" },
  { key: "medical",     label: "طبي وصيدلاني",      icon: "💊" },
  { key: "building",    label: "مواد البناء",         icon: "🏗️" },
  { key: "stationery",  label: "قرطاسية ومكتبية",   icon: "📎" },
  { key: "cleaning",    label: "منظفات ومستلزمات",  icon: "🧹" },
  { key: "transport",   label: "نقل وشحن",           icon: "🚛" },
  { key: "services",    label: "خدمات مهنية",        icon: "⚙️" },
  { key: "mixed",       label: "متنوع / أخرى",       icon: "📦" },
] as const;

function SupplierPolicyTab({
  profile, isArabic, onSave,
}: {
  profile: SupplierProfile;
  isArabic: boolean;
  onSave: (patch: Partial<SupplierProfile>) => void;
}) {
  const [returnPolicy, setReturnPolicy] = useState(profile.returnPolicy ?? "");
  const [returnDays, setReturnDays] = useState<number>(profile.returnDays ?? 14);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({ returnPolicy, returnDays });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", border: "1px solid #E2E8F0",
    borderRadius: 8, fontSize: 13.5, color: "#0F172A", background: "#fff",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 120ms ease",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: 6, fontSize: 12.5,
    fontWeight: 700, color: "#475569",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section className="detail-card">
        <h3>{isArabic ? "سياسة الإرجاع والاسترداد" : "Return & Refund Policy"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>{isArabic ? "مدة الإرجاع المسموح بها (أيام)" : "Return Window (days)"}</label>
            <input
              type="number"
              min={0}
              max={365}
              value={returnDays}
              onChange={(e) => setReturnDays(Math.max(0, Number(e.target.value)))}
              style={{ ...fieldStyle, height: 40, width: 120 }}
            />
          </div>
          <div>
            <label style={labelStyle}>{isArabic ? "شروط وأحكام الإرجاع" : "Return Conditions"}</label>
            <textarea
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              placeholder={isArabic ? "مثال: يُقبل الإرجاع للبضائع غير المفتوحة فقط..." : "e.g. Returns accepted for unopened goods only..."}
              rows={4}
              style={{ ...fieldStyle, resize: "vertical", padding: "10px 12px" }}
            />
          </div>
        </div>
      </section>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          style={{
            height: 40, padding: "0 22px", borderRadius: 9, border: "none",
            background: "#2563EB", color: "#fff", fontSize: 13.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1D4ED8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#2563EB"; }}
        >
          {isArabic ? "حفظ السياسة" : "Save Policy"}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 600 }}>
            {isArabic ? "✓ تم الحفظ" : "✓ Saved"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Suppliers() {
  const { t, isArabic } = useSettings();
  const { can } = useAuth();
  const navigate = useNavigate();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier: deleteSupplierCtx } = useData();
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [productCategories] = useState<string[]>(() => getProductCategories());
  const [profiles, setProfiles] = useState<SupplierProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("supplierName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [panelStatus, setPanelStatus] = useState('');
  const [panelCategory, setPanelCategory] = useState('');
  const [panelBalance, setPanelBalance] = useState('');
  const [menuState, setMenuState] = useState<ActionMenuState | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<SupplierConfirmAction>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ itemName: string; onConfirm: () => void } | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [formState, setFormState] = useState<SupplierFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);
  const [filterClosing, setFilterClosing] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [customCatInput, setCustomCatInput] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);
  const formInitialSnapshotRef = useRef("");
  const supplierCopy = useMemo(
    () => ({
      summary: {
        total: isArabic ? "إجمالي الموردين" : "Total Suppliers",
        active: isArabic ? "الموردون النشطون" : "Active Suppliers",
        outstanding: isArabic ? "المستحقات المفتوحة" : "Outstanding Payables",
        topRated: isArabic ? "الأعلى تقييماً" : "Top Rated Suppliers",
        thisMonth: isArabic ? "هذا الشهر" : "This month",
        updatedToday: isArabic ? "محدث اليوم" : "Updated today",
        acrossVendors: isArabic ? "على مستوى جميع الموردين" : "Across all vendors",
        ratingHint: isArabic ? "4.6 فأعلى" : "4.6 and above",
      },
      filters: {
        helper: isArabic
          ? "حافظ على قائمة الموردين مركزة بالحقول الأساسية."
          : "Keep the list focused with essential supplier fields.",
        status: isArabic ? "الحالة" : "Status",
        category: isArabic ? "التصنيف" : "Category",
        balance: isArabic ? "الرصيد" : "Balance",
        allBalances: isArabic ? "كل الأرصدة" : "All balances",
        outstandingOnly: isArabic ? "المستحقات فقط" : "Outstanding only",
        highBalance: isArabic ? "رصيد مرتفع" : "High balance",
        closeFilters: isArabic ? "إغلاق الفلاتر" : "Close filters",
      },
      form: {
        subtitle: isArabic
          ? "ملف المورد، شروط الدفع، التواصل، والبيانات المالية"
          : "Supplier profile, terms, contacts, and finance details",
        basic: isArabic ? "المعلومات الأساسية" : "Basic Information",
        contact: isArabic ? "معلومات التواصل" : "Contact Information",
        location: isArabic ? "الموقع" : "Location",
        finance: isArabic ? "التفاصيل المالية" : "Financial Details",
        nameRequired: isArabic ? "اسم المورد *" : "Supplier Name *",
        namePlaceholder: isArabic ? "أدخل اسم المورد" : "Enter supplier name",
        code: isArabic ? "كود المورد" : "Supplier Code",
        autoGenerated: isArabic ? "يتم توليده تلقائياً" : "Auto-generated",
        companyOptional: isArabic ? "اسم الشركة اختياري" : "Company Name Optional",
        companyPlaceholder: isArabic ? "اسم الشركة اختياري" : "Optional company name",
        phoneOrEmail: isArabic ? "الهاتف أو البريد *" : "Phone or Email *",
        phonePlaceholder: isArabic ? "رقم هاتف المورد" : "Supplier phone number",
        emailOptional: isArabic ? "البريد اختياري" : "Email Optional",
        emailPlaceholder: isArabic ? "بريد إلكتروني اختياري" : "Optional email address",
        locationPlaceholder: isArabic ? "ابحث عن مدينة أو بلدة فلسطينية" : "Search Palestinian city or village",
        taxNumber: isArabic ? "الرقم الضريبي" : "Tax Number",
        taxPlaceholder: isArabic ? "رقم التسجيل الضريبي" : "Tax registration number",
        registration: isArabic ? "رقم التسجيل" : "Registration Number",
        registrationPlaceholder: isArabic ? "يولد تلقائياً لموردي الشركات" : "Auto-generated for company suppliers",
        notesPlaceholder: isArabic ? "ملاحظات داخلية اختيارية" : "Optional internal notes",
        closeForm: isArabic ? "إغلاق نموذج المورد" : "Close supplier form",
      },
    }),
    [isArabic],
  );

  useEffect(() => {
    try {
      setIsLoading(true);
      setViewError(null);
      setProfiles(readProfiles(suppliers, purchases));
    } catch {
      setViewError(
        isArabic ? "تعذر تحميل مساحة الموردين." : "The suppliers workspace could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isArabic, purchases, suppliers]);

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
          supplier.city,
          supplier.country,
          supplier.currency,
          supplier.status,
          supplier.taxRegistered ? "yes" : "no",
          String(supplier.rating),
          money(supplier.outstandingBalance),
          formatDate(supplier.lastPurchaseDate),
          supplier.notes.map((item) => item.text).join(" "),
          supplier.purchases.map((item) => item.poNumber).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (filters.status && supplier.status !== filters.status) return false;
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


  const activeFilterEntries = useMemo(() => {
    const entries: Array<{ key: keyof FilterState; label: string; value: string }> = [];
    const labels: Record<keyof FilterState, string> = {
      status: isArabic ? "الحالة" : "Status",
      currency: isArabic ? "العملة" : "Currency",
      category: isArabic ? "التصنيف" : "Category",
      rating: isArabic ? "التقييم" : "Rating",
      country: isArabic ? "الدولة" : "Country",
      city: isArabic ? "المدينة" : "City",
      taxRegistered: isArabic ? "الضريبة" : "Tax",
      outstandingBalance: isArabic ? "الرصيد" : "Balance",
      lastPurchaseDate: isArabic ? "آخر شراء" : "Last Purchase",
      createdDate: isArabic ? "تاريخ الإنشاء" : "Created",
    };

    (Object.keys(filters) as Array<keyof FilterState>).forEach((key) => {
      if (filters[key]) {
        const value =
          key === "status"
            ? formatSupplierStatusLabel(filters[key] as SupplierStatus, isArabic)
            : filters[key];

        entries.push({ key, label: labels[key], value });
      }
    });

    return entries;
  }, [filters, isArabic]);

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

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchTerm(value), 150);
  }

  function closeFilterPanel() {
    setFilterClosing(true);
    setTimeout(() => {
      setMoreFiltersOpen(false);
      setFilterClosing(false);
    }, 120);
  }

  useEffect(() => {
    if (moreFiltersOpen) {
      setPanelStatus(filters.status);
      setPanelCategory(filters.category);
      setPanelBalance(filters.outstandingBalance);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moreFiltersOpen]);

  useEffect(() => {
    if (!moreFiltersOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeFilterPanel(); }
    function onClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        closeFilterPanel();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [moreFiltersOpen]);

  useEffect(() => {
    if (!formOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestCloseForm();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen]);

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setQuickFilters([]);
    setSearchTerm("");
    setSearchInput("");
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
      nextErrors.supplierName = isArabic ? "اسم المورد مطلوب." : "Supplier name is required.";
    }

    if (!formState.phone.trim() && !formState.email.trim()) {
      nextErrors.phone = isArabic ? "أدخل رقم هاتف أو بريد إلكتروني." : "Enter a phone number or email address.";
    }

    if (
      formState.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())
    ) {
      nextErrors.email = isArabic ? "أدخل بريداً إلكترونياً صحيحاً." : "Enter a valid email address.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function saveSupplierForm(saveAsDraft = false) {
    if (!saveAsDraft && !validateSupplierForm()) return;

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

    setProfiles((prev) =>
      prev.map((p) => p.supplierId === confirmAction.supplierId ? { ...p, status: "Inactive" as SupplierStatus } : p),
    );
    saveProfiles(profiles.map((p) => p.supplierId === confirmAction.supplierId ? { ...p, status: "Inactive" as SupplierStatus } : p));
    setConfirmAction(null);
    setMenuState(null);
    setToast(
      isArabic
        ? `تمت أرشفة ${supplier?.supplierName || "المورد"}.`
        : `${supplier?.supplierName || "Supplier"} archived`
    );
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
            <p>{t.suppliers.pageSubtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Can permission="suppliers.create">
              <Button variant="primary" size="sm" type="button" leftIcon={<Plus size={14} />} onClick={openAddModal}>
                {t.suppliers.addSupplier}
              </Button>
            </Can>
          </div>
        </section>

        <section className="suppliers-stat-grid">
          {([
            { key: "total", label: isArabic ? "إجمالي الموردين" : "Total Suppliers", value: summary.totalSuppliers, icon: Building2, iconColor: "#2563EB", iconBg: "#EFF6FF", filterKey: null as string | null },
            { key: "preferred", label: isArabic ? "المفضلون" : "Preferred", value: summary.preferred, icon: Star, iconColor: "#D97706", iconBg: "#FFFBEB", filterKey: "Preferred" },
            { key: "blocked", label: isArabic ? "المحظورون" : "Blocked", value: summary.blocked, icon: Ban, iconColor: "#DC2626", iconBg: "#FEF2F2", filterKey: "Blocked" },
          ]).map((card, idx) => (
            <article
              key={card.key}
              className={`sup-stat-card${quickFilters.includes(card.filterKey ?? "") ? " active" : ""}`}
              style={{ animationDelay: `${idx * 70}ms` } as React.CSSProperties}
              onClick={() => { if (card.filterKey) toggleQuickFilter(card.filterKey); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (card.filterKey) toggleQuickFilter(card.filterKey); } }}
            >
              <div className="sup-stat-inner">
                <div className="sup-stat-info">
                  <span className="sup-stat-label">{card.label}</span>
                  <strong className="sup-stat-value"><AnimatedNumber value={card.value} /></strong>
                </div>
                <div className="sup-stat-icon-wrap" style={{ background: card.iconBg }}>
                  <card.icon size={18} color={card.iconColor} />
                </div>
              </div>
            </article>
          ))}
        </section>


        <div className={`suppliers-filter-card ${moreFiltersOpen ? "filters-open" : ""}`}>
              <div className="supplier-toolbar">
                <Input
                  variant="search"
                  size="md"
                  leftIcon={<Search size={18} />}
                  className="supplier-search-field"
                  value={searchInput}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder={t.suppliers.searchPlaceholder}
                />

                <div className="supplier-toolbar-actions">
                  <div style={{ position: "relative" }} ref={filterRef}>
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

                    {moreFiltersOpen && (
                      <div
                        className={`supplier-filter-dropdown${filterClosing ? " closing" : ""}`}
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          right: 0,
                          width: 280,
                          background: "white",
                          border: "1px solid #E2E8F0",
                          borderRadius: 12,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                          padding: 16,
                          zIndex: 9999,
                          direction: "rtl",
                          animation: "dropdownIn 160ms cubic-bezier(0.16,1,0.3,1)",
                        }}
                        onClick={e => e.stopPropagation()}
                      >

                        {/* Panel Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 14, color: "#64748B" }} />
                            تصفية النتائج
                          </span>
                          <button
                            type="button"
                            onClick={closeFilterPanel}
                            style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "all 120ms ease" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
                          >✕</button>
                        </div>

                        {/* الحالة */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                            الحالة
                          </label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {([
                              { value: "",           label: "كل الحالات", dot: "#CBD5E1" },
                              { value: "Active",     label: "نشط",        dot: "#16A34A" },
                              { value: "Preferred",  label: "مفضل",       dot: "#D97706" },
                              { value: "Blocked",    label: "محظور",      dot: "#DC2626" },
                            ] as const).map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPanelStatus(opt.value)}
                                style={{ width: "100%", padding: "7px 10px", border: `1px solid ${panelStatus === opt.value ? "#BFDBFE" : "transparent"}`, borderRadius: 7, background: panelStatus === opt.value ? "#EFF6FF" : "transparent", color: panelStatus === opt.value ? "#1D4ED8" : "#374151", fontSize: 13, fontWeight: panelStatus === opt.value ? 600 : 400, cursor: "pointer", textAlign: "right", display: "flex", alignItems: "center", gap: 8, transition: "all 120ms ease" }}
                                onMouseEnter={e => { if (panelStatus !== opt.value) e.currentTarget.style.background = "#F8FAFC"; }}
                                onMouseLeave={e => { if (panelStatus !== opt.value) e.currentTarget.style.background = "transparent"; }}
                              >
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: opt.dot, flexShrink: 0 }} />
                                {opt.label}
                                {panelStatus === opt.value && (
                                  <i className="ti ti-check" style={{ fontSize: 12, marginRight: "auto", color: "#2563EB" }} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ height: 1, background: "#F1F5F9", margin: "12px 0" }} />

                        {/* التصنيف */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                            التصنيف
                          </label>
                          <select
                            value={panelCategory}
                            onChange={e => setPanelCategory(e.target.value)}
                            style={{ width: "100%", height: 36, border: `1px solid ${panelCategory ? "#BFDBFE" : "#E2E8F0"}`, borderRadius: 8, padding: "0 10px", fontSize: 13, color: panelCategory ? "#1D4ED8" : "#374151", background: panelCategory ? "#EFF6FF" : "white", direction: "rtl", cursor: "pointer", outline: "none", transition: "all 150ms ease" }}
                            onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; }}
                            onBlur={e => { e.target.style.borderColor = panelCategory ? "#BFDBFE" : "#E2E8F0"; e.target.style.boxShadow = "none"; }}
                          >
                            <option value="">كل التصنيفات</option>
                            {categoryOptions.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ height: 1, background: "#F1F5F9", margin: "12px 0" }} />

                        {/* الرصيد */}
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                            الرصيد
                          </label>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {([
                              { value: "",     label: "كل الأرصدة",  dot: "#CBD5E1" },
                              { value: "open", label: "له رصيد",     dot: "#16A34A" },
                              { value: "high", label: "رصيد مرتفع",  dot: "#94A3B8" },
                            ] as const).map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPanelBalance(opt.value)}
                                style={{ width: "100%", padding: "7px 10px", border: `1px solid ${panelBalance === opt.value ? "#BFDBFE" : "transparent"}`, borderRadius: 7, background: panelBalance === opt.value ? "#EFF6FF" : "transparent", color: panelBalance === opt.value ? "#1D4ED8" : "#374151", fontSize: 13, fontWeight: panelBalance === opt.value ? 600 : 400, cursor: "pointer", textAlign: "right", display: "flex", alignItems: "center", gap: 8, transition: "all 120ms ease" }}
                                onMouseEnter={e => { if (panelBalance !== opt.value) e.currentTarget.style.background = "#F8FAFC"; }}
                                onMouseLeave={e => { if (panelBalance !== opt.value) e.currentTarget.style.background = "transparent"; }}
                              >
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: opt.dot, flexShrink: 0 }} />
                                {opt.label}
                                {panelBalance === opt.value && (
                                  <i className="ti ti-check" style={{ fontSize: 12, marginRight: "auto", color: "#2563EB" }} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFilters(c => ({ ...c, status: panelStatus, category: panelCategory, outstandingBalance: panelBalance }));
                              closeFilterPanel();
                            }}
                            style={{ flex: 1, height: 34, background: "#2563EB", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 150ms ease" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#1D4ED8"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#2563EB"; }}
                          >
                            تطبيق
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPanelStatus(""); setPanelCategory(""); setPanelBalance("");
                              clearFilters();
                              closeFilterPanel();
                            }}
                            style={{ padding: "0 12px", height: 34, border: "1px solid #E2E8F0", background: "white", color: "#64748B", borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "all 150ms ease" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.background = "#FEF2F2"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "white"; }}
                          >
                            مسح
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                      {isArabic ? "سريع" : "Quick"}: {filter}
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
                  <h3>{isArabic ? "حدث خطأ ما" : "Something went wrong"}</h3>
                  <p>{viewError}</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="supplier-empty-state">
                  <Building2 size={28} />
                  <h3>
                    {searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0
                      ? (isArabic ? "لا توجد نتائج" : "No results found")
                      : (isArabic ? "لا يوجد موردون بعد" : "No suppliers yet")}
                  </h3>
                  <p>
                    {searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0
                      ? (isArabic ? "جرّب تعديل البحث أو الفلاتر." : "Try changing your filters or search.")
                      : (isArabic ? "أنشئ أول ملف مورد لبدء إجراءات الشراء." : "Create your first supplier profile to start procurement workflows.")}
                  </p>

                  {(searchTerm || activeFilterEntries.length > 0 || quickFilters.length > 0) && (
                    <Button
                      variant="secondary"
                      size="md"
                      type="button"
                      onClick={clearFilters}
                    >
                      {isArabic ? "مسح الفلاتر" : "Clear Filters"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="suppliers-table-wrap app-table-wrap atlas-table-wrapper">
                  <table className="suppliers-table app-data-table atlas-table">
                    <colgroup>
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "14%" }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th className="col-entity px-3 py-3 whitespace-nowrap truncate">
                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() => handleSort("supplierName")}
                          >
                            {t.suppliers.cols.supplier} <ArrowUpDown size={13} />
                          </button>
                        </th>

                        <th className="col-code px-3 py-3 whitespace-nowrap truncate">{t.common.phone}</th>

                        <th className="col-flex px-3 py-3 whitespace-nowrap truncate">{isArabic ? "الموقع" : "Location"}</th>

                        <th className="col-badge px-3 py-3 whitespace-nowrap truncate">{isArabic ? "التصنيف" : "Category"}</th>

                        <th className="col-currency px-3 py-3 whitespace-nowrap truncate">
                          <button
                            type="button"
                            className="table-sort-btn"
                            onClick={() => handleSort("outstandingBalance")}
                          >
                            {t.suppliers.cols.balance} <ArrowUpDown size={13} />
                          </button>
                        </th>

                        <th className="col-actions px-3 py-3 whitespace-nowrap truncate">{t.suppliers.cols.actions}</th>
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
                          className="odd:bg-white even:bg-slate-50/30"
                        >
                          <td className="col-entity px-3 py-3 whitespace-nowrap truncate">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                background: supplierAvatarColor(supplier.supplierName),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "white", fontWeight: 700, fontSize: 14,
                              }}>
                                {supplier.supplierName.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {supplier.supplierName}
                                </div>
                                <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>
                                  {supplier.code}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="col-code px-3 py-3 whitespace-nowrap truncate">
                            <span style={{ fontSize: 13, color: "#0F172A" }}>
                              {supplier.phone || (isArabic ? "بدون هاتف" : "No phone")}
                            </span>
                          </td>

                          <td className="col-flex px-3 py-3 whitespace-nowrap truncate">
                            <span style={{ fontSize: 13, color: "#475569" }}>
                              {formatLocationDisplay(supplier.city, isArabic)}
                            </span>
                          </td>

                          <td className="col-badge px-3 py-3 whitespace-nowrap truncate">
                            {supplier.category ? (
                              <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "3px 10px", borderRadius: 99,
                                fontSize: 11, fontWeight: 500,
                                background: getCatBg(supplier.category),
                                color: getCatColor(supplier.category),
                                whiteSpace: "nowrap",
                              }}>
                                {supplier.category}
                              </span>
                            ) : (
                              <span style={{ color: "#94A3B8" }}>—</span>
                            )}
                          </td>

                          <td className="col-currency px-3 py-3 whitespace-nowrap truncate">
                            <strong className={`balance-cell${supplier.outstandingBalance === 0 ? " zero" : ""}${supplier.outstandingBalance < 0 ? " negative" : ""}`}>
                              {supplier.outstandingBalance === 0
                                ? <span style={{ color: "#94A3B8" }}>—</span>
                                : money(supplier.outstandingBalance)}
                            </strong>
                          </td>

                          <td className="col-actions px-3 py-3 whitespace-nowrap" style={{ overflow: "visible" }}>
                            <TableActions
                              onView={() => { setDetailSupplierId(supplier.supplierId); setDetailTab("overview"); }}
                              onEdit={can("suppliers.edit") ? () => openEditModal(supplier.supplierId) : undefined}
                              onDelete={can("suppliers.delete") ? () => setDeleteConfirmItem({ itemName: supplier.supplierName, onConfirm: () => deleteSupplierItem(supplier.supplierId) }) : undefined}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="simple-suppliers-footer">
                <span>
                  {isArabic
                    ? `عرض جميع ${filteredSuppliers.length} مورداً`
                    : `Showing all ${filteredSuppliers.length} suppliers`}
                </span>
              </div>
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
              <strong>{isArabic ? "إجراءات المورد" : "Supplier Actions"}</strong>
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
              {isArabic ? "عرض المورد" : "View Supplier"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="edit"
              leftIcon={<FileText size={15} />}
              onClick={() => openEditModal(menuSupplier.supplierId)}
            >
              {isArabic ? "تعديل المورد" : "Edit Supplier"}
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
              {isArabic ? "أرشفة المورد" : "Archive Supplier"}
            </Button>

            <Button
              variant="danger"
              size="sm"
              type="button"
              className="danger"
              leftIcon={<X size={15} />}
              onClick={() => {
                setDeleteConfirmItem({
                  itemName: menuSupplier.supplierName,
                  onConfirm: () => {
                    deleteSupplierItem(menuSupplier.supplierId);
                    setMenuState(null);
                  },
                });
              }}
            >
              {isArabic ? "حذف المورد" : "Delete Supplier"}
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
              aria-label={isArabic ? "إغلاق تفاصيل المورد" : "Close supplier details"}
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
                  "policy",
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
                    <h3>{isArabic ? "المعلومات الأساسية" : "Basic Information"}</h3>
                    <dl>
                      <div>
                        <dt>{isArabic ? "اسم المورد" : "Supplier Name"}</dt>
                        <dd>{detailSupplier.supplierName}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "كود المورد" : "Supplier Code"}</dt>
                        <dd className="numeric-cell">{detailSupplier.code}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "اسم الشركة" : "Company Name"}</dt>
                        <dd>{detailSupplier.companyName}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "التصنيف" : "Category"}</dt>
                        <dd>{detailSupplier.category}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "الرقم الضريبي" : "Tax Number"}</dt>
                        <dd className="numeric-cell">{detailSupplier.taxNumber}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "رقم التسجيل" : "Registration Number"}</dt>
                        <dd className="numeric-cell">{detailSupplier.registrationNumber}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "الحالة" : "Status"}</dt>
                        <dd>{formatSupplierStatusLabel(detailSupplier.status, isArabic)}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "التقييم" : "Rating"}</dt>
                        <dd className="numeric-cell">{detailSupplier.rating.toFixed(1)} / 5</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card">
                    <h3>{isArabic ? "معلومات التواصل" : "Contact Information"}</h3>
                    <dl>
                      <div>
                        <dt>{t.common.phone}</dt>
                        <dd className="numeric-cell">{detailSupplier.phone || "-"}</dd>
                      </div>
                      <div>
                        <dt>{t.common.email}</dt>
                        <dd>{detailSupplier.email || "-"}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "الموقع" : "Location"}</dt>
                        <dd>{formatLocationDisplay(detailSupplier.city || detailSupplier.country, isArabic)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card">
                    <h3>{isArabic ? "المعلومات المالية" : "Financial Information"}</h3>
                    <dl>
                      <div>
                        <dt>{isArabic ? "العملة" : "Preferred Currency"}</dt>
                        <dd className="numeric-cell">{detailSupplier.currency}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "الرصيد المستحق" : "Outstanding Balance"}</dt>
                        <dd className={`balance-cell${detailSupplier.outstandingBalance === 0 ? " zero" : ""}${detailSupplier.outstandingBalance < 0 ? " negative" : ""}`}>{money(detailSupplier.outstandingBalance)}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "إجمالي المشتريات" : "Total Purchased"}</dt>
                        <dd className="balance-cell">{money(detailSupplier.totalPurchased)}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "آخر دفعة" : "Last Payment"}</dt>
                        <dd className="numeric-cell">{formatDate(detailSupplier.lastPaymentDate)}</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "آخر شراء" : "Last Purchase"}</dt>
                        <dd className="numeric-cell">{formatDate(detailSupplier.lastPurchaseDate)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card">
                    <h3>{isArabic ? "ملخص الأداء" : "Performance Summary"}</h3>
                    <dl>
                      <div>
                        <dt>{isArabic ? "نسبة الالتزام بالتسليم" : "On-time delivery rate"}</dt>
                        <dd className="numeric-cell">{detailSupplier.onTimeRate}%</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "تقييم الجودة" : "Quality score"}</dt>
                        <dd className="numeric-cell">{detailSupplier.qualityScore}%</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "نسبة المرتجعات" : "Return rate"}</dt>
                        <dd className="numeric-cell">{detailSupplier.returnRate}%</dd>
                      </div>
                      <div>
                        <dt>{isArabic ? "مستوى الاعتمادية" : "Reliability level"}</dt>
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
                        <th className="col-code">PO Number</th>
                        <th className="col-date">{t.common.date}</th>
                        <th className="col-currency">Total</th>
                        <th className="col-num">Received</th>
                        <th className="col-badge">Payment Status</th>
                        <th className="col-badge">Status</th>
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
                        <th className="col-code">Invoice Number</th>
                        <th className="col-date">{t.common.date}</th>
                        <th className="col-date">Due Date</th>
                        <th className="col-currency">{t.common.total}</th>
                        <th className="col-currency">Remaining</th>
                        <th className="col-badge">{t.common.status}</th>
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
                        <th className="col-date">Payment Date</th>
                        <th className="col-currency">{t.common.amount}</th>
                        <th className="col-badge">{t.common.method}</th>
                        <th className="col-code">Reference</th>
                        <th className="col-truncate">{t.common.notes}</th>
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
                        <th className="col-entity">{t.common.name}</th>
                        <th className="col-flex">Role</th>
                        <th className="col-code">{t.common.phone}</th>
                        <th className="col-code">{t.common.email}</th>
                        <th className="col-truncate">{t.common.notes}</th>
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
                        <th className="col-entity">File Name</th>
                        <th className="col-badge">Type</th>
                        <th className="col-date">Uploaded Date</th>
                        <th className="col-entity">Uploaded By</th>
                        <th className="col-actions">{t.suppliers.cols.actions}</th>
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

              {detailTab === "policy" && (
                <SupplierPolicyTab
                  profile={detailSupplier}
                  isArabic={isArabic}
                  onSave={(patch) => {
                    setProfiles((prev) => {
                      const next = prev.map((p) =>
                        p.supplierId === detailSupplier.supplierId ? { ...p, ...patch } : p
                      );
                      saveProfiles(next);
                      return next;
                    });
                  }}
                />
              )}
            </div>
          </aside>
        </div>,
        document.body
      )}

      {formOpen && createPortal(
        <div
          dir="rtl"
          style={{
            position: "fixed", inset: 0, zIndex: 9100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(15,23,42,0.48)", backdropFilter: "blur(4px)",
          }}
          onClick={() => { if (!discardConfirmOpen) requestCloseForm(); }}
        >
          <div
            style={{
              background: "white", borderRadius: 20,
              width: "min(560px, 94vw)", maxHeight: "88vh",
              display: "flex", flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
              animation: "supplierModalIn 220ms cubic-bezier(0.16,1,0.3,1) forwards",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              position: "sticky", top: 0, zIndex: 1, background: "white",
              padding: "20px 24px 16px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              borderRadius: "20px 20px 0 0",
            }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
                  {formMode === "add" ? t.suppliers.form.createTitle : t.suppliers.form.editTitle}
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  {supplierCopy.form.subtitle}
                </div>
              </div>
              <button
                type="button"
                onClick={requestCloseForm}
                aria-label={supplierCopy.form.closeForm}
                style={{
                  width: 32, height: 32, borderRadius: "50%", border: "none",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748B", transition: "all 150ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.color = "#DC2626"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto" }}>
            <div className="supplier-form-body">
              <section className="supplier-form-section">
                <h3>{supplierCopy.form.basic}</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field">
                    <span>{supplierCopy.form.nameRequired}</span>
                    <input
                      placeholder={supplierCopy.form.namePlaceholder}
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
                    <span>{supplierCopy.form.code}</span>
                    <input
                      placeholder={supplierCopy.form.autoGenerated}
                      value={formState.supplierCode}
                      readOnly
                    />
                  </label>

                  <label className="supplier-field">
                    <span>{supplierCopy.form.companyOptional}</span>
                    <input
                      placeholder={supplierCopy.form.companyPlaceholder}
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

                  <div className="supplier-field full">
                    <span>{t.suppliers.form.category}</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 6 }}>
                      {SUPPLIER_CATEGORIES.map(cat => {
                        const active = formState.category === cat.label;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "6px 13px", borderRadius: 99, fontSize: 12,
                              cursor: "pointer", fontFamily: "inherit",
                              border: active ? "1.5px solid #2563EB" : "1.5px solid #E2E8F0",
                              background: active ? "#EFF6FF" : "white",
                              color: active ? "#1D4ED8" : "#475569",
                              fontWeight: active ? 600 : 400,
                              transition: "all 120ms ease",
                            }}
                            onClick={() => setFormState(c => ({ ...c, category: cat.label }))}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {!showCustomCatInput && (
                      <button
                        type="button"
                        style={{ marginTop: 8, fontSize: 12, color: "#2563EB", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                        onClick={() => setShowCustomCatInput(true)}
                      >
                        + إضافة تصنيف جديد
                      </button>
                    )}
                    {showCustomCatInput && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                        <input
                          autoFocus
                          style={{ flex: 1, height: 34, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                          placeholder="اسم التصنيف"
                          value={customCatInput}
                          onChange={e => setCustomCatInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && customCatInput.trim()) {
                              setFormState(c => ({ ...c, category: customCatInput.trim() }));
                              setCustomCatInput("");
                              setShowCustomCatInput(false);
                            }
                            if (e.key === "Escape") { setShowCustomCatInput(false); setCustomCatInput(""); }
                          }}
                        />
                        <button type="button" style={{ fontSize: 12, color: "#64748B", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }} onClick={() => { setShowCustomCatInput(false); setCustomCatInput(""); }}>إلغاء</button>
                      </div>
                    )}
                  </div>

                </div>
              </section>

              <section className="supplier-form-section">
                <h3>{supplierCopy.form.contact}</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field">
                    <span>{supplierCopy.form.phoneOrEmail}</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="059XXXXXXX"
                      value={formState.phone}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/[^0-9]/g, "");
                        if (digits.length <= 10) {
                          setFormState((current) => ({ ...current, phone: digits }));
                          setFormErrors((current) => ({ ...current, phone: undefined }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.ctrlKey || e.metaKey) return;
                        const allowed = ["Backspace","Delete","Tab","Enter","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"];
                        if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
                        const val = (formState.phone + pasted).slice(0, 10);
                        setFormState((current) => ({ ...current, phone: val }));
                      }}
                      style={{
                        width: "100%", height: 40,
                        border: `1px solid ${!formState.phone ? "#E2E8F0" : isValidPhone(formState.phone) ? "#BBF7D0" : "#FECACA"}`,
                        borderRadius: 8, padding: "0 12px", fontSize: 14,
                        direction: "ltr", textAlign: "left", fontFamily: "monospace",
                        background: !formState.phone ? "white" : isValidPhone(formState.phone) ? "#F0FDF4" : "#FEF2F2",
                        outline: "none", transition: "all 150ms ease", boxSizing: "border-box",
                      }}
                    />
                    {formErrors.phone && (
                      <small className="field-error-text">{formErrors.phone}</small>
                    )}
                  </label>

                  <label className="supplier-field">
                    <span>{supplierCopy.form.emailOptional}</span>
                    <input
                      placeholder={supplierCopy.form.emailPlaceholder}
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
                <h3>{supplierCopy.form.location}</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field full">
                    <span>{supplierCopy.form.location}</span>
                    <input
                      list="supplier-location-options"
                      placeholder={supplierCopy.form.locationPlaceholder}
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
                <h3>{t.suppliers.form.notes}</h3>
                <div className="supplier-form-grid">
                  <label className="supplier-field full">
                    <span>{t.suppliers.form.notes}</span>
                    <textarea
                      placeholder={supplierCopy.form.notesPlaceholder}
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
            </div>

            {/* Modal footer */}
            <div style={{
              position: "sticky", bottom: 0, background: "white",
              borderTop: "1px solid #F1F5F9", padding: "16px 24px",
              display: "flex", gap: 10, justifyContent: "flex-end",
              borderRadius: "0 0 20px 20px",
            }}>
              <Button variant="secondary" size="md" type="button" onClick={requestCloseForm}>
                {t.common.cancel}
              </Button>
              <Button variant="secondary" size="md" type="button" onClick={() => saveSupplierForm(true)}>
                {t.common.saveAsDraft}
              </Button>
              <Button variant="primary" size="md" type="button" onClick={() => saveSupplierForm(false)}>
                {formMode === "add" ? t.suppliers.addSupplier : t.common.save}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {discardConfirmOpen &&
        createPortal(
          <div className="supplier-overlay supplier-confirm-overlay" style={{ zIndex: 9200 }} onClick={() => setDiscardConfirmOpen(false)}>
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

      <DeleteConfirmDialog
        isOpen={!!deleteConfirmItem}
        itemName={deleteConfirmItem?.itemName ?? ""}
        onConfirm={() => { const cb = deleteConfirmItem?.onConfirm; setDeleteConfirmItem(null); if (cb) cb(); }}
        onCancel={() => setDeleteConfirmItem(null)}
      />

      {confirmAction &&
        confirmAction.type !== "delete" &&
        createPortal(
          <div className="supplier-overlay supplier-confirm-overlay" onClick={() => setConfirmAction(null)}>
            <div className="supplier-confirm-modal" onClick={(event) => event.stopPropagation()}>
              <div className="supplier-confirm-icon">
                <Archive size={22} />
              </div>
              <div>
                <span>Supplier action</span>
                <h3>
                  {"Archive this supplier?"}
                </h3>
                <p>
                  {`${confirmSupplier?.supplierName || "This supplier"} will be marked as archived for your workflow.`}
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
                  variant="primary"
                  size="md"
                  type="button"
                  className="suppliers-primary-btn"
                  onClick={confirmSupplierAction}
                >
                  {`${t.common.archived} ${t.suppliers.cols.supplier}`}
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
