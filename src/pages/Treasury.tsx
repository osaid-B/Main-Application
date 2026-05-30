import "./Treasury.css";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Landmark,
  Lock,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import { useTreasury } from "../context/TreasuryContext";
import { STATUS_AR, TYPE_AR, type InstrumentStatus } from "../types/treasury";
import type { TreasuryInstrument } from "../types/treasury";
import { AddCheckModal } from "../components/treasury/AddCheckModal";
import { AddTransferModal } from "../components/treasury/AddTransferModal";
import { StatusActionModal, type StatusActionType } from "../components/treasury/StatusActionModal";
import { InstrumentDetailPanel } from "../components/treasury/InstrumentDetailPanel";

type TreasuryTab = "overview" | "incoming" | "outgoing" | "transfers";

const TODAY = new Date().toISOString().split("T")[0];
const TODAY_MS = new Date(TODAY).getTime();

function normalizeDate(d: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [day, month, year] = d.split("/");
    return `${year}-${month}-${day}`;
  }
  return d;
}

function money(value: number, currency: "ILS" | "JOD" | "USD" = "ILS"): string {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
  if (currency === "ILS") return `₪${n}`;
  if (currency === "JOD") return `${n} د.أ`;
  return `$${n}`;
}

function formatDate(d?: string): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(normalizeDate(d)));
  } catch {
    return d;
  }
}

function relTime(dateStr?: string, isArabic = false): string {
  if (!dateStr) return "";
  try {
    const diff = Math.ceil(
      (new Date(normalizeDate(dateStr)).getTime() - new Date(TODAY).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (diff > 0)
      return isArabic
        ? `خلال ${diff} ${diff === 1 ? "يوم" : "أيام"}`
        : `In ${diff} day${diff === 1 ? "" : "s"}`;
    if (diff < 0)
      return isArabic
        ? `منذ ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "يوم" : "أيام"}`
        : `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`;
    return isArabic ? "اليوم" : "Today";
  } catch {
    return "";
  }
}

function statusTone(status: InstrumentStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "cleared") return "success";
  if (["pending", "deposited", "under_review", "partially_applied"].includes(status))
    return "warning";
  if (["bounced", "cancelled"].includes(status)) return "danger";
  return "neutral";
}

function renderPages(
  page: number,
  total: number,
  setPage: (p: number) => void,
): React.ReactNode {
  if (total <= 1) return null;
  const pages: (number | "…")[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++)
      pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }
  return pages.map((p, idx) =>
    p === "…" ? (
      <span key={`e${idx}`} className="trs-pg-ellipsis">
        …
      </span>
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
    ),
  );
}

export default function Treasury() {
  const { isArabic } = useSettings();
  const { instruments, bankAccounts } = useTreasury();

  const [activeTab, setActiveTab] = useState<TreasuryTab>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toast, setToast] = useState("");

  // Modal / panel state
  const [addCheckDir, setAddCheckDir] = useState<"incoming" | "outgoing" | null>(null);
  const [showAddTransfer, setShowAddTransfer] = useState(false);
  const [detailInstrument, setDetailInstrument] = useState<TreasuryInstrument | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    instrument: TreasuryInstrument;
    action: StatusActionType;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

  const openAction = (instrument: TreasuryInstrument, action: StatusActionType = "menu") => {
    setDetailInstrument(null);
    setActionTarget({ instrument, action });
  };

  const handlePanelAction = (type: StatusActionType) => {
    if (!detailInstrument) return;
    openAction(detailInstrument, type);
  };

  // KPIs
  const kpi = useMemo(() => {
    const threeDaysFromNow = TODAY_MS + 3 * 24 * 60 * 60 * 1000;
    const dueSoon = instruments.filter(i => {
      if (!["pending", "deposited"].includes(i.status)) return false;
      try {
        return new Date(normalizeDate(i.dueDate)).getTime() <= threeDaysFromNow;
      } catch {
        return false;
      }
    }).length;
    const bounced = instruments.filter(i => i.status === "bounced").length;
    const underReview = instruments.filter(i => i.status === "under_review").length;
    return { dueSoon, bounced, underReview };
  }, [instruments]);

  // Active statuses for filter dropdown
  const activeStatuses = useMemo(() => {
    const vals = new Set<string>(["All"]);
    instruments.forEach(i => vals.add(i.status));
    return Array.from(vals);
  }, [instruments]);

  // Filtered instruments by tab
  const tabFiltered = useMemo(() => {
    return instruments.filter(i => {
      switch (activeTab) {
        case "incoming":
          return i.direction === "incoming" && i.type === "check";
        case "outgoing":
          return i.direction === "outgoing" && i.type === "check";
        case "transfers":
          return i.type === "bank_transfer";
        default:
          return true;
      }
    });
  }, [instruments, activeTab]);

  // Search + status filter
  const filtered = useMemo(() => {
    return tabFiltered.filter(i => {
      const q = [
        i.checkNumber,
        i.referenceNumber,
        i.drawerName,
        i.payeeName,
        i.bankName,
        i.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchSearch = q.includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "All" || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tabFiltered, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pagedRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const switchTab = (tab: TreasuryTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const totalBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  const activeAccountsLabel = isArabic
    ? `عبر ${bankAccounts.length} حسابات خزينة نشطة`
    : `Across ${bankAccounts.length} active treasury accounts`;

  return (
    <div className="trs-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="trs-header">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div className="trs-header-eyebrow">
              <Landmark size={14} />
              {isArabic ? "الخزينة" : "Treasury"}
            </div>
            <p className="trs-header-sub">
              {isArabic
                ? "إدارة الشيكات والتحويلات البنكية والأدوات المالية"
                : "Manage cheques, bank transfers, and financial instruments"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              leftIcon={<Plus size={14} />}
              onClick={() => setAddCheckDir("incoming")}
              className="trs-mini-btn"
              style={{ height: 38 }}
            >
              شيك وارد
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Plus size={14} />}
              onClick={() => setAddCheckDir("outgoing")}
              className="trs-mini-btn"
              style={{ height: 38 }}
            >
              شيك صادر
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowAddTransfer(true)}
              className="trs-mini-btn trs-mini-btn--primary"
              style={{ height: 38 }}
            >
              حوالة بنكية
            </Button>
          </div>
        </div>
      </header>

      {/* ── KPI Row ────────────────────────────────────────── */}
      <div className="trs-kpi-row">
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--blue">
            <Landmark size={20} />
          </div>
          <div>
            <span className="trs-kpi-label">
              {isArabic ? "إجمالي الأرصدة" : "Total Balance"}
            </span>
            <strong className="trs-kpi-value">{money(totalBalance)}</strong>
            <span className="trs-kpi-link">{activeAccountsLabel}</span>
          </div>
        </div>
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--amber">
            <Banknote size={20} />
          </div>
          <div>
            <span className="trs-kpi-label">
              {isArabic ? "شيكات مستحقة قريباً" : "Due Soon"}
            </span>
            <strong className="trs-kpi-value">{kpi.dueSoon}</strong>
            <span className="trs-kpi-note">
              {isArabic ? "مستحقة خلال 3 أيام" : "Maturing within 3 days"}
            </span>
          </div>
        </div>
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--red">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="trs-kpi-label">
              {isArabic ? "شيكات مرتجعة" : "Bounced"}
            </span>
            <strong className="trs-kpi-value">{kpi.bounced}</strong>
            <span className="trs-kpi-note">
              {isArabic ? "تحتاج متابعة" : "Need follow-up"}
            </span>
          </div>
        </div>
        <div className="trs-kpi-card">
          <div className="trs-kpi-icon trs-kpi-icon--purple">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="trs-kpi-label">
              {isArabic ? "قيد المراجعة" : "Under Review"}
            </span>
            <strong className="trs-kpi-value">{kpi.underReview}</strong>
            <span className="trs-kpi-note">
              {isArabic ? "تحتاج تحقق يدوي" : "Manual validation needed"}
            </span>
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
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={isArabic ? "بحث في الأدوات المالية..." : "Search instruments..."}
                />
              </div>
              <Select
                className="trs-status-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                options={activeStatuses.map(s => ({
                  value: s,
                  label:
                    s === "All"
                      ? isArabic ? "الكل" : "All"
                      : isArabic
                      ? STATUS_AR[s as InstrumentStatus] ?? s
                      : s,
                }))}
              />
              <div className="trs-tab-group">
                {(
                  [
                    ["overview", isArabic ? "الكل" : "All"],
                    ["incoming", isArabic ? "واردة" : "Incoming"],
                    ["outgoing", isArabic ? "صادرة" : "Outgoing"],
                    ["transfers", isArabic ? "تحويلات" : "Transfers"],
                  ] as [TreasuryTab, string][]
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="ghost"
                    className={`trs-tab-btn${activeTab === key ? " active" : ""}`}
                    onClick={() => switchTab(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="trs-table-card">
            <div className="trs-table-wrap">
              <table className="trs-table">
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{isArabic ? "المرجع" : "Reference"}</th>
                    <th>{isArabic ? "النوع" : "Type"}</th>
                    <th>{isArabic ? "الطرف" : "Party"}</th>
                    <th>{isArabic ? "الحالة" : "Status"}</th>
                    <th>{isArabic ? "تاريخ الاستحقاق" : "Due Date"}</th>
                    <th>{isArabic ? "المبلغ" : "Amount"}</th>
                    <th>{isArabic ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map(row => {
                    const isCheck = row.type === "check";
                    const isIncoming = row.direction === "incoming";
                    const avatarLabel = isCheck ? "شيك" : "تحويل";
                    const avatarBg = isCheck
                      ? isIncoming
                        ? "#dbeafe"
                        : "#ffedd5"
                      : "#dcfce7";
                    const avatarColor = isCheck
                      ? isIncoming
                        ? "#1d4ed8"
                        : "#ea580c"
                      : "#16a34a";
                    const typeLabel = isIncoming
                      ? isArabic ? "وارد" : "Incoming"
                      : isArabic ? "صادر" : "Outgoing";
                    const party = isIncoming ? row.drawerName : row.payeeName;
                    const reference = row.checkNumber ?? row.referenceNumber ?? row.id;

                    return (
                      <tr
                        key={row.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setDetailInstrument(row)}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "start", width: "100%" }}
                            onClick={() => setDetailInstrument(row)}
                          >
                            <div className="trs-item-cell">
                              <div
                                className="trs-avatar"
                                style={{ background: avatarBg, color: avatarColor }}
                              >
                                {avatarLabel}
                              </div>
                              <div>
                                <strong className="numeric-cell">{reference}</strong>
                                <span className="trs-sub-label">
                                  {isArabic ? TYPE_AR[row.type] : row.type}
                                </span>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <Badge
                            variant="info"
                            className="trs-type-badge"
                            style={{
                              background: isIncoming ? "#dbeafe" : "#ffedd5",
                              color: isIncoming ? "#1d4ed8" : "#ea580c",
                            }}
                          >
                            {typeLabel}
                          </Badge>
                        </td>
                        <td className="trs-party-cell">{party}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <Badge
                            variant={statusTone(row.status)}
                            className={`trs-status-badge trs-status--${statusTone(row.status)}`}
                          >
                            {isArabic
                              ? STATUS_AR[row.status]
                              : row.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="trs-date-cell">
                            <span className="numeric-cell">{formatDate(row.dueDate)}</span>
                            <span
                              className={`trs-date-sub${
                                (() => {
                                  try {
                                    return new Date(normalizeDate(row.dueDate)).getTime() < TODAY_MS;
                                  } catch {
                                    return false;
                                  }
                                })()
                                  ? " trs-danger-text"
                                  : ""
                              }`}
                            >
                              {relTime(row.dueDate, isArabic)}
                            </span>
                          </div>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <strong className="trs-amount numeric-cell">
                            {money(row.amount, row.currency)}
                          </strong>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="trs-row-actions">
                            <Button
                              type="button"
                              variant="icon"
                              className="trs-icon-btn"
                              title={isArabic ? "عرض التفاصيل" : "View details"}
                              onClick={e => {
                                e.stopPropagation();
                                setDetailInstrument(row);
                              }}
                            >
                              <Eye size={15} />
                            </Button>
                            <Button
                              type="button"
                              variant="icon"
                              className="trs-icon-btn"
                              title={isArabic ? "الإجراءات" : "Actions"}
                              onClick={e => {
                                e.stopPropagation();
                                openAction(row, "menu");
                              }}
                            >
                              <MoreVertical size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="trs-empty-row">
                        {isArabic
                          ? "لا توجد أدوات تطابق البحث."
                          : "No instruments match your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="trs-pagination">
              <span className="trs-pg-meta">
                {filtered.length === 0
                  ? isArabic ? "لا توجد نتائج" : "No results"
                  : isArabic
                  ? `عرض ${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} من ${filtered.length}`
                  : `Showing ${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length}`}
              </span>
              <div className="trs-pg-controls">
                <Button
                  type="button"
                  variant="ghost"
                  className="trs-pg-btn"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                {renderPages(page, totalPages, setPage)}
                <Button
                  type="button"
                  variant="ghost"
                  className="trs-pg-btn"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
              <Select
                className="trs-rpp-select"
                value={String(rowsPerPage)}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                options={[5, 10, 20].map(n => ({
                  value: String(n),
                  label: isArabic ? `${n} / صفحة` : `${n} / page`,
                }))}
              />
            </div>
          </div>
        </div>

        {/* ── Sidebar ────────────────────────────────────── */}
        <aside className="trs-sidebar-col">
          {/* Quick-add card */}
          <div className="trs-sidebar-card trs-role-card">
            <span className="trs-role-eyebrow">
              {isArabic ? "إضافة سريعة" : "Quick Add"}
            </span>
            <div className="trs-role-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <strong className="trs-role-name">
              {isArabic ? "أداة مالية" : "New Instrument"}
            </strong>
            <p className="trs-role-desc">
              {isArabic
                ? "أضف شيكاً أو حوالة بنكية لبدء المعالجة."
                : "Add a cheque or bank transfer to start processing."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Button
                type="button"
                variant="primary"
                className="trs-capture-btn"
                leftIcon={<Plus size={14} />}
                onClick={() => setAddCheckDir("incoming")}
              >
                {isArabic ? "+ شيك وارد" : "+ Incoming Cheque"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="trs-capture-btn"
                style={{ background: "#f8fafc", color: "#0f172a", marginTop: 0 }}
                leftIcon={<Plus size={14} />}
                onClick={() => setAddCheckDir("outgoing")}
              >
                {isArabic ? "+ شيك صادر" : "+ Outgoing Cheque"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="trs-capture-btn"
                style={{ background: "#f0fdf4", color: "#15803d", marginTop: 0 }}
                leftIcon={<Plus size={14} />}
                onClick={() => setShowAddTransfer(true)}
              >
                {isArabic ? "+ حوالة بنكية" : "+ Bank Transfer"}
              </Button>
            </div>
          </div>

          {/* Instrument Controls */}
          <div className="trs-sidebar-card">
            <div className="trs-sidebar-head">
              <span className="trs-sidebar-title">
                {isArabic ? "ضوابط الأدوات" : "Instrument Controls"}
              </span>
              <ShieldCheck size={15} className="trs-sidebar-icon" />
            </div>
            <p className="trs-sidebar-sub">
              {isArabic
                ? "إجراءات الخزينة الحساسة مقيدة بالصلاحيات ويتم تدقيقها"
                : "Sensitive treasury actions are role-gated and audited."}
            </p>
            <div className="trs-controls-list">
              {(
                [
                  [isArabic ? "اعتماد الشيكات" : "Approve cheques", true],
                  [isArabic ? "التحقق من التحويلات" : "Verify transfers", true],
                  [isArabic ? "تصحيح OCR" : "Correct OCR", true],
                  [isArabic ? "إجراءات التسوية" : "Reconciliation actions", true],
                ] as [string, boolean][]
              ).map(([label, allowed]) => (
                <div key={label} className="trs-control-row">
                  <Lock size={12} className="trs-control-lock" />
                  <span className="trs-control-label">{label}</span>
                  <Badge
                    variant={allowed ? "success" : "danger"}
                    className={`trs-access-badge${
                      allowed ? " trs-access--allowed" : " trs-access--restricted"
                    }`}
                  >
                    {allowed
                      ? isArabic ? "مسموح" : "Allowed"
                      : isArabic ? "مقيد" : "Restricted"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Signals */}
          <div className="trs-sidebar-card">
            <div className="trs-sidebar-head">
              <span className="trs-sidebar-title">
                {isArabic ? "الإشارات التشغيلية" : "Operational Signals"}
              </span>
              <BrainCircuit size={15} className="trs-sidebar-icon" />
            </div>
            <p className="trs-sidebar-sub">
              {isArabic ? "عناصر خزينة عالية الأولوية" : "High-priority treasury items."}
            </p>
            <div className="trs-signals-list">
              <Button
                type="button"
                variant="ghost"
                className="trs-signal-row"
                onClick={() => switchTab("incoming")}
              >
                <span className="trs-signal-count trs-signal--red">{kpi.bounced}</span>
                <span className="trs-signal-label">
                  {isArabic ? "شيكات مرتجعة" : "bounced cheques"}
                </span>
                <ChevronRight size={14} className="trs-signal-chevron" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="trs-signal-row"
                onClick={() => switchTab("incoming")}
              >
                <span className="trs-signal-count trs-signal--amber">{kpi.dueSoon}</span>
                <span className="trs-signal-label">
                  {isArabic ? "أدوات تستحق خلال 3 أيام" : "instruments due within 3 days"}
                </span>
                <ChevronRight size={14} className="trs-signal-chevron" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="trs-signal-row"
                onClick={() => switchTab("overview")}
              >
                <span className="trs-signal-count trs-signal--blue">{kpi.underReview}</span>
                <span className="trs-signal-label">
                  {isArabic ? "قيد المراجعة" : "under review"}
                </span>
                <ChevronRight size={14} className="trs-signal-chevron" />
              </Button>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="trs-sidebar-card">
            <div className="trs-sidebar-head">
              <span className="trs-sidebar-title">
                {isArabic ? "الحسابات البنكية" : "Bank Accounts"}
              </span>
              <CreditCard size={15} className="trs-sidebar-icon" />
            </div>
            <div className="trs-accounts-list">
              {bankAccounts.slice(0, 3).map(account => (
                <div key={account.id} className="trs-account-row">
                  <div>
                    <strong className="trs-account-name">{account.bankName}</strong>
                    <span className="trs-account-bank numeric-cell">
                      {account.branchName} •••• {account.accountNumber.slice(-4)}
                    </span>
                  </div>
                  <strong className="trs-account-balance numeric-cell">
                    {money(account.balance, account.currency)}
                  </strong>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="trs-view-all-btn"
              rightIcon={<ChevronRight size={13} />}
            >
              {isArabic ? "عرض كل الحسابات" : "View all accounts"}
            </Button>
          </div>
        </aside>
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      {addCheckDir !== null && (
        <AddCheckModal
          isOpen={true}
          onClose={() => setAddCheckDir(null)}
          direction={addCheckDir}
          onSuccess={msg => { showToast(msg); setAddCheckDir(null); }}
        />
      )}

      {showAddTransfer && (
        <AddTransferModal
          isOpen={true}
          onClose={() => setShowAddTransfer(false)}
          onSuccess={msg => { showToast(msg); setShowAddTransfer(false); }}
        />
      )}

      {actionTarget && (
        <StatusActionModal
          isOpen={true}
          onClose={() => setActionTarget(null)}
          instrument={actionTarget.instrument}
          initialAction={actionTarget.action}
          onSuccess={msg => {
            showToast(msg);
            setActionTarget(null);
            // If the detail panel is showing the same instrument, update it
            if (detailInstrument?.id === actionTarget.instrument.id) {
              setDetailInstrument(null);
            }
          }}
        />
      )}

      {/* ── Detail Panel ──────────────────────────────────── */}
      {detailInstrument && (
        <InstrumentDetailPanel
          instrument={detailInstrument}
          onClose={() => setDetailInstrument(null)}
          onAction={handlePanelAction}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && <div className="treasury-toast">{toast}</div>}
    </div>
  );
}
