import "./Treasury.css";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  FileScan,
  Landmark,
  Lock,
  MoreVertical,
  RefreshCcw,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import OverflowContent from "../components/ui/OverflowContent";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
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

type UnifiedRow = {
  id: string;
  avatarLabel: string;
  avatarBg: string;
  avatarColor: string;
  reference: string;
  subLabel: string;
  typeLabel: string;
  typeBg: string;
  typeColor: string;
  party: string;
  status: string;
  date: string;
  amount: number | null;
  currency: string;
  onView: () => void;
};

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

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value?: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function relTime(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff > 0) return `In ${diff} day${diff === 1 ? "" : "s"}`;
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`;
  return "Today";
}

function confidenceLabel(value: number) {
  if (value >= 0.9) return "High confidence";
  if (value >= 0.75) return "Medium confidence";
  return "Needs review";
}

function urgencyLabel(dueDate: string) {
  const diff = Math.ceil(
    (new Date(dueDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

function statusTone(status: string) {
  if (["Cleared", "Verified", "Approved", "Fully Applied", "Collected"].includes(status)) return "success";
  if (["Pending Verification", "Deposited", "Under Collection", "Partially Applied", "Issued", "Delivered", "Held", "Post-dated"].includes(status)) return "warning";
  if (["Bounced", "Rejected", "Cancelled", "Returned", "Voided"].includes(status)) return "danger";
  return "neutral";
}

function averageConfidence(fields: OCRFieldReview[]) {
  if (fields.length === 0) return 0;
  return fields.reduce((sum, item) => sum + item.confidence, 0) / fields.length;
}

function renderPages(page: number, total: number, setPage: (p: number) => void) {
  if (total <= 1) return null;
  const pages: (number | "…")[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }
  return pages.map((p, idx) =>
    p === "…" ? (
      <span key={`e${idx}`} className="trs-pg-ellipsis">…</span>
    ) : (
      <Button
        key={p}
        type="button"
        variant="ghost"
        className={`trs-pg-btn${page === p ? " active" : ""}`}
        onClick={() => setPage(p as number)}
      >
        {p}
      </Button>
    )
  );
}

export default function Treasury() {
  const { user } = useAuth();
  const { t } = useSettings();
  const customers  = useMemo(() => getCustomers(),  []);
  const suppliers  = useMemo(() => getSuppliers(),  []);
  const invoices   = useMemo(() => getInvoices(),   []);
  const payments   = useMemo(() => getPayments(),   []);
  const bankAccounts = useMemo(() => getBankAccounts(), []);

  const [incomingCheques,  setIncomingCheques]  = useState(() => getIncomingCheques());
  const [outgoingCheques,  setOutgoingCheques]  = useState(() => getOutgoingCheques());
  const [bankTransfers,    setBankTransfers]    = useState(() => getBankTransfers());
  const [ocrExtractions,   setOcrExtractions]   = useState(() => getOCRExtractions());
  const [auditEvents,      setAuditEvents]      = useState(() => getAuditEvents());
  const [reconciliationItems] = useState<ReconciliationItem[]>(() => getReconciliationItems());
  const [activeTab,    setActiveTab]    = useState<TreasuryTab>("overview");
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detailRecord, setDetailRecord] = useState<DetailRecord | null>(null);
  const [ocrTarget,    setOcrTarget]    = useState<OCRTarget | null>(null);
  const [toast,        setToast]        = useState<string>("");
  const [page,         setPage]         = useState(1);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);

  const rolePreset = (localStorage.getItem("app-role-preset") as TreasuryRole) || "Admin";
  const access = ROLE_MATRIX[rolePreset] ?? ROLE_MATRIX.Admin;

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

  const filteredIncoming = useMemo(() => {
    return incomingCheques.filter((item) => {
      const q = [item.chequeNumber, item.accountHolder, item.bankName, item.notes].filter(Boolean).join(" ").toLowerCase();
      return q.includes(searchTerm.toLowerCase()) && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [incomingCheques, searchTerm, statusFilter]);

  const filteredOutgoing = useMemo(() => {
    return outgoingCheques.filter((item) => {
      const q = [item.chequeNumber, item.accountHolder, item.bankName, item.notes].filter(Boolean).join(" ").toLowerCase();
      return q.includes(searchTerm.toLowerCase()) && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [outgoingCheques, searchTerm, statusFilter]);

  const filteredTransfers = useMemo(() => {
    return bankTransfers.filter((item) => {
      const q = [item.transferReference, item.senderOrReceiver, item.sourceBank, item.destinationBank, item.notes].filter(Boolean).join(" ").toLowerCase();
      return q.includes(searchTerm.toLowerCase()) && (statusFilter === "All" || item.status === statusFilter);
    });
  }, [bankTransfers, searchTerm, statusFilter]);

  const ocrQueue = useMemo(() => {
    return ocrExtractions.filter((item) => item.status !== "Reviewed").sort((a, b) => a.averageConfidence - b.averageConfidence);
  }, [ocrExtractions]);

  const unifiedRows = useMemo((): UnifiedRow[] => {
    const rows: UnifiedRow[] = [];

    filteredIncoming.forEach((r) => {
      const customer = customers.find((c) => c.id === r.customerId);
      rows.push({
        id: r.id,
        avatarLabel: "CHQ",
        avatarBg: "#dbeafe",
        avatarColor: "#1d4ed8",
        reference: r.chequeNumber,
        subLabel: "Cheque",
        typeLabel: "Incoming",
        typeBg: "#dbeafe",
        typeColor: "#1d4ed8",
        party: customer?.name ?? r.accountHolder,
        status: r.status,
        date: r.dueDate,
        amount: r.amount,
        currency: r.currency,
        onView: () => setDetailRecord({ type: "incoming", record: r }),
      });
    });

    filteredOutgoing.forEach((r) => {
      const supplier = suppliers.find((s) => s.id === r.supplierId);
      rows.push({
        id: r.id,
        avatarLabel: "CHQ",
        avatarBg: "#ffedd5",
        avatarColor: "#ea580c",
        reference: r.chequeNumber,
        subLabel: "Cheque",
        typeLabel: "Outgoing",
        typeBg: "#ffedd5",
        typeColor: "#ea580c",
        party: supplier?.name ?? r.accountHolder,
        status: r.status,
        date: r.dueDate,
        amount: r.amount,
        currency: r.currency,
        onView: () => setDetailRecord({ type: "outgoing", record: r }),
      });
    });

    filteredTransfers.forEach((r) => {
      rows.push({
        id: r.id,
        avatarLabel: "TRF",
        avatarBg: "#dcfce7",
        avatarColor: "#16a34a",
        reference: r.transferReference,
        subLabel: "Bank Transfer",
        typeLabel: r.direction === "incoming" ? "Incoming" : "Outgoing",
        typeBg: r.direction === "incoming" ? "#dbeafe" : "#ffedd5",
        typeColor: r.direction === "incoming" ? "#1d4ed8" : "#ea580c",
        party: r.senderOrReceiver,
        status: r.status,
        date: r.transferDate,
        amount: r.amount,
        currency: r.currency,
        onView: () => setDetailRecord({ type: "transfer", record: r }),
      });
    });

    ocrQueue.forEach((r) => {
      rows.push({
        id: r.id,
        avatarLabel: "OCR",
        avatarBg: "#f1f5f9",
        avatarColor: "#64748b",
        reference: r.id,
        subLabel: "Instrument",
        typeLabel: "Review",
        typeBg: "#f1f5f9",
        typeColor: "#64748b",
        party: "Manual review",
        status: "Pending",
        date: r.capturedAt,
        amount: null,
        currency: "USD",
        onView: () => {
          const transfer = bankTransfers.find((t) => t.ocrExtractionId === r.id);
          if (transfer) { setOcrTarget({ type: "transfer", record: transfer, extraction: r }); return; }
          const incoming = incomingCheques.find((c) => c.ocrExtractionId === r.id);
          if (incoming) setOcrTarget({ type: "incoming", record: incoming, extraction: r });
        },
      });
    });

    return rows;
  }, [filteredIncoming, filteredOutgoing, filteredTransfers, ocrQueue, customers, suppliers, incomingCheques, bankTransfers]);

  const totalPages = Math.ceil(unifiedRows.length / rowsPerPage);
  const pagedRows  = unifiedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const activeStatuses = useMemo(() => {
    const values = new Set<string>(["All"]);
    [...incomingCheques, ...outgoingCheques, ...bankTransfers].forEach((item) => values.add(item.status));
    return Array.from(values);
  }, [bankTransfers, incomingCheques, outgoingCheques]);

  const postAudit = (event: AuditEvent) => {
    const next = [event, ...auditEvents];
    setAuditEvents(next);
    saveAuditEvents(next);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const handleApproveCheque = (record: ChequeInstrument, direction: "incoming" | "outgoing") => {
    if (!access.approve) { showToast("Your role cannot approve cheque actions."); return; }
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
    showToast("Cheque approval recorded.");
  };

  const handleVerifyTransfer = (record: BankTransfer) => {
    if (!access.verifyTransfer) { showToast("Your role cannot verify bank transfers."); return; }
    const ts = new Date().toISOString();
    const next = bankTransfers.map((item) => item.id === record.id ? { ...item, status: "Verified" as BankTransfer["status"], approvedBy: user?.username ?? rolePreset, updatedAt: ts } : item);
    setBankTransfers(next); saveBankTransfers(next);
    postAudit({ id: `AUD-${record.id}-${ts}`, entityType: "bank-transfer", entityId: record.id, action: "Transfer verified", actor: user?.username ?? "system", actorRole: rolePreset, timestamp: ts, details: `Transfer ${record.transferReference} verified and ready for settlement posting.` });
    showToast("Bank transfer verified.");
  };

  const handleSaveOcrCorrections = (updatedFields: OCRFieldReview[]) => {
    if (!ocrTarget) return;
    if (!access.correctOCR) { showToast("Your role cannot correct OCR data."); return; }
    const ts = new Date().toISOString();
    const nextExtraction = { ...ocrTarget.extraction, status: "Corrected" as const, fields: updatedFields, averageConfidence: averageConfidence(updatedFields) };
    const next = ocrExtractions.map((item) => item.id === nextExtraction.id ? nextExtraction : item);
    setOcrExtractions(next); saveOCRExtractions(next);
    postAudit({ id: `AUD-${nextExtraction.id}-${ts}`, entityType: "ocr-extraction", entityId: nextExtraction.id, action: "OCR corrected", actor: user?.username ?? "system", actorRole: rolePreset, timestamp: ts, details: `Manual corrections saved for ${ocrTarget.type} ${ocrTarget.record.id}.` });
    setOcrTarget(null);
    showToast("OCR corrections saved and audited.");
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

  const switchTab = (tab: TreasuryTab) => { setActiveTab(tab); setPage(1); };

  return (
    <div className="trs-page">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="trs-header">
        <div className="trs-header-eyebrow">
          <Landmark size={14} />
          {t.treasury.pageTitle}
        </div>
        <h1 className="trs-header-title">{t.treasury.pageTitle}</h1>
        <p className="trs-header-sub">{t.treasury.pageSubtitle}</p>
      </header>

      {/* ── KPI Row ────────────────────────────────────────── */}
      <div className="trs-kpi-row">
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--blue"><Landmark size={20} /></div>
          <div>
            <span className="trs-kpi-label">{t.treasury.overview.bankAccounts}</span>
            <strong className="trs-kpi-value">
              {money(bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0))}
            </strong>
            <span className="trs-kpi-link">{t.treasury.kpi.acrossAccounts.replace("{{count}}", String(bankAccounts.length))}</span>
          </div>
        </div>
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--amber"><Banknote size={20} /></div>
          <div>
            <span className="trs-kpi-label">{t.treasury.kpi.incomingChequesDueSoon}</span>
            <strong className="trs-kpi-value">{combinedSignals.dueSoon}</strong>
            <span className="trs-kpi-note">{t.treasury.kpi.postDatedNote}</span>
          </div>
        </div>
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--red"><AlertTriangle size={20} /></div>
          <div>
            <span className="trs-kpi-label">{t.treasury.kpi.bouncedInstruments}</span>
            <strong className="trs-kpi-value">{combinedSignals.bounced}</strong>
            <span className="trs-kpi-note">{t.treasury.kpi.bouncedNote}</span>
          </div>
        </div>
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--purple"><FileScan size={20} /></div>
          <div>
            <span className="trs-kpi-label">{t.treasury.kpi.ocrQueue}</span>
            <strong className="trs-kpi-value">{ocrQueue.length}</strong>
            <span className="trs-kpi-note">{t.treasury.kpi.itemsNeedValidation.replace("{{count}}", String(combinedSignals.lowConfidence))}</span>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="trs-body">

        {/* Content column */}
        <div className="trs-content-col">

          {/* Toolbar */}
          <div className="trs-toolbar">
            <div className="trs-toolbar-top">
              <div className="trs-search">
                <Search size={15} />
                <Input
                  variant="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.treasury.searchPlaceholder}
                />
              </div>
              <Select
                className="trs-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={activeStatuses.map((s) => ({ value: s, label: s }))}
              />
              <div className="trs-tab-group">
                {([["overview", t.treasury.tabs.overview], ["incoming", t.treasury.tabs.incoming], ["outgoing", t.treasury.tabs.outgoing]] as [TreasuryTab, string][]).map(([key, label]) => (
                  <Button key={key} type="button" variant="ghost" className={`trs-tab-btn${activeTab === key ? " active" : ""}`} onClick={() => switchTab(key)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="trs-sub-tab-group">
              {([["overview", t.common.all], ["transfers", t.treasury.tabs.transfers], ["reconciliation", t.treasury.tabs.reconciliation]] as [TreasuryTab, string][]).map(([key, label]) => (
                <Button key={key} type="button" variant="ghost" className={`trs-sub-tab-btn${activeTab === key ? " active" : ""}`} onClick={() => switchTab(key)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* ── Overview / unified table ── */}
          {activeTab === "overview" && (
            <div className="trs-table-card">
              <div className="trs-table-wrap">
                <table className="trs-table">
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "9%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>{t.treasury.cols.reference}</th>
                      <th>{t.common.type}</th>
                      <th>{t.treasury.cols.party}</th>
                      <th>{t.treasury.cols.status}</th>
                      <th>{t.treasury.cols.date}</th>
                      <th>{t.treasury.cols.amount}</th>
                      <th>{t.treasury.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="trs-item-cell">
                            <div className="trs-avatar" style={{ background: row.avatarBg, color: row.avatarColor }}>
                              {row.avatarLabel}
                            </div>
                            <div>
                              <strong>{row.reference}</strong>
                              <span className="trs-sub-label">{row.subLabel}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="info" className="trs-type-badge" style={{ background: row.typeBg, color: row.typeColor }}>
                            {row.typeLabel}
                          </Badge>
                        </td>
                        <td className="trs-party-cell">{row.party}</td>
                        <td>
                          <Badge variant={statusTone(row.status) as "success" | "warning" | "danger" | "neutral"} className={`trs-status-badge trs-status--${statusTone(row.status)}`}>
                            {row.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="trs-date-cell">
                            <span>{formatDate(row.date)}</span>
                            <span className="trs-date-sub">{relTime(row.date)}</span>
                          </div>
                        </td>
                        <td>
                          {row.amount !== null
                            ? <strong className="trs-amount">{money(row.amount, row.currency)}</strong>
                            : <span className="trs-muted">—</span>}
                        </td>
                        <td>
                          <div className="trs-row-actions">
                            <Button type="button" variant="icon" className="trs-icon-btn" onClick={row.onView} title="View details">
                              <Eye size={15} />
                            </Button>
                            <Button type="button" variant="icon" className="trs-icon-btn" title="More options">
                              <MoreVertical size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pagedRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="trs-empty-row">No instruments match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="trs-pagination">
                <span className="trs-pg-meta">
                  Showing {unifiedRows.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, unifiedRows.length)} of {unifiedRows.length} items
                </span>
                <div className="trs-pg-controls">
                  <Button type="button" variant="ghost" className="trs-pg-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                    <ChevronLeft size={14} />
                  </Button>
                  {renderPages(page, totalPages, setPage)}
                  <Button type="button" variant="ghost" className="trs-pg-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
                <Select
                  className="trs-rpp-select"
                  value={String(rowsPerPage)}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                  options={[5, 10, 20].map((n) => ({ value: String(n), label: `${n} / page` }))}
                />
              </div>
            </div>
          )}

          {/* ── Incoming Cheques ── */}
          {activeTab === "incoming" && (
            <div className="trs-table-card">
              <div className="trs-table-inner-head">
                <strong>{t.treasury.tabs.incoming}</strong>
                <span className="trs-table-sub">{t.treasury.pageSubtitle}</span>
              </div>
              <div className="trs-table-wrap">
                <table className="trs-table">
                  <thead>
                    <tr>
                      <th>{t.treasury.cols.reference}</th><th>{t.common.customer}</th><th>{t.treasury.cols.dueDate}</th>
                      <th>{t.treasury.cols.amount}</th><th>{t.treasury.cols.status}</th><th>OCR</th><th>{t.treasury.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncoming.map((record) => {
                      const customer   = customers.find((c) => c.id === record.customerId);
                      const extraction = ocrExtractions.find((e) => e.id === record.ocrExtractionId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="trs-item-cell">
                              <div className="trs-avatar" style={{ background: "#dbeafe", color: "#1d4ed8" }}>CHQ</div>
                              <div><strong>{record.chequeNumber}</strong><span className="trs-sub-label">{record.bankName}</span></div>
                            </div>
                          </td>
                          <td><div><strong>{customer?.name ?? record.accountHolder}</strong><span className="trs-sub-label">{record.invoiceId ? `Invoice ${record.invoiceId}` : "Unapplied"}</span></div></td>
                          <td><div><strong>{formatDate(record.dueDate)}</strong><span className={`trs-sub-label${new Date(record.dueDate) < new Date(TODAY) ? " trs-danger-text" : ""}`}>{urgencyLabel(record.dueDate)}</span></div></td>
                          <td><strong className="trs-amount">{money(record.amount, record.currency)}</strong></td>
                          <td><Badge variant={statusTone(record.status) as "success" | "warning" | "danger" | "neutral"} className={`trs-status-badge trs-status--${statusTone(record.status)}`}>{record.status}</Badge></td>
                          <td>
                            {extraction
                              ? <Button type="button" variant="secondary" className="trs-mini-btn" onClick={() => openOCR("incoming", record)}>{Math.round(extraction.averageConfidence * 100)}% · Review</Button>
                              : <span className="trs-muted">No OCR</span>}
                          </td>
                          <td>
                            <div className="trs-row-actions">
                              <Button type="button" variant="icon" className="trs-icon-btn" onClick={() => setDetailRecord({ type: "incoming", record })}><Eye size={15} /></Button>
                              <Button type="button" variant="primary" className="trs-mini-btn trs-mini-btn--primary" disabled={!access.approve} onClick={() => handleApproveCheque(record, "incoming")}>"Approve"</Button>
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
              <div className="trs-table-inner-head">
                <strong>{t.treasury.tabs.outgoing}</strong>
                <span className="trs-table-sub">{t.treasury.pageSubtitle}</span>
              </div>
              <div className="trs-table-wrap">
                <table className="trs-table">
                  <thead>
                    <tr>
                      <th>{t.treasury.cols.reference}</th><th>{t.common.supplier}</th><th>{t.treasury.cols.dueDate}</th>
                      <th>{t.treasury.cols.amount}</th><th>{t.treasury.cols.status}</th><th>{t.common.notes}</th><th>{t.treasury.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutgoing.map((record) => {
                      const supplier = suppliers.find((s) => s.id === record.supplierId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="trs-item-cell">
                              <div className="trs-avatar" style={{ background: "#ffedd5", color: "#ea580c" }}>CHQ</div>
                              <div><strong>{record.chequeNumber}</strong><span className="trs-sub-label">{record.bankName}</span></div>
                            </div>
                          </td>
                          <td><div><strong>{supplier?.name ?? record.accountHolder}</strong><span className="trs-sub-label">{record.linkedPurchaseId ? `Purchase ${record.linkedPurchaseId}` : "No payable link"}</span></div></td>
                          <td><div><strong>{formatDate(record.dueDate)}</strong><span className="trs-sub-label">{urgencyLabel(record.dueDate)}</span></div></td>
                          <td><strong className="trs-amount">{money(record.amount, record.currency)}</strong></td>
                          <td><Badge variant={statusTone(record.status) as "success" | "warning" | "danger" | "neutral"} className={`trs-status-badge trs-status--${statusTone(record.status)}`}>{record.status}</Badge></td>
                          <td><span className="trs-muted">{record.journalLink?.postingState ?? "Not mapped"}</span></td>
                          <td>
                            <div className="trs-row-actions">
                              <Button type="button" variant="icon" className="trs-icon-btn" onClick={() => setDetailRecord({ type: "outgoing", record })}><Eye size={15} /></Button>
                              <Button type="button" variant="primary" className="trs-mini-btn trs-mini-btn--primary" disabled={!access.approve} onClick={() => handleApproveCheque(record, "outgoing")}>"Approve"</Button>
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
              <div className="trs-table-inner-head">
                <strong>{t.treasury.tabs.transfers}</strong>
                <span className="trs-table-sub">{t.treasury.pageSubtitle}</span>
              </div>
              <div className="trs-table-wrap">
                <table className="trs-table">
                  <thead>
                    <tr>
                      <th>{t.treasury.form.transfer.reference}</th><th>{t.treasury.form.transfer.from}</th><th>{t.treasury.cols.date}</th>
                      <th>{t.treasury.cols.amount}</th><th>{t.treasury.cols.status}</th><th>OCR</th><th>{t.treasury.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map((record) => {
                      const extraction = ocrExtractions.find((e) => e.id === record.ocrExtractionId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="trs-item-cell">
                              <div className="trs-avatar" style={{ background: "#dcfce7", color: "#16a34a" }}>TRF</div>
                              <div><strong>{record.transferReference}</strong><span className="trs-sub-label">{record.direction === "incoming" ? "Incoming transfer" : "Outgoing transfer"}</span></div>
                            </div>
                          </td>
                          <td><div><strong>{record.senderOrReceiver}</strong><span className="trs-sub-label">{record.sourceBank} → {record.destinationBank}</span></div></td>
                          <td><div><strong>{formatDate(record.transferDate)}</strong><span className="trs-sub-label">{record.settlementDate ? `Settles ${formatDate(record.settlementDate)}` : "Settlement pending"}</span></div></td>
                          <td><strong className="trs-amount">{money(record.amount, record.currency)}</strong></td>
                          <td><Badge variant={statusTone(record.status) as "success" | "warning" | "danger" | "neutral"} className={`trs-status-badge trs-status--${statusTone(record.status)}`}>{record.status}</Badge></td>
                          <td>
                            {extraction
                              ? <Button type="button" variant="secondary" className="trs-mini-btn" onClick={() => openOCR("transfer", record)}>{Math.round(extraction.averageConfidence * 100)}% · OCR</Button>
                              : <span className="trs-muted">{record.attachmentIds.length} file(s)</span>}
                          </td>
                          <td>
                            <div className="trs-row-actions">
                              <Button type="button" variant="icon" className="trs-icon-btn" onClick={() => setDetailRecord({ type: "transfer", record })}><Eye size={15} /></Button>
                              <Button type="button" variant="primary" className="trs-mini-btn trs-mini-btn--primary" disabled={!access.verifyTransfer} onClick={() => handleVerifyTransfer(record)}>{t.treasury.reconciliation.match}</Button>
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
              <div className="trs-table-inner-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <strong>{t.treasury.reconciliation.title}</strong>
                  <span className="trs-table-sub">{t.treasury.reconciliation.subtitle}</span>
                </div>
                <Button type="button" variant="primary" className="trs-mini-btn trs-mini-btn--primary" disabled={!access.reconcile} leftIcon={<RefreshCcw size={14} />}>
                  {t.treasury.reconciliation.match}
                </Button>
              </div>
              <div className="trs-table-wrap">
                <table className="trs-table">
                  <thead>
                    <tr>
                      <th>{t.treasury.cols.reference}</th><th>{t.treasury.cols.date}</th><th>{t.treasury.cols.amount}</th>
                      <th>{t.treasury.cols.status}</th><th>{t.treasury.reconciliation.match}</th><th>{t.common.notes}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliationItems.map((item) => (
                      <tr key={item.id}>
                        <td><div><strong>{item.sourceId}</strong><span className="trs-sub-label">{item.sourceType}</span></div></td>
                        <td>{formatDate(item.date)}</td>
                        <td><strong className="trs-amount">{money(item.amount, item.currency)}</strong></td>
                        <td><Badge variant={statusTone(item.matchStatus) as "success" | "warning" | "danger" | "neutral"} className={`trs-status-badge trs-status--${statusTone(item.matchStatus)}`}>{item.matchStatus}</Badge></td>
                        <td>
                          <OverflowContent title={item.sourceId} subtitle="Suggested match" preview={item.suggestedTarget ? `${item.suggestedBy}: ${item.suggestedTarget}` : "No match yet"} content={item.suggestedTarget ? `${item.suggestedBy}: ${item.suggestedTarget}` : "No suggested match yet."} />
                        </td>
                        <td>
                          <OverflowContent title={item.sourceId} subtitle="Reconciliation note" preview={item.notes || "No notes"} content={item.notes || "No notes recorded."} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────── */}
        <aside className="trs-sidebar-col">

          {/* Role card */}
          <div className="trs-sidebar-card trs-role-card">
            <span className="trs-role-eyebrow">{t.treasury.sidebar.activeRole}</span>
            <div className="trs-role-icon-wrap"><ShieldCheck size={22} /></div>
            <strong className="trs-role-name">{rolePreset}</strong>
            <p className="trs-role-desc">
              {access.approve
                ? "Can approve instruments and verification workflows."
                : "View-only access for sensitive treasury actions."}
            </p>
            <Button type="button" variant="primary" className="trs-capture-btn" leftIcon={<Upload size={15} />}>
              Capture Instrument
            </Button>
          </div>

          {/* Instrument Controls */}
          <div className="trs-sidebar-card">
            <div className="trs-sidebar-head">
              <span className="trs-sidebar-title">{t.treasury.sidebar.instrumentControls}</span>
              <ShieldCheck size={15} className="trs-sidebar-icon" />
            </div>
            <p className="trs-sidebar-sub">{t.treasury.sidebar.sensitiveNote}</p>
            <div className="trs-controls-list">
              {([
                ["Approve cheques",        access.approve],
                ["Verify transfers",       access.verifyTransfer],
                ["Correct OCR",            access.correctOCR],
                ["Reconciliation actions", access.reconcile],
              ] as [string, boolean][]).map(([label, allowed]) => (
                <div key={label} className="trs-control-row">
                  <Lock size={12} className="trs-control-lock" />
                  <span className="trs-control-label">{label}</span>
                  <Badge variant={allowed ? "success" : "danger"} className={`trs-access-badge${allowed ? " trs-access--allowed" : " trs-access--restricted"}`}>
                    {allowed ? "Allowed" : "Restricted"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Signals */}
          <div className="trs-sidebar-card">
            <div className="trs-sidebar-head">
              <span className="trs-sidebar-title">{t.treasury.sidebar.operationalSignals}</span>
              <BrainCircuit size={15} className="trs-sidebar-icon" />
            </div>
            <p className="trs-sidebar-sub">{t.treasury.sidebar.highPriorityItems}</p>
            <div className="trs-signals-list">
              <Button type="button" variant="ghost" className="trs-signal-row" onClick={() => switchTab("incoming")}>
                <span className="trs-signal-count trs-signal--red">{combinedSignals.bounced}</span>
                <span className="trs-signal-label">bounced cheques</span>
                <ChevronRight size={14} className="trs-signal-chevron" />
              </Button>
              <Button type="button" variant="ghost" className="trs-signal-row" onClick={() => switchTab("transfers")}>
                <span className="trs-signal-count trs-signal--amber">{combinedSignals.pendingVerification}</span>
                <span className="trs-signal-label">transfers pending verification</span>
                <ChevronRight size={14} className="trs-signal-chevron" />
              </Button>
              <Button type="button" variant="ghost" className="trs-signal-row" onClick={() => switchTab("incoming")}>
                <span className="trs-signal-count trs-signal--blue">{combinedSignals.dueSoon}</span>
                <span className="trs-signal-label">instruments due within 3 days</span>
                <ChevronRight size={14} className="trs-signal-chevron" />
              </Button>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="trs-sidebar-card">
            <div className="trs-sidebar-head">
              <span className="trs-sidebar-title">Bank Accounts</span>
              <CreditCard size={15} className="trs-sidebar-icon" />
            </div>
            <div className="trs-accounts-list">
              {bankAccounts.slice(0, 2).map((account) => (
                <div key={account.id} className="trs-account-row">
                  <div>
                    <strong className="trs-account-name">{account.name}</strong>
                    <span className="trs-account-bank">
                      {account.bankName} •••• {account.accountNumberMasked.replace(/\D/g, "").slice(-4)}
                    </span>
                  </div>
                  <strong className="trs-account-balance">
                    {money(account.currentBalance, account.currency)}
                  </strong>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" className="trs-view-all-btn" rightIcon={<ChevronRight size={13} />}>
              View all accounts
            </Button>
          </div>
        </aside>
      </div>

      {/* ── Detail Drawer ─────────────────────────────────── */}
      {detailRecord
        ? createPortal(
            <div className="treasury-overlay" onClick={() => setDetailRecord(null)}>
              <aside className="treasury-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="treasury-drawer-head">
                  <div>
                    <span>{detailRecord.type === "transfer" ? t.treasury.drawer.transferDetails : t.treasury.drawer.chequeDetails}</span>
                    <h2>{"transferReference" in detailRecord.record ? detailRecord.record.transferReference : detailRecord.record.chequeNumber}</h2>
                    <p>{t.treasury.drawer.drawerSubtitle}</p>
                  </div>
                  <button type="button" className="icon-dismiss-btn" onClick={() => setDetailRecord(null)}><X size={18} /></button>
                </div>
                <div className="treasury-drawer-body">
                  <section className="workspace-surface treasury-drawer-card">
                    <h3>{t.treasury.drawer.coreData}</h3>
                    <div className="treasury-detail-grid">
                      <div><span>{t.treasury.drawer.labelStatus}</span><strong>{detailRecord.record.status}</strong></div>
                      <div><span>{t.treasury.drawer.labelAmount}</span><strong>{money(detailRecord.record.amount, detailRecord.record.currency)}</strong></div>
                      <div><span>{t.treasury.drawer.labelIssuedDate}</span><strong>{formatDate("transferDate" in detailRecord.record ? detailRecord.record.transferDate : detailRecord.record.issueDate)}</strong></div>
                      <div><span>{t.treasury.drawer.labelDueDate}</span><strong>{formatDate("transferReference" in detailRecord.record ? detailRecord.record.settlementDate : detailRecord.record.dueDate)}</strong></div>
                      <div><span>{t.treasury.drawer.labelApprovedBy}</span><strong>{detailRecord.record.approvedBy || t.treasury.drawer.pendingApproval}</strong></div>
                      <div><span>{t.treasury.drawer.labelReconciled}</span><strong>{detailRecord.record.reconciled ? t.treasury.drawer.yes : t.treasury.drawer.no}</strong></div>
                    </div>
                  </section>
                  <section className="workspace-surface treasury-drawer-card">
                    <h3>{t.treasury.drawer.linkedRecords}</h3>
                    {renderLinkage(detailRecord.record)}
                  </section>
                  <section className="workspace-surface treasury-drawer-card">
                    <h3>{t.treasury.drawer.ocrContext}</h3>
                    <div className="treasury-detail-grid">
                      <div><span>{t.treasury.drawer.labelAttachments}</span><strong>{detailRecord.record.attachmentIds.length}</strong></div>
                      <div><span>{t.treasury.drawer.labelOcrExtraction}</span><strong>{detailRecord.record.ocrExtractionId ?? t.treasury.drawer.notCaptured}</strong></div>
                      <div><span>{t.treasury.drawer.labelCreatedBy}</span><strong>{detailRecord.record.createdBy}</strong></div>
                      <div><span>{t.treasury.drawer.labelLastUpdated}</span><strong>{formatDate(detailRecord.record.updatedAt)}</strong></div>
                    </div>
                  </section>
                </div>
              </aside>
            </div>,
            document.body
          )
        : null}

      {/* ── OCR Modal ─────────────────────────────────────── */}
      {ocrTarget
        ? <OCRReviewModal target={ocrTarget} onClose={() => setOcrTarget(null)} onSave={handleSaveOcrCorrections} />
        : null}

      {toast ? <div className="treasury-toast">{toast}</div> : null}
    </div>
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
  const { t } = useSettings();
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
        <div><span>Provider</span><strong>{target.extraction.provider}</strong></div>
        <div><span>Average confidence</span><strong>{Math.round(target.extraction.averageConfidence * 100)}%</strong></div>
        <div><span>Status</span><strong>{target.extraction.status}</strong></div>
      </div>
      <div className="ocr-field-list">
        {fields.map((field) => (
          <div key={field.field} className="ocr-field-row">
            <div className="ocr-field-meta">
              <strong>{field.field}</strong>
              <span>{confidenceLabel(field.confidence)} · {Math.round(field.confidence * 100)}%</span>
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
