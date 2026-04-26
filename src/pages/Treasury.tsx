import "./Treasury.css";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BrainCircuit,
  FileScan,
  Landmark,
  RefreshCcw,
  Search,
  ShieldCheck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import OverflowContent from "../components/ui/OverflowContent";
import { useAuth } from "../context/AuthContext";
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
  Admin: { approve: true, verifyTransfer: true, correctOCR: true, reconcile: true },
  Finance: { approve: true, verifyTransfer: true, correctOCR: true, reconcile: true },
  Sales: { approve: false, verifyTransfer: false, correctOCR: false, reconcile: false },
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
  if (["Cleared", "Verified", "Approved", "Fully Applied", "Collected"].includes(status)) {
    return "success";
  }
  if (["Pending Verification", "Deposited", "Under Collection", "Partially Applied", "Issued", "Delivered", "Held"].includes(status)) {
    return "warning";
  }
  if (["Bounced", "Rejected", "Cancelled", "Returned", "Voided"].includes(status)) {
    return "danger";
  }
  return "neutral";
}

function averageConfidence(fields: OCRFieldReview[]) {
  if (fields.length === 0) return 0;
  return fields.reduce((sum, item) => sum + item.confidence, 0) / fields.length;
}

export default function Treasury() {
  const { user } = useAuth();
  const customers = useMemo(() => getCustomers(), []);
  const suppliers = useMemo(() => getSuppliers(), []);
  const invoices = useMemo(() => getInvoices(), []);
  const payments = useMemo(() => getPayments(), []);
  const bankAccounts = useMemo(() => getBankAccounts(), []);

  const [incomingCheques, setIncomingCheques] = useState(() => getIncomingCheques());
  const [outgoingCheques, setOutgoingCheques] = useState(() => getOutgoingCheques());
  const [bankTransfers, setBankTransfers] = useState(() => getBankTransfers());
  const [ocrExtractions, setOcrExtractions] = useState(() => getOCRExtractions());
  const [auditEvents, setAuditEvents] = useState(() => getAuditEvents());
  const [reconciliationItems] = useState<ReconciliationItem[]>(() => getReconciliationItems());
  const [activeTab, setActiveTab] = useState<TreasuryTab>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [detailRecord, setDetailRecord] = useState<DetailRecord | null>(null);
  const [ocrTarget, setOcrTarget] = useState<OCRTarget | null>(null);
  const [toast, setToast] = useState<string>("");

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
      const matchesQuery = [item.chequeNumber, item.accountHolder, item.bankName, item.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [incomingCheques, searchTerm, statusFilter]);

  const filteredOutgoing = useMemo(() => {
    return outgoingCheques.filter((item) => {
      const matchesQuery = [item.chequeNumber, item.accountHolder, item.bankName, item.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [outgoingCheques, searchTerm, statusFilter]);

  const filteredTransfers = useMemo(() => {
    return bankTransfers.filter((item) => {
      const matchesQuery = [
        item.transferReference,
        item.senderOrReceiver,
        item.sourceBank,
        item.destinationBank,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [bankTransfers, searchTerm, statusFilter]);

  const ocrQueue = useMemo(() => {
    return ocrExtractions
      .filter((item) => item.status !== "Reviewed")
      .sort((a, b) => a.averageConfidence - b.averageConfidence);
  }, [ocrExtractions]);

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
    if (!access.approve) {
      showToast("Your role cannot approve cheque actions.");
      return;
    }

    const eventTimestamp = new Date().toISOString();
    const nextStatus: ChequeInstrument["status"] =
      direction === "incoming"
        ? record.status === "Deposited"
          ? "Under Collection"
          : "Approved"
        : "Approved";

    if (direction === "incoming") {
      const next = incomingCheques.map((item) =>
        item.id === record.id
          ? { ...item, status: nextStatus, approvedBy: user?.username ?? rolePreset, updatedAt: eventTimestamp }
          : item
      );
      setIncomingCheques(next);
      saveIncomingCheques(next);
    } else {
      const next = outgoingCheques.map((item) =>
        item.id === record.id
          ? { ...item, status: nextStatus, approvedBy: user?.username ?? rolePreset, updatedAt: eventTimestamp }
          : item
      );
      setOutgoingCheques(next);
      saveOutgoingCheques(next);
    }

    postAudit({
      id: `AUD-${record.id}-${eventTimestamp}`,
      entityType: direction === "incoming" ? "incoming-cheque" : "outgoing-cheque",
      entityId: record.id,
      action: "Approval recorded",
      actor: user?.username ?? "system",
      actorRole: rolePreset,
      timestamp: eventTimestamp,
      details: `Status moved to ${nextStatus}.`,
    });
    showToast("Cheque approval recorded.");
  };

  const handleVerifyTransfer = (record: BankTransfer) => {
    if (!access.verifyTransfer) {
      showToast("Your role cannot verify bank transfers.");
      return;
    }

    const eventTimestamp = new Date().toISOString();
    const next = bankTransfers.map((item) =>
      item.id === record.id
        ? {
            ...item,
            status: "Verified" as BankTransfer["status"],
            approvedBy: user?.username ?? rolePreset,
            updatedAt: eventTimestamp,
          }
        : item
    );
    setBankTransfers(next);
    saveBankTransfers(next);

    postAudit({
      id: `AUD-${record.id}-${eventTimestamp}`,
      entityType: "bank-transfer",
      entityId: record.id,
      action: "Transfer verified",
      actor: user?.username ?? "system",
      actorRole: rolePreset,
      timestamp: eventTimestamp,
      details: `Transfer ${record.transferReference} verified and ready for settlement posting.`,
    });
    showToast("Bank transfer verified.");
  };

  const handleSaveOcrCorrections = (updatedFields: OCRFieldReview[]) => {
    if (!ocrTarget) return;
    if (!access.correctOCR) {
      showToast("Your role cannot correct OCR data.");
      return;
    }

    const eventTimestamp = new Date().toISOString();
    const nextExtraction = {
      ...ocrTarget.extraction,
      status: "Corrected" as const,
      fields: updatedFields,
      averageConfidence: averageConfidence(updatedFields),
    };

    const next = ocrExtractions.map((item) =>
      item.id === nextExtraction.id ? nextExtraction : item
    );
    setOcrExtractions(next);
    saveOCRExtractions(next);

    postAudit({
      id: `AUD-${nextExtraction.id}-${eventTimestamp}`,
      entityType: "ocr-extraction",
      entityId: nextExtraction.id,
      action: "OCR corrected",
      actor: user?.username ?? "system",
      actorRole: rolePreset,
      timestamp: eventTimestamp,
      details: `Manual corrections saved for ${ocrTarget.type} ${ocrTarget.record.id}.`,
    });

    setOcrTarget(null);
    showToast("OCR corrections saved and audited.");
  };

  const openOCR = (type: OCRTarget["type"], record: ChequeInstrument | BankTransfer) => {
    const extractionId = record.ocrExtractionId;
    if (!extractionId) return;
    const extraction = ocrExtractions.find((item) => item.id === extractionId);
    if (!extraction) return;
    setOcrTarget({ type, record: record as never, extraction } as OCRTarget);
  };

  const activeStatuses = useMemo(() => {
    const values = new Set<string>(["All"]);
    [...incomingCheques, ...outgoingCheques, ...bankTransfers].forEach((item) =>
      values.add(item.status)
    );
    return Array.from(values);
  }, [bankTransfers, incomingCheques, outgoingCheques]);

  const renderLinkage = (record: DetailRecord["record"]) => {
  const customer = "customerId" in record && record.customerId
      ? customers.find((item) => item.id === record.customerId)
      : undefined;
    const supplier = "supplierId" in record && record.supplierId
      ? suppliers.find((item) => item.id === record.supplierId)
      : undefined;
    const invoice = "invoiceId" in record && record.invoiceId
      ? invoices.find((item) => item.id === record.invoiceId)
      : undefined;
    const payment = "paymentId" in record && record.paymentId
      ? payments.find((item) => item.id === record.paymentId)
      : undefined;

    const journalEntry = "transferReference" in record ? record.linkedJournal : record.journalLink;

    return (
      <div className="treasury-detail-links">
        <div><span>Customer</span><strong>{customer?.name ?? "Not linked"}</strong></div>
        <div><span>Supplier</span><strong>{supplier?.name ?? "Not linked"}</strong></div>
        <div><span>Invoice</span><strong>{invoice?.id ?? "Not linked"}</strong></div>
        <div><span>Payment</span><strong>{payment?.paymentId ?? payment?.id ?? "Not linked"}</strong></div>
        <div>
          <span>Journal</span>
          <strong>{journalEntry?.journalEntryId ?? "Ready to map"}</strong>
        </div>
        <div>
          <span>Posting</span>
          <strong>{journalEntry?.postingState ?? "Not mapped"}</strong>
        </div>
      </div>
    );
  };

  return (
    <div className="treasury-page">
      <section className="treasury-hero workspace-surface">
        <div className="treasury-hero-copy">
          <span className="eyebrow-label">
            <Landmark size={14} />
            Treasury Operations
          </span>
          <h1 className="page-title">Treasury, Cheques, and Transfers</h1>
          <p className="page-subtitle">
            Manage incoming customer cheques, outgoing supplier cheques, transfer verification,
            OCR review, document custody, approval control, and reconciliation readiness from one treasury workspace.
          </p>
        </div>

        <div className="treasury-hero-actions">
          <div className="treasury-role-card summary-surface">
            <span>Active treasury role</span>
            <strong>{rolePreset}</strong>
            <small>
              {access.approve
                ? "Can approve instruments and verification workflows."
                : "View-only access for sensitive treasury actions."}
            </small>
          </div>
          <button type="button" className="treasury-primary-btn">
            <Upload size={16} />
            Capture Instrument
          </button>
        </div>
      </section>

      <section className="dense-kpi-grid">
        <article className="dense-kpi-card">
          <Landmark size={20} />
          <div>
            <span>Bank balances</span>
            <strong>{money(bankAccounts.reduce((sum, item) => sum + item.currentBalance, 0))}</strong>
            <small>Across {bankAccounts.length} active treasury accounts</small>
          </div>
        </article>
        <article className="dense-kpi-card">
          <Banknote size={20} />
          <div>
            <span>Incoming cheques due soon</span>
            <strong>{combinedSignals.dueSoon}</strong>
            <small>Post-dated or maturing within 3 days</small>
          </div>
        </article>
        <article className="dense-kpi-card">
          <AlertTriangle size={20} />
          <div>
            <span>Bounced instruments</span>
            <strong>{combinedSignals.bounced}</strong>
            <small>Need follow-up, reversal, or customer/supplier action</small>
          </div>
        </article>
        <article className="dense-kpi-card">
          <FileScan size={20} />
          <div>
            <span>OCR queue</span>
            <strong>{ocrQueue.length}</strong>
            <small>{combinedSignals.lowConfidence} items need manual validation</small>
          </div>
        </article>
      </section>

      <section className="treasury-main-grid">
        <div className="treasury-main-column">
          <section className="treasury-toolbar toolbar-surface">
            <div className="data-toolbar-row">
              <div className="data-toolbar-group treasury-search-shell">
                <Search size={16} />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by cheque number, transfer reference, account holder, bank, or note"
                />
              </div>

              <div className="data-toolbar-group">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {activeStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="treasury-tab-row">
              {[
                ["overview", "Overview"],
                ["incoming", "Incoming Cheques"],
                ["outgoing", "Outgoing Cheques"],
                ["transfers", "Bank Transfers"],
                ["reconciliation", "Reconciliation"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`treasury-tab-btn ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key as TreasuryTab)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === "overview" ? (
            <section className="treasury-overview-grid">
              <article className="workspace-surface treasury-signal-card">
                <div className="treasury-card-head">
                  <div>
                    <h2 className="section-title">Operational Signals</h2>
                    <p className="section-subtitle">High-priority treasury items requiring attention</p>
                  </div>
                  <BrainCircuit size={18} />
                </div>

                <div className="treasury-signal-list">
                  <div className="signal-row critical">
                    <strong>{combinedSignals.bounced} bounced cheques</strong>
                    <span>Reverse payment allocations, notify customers/suppliers, and review journal impact.</span>
                  </div>
                  <div className="signal-row warning">
                    <strong>{combinedSignals.pendingVerification} transfers pending verification</strong>
                    <span>Verify proof, approve settlement, and prepare reconciliation linkage.</span>
                  </div>
                  <div className="signal-row info">
                    <strong>{combinedSignals.dueSoon} instruments due within 3 days</strong>
                    <span>Prepare deposit batches, follow up on post-dated cheques, and monitor cash flow timing.</span>
                  </div>
                </div>
              </article>

              <article className="workspace-surface treasury-bank-card">
                <div className="treasury-card-head">
                  <div>
                    <h2 className="section-title">Bank Accounts</h2>
                    <p className="section-subtitle">Current, available, and pending instrument exposure</p>
                  </div>
                  <Wallet size={18} />
                </div>

                <div className="treasury-bank-stack">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="treasury-bank-row">
                      <div>
                        <strong>{account.name}</strong>
                        <span>
                          {account.bankName} · {account.accountNumberMasked}
                        </span>
                      </div>
                      <div className="bank-row-values">
                        <strong>{money(account.currentBalance, account.currency)}</strong>
                        <span>Available {money(account.availableBalance, account.currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="workspace-surface treasury-signal-card">
                <div className="treasury-card-head">
                  <div>
                    <h2 className="section-title">OCR Review Queue</h2>
                    <p className="section-subtitle">Confidence scoring with manual review before final treasury action</p>
                  </div>
                  <FileScan size={18} />
                </div>

                <div className="treasury-ocr-queue">
                  {ocrQueue.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ocr-queue-row"
                      onClick={() => {
                        const transfer = bankTransfers.find((record) => record.ocrExtractionId === item.id);
                        if (transfer) {
                          setOcrTarget({ type: "transfer", record: transfer, extraction: item });
                          return;
                        }

                        const incoming = incomingCheques.find((record) => record.ocrExtractionId === item.id);
                        if (incoming) {
                          setOcrTarget({ type: "incoming", record: incoming, extraction: item });
                        }
                      }}
                    >
                      <div>
                        <strong>{item.sourceId}</strong>
                        <span>{confidenceLabel(item.averageConfidence)} · {item.status}</span>
                      </div>
                      <span className={`status-chip ${item.averageConfidence >= 0.85 ? "success" : item.averageConfidence >= 0.75 ? "warning" : "danger"}`}>
                        {Math.round(item.averageConfidence * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "incoming" ? (
            <section className="workspace-surface treasury-table-card">
              <div className="treasury-card-head">
                <div>
                  <h2 className="section-title">Incoming Customer Cheques</h2>
                  <p className="section-subtitle">Received, deposited, under collection, cleared, bounced, and post-dated instruments</p>
                </div>
              </div>
              <div className="treasury-table-wrap">
                <table className="treasury-table app-data-table">
                  <thead>
                    <tr>
                      <th>Cheque</th>
                      <th>Customer</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>OCR</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncoming.map((record) => {
                      const customer = customers.find((item) => item.id === record.customerId);
                      const extraction = ocrExtractions.find((item) => item.id === record.ocrExtractionId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="primary-cell">
                              <strong>{record.chequeNumber}</strong>
                              <span>{record.bankName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{customer?.name ?? record.accountHolder}</strong>
                              <span>{record.invoiceId ? `Invoice ${record.invoiceId}` : "Unapplied"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{formatDate(record.dueDate)}</strong>
                              <span className={new Date(record.dueDate) < new Date(TODAY) ? "danger-text" : ""}>
                                {urgencyLabel(record.dueDate)}
                              </span>
                            </div>
                          </td>
                          <td><strong className="financial-value">{money(record.amount, record.currency)}</strong></td>
                          <td><span className={`status-chip ${statusTone(record.status)}`}>{record.status}</span></td>
                          <td>
                            {extraction ? (
                              <button type="button" className="mini-action-btn" onClick={() => openOCR("incoming", record)}>
                                {Math.round(extraction.averageConfidence * 100)}% · Review
                              </button>
                            ) : (
                              <span className="muted-note">No OCR</span>
                            )}
                          </td>
                          <td>
                            <div className="treasury-row-actions">
                              <button type="button" className="mini-action-btn" onClick={() => setDetailRecord({ type: "incoming", record })}>
                                Open
                              </button>
                              <button
                                type="button"
                                className="mini-action-btn primary"
                                disabled={!access.approve}
                                onClick={() => handleApproveCheque(record, "incoming")}
                              >
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeTab === "outgoing" ? (
            <section className="workspace-surface treasury-table-card">
              <div className="treasury-card-head">
                <div>
                  <h2 className="section-title">Outgoing Supplier Cheques</h2>
                  <p className="section-subtitle">Approved, issued, delivered, cleared, bounced, or voided supplier instruments</p>
                </div>
              </div>
              <div className="treasury-table-wrap">
                <table className="treasury-table app-data-table">
                  <thead>
                    <tr>
                      <th>Cheque</th>
                      <th>Supplier</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Journal</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutgoing.map((record) => {
                      const supplier = suppliers.find((item) => item.id === record.supplierId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="primary-cell">
                              <strong>{record.chequeNumber}</strong>
                              <span>{record.bankName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{supplier?.name ?? record.accountHolder}</strong>
                              <span>{record.linkedPurchaseId ? `Purchase ${record.linkedPurchaseId}` : "No payable link"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{formatDate(record.dueDate)}</strong>
                              <span>{urgencyLabel(record.dueDate)}</span>
                            </div>
                          </td>
                          <td><strong className="financial-value">{money(record.amount, record.currency)}</strong></td>
                          <td><span className={`status-chip ${statusTone(record.status)}`}>{record.status}</span></td>
                          <td><span className="muted-note">{record.journalLink?.postingState ?? "Not mapped"}</span></td>
                          <td>
                            <div className="treasury-row-actions">
                              <button type="button" className="mini-action-btn" onClick={() => setDetailRecord({ type: "outgoing", record })}>
                                Open
                              </button>
                              <button
                                type="button"
                                className="mini-action-btn primary"
                                disabled={!access.approve}
                                onClick={() => handleApproveCheque(record, "outgoing")}
                              >
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeTab === "transfers" ? (
            <section className="workspace-surface treasury-table-card">
              <div className="treasury-card-head">
                <div>
                  <h2 className="section-title">Bank Transfers</h2>
                  <p className="section-subtitle">Incoming and outgoing transfers with proof review, OCR, and settlement verification</p>
                </div>
              </div>
              <div className="treasury-table-wrap">
                <table className="treasury-table app-data-table">
                  <thead>
                    <tr>
                      <th>Transfer</th>
                      <th>Counterparty</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Proof / OCR</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map((record) => {
                      const extraction = ocrExtractions.find((item) => item.id === record.ocrExtractionId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="primary-cell">
                              <strong>{record.transferReference}</strong>
                              <span>{record.direction === "incoming" ? "Incoming transfer" : "Outgoing transfer"}</span>
                            </div>
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{record.senderOrReceiver}</strong>
                              <span>{record.sourceBank} → {record.destinationBank}</span>
                            </div>
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{formatDate(record.transferDate)}</strong>
                              <span>{record.settlementDate ? `Settles ${formatDate(record.settlementDate)}` : "Settlement pending"}</span>
                            </div>
                          </td>
                          <td><strong className="financial-value">{money(record.amount, record.currency)}</strong></td>
                          <td><span className={`status-chip ${statusTone(record.status)}`}>{record.status}</span></td>
                          <td>
                            {extraction ? (
                              <button type="button" className="mini-action-btn" onClick={() => openOCR("transfer", record)}>
                                {Math.round(extraction.averageConfidence * 100)}% · OCR
                              </button>
                            ) : (
                              <span className="muted-note">{record.attachmentIds.length} file(s)</span>
                            )}
                          </td>
                          <td>
                            <div className="treasury-row-actions">
                              <button type="button" className="mini-action-btn" onClick={() => setDetailRecord({ type: "transfer", record })}>
                                Open
                              </button>
                              <button
                                type="button"
                                className="mini-action-btn primary"
                                disabled={!access.verifyTransfer}
                                onClick={() => handleVerifyTransfer(record)}
                              >
                                Verify
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeTab === "reconciliation" ? (
            <section className="workspace-surface treasury-table-card">
              <div className="treasury-card-head">
                <div>
                  <h2 className="section-title">Reconciliation Readiness</h2>
                  <p className="section-subtitle">Suggested, unmatched, and partially matched treasury records waiting for bank statement linkage</p>
                </div>
                <button type="button" className="mini-action-btn primary" disabled={!access.reconcile}>
                  <RefreshCcw size={15} />
                  Run Suggestions
                </button>
              </div>

              <div className="treasury-table-wrap">
                <table className="treasury-table app-data-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Match Status</th>
                      <th>Suggested Match</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliationItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="primary-cell">
                            <strong>{item.sourceId}</strong>
                            <span>{item.sourceType}</span>
                          </div>
                        </td>
                        <td>{formatDate(item.date)}</td>
                        <td><strong className="financial-value">{money(item.amount, item.currency)}</strong></td>
                        <td><span className={`status-chip ${statusTone(item.matchStatus)}`}>{item.matchStatus}</span></td>
                        <td>
                          <OverflowContent
                            title={item.sourceId}
                            subtitle="Suggested match"
                            preview={item.suggestedTarget ? `${item.suggestedBy}: ${item.suggestedTarget}` : "No match yet"}
                            content={item.suggestedTarget ? `${item.suggestedBy}: ${item.suggestedTarget}` : "No suggested match yet."}
                          />
                        </td>
                        <td>
                          <OverflowContent
                            title={item.sourceId}
                            subtitle="Reconciliation note"
                            preview={item.notes || "No notes"}
                            content={item.notes || "No notes recorded."}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="treasury-side-column">
          <section className="workspace-surface treasury-side-card">
            <div className="treasury-card-head">
              <div>
                <h2 className="section-title">Instrument Controls</h2>
                <p className="section-subtitle">Sensitive treasury actions are role-gated and audited</p>
              </div>
              <ShieldCheck size={18} />
            </div>

            <div className="control-list">
              <div><span>Approve cheques</span><strong>{access.approve ? "Allowed" : "Restricted"}</strong></div>
              <div><span>Verify transfers</span><strong>{access.verifyTransfer ? "Allowed" : "Restricted"}</strong></div>
              <div><span>Correct OCR</span><strong>{access.correctOCR ? "Allowed" : "Restricted"}</strong></div>
              <div><span>Reconciliation actions</span><strong>{access.reconcile ? "Allowed" : "Restricted"}</strong></div>
            </div>
          </section>

          <section className="workspace-surface treasury-side-card">
            <div className="treasury-card-head">
              <div>
                <h2 className="section-title">Audit Trail</h2>
                <p className="section-subtitle">OCR corrections, approvals, deposits, and verification history</p>
              </div>
              <BadgeCheck size={18} />
            </div>
            <div className="audit-list">
              {auditEvents.slice(0, 5).map((event) => (
                <article key={event.id} className="audit-row">
                  <strong>{event.action}</strong>
                  <span>{event.details}</span>
                  <small>{event.actorRole} · {event.actor} · {formatDate(event.timestamp)}</small>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {detailRecord
        ? createPortal(
            <div className="treasury-overlay" onClick={() => setDetailRecord(null)}>
              <aside className="treasury-drawer" onClick={(event) => event.stopPropagation()}>
                <div className="treasury-drawer-head">
                  <div>
                    <span>{detailRecord.type === "transfer" ? "Transfer details" : "Cheque details"}</span>
                    <h2>
                      {"transferReference" in detailRecord.record
                        ? detailRecord.record.transferReference
                        : detailRecord.record.chequeNumber}
                    </h2>
                    <p>
                      Linked treasury data, OCR evidence, approvals, journal readiness, and reconciliation context.
                    </p>
                  </div>
                  <button type="button" className="icon-dismiss-btn" onClick={() => setDetailRecord(null)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="treasury-drawer-body">
                  <section className="workspace-surface treasury-drawer-card">
                    <h3>Core instrument data</h3>
                    <div className="treasury-detail-grid">
                      <div><span>Status</span><strong>{detailRecord.record.status}</strong></div>
                      <div><span>Amount</span><strong>{money(detailRecord.record.amount, detailRecord.record.currency)}</strong></div>
                      <div><span>Issue/Transfer Date</span><strong>{formatDate("transferDate" in detailRecord.record ? detailRecord.record.transferDate : detailRecord.record.issueDate)}</strong></div>
                      <div><span>Due / Settlement</span><strong>{formatDate("transferReference" in detailRecord.record ? detailRecord.record.settlementDate : detailRecord.record.dueDate)}</strong></div>
                      <div><span>Approved By</span><strong>{detailRecord.record.approvedBy || "Pending approval"}</strong></div>
                      <div><span>Reconciled</span><strong>{detailRecord.record.reconciled ? "Yes" : "No"}</strong></div>
                    </div>
                  </section>

                  <section className="workspace-surface treasury-drawer-card">
                    <h3>Linked business records</h3>
                    {renderLinkage(detailRecord.record)}
                  </section>

                  <section className="workspace-surface treasury-drawer-card">
                    <h3>Document and OCR context</h3>
                    <div className="treasury-detail-grid">
                      <div><span>Attachments</span><strong>{detailRecord.record.attachmentIds.length}</strong></div>
                      <div><span>OCR extraction</span><strong>{detailRecord.record.ocrExtractionId ?? "Not captured"}</strong></div>
                      <div><span>Created By</span><strong>{detailRecord.record.createdBy}</strong></div>
                      <div><span>Last Updated</span><strong>{formatDate(detailRecord.record.updatedAt)}</strong></div>
                    </div>
                  </section>
                </div>
              </aside>
            </div>,
            document.body
          )
        : null}

      {ocrTarget
        ? createPortal(
            <OCRReviewModal
              target={ocrTarget}
              onClose={() => setOcrTarget(null)}
              onSave={handleSaveOcrCorrections}
            />,
            document.body
          )
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
  const [fields, setFields] = useState(target.extraction.fields);

  return (
    <div className="treasury-overlay" onClick={onClose}>
      <div className="treasury-modal" onClick={(event) => event.stopPropagation()}>
        <div className="treasury-modal-head">
          <div>
            <span>OCR review</span>
            <h2>{target.extraction.sourceId}</h2>
            <p>
              Review extracted cheque or transfer fields, confirm confidence, and save manual corrections with audit history.
            </p>
          </div>
          <button type="button" className="icon-dismiss-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="ocr-summary-strip">
          <div>
            <span>Provider</span>
            <strong>{target.extraction.provider}</strong>
          </div>
          <div>
            <span>Average confidence</span>
            <strong>{Math.round(target.extraction.averageConfidence * 100)}%</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{target.extraction.status}</strong>
          </div>
        </div>

        <div className="ocr-field-list">
          {fields.map((field) => (
            <div key={field.field} className="ocr-field-row">
              <div className="ocr-field-meta">
                <strong>{field.field}</strong>
                <span>{confidenceLabel(field.confidence)} · {Math.round(field.confidence * 100)}%</span>
              </div>
              <label>
                <span>Extracted</span>
                <input type="text" value={field.extractedValue} disabled />
              </label>
              <label>
                <span>Corrected value</span>
                <input
                  type="text"
                  value={field.correctedValue ?? field.extractedValue}
                  onChange={(event) =>
                    setFields((current) =>
                      current.map((item) =>
                        item.field === field.field
                          ? {
                              ...item,
                              correctedValue: event.target.value,
                              approved: true,
                            }
                          : item
                      )
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>

        <div className="treasury-modal-footer">
          <button type="button" className="mini-action-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="mini-action-btn primary" onClick={() => onSave(fields)}>
            Save OCR corrections
          </button>
        </div>
      </div>
    </div>
  );
}
