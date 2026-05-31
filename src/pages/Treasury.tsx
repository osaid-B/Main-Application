import "./Treasury.css";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileScan,
  Landmark,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useTreasury } from "../context/TreasuryContext";
import type { TreasuryInstrument, InstrumentStatus } from "../types/treasury";
import {
  PALESTINIAN_BANKS,
  STATUS_AR,
  TYPE_AR,
  DIRECTION_LABELS_AR,
} from "../types/treasury";
import { TreasuryDetailPanel } from "./TreasuryDetailPanel";
import { AddInstrumentModal } from "./TreasuryAddModal";
import {
  DepositModal,
  ClearModal,
  BounceModal,
  ReDepositModal,
  LegalInfoModal,
  CancelModal,
} from "./TreasuryStatusModals";

// ─── Types ────────────────────────────────────────────────────────────────────

type TreasuryTab = "overview" | "incoming" | "outgoing" | "transfers" | "guarantees";

type ActionModal =
  | { type: "deposit";   instrument: TreasuryInstrument }
  | { type: "clear";     instrument: TreasuryInstrument }
  | { type: "bounce";    instrument: TreasuryInstrument }
  | { type: "redeposit"; instrument: TreasuryInstrument }
  | { type: "legal";     instrument: TreasuryInstrument }
  | { type: "cancel";    instrument: TreasuryInstrument }
  | { type: "add_check"; direction: "incoming" | "outgoing" }
  | { type: "add_transfer"; direction: "incoming" | "outgoing" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function dueDateToISO(ddmmyyyy: string): string {
  if (!ddmmyyyy) return "";
  if (ddmmyyyy.includes("-")) return ddmmyyyy;
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function isOverdue(instrument: TreasuryInstrument): boolean {
  if (["cleared", "cancelled"].includes(instrument.status)) return false;
  const iso = dueDateToISO(instrument.dueDate);
  return iso < TODAY_ISO;
}

function formatMoney(amount: number, currency: string): string {
  const sym: Record<string, string> = { ILS: "₪", JOD: "د.أ", USD: "$" };
  return `${sym[currency] ?? currency}${amount.toLocaleString("ar-PS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadgeClass(status: InstrumentStatus): string {
  return `trs-badge trs-badge--${status}`;
}

function rowClass(inst: TreasuryInstrument): string {
  if (inst.status === "bounced")          return "trs-row--bounced";
  if (inst.status === "under_review")     return "trs-row--review";
  if (isOverdue(inst))                    return "trs-row--overdue";
  return "";
}

function rowExtraClass(inst: TreasuryInstrument): string {
  if (!inst.micrVerified && inst.micrRaw) return "trs-row--ocr-unverified";
  return "";
}

// ─── Render pagination buttons ────────────────────────────────────────────────

function renderPageButtons(page: number, total: number, setPage: (p: number) => void) {
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
      <button
        key={p}
        type="button"
        className={`trs-pg-btn${page === p ? " active" : ""}`}
        onClick={() => setPage(p as number)}
      >
        {p}
      </button>
    )
  );
}

// ─── Context-aware row action buttons ─────────────────────────────────────────

function RowActions({
  instrument,
  onView,
  onDeposit,
  onClear,
  onRedeposit,
  onCancel,
  onSubmit,
}: {
  instrument: TreasuryInstrument;
  onView: () => void;
  onDeposit: () => void;
  onClear: () => void;
  onBounce: () => void;
  onRedeposit: () => void;
  onLegal: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { status } = instrument;
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const primary: { label: string; fn: () => void } | null = (() => {
    if (status === "draft")             return { label: "تقديم",        fn: onSubmit    };
    if (status === "pending")           return { label: "إيداع",         fn: onDeposit   };
    if (status === "deposited")         return { label: "تحصيل",         fn: onClear     };
    if (status === "bounced")           return { label: "إعادة إيداع",   fn: onRedeposit };
    if (status === "under_review")      return { label: "مراجعة",        fn: onView      };
    if (status === "partially_applied") return { label: "تحصيل",         fn: onClear     };
    return null;
  })();

  const canCancel = ["draft", "pending", "bounced", "under_review"].includes(status);

  return (
    <div
      ref={containerRef}
      className={`trs-row-actions${menuOpen ? " trs-row-actions--open" : ""}`}
      onClick={e => e.stopPropagation()}
    >
      <button type="button" className="trs-row-eye" onClick={onView} title="عرض التفاصيل">
        <Eye size={13} />
      </button>
      {primary && (
        <button type="button" className="trs-row-primary-btn" onClick={primary.fn}>
          {primary.label}
        </button>
      )}
      <div className="trs-row-overflow-wrap">
        <button
          type="button"
          className="trs-row-overflow-btn"
          onClick={() => setMenuOpen(v => !v)}
          title="المزيد"
        >
          <MoreHorizontal size={13} />
        </button>
        {menuOpen && (
          <div className="trs-row-overflow-menu">
            <button type="button" onClick={() => { onView(); setMenuOpen(false); }}>
              عرض التفاصيل
            </button>
            {canCancel && (
              <button
                type="button"
                className="trs-overflow-item--danger"
                onClick={() => { onCancel(); setMenuOpen(false); }}
              >
                إلغاء
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Treasury page ────────────────────────────────────────────────────────────

export default function Treasury() {
  const { isArabic } = useSettings();
  const navigate = useNavigate();
  const {
    instruments,
    bankAccounts,
    addInstrument,
    updateInstrumentStatus,
  } = useTreasury();

  // UI state
  const [activeTab,     setActiveTab]     = useState<TreasuryTab>("overview");
  const [searchTerm,    setSearchTerm]    = useState("");
  const [filterDir,     setFilterDir]     = useState("all");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterBank,    setFilterBank]    = useState("all");
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [page,          setPage]          = useState(1);
  const [rowsPerPage,   setRowsPerPage]   = useState(10);
  const [selectedInst,  setSelectedInst]  = useState<TreasuryInstrument | null>(null);
  const [actionModal,   setActionModal]   = useState<ActionModal | null>(null);
  const [toast,         setToast]         = useState("");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showAddDropdown) return;
    const close = (e: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setShowAddDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showAddDropdown]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  // ── Stat card values ─────────────────────────────────────────────────────────
  const totalBalanceILS = bankAccounts
    .filter(a => a.isActive)
    .reduce((sum, a) => {
      const rates: Record<string, number> = { ILS: 1, JOD: 5.15, USD: 3.7 };
      return sum + a.balance * (rates[a.currency] ?? 1);
    }, 0);
  const activeAccountsCount = bankAccounts.filter(a => a.isActive).length;

  const pendingIncoming = instruments.filter(
    i => i.direction === "incoming" && ["pending", "deposited"].includes(i.status)
  );
  const pendingIncomingTotal = pendingIncoming.reduce((s, i) => s + i.amountInILS, 0);

  const bouncedCount = instruments.filter(i => i.status === "bounced").length;
  const underReviewCount = instruments.filter(i => i.status === "under_review").length;

  // ── Filter logic ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return instruments.filter(inst => {
      // Tab filter
      if (activeTab === "incoming")   return inst.direction === "incoming" && inst.type === "check";
      if (activeTab === "outgoing")   return inst.direction === "outgoing" && inst.type === "check";
      if (activeTab === "transfers")  return inst.type === "bank_transfer";
      if (activeTab === "guarantees") return inst.type === "bank_guarantee" || inst.type === "letter_of_credit";

      // Overview — all
      if (filterDir !== "all" && inst.direction !== filterDir) return false;
      if (filterStatus !== "all" && inst.status !== filterStatus) return false;
      if (filterBank !== "all" && inst.bankId !== filterBank) return false;

      if (dateFrom) {
        const instIso = dueDateToISO(inst.instrumentDate);
        if (instIso < dateFrom) return false;
      }
      if (dateTo) {
        const instIso = dueDateToISO(inst.instrumentDate);
        if (instIso > dateTo) return false;
      }

      // Text search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const haystack = [
          inst.id, inst.drawerName, inst.bankName,
          inst.checkNumber ?? "", inst.referenceNumber ?? "",
          inst.accountNumber,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [instruments, activeTab, filterDir, filterStatus, filterBank, dateFrom, dateTo, searchTerm]);

  const totalPages  = Math.ceil(filtered.length / rowsPerPage);
  const pagedItems  = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const switchTab = (tab: TreasuryTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // ── Action handlers ───────────────────────────────────────────────────────────
  const handlePanelAction = useCallback((
    action: "submit" | "deposit" | "clear" | "bounce" | "redeposit" | "legal" | "review" | "cancel",
    inst: TreasuryInstrument
  ) => {
    if (action === "submit") {
      updateInstrumentStatus(inst.id, "pending");
      setSelectedInst(null);
      showToast("تم تقديم الأداة للمعالجة.");
    } else if (action === "deposit") {
      setActionModal({ type: "deposit", instrument: inst });
    } else if (action === "clear") {
      setActionModal({ type: "clear", instrument: inst });
    } else if (action === "bounce") {
      setActionModal({ type: "bounce", instrument: inst });
    } else if (action === "redeposit") {
      setActionModal({ type: "redeposit", instrument: inst });
    } else if (action === "legal") {
      setActionModal({ type: "legal", instrument: inst });
    } else if (action === "cancel") {
      setActionModal({ type: "cancel", instrument: inst });
    }
  }, [updateInstrumentStatus, showToast]);

  const handleAddInstrument = useCallback(
    (data: Parameters<typeof addInstrument>[0], _asDraft?: boolean) => {
      void _asDraft;
      addInstrument(data);
      setActionModal(null);
      showToast("تم إضافة الأداة المالية بنجاح.");
    },
    [addInstrument, showToast]
  );

  // ── Unique bank options for filter ────────────────────────────────────────────
  const bankOptions = useMemo(() => {
    const banks = new Set(instruments.map(i => i.bankId));
    return [
      { value: "all", label: "كل البنوك" },
      ...PALESTINIAN_BANKS
        .filter(b => banks.has(b.id))
        .map(b => ({ value: b.id, label: b.nameAr })),
    ];
  }, [instruments]);

  const statusOptions = [
    { value: "all", label: "كل الحالات" },
    { value: "draft", label: "مسودة" },
    { value: "pending", label: "معلقة" },
    { value: "deposited", label: "مودعة" },
    { value: "cleared", label: "محصّلة" },
    { value: "bounced", label: "مرتجعة" },
    { value: "cancelled", label: "ملغاة" },
    { value: "under_review", label: "قيد المراجعة" },
    { value: "partially_applied", label: "مطبّقة جزئياً" },
  ];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="trs-page">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="trs-header">
        <div className="trs-header-left">
          <div className="trs-header-icon">
            <Landmark size={24} />
          </div>
          <div className="trs-header-copy">
            <h1>الخزينة والمصرفية</h1>
            <p>إدارة الشيكات والتحويلات والضمانات البنكية — البنوك الفلسطينية المرخّصة</p>
          </div>
        </div>
        <div className="trs-header-actions">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ShieldCheck size={14} />}
            onClick={() => navigate("/treasury/accounts")}
          >
            الحسابات البنكية
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
          >
            تصدير CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCcw size={14} />}
          >
            تسوية بنكية
          </Button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div className="trs-stat-row">
        <div className="trs-stat-card" style={{ "--card-accent": "#3B5BDB" } as React.CSSProperties}>
          <span className="trs-stat-label">الحسابات البنكية</span>
          <span className="trs-stat-value">{formatMoney(totalBalanceILS, "ILS")}</span>
          <span className="trs-stat-sub">{activeAccountsCount} حساب نشط</span>
        </div>

        <div className="trs-stat-card" style={{ "--card-accent": "#D97706" } as React.CSSProperties}>
          <span className="trs-stat-label">شيكات واردة معلقة</span>
          <span className="trs-stat-value">{pendingIncoming.length}</span>
          <span className="trs-stat-sub trs-stat-sub--orange">
            {formatMoney(pendingIncomingTotal, "ILS")}
          </span>
        </div>

        <div className="trs-stat-card" style={{ "--card-accent": "#DC2626" } as React.CSSProperties}>
          <span className="trs-stat-label">أدوات مرتجعة</span>
          <span className="trs-stat-value">{bouncedCount}</span>
          <span className="trs-stat-sub trs-stat-sub--red">تحتاج إجراءً فورياً</span>
        </div>

        <div className="trs-stat-card" style={{ "--card-accent": "#7C3AED" } as React.CSSProperties}>
          <span className="trs-stat-label">قائمة OCR</span>
          <span className="trs-stat-value">{underReviewCount}</span>
          <span className="trs-stat-sub trs-stat-sub--purple">تحتاج مراجعة يدوية</span>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="trs-toolbar">

        {/* Row 1: Tab pills */}
        <div className="trs-tab-pills" role="tablist">
          {([
            ["overview",   "نظرة عامة"],
            ["incoming",   "الشيكات الواردة"],
            ["outgoing",   "الشيكات الصادرة"],
            ["transfers",  "التحويلات"],
            ["guarantees", "الضمانات"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`trs-tab-pill ${activeTab === key ? "active" : ""}`}
              onClick={() => switchTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Row 2: Filters — single compact row */}
        <div className="trs-filters-row">
          <select
            className="trs-filter-select"
            value={filterDir}
            onChange={e => { setFilterDir(e.target.value); setPage(1); }}
            title="الاتجاه"
          >
            <option value="all">كل الاتجاهات</option>
            <option value="incoming">وارد</option>
            <option value="outgoing">صادر</option>
          </select>

          <select
            className="trs-filter-select"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            title="الحالة"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            className="trs-filter-select"
            value={filterBank}
            onChange={e => { setFilterBank(e.target.value); setPage(1); }}
            title="البنك"
          >
            {bankOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="trs-date-range">
            <span className="trs-date-label">من:</span>
            <input type="date" className="trs-filter-date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
            <span className="trs-date-sep">—</span>
            <span className="trs-date-label">إلى:</span>
            <input type="date" className="trs-filter-date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>

          <div className="trs-search-wrap">
            <Search size={13} />
            <input
              type="search"
              className="trs-search-input"
              placeholder="بحث: مرجع، اسم، رقم شيك..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Row 3: Actions */}
        <div className="trs-actions-row">
          <div className="trs-actions-start">
            <button
              type="button"
              className="trs-text-link"
              onClick={() => navigate("/treasury/accounts")}
            >
              الحسابات البنكية
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="trs-actions-end">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FileScan size={14} />}
              onClick={() => setActionModal({ type: "add_check", direction: "incoming" })}
            >
              مسح OCR
            </Button>
            <div ref={addDropdownRef} className="trs-add-dropdown-wrap">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                rightIcon={<ChevronDown size={12} />}
                onClick={() => setShowAddDropdown(v => !v)}
              >
                إضافة
              </Button>
              {showAddDropdown && (
                <div className="trs-add-dropdown-menu">
                  <button
                    type="button"
                    onClick={() => { setActionModal({ type: "add_check", direction: "incoming" }); setShowAddDropdown(false); }}
                  >
                    شيك وارد
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionModal({ type: "add_check", direction: "outgoing" }); setShowAddDropdown(false); }}
                  >
                    شيك صادر
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionModal({ type: "add_transfer", direction: "incoming" }); setShowAddDropdown(false); }}
                  >
                    حوالة بنكية
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main table ───────────────────────────────────────────────────────── */}
      <div className="trs-table-card">
        <div className="trs-table-head">
          <strong>
            {activeTab === "overview"   ? "جميع الأدوات المالية"
           : activeTab === "incoming"   ? "الشيكات الواردة"
           : activeTab === "outgoing"   ? "الشيكات الصادرة"
           : activeTab === "transfers"  ? "التحويلات البنكية"
           : "الضمانات والاعتمادات"}
          </strong>
          <span className="trs-table-count">{filtered.length} سجل</span>
        </div>

        <div className="trs-table-wrap">
          <table className="trs-table" role="grid">
            <colgroup>
              <col style={{ width: 150 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 120 }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>المرجع</th>
                <th>الطرف</th>
                <th>رقم الشيك</th>
                <th>المبلغ</th>
                <th>تاريخ الشيك</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.length === 0 ? (
                <tr className="trs-empty-row">
                  <td colSpan={8}>
                    لا توجد أدوات تطابق البحث الحالي.
                  </td>
                </tr>
              ) : (
                pagedItems.map(inst => {
                  const overdue = isOverdue(inst);
                  const dueIso  = dueDateToISO(inst.dueDate);
                  const dueDiff = Math.ceil((new Date(dueIso).getTime() - new Date(TODAY_ISO).getTime()) / 86_400_000);
                  const dueSuffix = overdue
                    ? `متأخر ${Math.abs(dueDiff)} يوم`
                    : dueDiff === 0 ? "مستحق اليوم"
                    : `خلال ${dueDiff} أيام`;

                  return (
                    <tr
                      key={inst.id}
                      className={[rowClass(inst), rowExtraClass(inst)].filter(Boolean).join(" ")}
                      onClick={() => setSelectedInst(inst)}
                      role="row"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && setSelectedInst(inst)}
                    >
                      {/* المرجع */}
                      <td>
                        <div className="tc-ref">
                          <div className="tc-ref-top">
                            <strong>{inst.id}</strong>
                            <span className={`trs-dir-pill trs-dir-pill--${inst.direction}`}>
                              {DIRECTION_LABELS_AR[inst.direction]}
                            </span>
                          </div>
                          <span className="tc-ref-sub">{TYPE_AR[inst.type]}</span>
                        </div>
                      </td>

                      {/* الطرف */}
                      <td>
                        <div className="tc-party">
                          <strong>{inst.drawerName}</strong>
                          <span>{inst.bankName} ···· {inst.accountNumber.slice(-4)}</span>
                        </div>
                      </td>

                      {/* رقم الشيك */}
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                          {inst.checkNumber ?? "—"}
                        </span>
                      </td>

                      {/* المبلغ */}
                      <td>
                        <div className="tc-amount">
                          <strong>{formatMoney(inst.amount, inst.currency)}</strong>
                          {inst.currency !== "ILS" && (
                            <span>{formatMoney(inst.amountInILS, "ILS")}</span>
                          )}
                        </div>
                      </td>

                      {/* تاريخ الشيك */}
                      <td>
                        <div className="tc-date">
                          <strong>{inst.instrumentDate}</strong>
                        </div>
                      </td>

                      {/* تاريخ الاستحقاق */}
                      <td>
                        <div className="tc-date">
                          <strong>{inst.dueDate}</strong>
                          {overdue
                            ? <span className="trs-overdue-text">{dueSuffix}</span>
                            : dueDiff <= 3
                            ? <span className="trs-due-soon-label">{dueSuffix}</span>
                            : <span className="trs-due-ok-label">{dueSuffix}</span>
                          }
                        </div>
                      </td>

                      {/* الحالة */}
                      <td>
                        <span className={statusBadgeClass(inst.status)}>
                          {STATUS_AR[inst.status]}
                        </span>
                      </td>

                      {/* الإجراءات */}
                      <td>
                        <RowActions
                          instrument={inst}
                          onView={() => setSelectedInst(inst)}
                          onDeposit={() => setActionModal({ type: "deposit", instrument: inst })}
                          onClear={() => setActionModal({ type: "clear", instrument: inst })}
                          onBounce={() => setActionModal({ type: "bounce", instrument: inst })}
                          onRedeposit={() => setActionModal({ type: "redeposit", instrument: inst })}
                          onLegal={() => setActionModal({ type: "legal", instrument: inst })}
                          onCancel={() => setActionModal({ type: "cancel", instrument: inst })}
                          onSubmit={() => {
                            updateInstrumentStatus(inst.id, "pending");
                            showToast("تم تقديم الأداة للمعالجة.");
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="trs-pagination">
          <span className="trs-pg-info">
            {filtered.length === 0
              ? "لا توجد سجلات"
              : `عرض ${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} من ${filtered.length}`}
          </span>
          <div className="trs-pg-controls">
            <button
              type="button"
              className="trs-pg-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <ChevronRight size={14} />
            </button>
            {renderPageButtons(page, totalPages, setPage)}
            <button
              type="button"
              className="trs-pg-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
          <select
            className="trs-rpp-select"
            value={String(rowsPerPage)}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
          >
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / صفحة</option>)}
          </select>
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────────────── */}
      {selectedInst && (
        <TreasuryDetailPanel
          instrument={selectedInst}
          isArabic={isArabic}
          onClose={() => setSelectedInst(null)}
          onAction={action => {
            handlePanelAction(action, selectedInst);
          }}
          onCopyRef={() => {
            void navigator.clipboard.writeText(selectedInst.id);
            showToast(`تم نسخ المرجع: ${selectedInst.id}`);
          }}
        />
      )}

      {/* ── Action modals ────────────────────────────────────────────────────── */}
      {actionModal?.type === "add_check" && (
        <AddInstrumentModal
          defaultDirection={actionModal.direction}
          onSave={(data, asDraft) => handleAddInstrument({ ...data, status: asDraft ? "draft" : "pending" }, asDraft)}
          onClose={() => setActionModal(null)}
        />
      )}
      {actionModal?.type === "add_transfer" && (
        <AddInstrumentModal
          defaultDirection={actionModal.direction}
          onSave={(data, asDraft) => handleAddInstrument({ ...data, type: "bank_transfer" }, asDraft)}
          onClose={() => setActionModal(null)}
        />
      )}

      {actionModal?.type === "deposit" && (
        <DepositModal
          bankAccounts={bankAccounts}
          onConfirm={({ depositRef, notes }) => {
            updateInstrumentStatus(actionModal.instrument.id, "deposited", `إيداع ${depositRef ? `رقم ${depositRef}` : ""}${notes ? ` — ${notes}` : ""}`);
            setActionModal(null);
            if (selectedInst?.id === actionModal.instrument.id) {
              setSelectedInst(prev => prev ? { ...prev, status: "deposited" } : null);
            }
            showToast("تم تسجيل الإيداع بنجاح.");
          }}
          onClose={() => setActionModal(null)}
        />
      )}

      {actionModal?.type === "clear" && (
        <ClearModal
          onConfirm={({ bankRef }) => {
            updateInstrumentStatus(actionModal.instrument.id, "cleared", `تأكيد تحصيل — مرجع البنك: ${bankRef}`);
            setActionModal(null);
            if (selectedInst?.id === actionModal.instrument.id) setSelectedInst(null);
            showToast("تم تأكيد التحصيل وتحديث الفواتير المرتبطة.");
          }}
          onClose={() => setActionModal(null)}
        />
      )}

      {actionModal?.type === "bounce" && (
        <BounceModal
          onConfirm={({ reason, bankRef }) => {
            updateInstrumentStatus(actionModal.instrument.id, "bounced", `سبب الارتجاع: ${reason}${bankRef ? ` — إشعار: ${bankRef}` : ""}`);
            setActionModal(null);
            if (selectedInst?.id === actionModal.instrument.id) {
              setSelectedInst(prev => prev ? { ...prev, status: "bounced" } : null);
            }
            showToast("تم تسجيل الارتجاع.");
          }}
          onClose={() => setActionModal(null)}
        />
      )}

      {actionModal?.type === "redeposit" && (
        <ReDepositModal
          onConfirm={() => {
            updateInstrumentStatus(actionModal.instrument.id, "deposited", "إعادة إيداع بعد الارتجاع");
            setActionModal(null);
            if (selectedInst?.id === actionModal.instrument.id) {
              setSelectedInst(prev => prev ? { ...prev, status: "deposited" } : null);
            }
            showToast("تم تسجيل إعادة الإيداع.");
          }}
          onClose={() => setActionModal(null)}
        />
      )}

      {actionModal?.type === "legal" && (
        <LegalInfoModal onClose={() => setActionModal(null)} />
      )}

      {actionModal?.type === "cancel" && (
        <CancelModal
          instrumentRef={actionModal.instrument.id}
          onConfirm={note => {
            updateInstrumentStatus(actionModal.instrument.id, "cancelled", note || "إلغاء يدوي");
            setActionModal(null);
            if (selectedInst?.id === actionModal.instrument.id) setSelectedInst(null);
            showToast("تم إلغاء الأداة المالية.");
          }}
          onClose={() => setActionModal(null)}
        />
      )}

      {/* Toast */}
      {toast && <div className="trs-toast">{toast}</div>}
    </div>
  );
}
