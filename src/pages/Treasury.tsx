import "./Treasury.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  ChevronLeft,
  CreditCard,
  FileScan,
  Filter,
  Landmark,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Upload,
  X,
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Scale,
} from "lucide-react";
import { AddCheckModal } from "../components/treasury/AddCheckModal";
import { AddTransferModal } from "../components/treasury/AddTransferModal";
import { useTreasury } from "../context/TreasuryContext";
import type { TreasuryInstrument, InstrumentDirection, InstrumentStatus, PalestinianCurrency } from "../types/treasury";
import { PALESTINIAN_BANKS, CHEQUE_STATUS_OPTIONS, TREASURY_STATUS_TO_CHEQUE } from "../types/treasury";
import { createPortal } from "react-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { TableActions } from "../components/ui/TableActions";


import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { formatCurrencyValue, formatDateValue } from "../utils/displayFormatters";
import {
  getAuditEvents,
  getBankAccounts,
  getBankTransfers,
  getCustomers,
  getIncomingCheques,
  getInvoices,
  getOCRExtractions,
  getOutgoingCheques,
  getPayments,
  getReconciliationItems,
  getSuppliers,
  saveAuditEvents,
  saveBankTransfers,
  saveIncomingCheques,
  saveOCRExtractions,
  saveOutgoingCheques,
} from "../data/storage";
import type {
  AuditEvent,
  BankTransfer,
  ChequeInstrument,
  OCRExtraction,
  OCRFieldReview,
  ReconciliationItem,
} from "../data/types";

type TreasuryTab =
  | "overview"
  | "incoming"
  | "outgoing"
  | "transfers"
  | "reconciliation";

type DetailRecord =
  | { type: "incoming"; record: ChequeInstrument }
  | { type: "outgoing"; record: ChequeInstrument }
  | { type: "transfer"; record: BankTransfer };

type OCRTarget =
  | { type: "incoming"; record: ChequeInstrument; extraction: OCRExtraction }
  | { type: "outgoing"; record: ChequeInstrument; extraction: OCRExtraction }
  | { type: "transfer"; record: BankTransfer; extraction: OCRExtraction };

type TreasuryRole = "Admin" | "Finance" | "Sales" | "Inventory";

const ROLE_MATRIX: Record<
  TreasuryRole,
  { approve: boolean; verifyTransfer: boolean; correctOCR: boolean; reconcile: boolean }
> = {
  Admin:     { approve: true,  verifyTransfer: true,  correctOCR: true,  reconcile: true  },
  Finance:   { approve: true,  verifyTransfer: true,  correctOCR: true,  reconcile: true  },
  Sales:     { approve: false, verifyTransfer: false, correctOCR: false, reconcile: false },
  Inventory: { approve: false, verifyTransfer: false, correctOCR: false, reconcile: false },
};

const TODAY = new Date().toISOString().split("T")[0];

function money(value: number, currency = "ILS") {
  return formatCurrencyValue(Number(value || 0), currency as "USD" | "ILS" | "JOD");
}

function formatDate(value?: string, isArabic = false) {
  if (!value) return isArabic ? "بدون تاريخ" : "No date";
  return formatDateValue(new Date(value), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }, "en-GB");
}

function confidenceLabel(value: number, isArabic = false) {
  if (value >= 0.9) return isArabic ? "ثقة عالية" : "High confidence";
  if (value >= 0.75) return isArabic ? "ثقة متوسطة" : "Medium confidence";
  return isArabic ? "تحتاج مراجعة" : "Needs review";
}

function statusLabel(status: string, isArabic = false) {
  if (!isArabic) return status;

  // Check CHEQUE_STATUS_OPTIONS first (via reverse-mapped English keys)
  const arabicKey = TREASURY_STATUS_TO_CHEQUE[status];
  if (arabicKey) {
    const opt = CHEQUE_STATUS_OPTIONS.find(o => o.value === arabicKey);
    if (opt) return opt.label;
  }
  // Also check if it's already an Arabic value from CHEQUE_STATUS_OPTIONS
  const directOpt = CHEQUE_STATUS_OPTIONS.find(o => o.value === status);
  if (directOpt) return directOpt.label;

  const labels: Record<string, string> = {
    Approved: "معتمد",
    Bounced: "مرتجع",
    Cancelled: "ملغى",
    Cleared: "محصّل",
    Collected: "محصّل",
    Corrected: "مصحح",
    Delivered: "مسلّم",
    Deposited: "مودع",
    "Fully Applied": "مسوّى بالكامل",
    Held: "محتجز",
    Issued: "مصدر",
    "Partially Applied": "مسوّى جزئياً",
    Pending: "معلّق",
    "Pending Verification": "بانتظار التحقق",
    "Post-dated": "مؤجل",
    Received: "مستلم",
    Rejected: "مرفوض",
    Returned: "معاد",
    Reviewed: "مراجع",
    "Under Collection": "قيد التحصيل",
    Verified: "موثّق",
    Voided: "ملغى",
  };

  return labels[status] ?? status;
}

function chequeStatusConfig(status: string) {
  const arabicKey = TREASURY_STATUS_TO_CHEQUE[status] ?? status;
  return CHEQUE_STATUS_OPTIONS.find(o => o.value === arabicKey) ?? null;
}

function roleLabel(role: TreasuryRole, isArabic = false) {
  if (!isArabic) return role;

  switch (role) {
    case "Admin":
      return "المدير";
    case "Finance":
      return "المالية";
    case "Sales":
      return "المبيعات";
    case "Inventory":
      return "المخزون";
    default:
      return role;
  }
}

function averageConfidence(fields: OCRFieldReview[]) {
  if (fields.length === 0) return 0;
  return fields.reduce((sum, item) => sum + item.confidence, 0) / fields.length;
}

function normInstrumentStatus(s: InstrumentStatus): string {
  const m: Record<InstrumentStatus, string> = {
    draft:              "Draft",
    pending:            "Pending",
    deposited:          "Deposited",
    cleared:            "Cleared",
    bounced:            "Bounced",
    cancelled:          "Cancelled",
    under_review:       "Under Collection",
    partially_applied:  "Partially Applied",
  };
  return m[s] ?? String(s);
}

export default function Treasury() {
  const { user } = useAuth();
  const { t, isArabic } = useSettings();
  const customers  = useMemo(() => getCustomers(),  []);
  const suppliers  = useMemo(() => getSuppliers(),  []);
  const invoices   = useMemo(() => getInvoices(),   []);
  const payments   = useMemo(() => getPayments(),   []);
  const bankAccounts = useMemo(() => getBankAccounts(), []);

  const [incomingCheques,  setIncomingCheques]  = useState(() => getIncomingCheques());
  const [outgoingCheques,  setOutgoingCheques]  = useState(() => getOutgoingCheques());
  const [bankTransfers,    setBankTransfers]    = useState(() => getBankTransfers());
  const [ocrExtractions,   setOcrExtractions]   = useState(() => getOCRExtractions());
  const [, setAuditEvents] = useState(() => getAuditEvents());
  const [reconciliationItems] = useState<ReconciliationItem[]>(() => getReconciliationItems());
  const { instruments: ctxInstruments, addInstrument } = useTreasury();
  const [initialCtxIds] = useState<Set<string>>(() => new Set(ctxInstruments.map(i => i.id)));

  const [activeTab,         setActiveTab]         = useState<TreasuryTab>("overview");
  const [searchTerm,        setSearchTerm]        = useState("");
  const [statusFilter,      setStatusFilter]      = useState("All");
  const [detailRecord,      setDetailRecord]      = useState<DetailRecord | null>(null);
  const [ocrTarget,         setOcrTarget]         = useState<OCRTarget | null>(null);
  const [toast,             setToast]             = useState<string>("");
  const [showIncomingCheck, setShowIncomingCheck] = useState(false);
  const [showOutgoingCheck, setShowOutgoingCheck] = useState(false);
  const [showTransfer,      setShowTransfer]      = useState(false);
  const [bankFilter,        setBankFilter]        = useState("all");
  const [directionFilter,   setDirectionFilter]   = useState("all");
  const [dateFrom,          setDateFrom]          = useState("");
  const [dateTo,            setDateTo]            = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [editIdForModal,    setEditIdForModal]    = useState<string | null>(null);
  const [showFab,           setShowFab]           = useState(false);
  const [showOCRScanner,    setShowOCRScanner]    = useState(false);
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ itemName: string; onConfirm: () => void } | null>(null);

  const TABS: { key: TreasuryTab; icon: React.ReactNode; label: string }[] = useMemo(() => [
    { key: "overview", icon: <LayoutDashboard size={14} />, label: t.treasury.tabs.overview },
    { key: "incoming", icon: <ArrowDownLeft size={14} />, label: t.treasury.tabs.incoming },
    { key: "outgoing", icon: <ArrowUpRight size={14} />, label: t.treasury.tabs.outgoing },
    { key: "transfers", icon: <ArrowLeftRight size={14} />, label: t.treasury.tabs.transfers },
    { key: "reconciliation", icon: <Scale size={14} />, label: t.treasury.tabs.reconciliation },
  ], [t]);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const updateIndicator = useCallback((key: TreasuryTab) => {
    const el = tabRefs.current[key];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, []);
  useEffect(() => { updateIndicator(activeTab); }, [activeTab, updateIndicator]);

  const rolePreset = (localStorage.getItem("app-role-preset") as TreasuryRole) || "Admin";
  const access = ROLE_MATRIX[rolePreset] ?? ROLE_MATRIX.Admin;
  const activeAccountsLabel = isArabic
    ? bankAccounts.length === 2
      ? "عبر حسابين خزينة نشطين"
      : `Ø¹Ø¨Ø± ${bankAccounts.length} Ø­Ø³Ø§Ø¨Ø§Øª Ø®Ø²ÙŠÙ†Ø© Ù†Ø´Ø·Ø©`
    : `Across ${bankAccounts.length} active treasury accounts`;

  const combinedSignals = useMemo(() => {
    const dueSoon = incomingCheques.filter(
      (item) =>
        ["Received", "Held", "Deposited", "Under Collection"].includes(item.status) &&
        new Date(item.dueDate).getTime() <= new Date(TODAY).getTime() + 3 * 24 * 60 * 60 * 1000
    ).length;
    const bounced = [...incomingCheques, ...outgoingCheques].filter(
      (item) => item.status === "Bounced"
    ).length;
    const pendingVerification = bankTransfers.filter(
      (item) => item.status === "Pending Verification"
    ).length;
    const lowConfidence = ocrExtractions.filter(
      (item) => item.averageConfidence < 0.8 || item.status !== "Reviewed"
    ).length;
    return { dueSoon, bounced, pendingVerification, lowConfidence };
  }, [bankTransfers, incomingCheques, ocrExtractions, outgoingCheques]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "All") count++;
    if (bankFilter !== "all") count++;
    if (directionFilter !== "all") count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [statusFilter, bankFilter, directionFilter, dateFrom, dateTo]);

  const filteredIncoming = useMemo(() => {
    return incomingCheques.filter((item) => {
      const q = [item.chequeNumber, item.accountHolder, item.bankName, item.notes, money(item.amount, item.currency), formatDate(item.dueDate), statusLabel(item.status)].filter(Boolean).join(" ").toLowerCase();
      return q.includes(searchTerm.toLowerCase()) && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [incomingCheques, searchTerm, statusFilter]);

  const filteredOutgoing = useMemo(() => {
    return outgoingCheques.filter((item) => {
      const q = [item.chequeNumber, item.accountHolder, item.bankName, item.notes, money(item.amount, item.currency), formatDate(item.dueDate), statusLabel(item.status)].filter(Boolean).join(" ").toLowerCase();
      return q.includes(searchTerm.toLowerCase()) && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [outgoingCheques, searchTerm, statusFilter]);

  const filteredTransfers = useMemo(() => {
    return bankTransfers.filter((item) => {
      const q = [item.transferReference, item.senderOrReceiver, item.sourceBank, item.destinationBank, item.notes, money(item.amount, item.currency), formatDate(item.transferDate), statusLabel(item.status)].filter(Boolean).join(" ").toLowerCase();
      return q.includes(searchTerm.toLowerCase()) && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [bankTransfers, searchTerm, statusFilter]);

  const ocrQueue = useMemo(() => {
    return ocrExtractions.filter((item) => item.status !== "Reviewed").sort((a, b) => a.averageConfidence - b.averageConfidence);
  }, [ocrExtractions]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  type UnifiedRow = {
    id: string;
    avatarLabel: string;
    reference: string;
    subLabel: string;
    typeLabel: string;
    direction: "incoming" | "outgoing";
    party: string;
    status: string;
    date: string;
    amount: number | null;
    currency: string;
    bankName: string;
    onView: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
  };

  const findRecord = (id: string) => {
    const inc = incomingCheques.find(c => c.id === id);
    if (inc) return { type: "incoming" as const, record: inc };
    const out = outgoingCheques.find(c => c.id === id);
    if (out) return { type: "outgoing" as const, record: out };
    const trf = bankTransfers.find(t => t.id === id);
    if (trf) return { type: "transfer" as const, record: trf };
    return null;
  };

  const postAudit = useCallback((event: AuditEvent) => {
    setAuditEvents(prev => {
      const next = [event, ...prev];
      saveAuditEvents(next);
      return next;
    });
  }, []);

  const handleDeleteRecord = useCallback((type: string, id: string) => {
    const ts = new Date().toISOString();
    if (type === "incoming") {
      const next = incomingCheques.filter(c => c.id !== id);
      setIncomingCheques(next); saveIncomingCheques(next);
    } else if (type === "outgoing") {
      const next = outgoingCheques.filter(c => c.id !== id);
      setOutgoingCheques(next); saveOutgoingCheques(next);
    } else if (type === "transfer") {
      const next = bankTransfers.filter(t => t.id !== id);
      setBankTransfers(next); saveBankTransfers(next);
    }
    postAudit({ id: `AUD-DEL-${id}-${ts}`, entityType: type === "incoming" ? "incoming-cheque" : type === "outgoing" ? "outgoing-cheque" : "bank-transfer", entityId: id, action: "Deleted", actor: user?.username ?? "system", actorRole: rolePreset, timestamp: ts, details: `Record ${id} deleted by user.` });
    showToast(isArabic ? "تم حذف السجل" : "Record deleted");
  }, [incomingCheques, outgoingCheques, bankTransfers, isArabic, postAudit, user, rolePreset]);

  const handleEditRecord = useCallback((type: string, id: string) => {
    setEditIdForModal(id);
    if (type === "incoming") setShowIncomingCheck(true);
    else if (type === "outgoing") setShowOutgoingCheck(true);
    else if (type === "transfer") setShowTransfer(true);
  }, []);

  const chequeToDefaultValues = (r: ChequeInstrument, dir: "incoming" | "outgoing") => {
    const bankId = PALESTINIAN_BANKS.find(b => b.nameAr === r.bankName)?.id ?? "";
    return {
      amount: String(r.amount),
      currency: r.currency as PalestinianCurrency,
      instrumentDate: r.issueDate,
      dueDate: r.dueDate,
      partyName: r.accountHolder,
      partyType: dir === "incoming" ? "customer" as const : "supplier" as const,
      bankId,
      branchName: "",
      accountNumber: r.bankAccountId ?? "",
      checkNumber: r.chequeNumber,
      notes: r.notes ?? "",
    };
  };

  const transferToDefaultValues = (r: BankTransfer) => {
    const bankId = PALESTINIAN_BANKS.find(b => b.nameAr === r.sourceBank)?.id ?? "";
    return {
      direction: r.direction as InstrumentDirection,
      amount: String(r.amount),
      currency: r.currency as PalestinianCurrency,
      transferDate: r.transferDate,
      partyName: r.senderOrReceiver,
      bankId,
      iban: "",
      purpose: r.transferReference,
      notes: r.notes ?? "",
    };
  };

  const getEditDefaultValues = () => {
    if (!editIdForModal) return undefined;
    const found = findRecord(editIdForModal);
    if (!found) return undefined;
    if (found.type === "incoming") return chequeToDefaultValues(found.record as ChequeInstrument, "incoming");
    if (found.type === "outgoing") return chequeToDefaultValues(found.record as ChequeInstrument, "outgoing");
    return transferToDefaultValues(found.record as BankTransfer);
  };

  const unifiedRows = useMemo((): UnifiedRow[] => {
    const rows: UnifiedRow[] = [];

    filteredIncoming.forEach((r) => {
      const customer = customers.find((c) => c.id === r.customerId);
      rows.push({
        id: r.id,
        avatarLabel: "CHQ",
        reference: r.chequeNumber,
        subLabel: isArabic ? "شيك" : "Cheque",
        typeLabel: isArabic ? "وارد" : "Incoming",
        direction: "incoming",
        party: customer?.name ?? r.accountHolder,
        status: r.status,
        date: r.dueDate,
        amount: r.amount,
        currency: r.currency,
        bankName: r.bankName ?? "",
        onView: () => setDetailRecord({ type: "incoming", record: r }),
        onEdit: () => handleEditRecord("incoming", r.id),
        onDelete: () => setDeleteConfirmItem({ itemName: r.chequeNumber, onConfirm: () => handleDeleteRecord("incoming", r.id) }),
      });
    });

    filteredOutgoing.forEach((r) => {
      const supplier = suppliers.find((s) => s.id === r.supplierId);
      rows.push({
        id: r.id,
        avatarLabel: "CHQ",
        reference: r.chequeNumber,
        subLabel: isArabic ? "شيك" : "Cheque",
        typeLabel: isArabic ? "صادر" : "Outgoing",
        direction: "outgoing",
        party: supplier?.name ?? r.accountHolder,
        status: r.status,
        date: r.dueDate,
        amount: r.amount,
        currency: r.currency,
        bankName: r.bankName ?? "",
        onView: () => setDetailRecord({ type: "outgoing", record: r }),
        onEdit: () => handleEditRecord("outgoing", r.id),
        onDelete: () => setDeleteConfirmItem({ itemName: r.chequeNumber, onConfirm: () => handleDeleteRecord("outgoing", r.id) }),
      });
    });

    filteredTransfers.forEach((r) => {
      rows.push({
        id: r.id,
        avatarLabel: "TRF",
        reference: r.transferReference,
        subLabel: isArabic ? "تحويل بنكي" : "Bank Transfer",
        typeLabel: r.direction === "incoming"
          ? (isArabic ? "وارد" : "Incoming")
          : (isArabic ? "صادر" : "Outgoing"),
        direction: r.direction,
        party: r.senderOrReceiver,
        status: r.status,
        date: r.transferDate,
        amount: r.amount,
        currency: r.currency,
        bankName: r.sourceBank ?? "",
        onView: () => setDetailRecord({ type: "transfer", record: r }),
        onEdit: () => handleEditRecord("transfer", r.id),
        onDelete: () => setDeleteConfirmItem({ itemName: r.transferReference, onConfirm: () => handleDeleteRecord("transfer", r.id) }),
      });
    });

    ocrQueue.forEach((r) => {
      rows.push({
        id: r.id,
        avatarLabel: "OCR",
        reference: r.id,
        subLabel: isArabic ? "أداة مالية" : "Instrument",
        typeLabel: isArabic ? "مراجعة" : "Review",
        direction: "incoming",
        party: isArabic ? "مراجعة يدوية" : "Manual review",
        status: "Pending",
        date: r.capturedAt,
        amount: null,
        currency: "USD",
        bankName: "",
        onView: () => {
          const transfer = bankTransfers.find((t) => t.ocrExtractionId === r.id);
          if (transfer) { setOcrTarget({ type: "transfer", record: transfer, extraction: r }); return; }
          const incoming = incomingCheques.find((c) => c.ocrExtractionId === r.id);
          if (incoming) setOcrTarget({ type: "incoming", record: incoming, extraction: r });
        },
        onEdit: undefined,
        onDelete: undefined,
      });
    });

    const newInstruments = ctxInstruments.filter(i => !initialCtxIds.has(i.id));
    const q = searchTerm.toLowerCase();
    newInstruments.forEach((inst: TreasuryInstrument) => {
      if (q && ![inst.checkNumber, inst.drawerName, inst.payeeName, inst.bankName, inst.notes]
        .filter(Boolean).join(" ").toLowerCase().includes(q)) return;
      const displayStatus = normInstrumentStatus(inst.status);
      if (statusFilter !== "All" && displayStatus !== statusFilter) return;
      rows.push({
        id: inst.id,
        avatarLabel: inst.type === "check" ? "CHQ" : "TRF",
        reference:   inst.checkNumber ?? inst.referenceNumber ?? inst.id,
        subLabel:    inst.type === "check" ? (isArabic ? "شيك" : "Cheque") : (isArabic ? "تحويل بنكي" : "Bank Transfer"),
        typeLabel:   inst.direction === "incoming" ? (isArabic ? "وارد" : "Incoming") : (isArabic ? "صادر" : "Outgoing"),
        direction:   inst.direction,
        party:       inst.direction === "incoming" ? inst.drawerName : inst.payeeName,
        status:      displayStatus,
        date:        inst.dueDate,
        amount:      inst.amount,
        currency:    inst.currency,
        bankName:    inst.bankName ?? "",
        onView:      () => showToast(isArabic ? "تم الحفظ — سيتوفر عرض التفاصيل قريباً" : "Saved — detail view coming soon"),
        onEdit:      undefined,
        onDelete:    undefined,
      });
    });

    return rows;
  }, [bankTransfers, ctxInstruments, customers, filteredIncoming, filteredOutgoing, filteredTransfers, incomingCheques, initialCtxIds, isArabic, ocrQueue, searchTerm, statusFilter, suppliers, handleEditRecord, handleDeleteRecord]);

  const activeStatuses = useMemo(() => {
    const values = new Set<string>(["All"]);
    [...incomingCheques, ...outgoingCheques, ...bankTransfers].forEach((item) => values.add(item.status));
    return Array.from(values);
  }, [bankTransfers, incomingCheques, outgoingCheques]);

  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    [...incomingCheques, ...outgoingCheques].forEach(c => { if (c.bankName) banks.add(c.bankName); });
    bankTransfers.forEach(t => { if (t.sourceBank) banks.add(t.sourceBank); });
    ctxInstruments.forEach(i => { if (i.bankName) banks.add(i.bankName); });
    return Array.from(banks).sort();
  }, [incomingCheques, outgoingCheques, bankTransfers, ctxInstruments]);

  const displayRows = useMemo(() => {
    return unifiedRows.filter(row => {
      const matchBank = bankFilter === "all" || row.bankName === bankFilter;
      const matchDir  = directionFilter === "all" || row.direction === directionFilter;
      const matchFrom = !dateFrom || row.date >= dateFrom;
      const matchTo   = !dateTo || row.date <= dateTo;
      return matchBank && matchDir && matchFrom && matchTo;
    });
  }, [unifiedRows, bankFilter, directionFilter, dateFrom, dateTo]);

  const handleApproveCheque = (record: ChequeInstrument, direction: "incoming" | "outgoing") => {
    if (!access.approve) {
      showToast(isArabic ? "صلاحيتك لا تسمح باعتماد الشيكات." : "Your role cannot approve cheque actions.");
      return;
    }
    const ts = new Date().toISOString();
    const nextStatus: ChequeInstrument["status"] =
      direction === "incoming" ? (record.status === "Deposited" ? "Under Collection" : "Approved") : "Approved";
    if (direction === "incoming") {
      const next = incomingCheques.map((item) => item.id === record.id ? { ...item, status: nextStatus, approvedBy: user?.username ?? rolePreset, updatedAt: ts } : item);
      setIncomingCheques(next); saveIncomingCheques(next);
    } else {
      const next = outgoingCheques.map((item) => item.id === record.id ? { ...item, status: nextStatus, approvedBy: user?.username ?? rolePreset, updatedAt: ts } : item);
      setOutgoingCheques(next); saveOutgoingCheques(next);
    }
    postAudit({ id: `AUD-${record.id}-${ts}`, entityType: direction === "incoming" ? "incoming-cheque" : "outgoing-cheque", entityId: record.id, action: "Approval recorded", actor: user?.username ?? "system", actorRole: rolePreset, timestamp: ts, details: `Status moved to ${nextStatus}.` });
    showToast(isArabic ? "تم تسجيل اعتماد الشيك." : "Cheque approval recorded.");
  };

  const handleVerifyTransfer = (record: BankTransfer) => {
    if (!access.verifyTransfer) {
      showToast(isArabic ? "صلاحيتك لا تسمح بالتحقق من التحويلات البنكية." : "Your role cannot verify bank transfers.");
      return;
    }
    const ts = new Date().toISOString();
    const next = bankTransfers.map((item) => item.id === record.id ? { ...item, status: "Verified" as BankTransfer["status"], approvedBy: user?.username ?? rolePreset, updatedAt: ts } : item);
    setBankTransfers(next); saveBankTransfers(next);
    postAudit({ id: `AUD-${record.id}-${ts}`, entityType: "bank-transfer", entityId: record.id, action: "Transfer verified", actor: user?.username ?? "system", actorRole: rolePreset, timestamp: ts, details: `Transfer ${record.transferReference} verified and ready for settlement posting.` });
    showToast(isArabic ? "تم التحقق من التحويل البنكي." : "Bank transfer verified.");
  };

  const handleSaveOcrCorrections = (updatedFields: OCRFieldReview[]) => {
    if (!ocrTarget) return;
    if (!access.correctOCR) {
      showToast(isArabic ? "صلاحيتك لا تسمح بتصحيح بيانات OCR." : "Your role cannot correct OCR data.");
      return;
    }
    const ts = new Date().toISOString();
    const nextExtraction = { ...ocrTarget.extraction, status: "Corrected" as const, fields: updatedFields, averageConfidence: averageConfidence(updatedFields) };
    const next = ocrExtractions.map((item) => item.id === nextExtraction.id ? nextExtraction : item);
    setOcrExtractions(next); saveOCRExtractions(next);
    postAudit({ id: `AUD-${nextExtraction.id}-${ts}`, entityType: "ocr-extraction", entityId: nextExtraction.id, action: "OCR corrected", actor: user?.username ?? "system", actorRole: rolePreset, timestamp: ts, details: `Manual corrections saved for ${ocrTarget.type} ${ocrTarget.record.id}.` });
    setOcrTarget(null);
    showToast(isArabic ? "تم حفظ تصحيحات OCR وتدقيقها." : "OCR corrections saved and audited.");
  };

  const openOCR = (type: OCRTarget["type"], record: ChequeInstrument | BankTransfer) => {
    const extraction = ocrExtractions.find((item) => item.id === record.ocrExtractionId);
    if (extraction) setOcrTarget({ type, record: record as never, extraction } as OCRTarget);
  };

  const renderLinkage = (record: DetailRecord["record"]) => {
    const customer  = "customerId" in record && record.customerId  ? customers.find((c) => c.id === record.customerId)  : undefined;
    const supplier  = "supplierId" in record && record.supplierId  ? suppliers.find((s) => s.id === record.supplierId)  : undefined;
    const invoice   = "invoiceId"  in record && record.invoiceId   ? invoices.find((i)  => i.id === record.invoiceId)   : undefined;
    const payment   = "paymentId"  in record && record.paymentId   ? payments.find((p)  => p.id === record.paymentId)   : undefined;
    const journalEntry = "transferReference" in record ? record.linkedJournal : record.journalLink;
    const td = t.treasury.drawer;
    return (
      <div className="treasury-detail-links">
        <div><span>{td.labelCustomer}</span><strong>{customer?.name ?? td.notLinked}</strong></div>
        <div><span>{td.labelSupplier}</span><strong>{supplier?.name ?? td.notLinked}</strong></div>
        <div><span>{td.labelInvoice}</span><strong>{invoice?.id ?? td.notLinked}</strong></div>
        <div><span>{td.labelPayment}</span><strong>{payment?.paymentId ?? payment?.id ?? td.notLinked}</strong></div>
        <div><span>{td.labelJournal}</span><strong>{journalEntry?.journalEntryId ?? td.readyToMap}</strong></div>
        <div><span>{td.labelPosting}</span><strong>{journalEntry?.postingState ?? td.notMapped}</strong></div>
      </div>
    );
  };

  const switchTab = (tab: TreasuryTab) => { setActiveTab(tab); };

  return (
    <div className="trs-page">

      {/* ── Header ── */}
      <header className="trs-header">
        <div className="trs-header-left">
          <div className="trs-header-icon"><Landmark size={24} /></div>
          <div className="trs-header-copy">
            <h1>{t.treasury.pageTitle}</h1>
            <p>{isArabic ? "إدارة الشيكات، الحوالات البنكية، التسوية، والأدوات المالية وفق بيئة العمل الفلسطينية." : "Manage cheques, bank transfers, reconciliation, and financial instruments aligned with Palestinian banking workflows."}</p>
          </div>
        </div>
        <div className="trs-header-actions">
          <div className="trs-add-wrap">
            <button type="button" className="trs-add-btn" onClick={() => setShowFab(v => !v)}>
              <Plus size={16} />
              <span>{isArabic ? "إضافة" : "Add"}</span>
            </button>
            {showFab && (<>
              <div className="trs-add-backdrop" onClick={() => setShowFab(false)} />
              <div className="trs-add-dropdown">
                <button type="button" className="trs-add-item" onClick={() => { setEditIdForModal(null); setShowIncomingCheck(true); setShowFab(false); }}>
                  <Plus size={13} />
                  <span>{isArabic ? "شيك وارد" : "Incoming Cheque"}</span>
                </button>
                <button type="button" className="trs-add-item" onClick={() => { setEditIdForModal(null); setShowOutgoingCheck(true); setShowFab(false); }}>
                  <Plus size={13} />
                  <span>{isArabic ? "شيك صادر" : "Outgoing Cheque"}</span>
                </button>
                <button type="button" className="trs-add-item" onClick={() => { setEditIdForModal(null); setShowTransfer(true); setShowFab(false); }}>
                  <Banknote size={13} />
                  <span>{isArabic ? "حوالة بنكية" : "Bank Transfer"}</span>
                </button>
                <button type="button" className="trs-add-item" onClick={() => { setShowOCRScanner(true); setShowFab(false); }}>
                  <FileScan size={13} />
                  <span>{isArabic ? "مسح شيك OCR" : "Scan OCR Cheque"}</span>
                </button>
                <button type="button" className="trs-add-item" disabled={!access.reconcile} onClick={() => { setShowReconciliation(true); setShowFab(false); }}>
                  <RefreshCcw size={13} />
                  <span>{t.treasury.reconciliation.title}</span>
                </button>
              </div>
            </>)}
          </div>
        </div>
      </header>

      {/* ── KPI Grid (6 compact cards, clickable) ──────────── */}
      <div className="trs-kpi-grid">
        <div className="trs-kpi-card trs-kpi-card--blue" style={{ cursor: "pointer" }} onClick={() => switchTab("overview")}>
          <div className="trs-kpi-top">
            <strong className="trs-kpi-figure">{formatCurrencyValue(Number(bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0)), "USD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
            <span className="trs-kpi-icon-circle"><Landmark size={16} /></span>
          </div>
          <span className="trs-kpi-label">{isArabic ? "إجمالي الرصيد البنكي" : "Total Bank Balance"}</span>
          <span className="trs-kpi-sub">{activeAccountsLabel}</span>
        </div>
        <div className="trs-kpi-card trs-kpi-card--indigo" style={{ cursor: "pointer" }} onClick={() => switchTab("overview")}>
          <div className="trs-kpi-top">
            <strong className="trs-kpi-figure">{bankAccounts.length}</strong>
            <span className="trs-kpi-icon-circle"><CreditCard size={16} /></span>
          </div>
          <span className="trs-kpi-label">{isArabic ? "الحسابات البنكية" : "Bank Accounts"}</span>
          <span className="trs-kpi-sub">{isArabic ? "نشطة وجاهزة" : "Active & ready"}</span>
        </div>
        <div className="trs-kpi-card trs-kpi-card--amber" style={{ cursor: "pointer" }} onClick={() => { switchTab("transfers"); setStatusFilter("Pending Verification"); }}>
          <div className="trs-kpi-top">
            <strong className="trs-kpi-figure">{combinedSignals.pendingVerification}</strong>
            <span className="trs-kpi-icon-circle"><Banknote size={16} /></span>
          </div>
          <span className="trs-kpi-label">{isArabic ? "بانتظار التحقق" : "Pending Verification"}</span>
          <span className="trs-kpi-sub">{isArabic ? "تحويلات بنكية" : "Bank transfers"}</span>
        </div>
        <div className="trs-kpi-card trs-kpi-card--danger" style={{ cursor: "pointer" }} onClick={() => { switchTab("overview"); setStatusFilter("Bounced"); }}>
          <div className="trs-kpi-top">
            <strong className="trs-kpi-figure">{combinedSignals.bounced}</strong>
            <span className="trs-kpi-icon-circle"><AlertTriangle size={16} /></span>
          </div>
          <span className="trs-kpi-label">{isArabic ? "المرتجعات" : "Bounced"}</span>
          <span className="trs-kpi-sub">{isArabic ? "شيكات مرتجعة تحتاج متابعة" : "Cheques needing follow-up"}</span>
        </div>
        <div className="trs-kpi-card trs-kpi-card--success" style={{ cursor: "pointer" }} onClick={() => switchTab("incoming")}>
          <div className="trs-kpi-top">
            <strong className="trs-kpi-figure">{combinedSignals.dueSoon}</strong>
            <span className="trs-kpi-icon-circle"><RefreshCcw size={16} /></span>
          </div>
          <span className="trs-kpi-label">{isArabic ? "تستحق قريباً" : "Due Soon"}</span>
          <span className="trs-kpi-sub">{isArabic ? "خلال 3 أيام" : "Within 3 days"}</span>
        </div>
        <div className="trs-kpi-card trs-kpi-card--purple" style={{ cursor: "pointer" }} onClick={() => switchTab("overview")}>
          <div className="trs-kpi-top">
            <strong className="trs-kpi-figure">{ocrQueue.length}</strong>
            <span className="trs-kpi-icon-circle"><FileScan size={16} /></span>
          </div>
          <span className="trs-kpi-label">OCR {isArabic ? "قائمة" : "Queue"}</span>
          <span className="trs-kpi-sub">{combinedSignals.lowConfidence} {isArabic ? "تحتاج مراجعة" : "need review"}</span>
        </div>
      </div>

      {/* ── Toolbar + Tabs + Table ─────────────────────────── */}
      <div className="trs-toolbar">
        <div className="trs-toolbar-row">
          <div className="trs-search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="trs-search-input"
              placeholder={t.treasury.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="trs-filter-btn-wrap">
            <button type="button" className="trs-filter-btn" onClick={() => setShowFilterDropdown(v => !v)}>
              <Filter size={14} />
              <span>{isArabic ? "تصفية" : "Filter"}</span>
              {activeFilterCount > 0 && <span className="trs-filter-badge">{activeFilterCount}</span>}
            </button>
            {showFilterDropdown && (
              <div className="trs-filter-dropdown">
                <div className="trs-filter-group">
                  <label>{isArabic ? "الحالة" : "Status"}</label>
                  <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }}>
                    {activeStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s === "All" ? (isArabic ? "الكل" : "All") : statusLabel(s, isArabic)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="trs-filter-group">
                  <label>{isArabic ? "البنك" : "Bank"}</label>
                  <select value={bankFilter} onChange={(e) => { setBankFilter(e.target.value); }}>
                    <option value="all">{isArabic ? "الكل" : "All"}</option>
                    {availableBanks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="trs-filter-group">
                  <label>{isArabic ? "الاتجاه" : "Direction"}</label>
                  <select value={directionFilter} onChange={(e) => { setDirectionFilter(e.target.value); }}>
                    <option value="all">{isArabic ? "الكل" : "All"}</option>
                    <option value="incoming">{isArabic ? "وارد" : "Incoming"}</option>
                    <option value="outgoing">{isArabic ? "صادر" : "Outgoing"}</option>
                  </select>
                </div>
                <div className="trs-filter-group">
                  <label>{isArabic ? "النطاق الزمني" : "Date Range"}</label>
                  <div className="trs-filter-dates">
                    <input type="date" className="trs-filter-date-m" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span>{isArabic ? "إلى" : "→"}</span>
                    <input type="date" className="trs-filter-date-m" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>
                <div className="trs-filter-actions">
                  <button type="button" className="trs-filter-clear-btn" onClick={() => {
                    setStatusFilter("All"); setBankFilter("all"); setDirectionFilter("all"); setDateFrom(""); setDateTo("");
                  }}>
                    {isArabic ? "مسح الكل" : "Clear All"}
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className="trs-result-count">
            {displayRows.length} {isArabic ? "سجل" : "records"}
            {displayRows.length !== unifiedRows.length && ` ${isArabic ? "من" : "of"} ${unifiedRows.length}`}
          </span>
        </div>
        <div className="trs-toolbar-row">
          <div className="trs-tab-bar" ref={tabContainerRef}>
            <div className="trs-tab-indicator" style={{ width: indicatorStyle.width, left: indicatorStyle.left }} />
            {TABS.map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                ref={el => { tabRefs.current[key] = el; }}
                className={`trs-tab-btn${activeTab === key ? " active" : ""}`}
                onClick={() => switchTab(key)}
              >
                <span className="trs-tab-icon">{icon}</span>
                <span className="trs-tab-label">
                  <span className="trs-tab-text">{label}</span>
                  <span className="trs-tab-text-bold" aria-hidden="true">{label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div key={activeTab} className="trs-tab-fade">
      {/* â”€â”€ Overview / unified table â”€â”€ */}
      {activeTab === "overview" && (
        <div className="trs-table-card">
          <div className="trs-table-head">
            <strong>{isArabic ? "جميع الأدوات المالية" : "All Financial Instruments"}</strong>
            <span className="trs-table-count">{displayRows.length} {isArabic ? "أداة" : "items"}</span>
          </div>
          <div className="trs-table-wrap">
            <table className="trs-table atlas-table">
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{t.treasury.cols.reference}</th>
                  <th className="col-badge">{t.common.type}</th>
                  <th className="col-entity">{t.treasury.cols.party}</th>
                  <th className="col-badge">{t.treasury.cols.status}</th>
                  <th className="col-date">{t.treasury.cols.date}</th>
                  <th className="col-currency">{t.treasury.cols.amount}</th>
                  <th className="col-actions">{t.treasury.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.id} data-direction={row.direction}>
                    <td>
                      <span className={`trs-ref-tag trs-ref-tag--${row.avatarLabel.toLowerCase()}`}>{row.avatarLabel}</span>
                      <div className="trs-ref-cell">
                        <strong className="numeric-cell">{row.reference}</strong>
                        <span className="trs-sub-label">{row.subLabel}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`trs-dir-tag trs-dir-tag--${row.direction}`}>{row.typeLabel}</span>
                    </td>
                    <td className="trs-party-cell">{row.party}</td>
                    <td>
                      {(() => { const cfg = chequeStatusConfig(row.status); return (
                        <span style={{ background: cfg?.bg ?? '#F1F5F9', color: cfg?.color ?? '#64748B', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {cfg?.label ?? statusLabel(row.status, isArabic)}
                        </span>
                      ); })()}
                    </td>
                    <td>
                      <span className="numeric-cell">{formatDate(row.date, isArabic)}</span>
                    </td>
                    <td>
                      {row.amount !== null
                        ? <strong className="trs-amount numeric-cell">{money(row.amount, row.currency)}</strong>
                        : <span className="trs-muted">—</span>}
                    </td>
                    <td>
                      <TableActions
                        onView={row.onView}
                        onEdit={row.onEdit}
                        onDelete={row.onDelete}
                      />
                    </td>
                  </tr>
                ))}
                {displayRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="trs-empty-row">
                      {isArabic ? "لا توجد أدوات تطابق البحث." : "No instruments match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Incoming Cheques ── */}
      {activeTab === "incoming" && (
        <div className="trs-table-card">
          <div className="trs-table-head">
            <strong>{t.treasury.tabs.incoming}</strong>
            <span className="trs-table-count">{filteredIncoming.length}</span>
          </div>
          <div className="trs-table-wrap">
            <table className="trs-table atlas-table">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{t.treasury.cols.reference}</th><th className="col-entity">{t.common.customer}</th><th className="col-date">{t.treasury.cols.dueDate}</th>
                  <th className="col-currency">{t.treasury.cols.amount}</th><th className="col-badge">{t.treasury.cols.status}</th><th className="col-flex">OCR</th><th className="col-actions">{t.treasury.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncoming.map((record) => {
                  const customer   = customers.find((c) => c.id === record.customerId);
                  const extraction = ocrExtractions.find((e) => e.id === record.ocrExtractionId);
                  return (
                    <tr key={record.id} data-direction="incoming">
                      <td>
                        <span className="trs-ref-tag trs-ref-tag--chq">CHQ</span>
                        <div className="trs-ref-cell">
                          <strong className="numeric-cell">{record.chequeNumber}</strong>
                          <span className="trs-sub-label">{record.bankName}</span>
                        </div>
                      </td>
                      <td><div className="trs-customer-cell"><strong>{customer?.name ?? record.accountHolder}</strong><span className="trs-sub-label">{record.invoiceId ? `${isArabic ? "فاتورة" : "Invoice"} ${record.invoiceId}` : (isArabic ? "غير مسوّى" : "Unapplied")}</span></div></td>
                      <td><strong className="numeric-cell">{formatDate(record.dueDate, isArabic)}</strong></td>
                      <td><strong className="trs-amount numeric-cell">{money(record.amount, record.currency)}</strong></td>
                      <td>{(() => { const cfg = chequeStatusConfig(record.status); return (<span style={{ background: cfg?.bg ?? '#F1F5F9', color: cfg?.color ?? '#64748B', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block' }}>{cfg?.label ?? statusLabel(record.status, isArabic)}</span>); })()}</td>
                      <td>
                        {extraction
                          ? <button type="button" className="trs-ocr-btn" onClick={() => openOCR("incoming", record)}>{Math.round(extraction.averageConfidence * 100)}% · {isArabic ? "مراجعة" : "Review"}</button>
                          : <span className="trs-muted">{isArabic ? "بدون OCR" : "No OCR"}</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <TableActions
                            onView={() => setDetailRecord({ type: "incoming", record })}
                            onEdit={() => handleEditRecord("incoming", record.id)}
                            onDelete={() => setDeleteConfirmItem({ itemName: record.chequeNumber, onConfirm: () => handleDeleteRecord("incoming", record.id) })}
                          />
                          <button type="button" className="trs-row-action-btn" disabled={!access.approve} onClick={() => handleApproveCheque(record, "incoming")}>{isArabic ? "اعتماد" : "Approve"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Outgoing Cheques ── */}
      {activeTab === "outgoing" && (
        <div className="trs-table-card">
          <div className="trs-table-head">
            <strong>{t.treasury.tabs.outgoing}</strong>
            <span className="trs-table-count">{filteredOutgoing.length}</span>
          </div>
          <div className="trs-table-wrap">
            <table className="trs-table atlas-table">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{t.treasury.cols.reference}</th><th className="col-entity">{t.common.supplier}</th><th className="col-date">{t.treasury.cols.dueDate}</th>
                  <th className="col-currency">{t.treasury.cols.amount}</th><th className="col-badge">{t.treasury.cols.status}</th><th className="col-truncate">{t.common.notes}</th><th className="col-actions">{t.treasury.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutgoing.map((record) => {
                  const supplier = suppliers.find((s) => s.id === record.supplierId);
                  return (
                    <tr key={record.id} data-direction="outgoing">
                      <td>
                        <span className="trs-ref-tag trs-ref-tag--chq">CHQ</span>
                        <div className="trs-ref-cell">
                          <strong className="numeric-cell">{record.chequeNumber}</strong>
                          <span className="trs-sub-label">{record.bankName}</span>
                        </div>
                      </td>
                      <td><div className="trs-customer-cell"><strong>{supplier?.name ?? record.accountHolder}</strong><span className="trs-sub-label">{record.linkedPurchaseId ? `${isArabic ? "شراء" : "Purchase"} ${record.linkedPurchaseId}` : (isArabic ? "بدون ربط" : "No link")}</span></div></td>
                      <td><strong className="numeric-cell">{formatDate(record.dueDate, isArabic)}</strong></td>
                      <td><strong className="trs-amount numeric-cell">{money(record.amount, record.currency)}</strong></td>
                      <td>{(() => { const cfg = chequeStatusConfig(record.status); return (<span style={{ background: cfg?.bg ?? '#F1F5F9', color: cfg?.color ?? '#64748B', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block' }}>{cfg?.label ?? statusLabel(record.status, isArabic)}</span>); })()}</td>
                      <td><span className="trs-muted">{record.journalLink?.postingState ?? (isArabic ? "غير مرتبط" : "Not mapped")}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <TableActions
                            onView={() => setDetailRecord({ type: "outgoing", record })}
                            onEdit={() => handleEditRecord("outgoing", record.id)}
                            onDelete={() => setDeleteConfirmItem({ itemName: record.chequeNumber, onConfirm: () => handleDeleteRecord("outgoing", record.id) })}
                          />
                          <button type="button" className="trs-row-action-btn" disabled={!access.approve} onClick={() => handleApproveCheque(record, "outgoing")}>{isArabic ? "اعتماد" : "Approve"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bank Transfers ── */}
      {activeTab === "transfers" && (
        <div className="trs-table-card">
          <div className="trs-table-head">
            <strong>{t.treasury.tabs.transfers}</strong>
            <span className="trs-table-count">{filteredTransfers.length}</span>
          </div>
          <div className="trs-table-wrap">
            <table className="trs-table atlas-table">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{t.treasury.form.transfer.reference}</th><th className="col-entity">{t.treasury.form.transfer.from}</th><th className="col-date">{t.treasury.cols.date}</th>
                  <th className="col-currency">{t.treasury.cols.amount}</th><th className="col-badge">{t.treasury.cols.status}</th><th className="col-flex">OCR</th><th className="col-actions">{t.treasury.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((record) => {
                  const extraction = ocrExtractions.find((e) => e.id === record.ocrExtractionId);
                  return (
                    <tr key={record.id} data-direction={record.direction}>
                      <td>
                        <span className="trs-ref-tag trs-ref-tag--trf">TRF</span>
                        <div className="trs-ref-cell">
                          <strong className="numeric-cell">{record.transferReference}</strong>
                          <span className="trs-sub-label">{record.direction === "incoming" ? (isArabic ? "تحويل وارد" : "Incoming") : (isArabic ? "تحويل صادر" : "Outgoing")}</span>
                        </div>
                      </td>
                      <td><div className="trs-customer-cell"><strong>{record.senderOrReceiver}</strong><span className="trs-sub-label">{record.sourceBank} → {record.destinationBank}</span></div></td>
                      <td><strong className="numeric-cell">{formatDate(record.transferDate, isArabic)}</strong></td>
                      <td><strong className="trs-amount numeric-cell">{money(record.amount, record.currency)}</strong></td>
                      <td>{(() => { const cfg = chequeStatusConfig(record.status); return (<span style={{ background: cfg?.bg ?? '#F1F5F9', color: cfg?.color ?? '#64748B', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block' }}>{cfg?.label ?? statusLabel(record.status, isArabic)}</span>); })()}</td>
                      <td>
                        {extraction
                          ? <button type="button" className="trs-ocr-btn" onClick={() => openOCR("transfer", record)}>{Math.round(extraction.averageConfidence * 100)}% Â· OCR</button>
                          : <span className="trs-muted">{isArabic ? `${record.attachmentIds.length} ملفات` : `${record.attachmentIds.length} file(s)`}</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <TableActions
                            onView={() => setDetailRecord({ type: "transfer", record })}
                            onEdit={() => handleEditRecord("transfer", record.id)}
                            onDelete={() => setDeleteConfirmItem({ itemName: record.transferReference, onConfirm: () => handleDeleteRecord("transfer", record.id) })}
                          />
                          <button type="button" className="trs-row-action-btn" disabled={!access.verifyTransfer} onClick={() => handleVerifyTransfer(record)}>{t.treasury.reconciliation.match}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reconciliation ── */}
      {activeTab === "reconciliation" && (
        <div className="trs-table-card">
          <div className="trs-table-head">
            <strong>{t.treasury.reconciliation.title}</strong>
            <button type="button" className="trs-row-action-btn" disabled={!access.reconcile} onClick={() => showToast(isArabic ? "ميزة التسوية قيد التطوير" : "Reconciliation coming soon")}>
              <RefreshCcw size={13} /> {t.treasury.reconciliation.match}
            </button>
          </div>
          <div className="trs-table-wrap">
            <table className="trs-table atlas-table">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{t.treasury.cols.reference}</th><th className="col-date">{t.treasury.cols.date}</th><th className="col-currency">{t.treasury.cols.amount}</th>
                  <th className="col-badge">{t.treasury.cols.status}</th><th className="col-flex">{t.treasury.reconciliation.match}</th><th className="col-truncate">{t.common.notes}</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationItems.map((item) => (
                  <tr key={item.id}>
                    <td><div><strong className="numeric-cell">{item.sourceId}</strong><span className="trs-sub-label">{item.sourceType}</span></div></td>
                    <td className="numeric-cell">{formatDate(item.date, isArabic)}</td>
                    <td><strong className="trs-amount numeric-cell">{money(item.amount, item.currency)}</strong></td>
                    <td>{(() => { const cfg = chequeStatusConfig(item.matchStatus); return (<span style={{ background: cfg?.bg ?? '#F1F5F9', color: cfg?.color ?? '#64748B', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block' }}>{cfg?.label ?? statusLabel(item.matchStatus, isArabic)}</span>); })()}</td>
                    <td>
                      <span className="trs-muted">{item.suggestedTarget ? `${item.suggestedBy}: ${item.suggestedTarget}` : (isArabic ? "لا توجد مطابقة بعد" : "No match yet")}</span>
                    </td>
                    <td>
                      <span className="trs-muted">{item.notes || (isArabic ? "بدون ملاحظات" : "No notes")}</span>
                    </td>
                                      </tr>
                ))}
              </tbody>
            </table>
          </div>
            </div>
          )}
          </div>

      {/* ── Compact role + permissions card ──────────────── */}
      <div className="trs-bottom-bar">
        <div className="trs-bottom-role">
          <div className="trs-bottom-role-head">
            <ShieldCheck size={18} />
            <span>{isArabic ? "صلاحيات الخزينة" : "Treasury Permissions"}</span>
            <span className="trs-bottom-role-badge">{roleLabel(rolePreset, isArabic)}</span>
          </div>
          <p className="trs-bottom-role-desc">
            {access.approve
              ? (isArabic ? "يمكنه اعتماد الشيكات، مراجعة الحوالات، وتصحيح نتائج OCR." : "Can approve cheques, review transfers, and correct OCR data.")
              : (isArabic ? "وصول للعرض فقط للإجراءات الحساسة." : "View-only access for sensitive actions.")}
          </p>
          <div className="trs-bottom-perms">
            <span className={`trs-bottom-perm ${access.approve ? "allowed" : "restricted"}`}>
              {isArabic ? "اعتماد الشيكات" : "Approve Cheques"}: {access.approve ? (isArabic ? "مسموح" : "Allowed") : (isArabic ? "مقيد" : "Restricted")}
            </span>
            <span className={`trs-bottom-perm ${access.verifyTransfer ? "allowed" : "restricted"}`}>
              {isArabic ? "التحقق من الحوالات" : "Verify Transfers"}: {access.verifyTransfer ? (isArabic ? "مسموح" : "Allowed") : (isArabic ? "مقيد" : "Restricted")}
            </span>
            <span className={`trs-bottom-perm ${access.correctOCR ? "allowed" : "restricted"}`}>
              {isArabic ? "تصحيح OCR" : "Correct OCR"}: {access.correctOCR ? (isArabic ? "مسموح" : "Allowed") : (isArabic ? "مقيد" : "Restricted")}
            </span>
            <span className={`trs-bottom-perm ${access.reconcile ? "allowed" : "restricted"}`}>
              {isArabic ? "التسوية" : "Reconciliation"}: {access.reconcile ? (isArabic ? "مسموح" : "Allowed") : (isArabic ? "مقيد" : "Restricted")}
            </span>
          </div>
        </div>
        <div className="trs-bottom-accounts">
          <div className="trs-bottom-accounts-head">
            <CreditCard size={15} />
            <span>{isArabic ? "الحسابات البنكية" : "Bank Accounts"}</span>
          </div>
          <div className="trs-bottom-accounts-list">
            {bankAccounts.slice(0, 3).map((account) => (
              <div key={account.id} className="trs-bottom-account-row">
                <div>
                  <strong>{account.name}</strong>
                  <span className="numeric-cell">{account.bankName} · {account.accountNumberMasked}</span>
                </div>
                <strong className="numeric-cell">{money(account.currentBalance, account.currency)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Detail Modal (centered popup, replaces drawer) â”€â”€ */}
      {detailRecord
        ? createPortal(
            <div className="trs-modal-overlay" onClick={() => setDetailRecord(null)}>
              <div className="trs-modal" onClick={(e) => e.stopPropagation()}>
                <div className="trs-modal-head">
                  <div>
                    <span>{detailRecord.type === "transfer" ? t.treasury.drawer.transferDetails : t.treasury.drawer.chequeDetails}</span>
                    <h2 className="numeric-cell">{"transferReference" in detailRecord.record ? detailRecord.record.transferReference : detailRecord.record.chequeNumber}</h2>
                    <p>{t.treasury.drawer.drawerSubtitle}</p>
                  </div>
                  <button type="button" className="icon-dismiss-btn" onClick={() => setDetailRecord(null)}><X size={18} /></button>
                </div>
                <div className="trs-modal-body">
                  <section className="workspace-surface trs-modal-card">
                    <h3>{t.treasury.drawer.coreData}</h3>
                    <div className="trs-detail-grid">
                      <div><span>{t.treasury.drawer.labelStatus}</span><strong>{statusLabel(detailRecord.record.status, isArabic)}</strong></div>
                      <div><span>{t.treasury.drawer.labelAmount}</span><strong className="numeric-cell">{money(detailRecord.record.amount, detailRecord.record.currency)}</strong></div>
                      <div><span>{t.treasury.drawer.labelIssuedDate}</span><strong className="numeric-cell">{formatDate("transferDate" in detailRecord.record ? detailRecord.record.transferDate : detailRecord.record.issueDate, isArabic)}</strong></div>
                      <div><span>{t.treasury.drawer.labelDueDate}</span><strong className="numeric-cell">{formatDate("transferReference" in detailRecord.record ? detailRecord.record.settlementDate : detailRecord.record.dueDate, isArabic)}</strong></div>
                      <div><span>{t.treasury.drawer.labelApprovedBy}</span><strong>{detailRecord.record.approvedBy || t.treasury.drawer.pendingApproval}</strong></div>
                      <div><span>{t.treasury.drawer.labelReconciled}</span><strong>{detailRecord.record.reconciled ? t.treasury.drawer.yes : t.treasury.drawer.no}</strong></div>
                    </div>
                  </section>
                  <section className="workspace-surface trs-modal-card">
                    <h3>{t.treasury.drawer.linkedRecords}</h3>
                    {renderLinkage(detailRecord.record)}
                  </section>
                  <section className="workspace-surface trs-modal-card">
                    <h3>{t.treasury.drawer.ocrContext}</h3>
                    <div className="trs-detail-grid">
                      <div><span>{t.treasury.drawer.labelAttachments}</span><strong>{detailRecord.record.attachmentIds.length}</strong></div>
                      <div><span>{t.treasury.drawer.labelOcrExtraction}</span><strong className="numeric-cell">{detailRecord.record.ocrExtractionId ?? t.treasury.drawer.notCaptured}</strong></div>
                      <div><span>{t.treasury.drawer.labelCreatedBy}</span><strong>{detailRecord.record.createdBy}</strong></div>
                      <div><span>{t.treasury.drawer.labelLastUpdated}</span><strong className="numeric-cell">{formatDate(detailRecord.record.updatedAt, isArabic)}</strong></div>
                    </div>
                  </section>
                </div>
                <div className="trs-modal-actions">
                  <button type="button" className="trs-row-action-btn" onClick={() => setDetailRecord(null)}>{isArabic ? "إغلاق" : "Close"}</button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* ── OCR Modal ─────────────────────────────────────── */}
      {ocrTarget
        ? <OCRReviewModal target={ocrTarget} onClose={() => setOcrTarget(null)} onSave={handleSaveOcrCorrections} />
        : null}

      {toast ? <div className="treasury-toast">{toast}</div> : null}

      <DeleteConfirmDialog
        isOpen={!!deleteConfirmItem}
        itemName={deleteConfirmItem?.itemName ?? ""}
        onConfirm={() => { const cb = deleteConfirmItem?.onConfirm; setDeleteConfirmItem(null); if (cb) cb(); }}
        onCancel={() => setDeleteConfirmItem(null)}
      />

      <OCRScannerModal
        isOpen={showOCRScanner}
        onClose={() => setShowOCRScanner(false)}
        onSave={(data) => {
          const bank = PALESTINIAN_BANKS.find(b => b.id === 'bank_of_palestine');
          addInstrument({
            type: 'check',
            direction: 'incoming',
            status: 'pending',
            amount: data.amount,
            currency: data.currency,
            amountInILS: data.amount * (data.currency === 'ILS' ? 1 : data.currency === 'JOD' ? 5.15 : 3.7),
            instrumentDate: data.issueDate,
            dueDate: data.dueDate,
            drawerName: data.drawerName,
            drawerType: 'customer',
            payeeName: 'Ø£Ø·Ù„Ø³ Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„',
            bankId: bank?.id ?? '',
            bankName: bank?.nameAr ?? data.bankName,
            accountNumber: data.accountNumber,
            checkNumber: data.chequeNumber,
            micrVerified: true,
            linkedInvoiceIds: [],
            linkedPaymentIds: [],
            notes: data.notes,
            createdBy: 'admin',
          });
          setShowOCRScanner(false);
          showToast(isArabic ? "تم حفظ بيانات OCR والشيك بنجاح" : "OCR data and cheque saved successfully");
        }}
        isArabic={isArabic}
      />

      {showReconciliation && (
        <ReconciliationPanel
          bankAccounts={bankAccounts}
          incomingCheques={incomingCheques}
          outgoingCheques={outgoingCheques}
          bankTransfers={bankTransfers}
          isArabic={isArabic}
          onClose={() => setShowReconciliation(false)}
          showToast={showToast}
        />
      )}

      <AddCheckModal
        key={`incoming-${editIdForModal ?? "new"}`}
        isOpen={showIncomingCheck}
        onClose={() => { setShowIncomingCheck(false); setEditIdForModal(null); }}
        direction="incoming"
        defaultValues={editIdForModal ? getEditDefaultValues() as Partial<Record<string, string>> : undefined}
        onSuccess={(msg) => { setShowIncomingCheck(false); setEditIdForModal(null); showToast(msg); }}
      />
      <AddCheckModal
        key={`outgoing-${editIdForModal ?? "new"}`}
        isOpen={showOutgoingCheck}
        onClose={() => { setShowOutgoingCheck(false); setEditIdForModal(null); }}
        direction="outgoing"
        defaultValues={editIdForModal ? getEditDefaultValues() as Partial<Record<string, string>> : undefined}
        onSuccess={(msg) => { setShowOutgoingCheck(false); setEditIdForModal(null); showToast(msg); }}
      />
      <AddTransferModal
        key={`transfer-${editIdForModal ?? "new"}`}
        isOpen={showTransfer}
        onClose={() => { setShowTransfer(false); setEditIdForModal(null); }}
        defaultValues={editIdForModal ? getEditDefaultValues() as Partial<Record<string, string>> : undefined}
        onSuccess={(msg) => { setShowTransfer(false); setEditIdForModal(null); showToast(msg); }}
      />
    </div>
  );
}

type OCRScannerData = {
  amount: number;
  currency: PalestinianCurrency;
  issueDate: string;
  dueDate: string;
  drawerName: string;
  bankName: string;
  accountNumber: string;
  chequeNumber: string;
  notes?: string;
};

function OCRScannerModal({
  isOpen,
  onClose,
  onSave,
  isArabic,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OCRScannerData) => void;
  isArabic: boolean;
}) {
  const [step, setStep] = useState<"upload" | "scanning" | "review">("upload");
  const [fields, setFields] = useState<{
    chequeNumber: string; drawerName: string; bankName: string;
    accountNumber: string; amount: string; currency: string;
    issueDate: string; dueDate: string; confidence: number;
  } | null>(null);

  const [localAmount, setLocalAmount] = useState("");
  const [localCurrency, setLocalCurrency] = useState("ILS");
  const [localDueDate, setLocalDueDate] = useState("");

  const mockResult = {
    chequeNumber: "123456", drawerName: "محمد أحمد",
    bankName: "بنك فلسطين", accountNumber: "123456789012",
    amount: "50000", currency: "ILS",
    issueDate: "2026-06-03",
    dueDate: "2026-07-03",
    confidence: 0.92,
  };

  const handleFile = () => {
    setStep("scanning");
    setTimeout(() => {
      setFields(mockResult);
      setLocalAmount(mockResult.amount);
      setLocalCurrency(mockResult.currency);
      setLocalDueDate(mockResult.dueDate);
      setStep("review");
    }, 2000);
  };

  const handleSave = () => {
    if (!fields) return;
    onSave({
      amount: Number(localAmount),
      currency: localCurrency as PalestinianCurrency,
      issueDate: fields.issueDate,
      dueDate: localDueDate,
      drawerName: fields.drawerName,
      bankName: fields.bankName,
      accountNumber: fields.accountNumber,
      chequeNumber: fields.chequeNumber,
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isArabic ? "مسح شيك OCR" : "OCR Cheque Scan"}
      size="lg"
      footer={
        step === "review" ? (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onClose}>{isArabic ? "إلغاء" : "Cancel"}</Button>
            <Button variant="primary" onClick={handleSave}>{isArabic ? "حفظ وإنشاء شيك" : "Save & Create Cheque"}</Button>
          </div>
        ) : step === "scanning" ? (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="secondary" disabled>{isArabic ? "جارٍ المسح..." : "Scanning..."}</Button>
          </div>
        ) : undefined
      }
    >
      {step === "upload" && (
        <div className="ocr-upload-zone" onClick={handleFile}>
          <Upload size={40} />
          <p>{isArabic ? "انقر أو أسحب صورة الشيك هنا" : "Click or drag a cheque image here"}</p>
          <span>{isArabic ? "يدعم JPG, PNG, PDF" : "Supports JPG, PNG, PDF"}</span>
          <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFile} />
        </div>
      )}
      {step === "scanning" && (
        <div className="ocr-scanning">
          <div className="ocr-scanner-line" />
          <p>{isArabic ? "جارٍ تحليل صورة الشيك..." : "Analysing cheque image..."}</p>
          <div className="ocr-scanning-bar"><div className="ocr-scanning-fill" /></div>
        </div>
      )}
      {step === "review" && fields && (
        <div className="ocr-review-fields">
          <div className="ocr-summary-strip">
            <div><span>{isArabic ? "رقم الشيك" : "Cheque No."}</span><strong>{fields.chequeNumber}</strong></div>
            <div><span>{isArabic ? "البنك" : "Bank"}</span><strong>{fields.bankName}</strong></div>
            <div><span>{isArabic ? "الثقة" : "Confidence"}</span><strong>{Math.round(fields.confidence * 100)}%</strong></div>
          </div>
          <div className="ocr-scanner-field-grid">
            <div className="ocr-scanner-field">
              <label>{isArabic ? "المبلغ" : "Amount"}</label>
              <input value={localAmount} onChange={e => setLocalAmount(e.target.value)} />
            </div>
            <div className="ocr-scanner-field">
              <label>{isArabic ? "العملة" : "Currency"}</label>
              <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value)}>
                <option value="ILS">ILS</option><option value="JOD">JOD</option><option value="USD">USD</option>
              </select>
            </div>
            <div className="ocr-scanner-field">
              <label>{isArabic ? "تاريخ الاستحقاق" : "Due Date"}</label>
              <input type="date" value={localDueDate} onChange={e => setLocalDueDate(e.target.value)} />
            </div>
            <div className="ocr-scanner-field">
              <label>{isArabic ? "الساحب" : "Drawer"}</label>
              <input value={fields.drawerName} disabled />
            </div>
            <div className="ocr-scanner-field">
              <label>{isArabic ? "رقم الحساب" : "Account No."}</label>
              <input value={fields.accountNumber} disabled />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ReconciliationPanel({
  bankAccounts,
  incomingCheques,
  outgoingCheques,
  bankTransfers,
  isArabic,
  onClose,
  showToast,
}: {
  bankAccounts: { id: string; name: string; bankName: string; accountNumberMasked: string; currentBalance: number; currency: string }[];
  incomingCheques: ChequeInstrument[];
  outgoingCheques: ChequeInstrument[];
  bankTransfers: BankTransfer[];
  isArabic: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAccount, setSelectedAccount] = useState<typeof bankAccounts[0] | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [statementLines] = useState<{ id: string; date: string; description: string; amount: number; type: "credit" | "debit" }[]>(() => [
    { id: "st-1", date: "2026-05-01", description: isArabic ? "شيك رقم 123456" : "Cheque 123456", amount: 50000, type: "credit" },
    { id: "st-2", date: "2026-05-03", description: isArabic ? "تحويل بنكي" : "Bank Transfer", amount: 25000, type: "debit" },
    { id: "st-3", date: "2026-05-05", description: isArabic ? "شيك رقم 789012" : "Cheque 789012", amount: 30000, type: "credit" },
    { id: "st-4", date: "2026-05-07", description: isArabic ? "رسوم بنكية" : "Bank Fees", amount: 150, type: "debit" },
  ]);

  const systemLines = useMemo(() => {
    const lines: { id: string; date: string; description: string; amount: number }[] = [];
    incomingCheques.forEach(c => lines.push({ id: `sys-inc-${c.id}`, date: c.dueDate, description: `${isArabic ? "شيك وارد" : "Incoming Chq"} ${c.chequeNumber}`, amount: c.amount }));
    outgoingCheques.forEach(c => lines.push({ id: `sys-out-${c.id}`, date: c.dueDate, description: `${isArabic ? "شيك صادر" : "Outgoing Chq"} ${c.chequeNumber}`, amount: -c.amount }));
    bankTransfers.forEach(t => lines.push({ id: `sys-trf-${t.id}`, date: t.transferDate, description: `${isArabic ? "تحويل" : "Transfer"} ${t.transferReference}`, amount: t.direction === "incoming" ? t.amount : -t.amount }));
    return lines;
  }, [incomingCheques, outgoingCheques, bankTransfers, isArabic]);

  const statementTotal = statementLines.reduce((s, l) => s + (l.type === "credit" ? l.amount : -l.amount), 0);
  const systemTotal = systemLines.reduce((s, l) => s + l.amount, 0);
  const matchedTotal = systemLines.filter(l => matchedIds.has(l.id)).reduce((s, l) => s + l.amount, 0);
  const remainingTotal = systemTotal - matchedTotal;
  const diff = statementTotal - remainingTotal;

  const toggleMatch = (sysId: string) => {
    setMatchedIds(prev => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId); else next.add(sysId);
      return next;
    });
  };

  const handleConfirm = () => {
    showToast(isArabic ? "تم اعتماد التسوية البنكية بنجاح" : "Bank reconciliation approved successfully");
    onClose();
  };

  const escHandler = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => { document.addEventListener("keydown", escHandler); return () => document.removeEventListener("keydown", escHandler); }, [escHandler]);

  return createPortal(
    <div className="recon-overlay" onClick={onClose}>
      <div className="recon-panel" onClick={e => e.stopPropagation()}>
        <div className="recon-head">
          <div className="recon-head-left">
            {step > 1 && (
              <button type="button" className="recon-back-btn" onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}>
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <span className="recon-head-step">{isArabic ? `Ø§Ù„Ø®Ø·ÙˆØ© ${step} Ù…Ù† 3` : `Step ${step} of 3`}</span>
              <h2>{step === 1 ? (isArabic ? "اختيار الحساب البنكي" : "Select Bank Account") : step === 2 ? (isArabic ? "مطابقة المعاملات" : "Match Transactions") : (isArabic ? "تأكيد التسوية" : "Confirm Reconciliation")}</h2>
            </div>
          </div>
          <button type="button" className="recon-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="recon-body">
          {step === 1 && (
            <div className="recon-account-list">
              <p className="recon-body-desc">{isArabic ? "اختر الحساب البنكي الذي تريد تسويته:" : "Select the bank account to reconcile:"}</p>
              {bankAccounts.map(acc => (
                <div key={acc.id} className={`recon-account-card${selectedAccount?.id === acc.id ? " selected" : ""}`} onClick={() => setSelectedAccount(acc)}>
                  <div className="recon-account-info">
                    <strong>{acc.name}</strong>
                    <span>{acc.bankName} · {acc.accountNumberMasked}</span>
                  </div>
                  <div className="recon-account-balance">
                    <span className="recon-balance-figure">{money(acc.currentBalance, acc.currency)}</span>
                    <span className="recon-balance-label">{isArabic ? "الرصيد الحالي" : "Current Balance"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="recon-match-layout">
              <div className="recon-match-col">
                <h3>{isArabic ? "كشف الحساب البنكي" : "Bank Statement"}</h3>
                <div className="recon-match-items">
                  {statementLines.map(line => (
                    <div key={line.id} className="recon-match-item recon-statement-item">
                      <div>
                        <strong>{line.description}</strong>
                        <span>{line.date}</span>
                      </div>
                      <span className={`recon-match-amount ${line.type === "credit" ? "credit" : "debit"}`}>
                        {line.type === "credit" ? "+" : "-"}{money(line.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="recon-match-total">
                    <span>{isArabic ? "المجموع" : "Total"}</span>
                    <strong>{money(statementTotal)}</strong>
                  </div>
                </div>
              </div>
              <div className="recon-match-col">
                <h3>{isArabic ? "النظام" : "System"}</h3>
                <div className="recon-match-items">
                  {systemLines.map(line => (
                    <div key={line.id} className={`recon-match-item${matchedIds.has(line.id) ? " matched" : ""}`} onClick={() => toggleMatch(line.id)}>
                      <div className="recon-match-check">
                        <div className={`recon-checkbox${matchedIds.has(line.id) ? " checked" : ""}`}>
                          {matchedIds.has(line.id) && <CheckCircle size={14} />}
                        </div>
                        <div>
                          <strong>{line.description}</strong>
                          <span>{line.date}</span>
                        </div>
                      </div>
                      <span className={`recon-match-amount ${line.amount >= 0 ? "credit" : "debit"}`}>
                        {money(Math.abs(line.amount))}
                      </span>
                    </div>
                  ))}
                  <div className="recon-match-total">
                    <span>{isArabic ? "المطابق" : "Matched"}: {matchedIds.size}</span>
                    <strong>{money(matchedTotal)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="recon-summary">
              <div className="recon-summary-card">
                <div className="recon-summary-row">
                  <span>{isArabic ? "رصيد كشف الحساب" : "Statement Balance"}</span>
                  <strong>{money(statementTotal)}</strong>
                </div>
                <div className="recon-summary-row">
                  <span>{isArabic ? "المعاملات المطابقة" : "Matched Transactions"}</span>
                  <strong>{money(matchedTotal)}</strong>
                </div>
                <div className="recon-summary-row">
                  <span>{isArabic ? "المعاملات غير المطابقة" : "Unmatched Transactions"}</span>
                  <strong>{money(remainingTotal - matchedTotal)}</strong>
                </div>
                <div className="recon-summary-divider" />
                <div className={`recon-summary-row recon-summary-diff${diff === 0 ? " zero" : ""}`}>
                  <span>{isArabic ? "الفرق" : "Difference"}</span>
                  <strong>{money(diff)}</strong>
                </div>
                {diff !== 0 && (
                  <p className="recon-summary-warning">
                    {isArabic ? "الفرق لا يساوي صفر. يرجى مراجعة المعاملات غير المطابقة." : "Difference is not zero. Please review unmatched transactions."}
                  </p>
                )}
              </div>
              {selectedAccount && (
                <div className="recon-summary-account">
                  <span>{isArabic ? "الحساب" : "Account"}</span>
                  <strong>{selectedAccount.name}</strong>
                  <span>{selectedAccount.bankName} · {selectedAccount.accountNumberMasked}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="recon-footer">
          {step === 1 && (
            <div className="recon-footer-actions">
              <Button variant="secondary" onClick={onClose}>{isArabic ? "إلغاء" : "Cancel"}</Button>
              <Button variant="primary" disabled={!selectedAccount} onClick={() => setStep(2)}>
                {isArabic ? "التالي ←" : "Next →"}
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="recon-footer-actions">
              <Button variant="secondary" onClick={() => setStep(1)}>{isArabic ? "← السابق" : "← Back"}</Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                {isArabic ? "مراجعة التسوية" : "Review Reconciliation"}
              </Button>
            </div>
          )}
          {step === 3 && (
            <div className="recon-footer-actions">
              <Button variant="secondary" onClick={() => setStep(2)}>{isArabic ? "← السابق" : "← Back"}</Button>
              <Button variant="primary" disabled={diff !== 0} onClick={handleConfirm}>
                <CheckCircle size={16} /> {isArabic ? "اعتماد التسوية" : "Approve Reconciliation"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function OCRReviewModal({
  target,
  onClose,
  onSave,
}: {
  target: OCRTarget;
  onClose: () => void;
  onSave: (fields: OCRFieldReview[]) => void;
}) {
  const { t, isArabic } = useSettings();
  const [fields, setFields] = useState(target.extraction.fields);
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      variant="dialog"
      size="lg"
      title={target.extraction.sourceId}
      description={t.treasury.ocr.subtitle}
      footer={
        <>
          <Button type="button" variant="secondary" className="trs-mini-btn" onClick={onClose}>{t.common.cancel}</Button>
          <Button type="button" variant="primary" className="trs-mini-btn trs-mini-btn--primary" onClick={() => onSave(fields)}>{t.common.save}</Button>
        </>
      }
    >
      <div className="ocr-summary-strip">
        <div><span>{isArabic ? "المزوّد" : "Provider"}</span><strong>{target.extraction.provider}</strong></div>
        <div><span>{isArabic ? "متوسط الثقة" : "Average confidence"}</span><strong className="numeric-cell">{Math.round(target.extraction.averageConfidence * 100)}%</strong></div>
        <div><span>{isArabic ? "الحالة" : "Status"}</span><strong>{statusLabel(target.extraction.status, isArabic)}</strong></div>
      </div>
      <div className="ocr-field-list">
        {fields.map((field) => (
          <div key={field.field} className="ocr-field-row">
            <div className="ocr-field-meta">
              <strong>{field.field}</strong>
              <span>{confidenceLabel(field.confidence, isArabic)} Â· {Math.round(field.confidence * 100)}%</span>
            </div>
            <label><span>{t.treasury.ocr.extracted}</span><Input value={field.extractedValue} disabled /></label>
            <label>
              <span>{t.treasury.ocr.confirm}</span>
              <Input
                value={field.correctedValue ?? field.extractedValue}
                onChange={(e) =>
                  setFields((cur) =>
                    cur.map((item) =>
                      item.field === field.field ? { ...item, correctedValue: e.target.value, approved: true } : item
                    )
                  )
                }
              />
            </label>
          </div>
        ))}
      </div>
    </Modal>
  );
}
