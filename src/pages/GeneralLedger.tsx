import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, X } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { TableActions } from "../components/ui/TableActions";
import { useData } from "../context/DataContext";
import styles from "./GeneralLedger.module.css";

// ── Types ────────────────────────────────────────────────────────────────────

type DebtStatus = "نشط" | "متأخر" | "مسدد" | "جزئي" | "ملغي";
type PartyType = "customer" | "supplier" | "employee" | "company" | "other";

interface DebtPaymentRecord {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

interface Debt {
  id: string;
  reference: string;
  date: string;
  dueDate: string;
  debtorName: string;
  debtorType: PartyType;
  creditorName: string;
  creditorType: PartyType;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  description?: string;
  invoiceId?: string;
  purchaseId?: string;
  createdFrom: "invoice" | "purchase" | "manual";
  payments: DebtPaymentRecord[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DebtStatus, { bg: string; color: string }> = {
  نشط:  { bg: "#EFF6FF", color: "#2563EB" },
  متأخر: { bg: "#FEF3C7", color: "#D97706" },
  مسدد:  { bg: "#DCFCE7", color: "#16A34A" },
  جزئي:  { bg: "#FEF9C3", color: "#CA8A04" },
  ملغي:  { bg: "#F1F5F9", color: "#64748B" },
};

const PARTY_BADGE: Record<PartyType, { label: string; bg: string; color: string }> = {
  customer: { label: "عميل",  bg: "#EFF6FF", color: "#2563EB" },
  supplier:  { label: "مورد",  bg: "#FEF3C7", color: "#92400E" },
  employee:  { label: "موظف", bg: "#F5F3FF", color: "#6D28D9" },
  company:   { label: "شركة", bg: "#F1F5F9", color: "#475569" },
  other:     { label: "أخرى", bg: "#F8FAFC", color: "#64748B" },
};

const PARTY_TYPE_OPTIONS: { value: PartyType; label: string }[] = [
  { value: "customer", label: "عميل" },
  { value: "supplier",  label: "مورد" },
  { value: "employee",  label: "موظف" },
  { value: "company",   label: "شركة" },
  { value: "other",     label: "أخرى" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeStatus(remaining: number, dueDate: string, paidAmount: number, total: number): DebtStatus {
  if (remaining <= 0) return "مسدد";
  if (dueDate < todayStr()) return "متأخر";
  if (paidAmount > 0 && paidAmount < total) return "جزئي";
  return "نشط";
}

function isThisMonth(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr + "T12:00:00");
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("ar-PS", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmt(n: number): string {
  return n.toLocaleString("ar-PS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── PartyCell component ───────────────────────────────────────────────────────

function PartyCell({ name, type }: { name: string; type: PartyType }) {
  const badge = PARTY_BADGE[type];
  return (
    <div>
      <strong style={{ fontSize: 13, color: "#0F172A", display: "block" }}>{name}</strong>
      <span style={{ display: "inline-block", marginTop: 3, fontSize: 11, fontWeight: 600, borderRadius: 99, padding: "1px 8px", background: badge.bg, color: badge.color }}>
        {badge.label}
      </span>
    </div>
  );
}

// ── ProgressBar component ─────────────────────────────────────────────────────

function ProgressBar({ pct, size = 4 }: { pct: number; size?: number }) {
  const barColor = pct >= 100 ? "#16A34A" : pct > 50 ? "#D97706" : "#DC2626";
  return (
    <div style={{ height: size, borderRadius: 99, background: "#FEE2E2", marginTop: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 99, background: barColor, width: `${Math.min(100, pct)}%`, transition: "width 600ms ease" }} />
    </div>
  );
}

// ── AddPaymentModal component ─────────────────────────────────────────────────

function AddPaymentModal({ debt, onClose, onSave }: {
  debt: Debt;
  onClose: () => void;
  onSave: (amount: number, date: string, notes: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const maxAmount = debt.remainingAmount;
  const canSave = parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div dir="rtl" style={{ background: "#fff", borderRadius: 16, width: 380, maxWidth: "92vw", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>تسجيل دفعة جديدة</h3>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94A3B8" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16, background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
          المتبقي: <strong style={{ color: "#DC2626" }}>₪ {fmt(maxAmount)}</strong>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>المبلغ *</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94A3B8" }}>₪</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0.01"
                max={maxAmount}
                step="0.01"
                placeholder="0.00"
                style={{ width: "100%", height: 40, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 36px 0 12px", fontSize: 14, textAlign: "left", direction: "ltr", boxSizing: "border-box" }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>التاريخ *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: "100%", height: 40, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 12px", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>ملاحظات</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="اختياري..."
              style={{ width: "100%", height: 40, border: "1px solid #E2E8F0", borderRadius: 8, padding: "0 12px", fontSize: 14, textAlign: "right", direction: "rtl", boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #E2E8F0", borderRadius: 8, background: "white", color: "#64748B", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(parseFloat(amount), date, notes.trim())}
            style={{ padding: "9px 20px", border: "none", borderRadius: 8, background: canSave ? "#16A34A" : "#BBF7D0", color: "white", fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed" }}
          >
            تسجيل الدفعة
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function GeneralLedger() {
  const { invoices, payments, purchases, suppliers, customers } = useData();

  const today = todayStr();

  // Manual debt entries (added by user from Add Debt form)
  const [manualDebts, setManualDebts] = useState<Debt[]>([]);
  const manualIdRef = useRef(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DebtStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Add form state
  const [formDebtDirection, setFormDebtDirection] = useState<"علينا" | "لنا">("لنا");
  const [formDebtorName, setFormDebtorName] = useState("");
  const [formDebtorType, setFormDebtorType] = useState<PartyType>("customer");
  const [formCreditorName, setFormCreditorName] = useState("شركة Atlas");
  const [formCreditorType, setFormCreditorType] = useState<PartyType>("company");
  const [formTotal, setFormTotal] = useState("");
  const [formDate, setFormDate] = useState(today);
  const [formDueDate, setFormDueDate] = useState("");
  const [formPaid, setFormPaid] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInvoiceId, setFormInvoiceId] = useState("");

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (showAddPayment) { setShowAddPayment(false); return; }
      if (deleteTarget) return;
      if (selectedDebt) { setSelectedDebt(null); return; }
      if (showAddModal) setShowAddModal(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showAddModal, selectedDebt, deleteTarget, showAddPayment]);

  // ── Auto-derive debts from invoices (ديون لنا — customers owe us) ──────────
  const invoiceDebts = useMemo<Debt[]>(() => {
    return invoices
      .filter(inv => !inv.isDeleted)
      .map(inv => {
        const total = Number(inv.total ?? inv.amount ?? 0);
        const remaining = Number(inv.remainingAmount ?? (inv.status === "Paid" ? 0 : total));
        const paid = total - remaining;
        const dueDate = addDays(inv.date, 30);
        const status = computeStatus(remaining, dueDate, paid, total);
        const customer = customers.find(c => c.id === inv.customerId);
        const paysForInv = payments.filter(p => p.invoiceId === inv.id);
        return {
          id: `INV-${inv.id}`,
          reference: `DEBT-${inv.id}`,
          date: inv.date,
          dueDate,
          debtorName: customer?.name ?? inv.customerId,
          debtorType: "customer" as PartyType,
          creditorName: "شركة Atlas",
          creditorType: "company" as PartyType,
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: remaining,
          status,
          description: `فاتورة ${inv.id}`,
          invoiceId: inv.id,
          createdFrom: "invoice" as const,
          payments: paysForInv.map(p => ({ id: p.id, date: p.date, amount: Number(p.amount), notes: p.notes })),
        };
      })
      .filter(d => d.totalAmount > 0);
  }, [invoices, customers, payments]);

  // ── Auto-derive debts from purchases (ديون علينا — we owe suppliers) ────────
  const purchaseDebts = useMemo<Debt[]>(() => {
    return purchases
      .filter(p => !p.isDeleted && p.status === "Pending")
      .map(p => {
        const supplier = suppliers.find(s => s.id === p.supplierId);
        const dueDate = addDays(p.date, 30);
        const status = computeStatus(p.totalCost, dueDate, 0, p.totalCost);
        return {
          id: `PUR-${p.id}`,
          reference: `DEBT-PUR-${p.id}`,
          date: p.date,
          dueDate,
          debtorName: "شركة Atlas",
          debtorType: "company" as PartyType,
          creditorName: supplier?.name ?? "مورد غير معروف",
          creditorType: "supplier" as PartyType,
          totalAmount: p.totalCost,
          paidAmount: 0,
          remainingAmount: p.totalCost,
          status,
          description: p.notes ?? `طلب شراء — ${supplier?.name ?? p.supplierId}`,
          purchaseId: p.id,
          createdFrom: "purchase" as const,
          payments: [],
        };
      });
  }, [purchases, suppliers]);

  // ── Combined debts ────────────────────────────────────────────────────────
  const allDebts = useMemo<Debt[]>(() => {
    return [...invoiceDebts, ...purchaseDebts, ...manualDebts].sort((a, b) => b.date.localeCompare(a.date));
  }, [invoiceDebts, purchaseDebts, manualDebts]);

  // ── KPI calculations ──────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const weOwe    = allDebts.filter(d => d.debtorType === "company" && d.status !== "مسدد" && d.status !== "ملغي");
    const owedToUs = allDebts.filter(d => d.creditorType === "company" && d.status !== "مسدد" && d.status !== "ملغي");
    const overdue  = allDebts.filter(d => d.status === "متأخر");

    const paidThisMonth = payments.filter(p => isThisMonth(p.date));
    const paidAmountThisMonth = paidThisMonth.reduce((s, p) => s + Number(p.amount || 0), 0);

    return {
      totalWeOwe: weOwe.reduce((s, d) => s + d.remainingAmount, 0),
      countWeOwe: weOwe.length,
      totalOwedToUs: owedToUs.reduce((s, d) => s + d.remainingAmount, 0),
      countOwedToUs: owedToUs.length,
      totalOverdue: overdue.reduce((s, d) => s + d.remainingAmount, 0),
      countOverdue: overdue.length,
      paidThisMonth: paidAmountThisMonth,
      countPaidThisMonth: paidThisMonth.length,
    };
  }, [allDebts, payments]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allDebts.filter(d => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (dateFrom && d.date < dateFrom) return false;
      if (dateTo && d.date > dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [d.reference, d.debtorName, d.creditorName, d.description ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allDebts, statusFilter, dateFrom, dateTo, search]);

  // ── Auto-fill form direction ──────────────────────────────────────────────
  function applyDirection(dir: "علينا" | "لنا") {
    setFormDebtDirection(dir);
    if (dir === "لنا") {
      setFormCreditorName("شركة Atlas");
      setFormCreditorType("company");
    } else {
      setFormDebtorName("شركة Atlas");
      setFormDebtorType("company");
    }
  }

  function openAddModal() {
    setFormDebtDirection("لنا");
    setFormDebtorName("");
    setFormDebtorType("customer");
    setFormCreditorName("شركة Atlas");
    setFormCreditorType("company");
    setFormTotal("");
    setFormDate(today);
    setFormDueDate("");
    setFormPaid("");
    setFormDescription("");
    setFormInvoiceId("");
    setShowAddModal(true);
  }

  function handleSaveDebt() {
    if (!formDebtorName.trim() || !formCreditorName.trim() || !parseFloat(formTotal)) return;
    const total = parseFloat(formTotal);
    const paid = Math.min(parseFloat(formPaid) || 0, total);
    const remaining = total - paid;
    const dueDate = formDueDate || addDays(formDate, 30);
    const id = `MAN-${Date.now()}-${++manualIdRef.current}`;
    const debt: Debt = {
      id,
      reference: `DEBT-${String(manualDebts.length + 1).padStart(4, "0")}`,
      date: formDate,
      dueDate,
      debtorName: formDebtorName.trim(),
      debtorType: formDebtorType,
      creditorName: formCreditorName.trim(),
      creditorType: formCreditorType,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      status: computeStatus(remaining, dueDate, paid, total),
      description: formDescription.trim() || undefined,
      invoiceId: formInvoiceId.trim() || undefined,
      createdFrom: "manual",
      payments: paid > 0 ? [{ id: `PAY-INIT-${id}`, date: formDate, amount: paid, notes: "مبلغ مدفوع مسبقاً" }] : [],
    };
    setManualDebts(prev => [...prev, debt]);
    setShowAddModal(false);
  }

  function handleDeleteDebt(id: string) {
    setManualDebts(prev => prev.filter(d => d.id !== id));
    setSelectedDebt(null);
    setDeleteTarget(null);
  }

  function handleAddPayment(debtId: string, amount: number, date: string, notes: string) {
    setManualDebts(prev => prev.map(d => {
      if (d.id !== debtId) return d;
      const newPaid = d.paidAmount + amount;
      const newRemaining = Math.max(0, d.remainingAmount - amount);
      const newPayment: DebtPaymentRecord = { id: `PAY-${Date.now()}`, date, amount, notes: notes || undefined };
      const newStatus = computeStatus(newRemaining, d.dueDate, newPaid, d.totalAmount);
      return { ...d, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus, payments: [...d.payments, newPayment] };
    }));
    setShowAddPayment(false);
    // Refresh selectedDebt with updated data
    setSelectedDebt(prev => {
      if (!prev || prev.id !== debtId) return prev;
      const newPaid = prev.paidAmount + amount;
      const newRemaining = Math.max(0, prev.remainingAmount - amount);
      const newStatus = computeStatus(newRemaining, prev.dueDate, newPaid, prev.totalAmount);
      const newPayment: DebtPaymentRecord = { id: `PAY-${Date.now()}`, date, amount, notes: notes || undefined };
      return { ...prev, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus, payments: [...prev.payments, newPayment] };
    });
  }

  function exportCsv() {
    const rows = [
      ["Reference", "Date", "DueDate", "Debtor", "Creditor", "Total", "Paid", "Remaining", "Status"],
      ...filtered.map(d => [d.reference, d.date, d.dueDate, d.debtorName, d.creditorName, d.totalAmount, d.paidAmount, d.remainingAmount, d.status]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `debt-register-${today}.csv`;
    a.click();
  }

  // ── KPI card data ─────────────────────────────────────────────────────────
  const kpiCards = [
    { label: "ديون علينا", iconBg: "#FEF2F2", iconColor: "#DC2626", icon: "ti-arrow-up-circle", value: kpi.totalWeOwe, sub: `${kpi.countWeOwe} دين نشط` },
    { label: "ديون لنا",   iconBg: "#F0FDF4", iconColor: "#16A34A", icon: "ti-arrow-down-circle", value: kpi.totalOwedToUs, sub: `${kpi.countOwedToUs} دين نشط` },
    { label: "متأخر السداد", iconBg: "#FEF3C7", iconColor: "#D97706", icon: "ti-clock-exclamation", value: kpi.totalOverdue, sub: `${kpi.countOverdue} دين متأخر` },
    { label: "سُدِّد هذا الشهر", iconBg: "#DCFCE7", iconColor: "#16A34A", icon: "ti-circle-check", value: kpi.paidThisMonth, sub: `${kpi.countPaidThisMonth} دين` },
  ];

  return (
    <Container maxWidth="full" padding="md">
      <div className={styles.page} dir="rtl">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.breadcrumb}>المالية / سجل الديون</p>
            <h1 className={styles.title}>سجل الديون والمديونيات</h1>
            <p className={styles.subtitle}>تتبع الديون المستحقة والمدفوعات</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={exportCsv}>
              تصدير
            </Button>
            <button type="button" className={styles.addDebtBtn} onClick={openAddModal}>
              <Plus size={16} /> إضافة دين جديد
            </button>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className={styles.kpiGrid}>
          {kpiCards.map((card) => (
            <div key={card.label} className={styles.kpi}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${card.icon}`} style={{ fontSize: 18, color: card.iconColor }} />
                </div>
                <span className={styles.kpiLabel}>{card.label}</span>
              </div>
              <strong className={styles.kpiValue} style={{ color: card.iconColor, fontSize: "1.25rem" }}>
                ₪ {fmt(card.value)}
              </strong>
              <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{card.sub}</span>
            </div>
          ))}
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className={styles.filters} style={{ marginBottom: 16 }}>
          <div className={styles.searchWrap}>
            <input
              className={styles.filterInput}
              style={{ width: "100%" }}
              placeholder="بحث بالاسم أو المرجع..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className={styles.filterInput}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "all" | DebtStatus)}
            >
              <option value="all">كل الحالات</option>
              {(Object.keys(STATUS_CONFIG) as DebtStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>من</label>
            <input type="date" className={styles.filterInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>إلى</label>
            <input type="date" className={styles.filterInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className={styles.tableWrap}>
          <table className={`${styles.table} atlas-table`}>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "4%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>رقم الدين</th>
                <th>التاريخ</th>
                <th>المدين (من يدفع)</th>
                <th>الدائن (من يستلم)</th>
                <th style={{ textAlign: "end" }}>المبلغ</th>
                <th style={{ textAlign: "end" }}>المدفوع</th>
                <th style={{ textAlign: "end" }}>الباقي</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(debt => {
                const paidPct = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0;
                const sc = STATUS_CONFIG[debt.status];
                return (
                  <tr key={debt.id} className={styles.clickableRow} onClick={() => setSelectedDebt(debt)}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1E40AF", fontSize: 13 }}>
                        {debt.reference}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748B" }}>{formatDate(debt.date)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <PartyCell name={debt.debtorName} type={debt.debtorType} />
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <PartyCell name={debt.creditorName} type={debt.creditorType} />
                    </td>
                    <td style={{ textAlign: "end", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                      ₪ {fmt(debt.totalAmount)}
                    </td>
                    <td style={{ textAlign: "end", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                      {debt.paidAmount > 0
                        ? <span style={{ color: "#16A34A", fontWeight: 600 }}>₪ {fmt(debt.paidAmount)}</span>
                        : <span style={{ color: "#CBD5E1" }}>—</span>
                      }
                    </td>
                    <td style={{ textAlign: "end" }}>
                      {debt.remainingAmount <= 0
                        ? <span style={{ color: "#16A34A", fontWeight: 600 }}>✓ مسدد</span>
                        : <>
                            <span style={{ color: "#DC2626", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 13, display: "block" }}>
                              ₪ {fmt(debt.remainingAmount)}
                            </span>
                            <ProgressBar pct={paidPct} />
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>{paidPct.toFixed(0)}% مسدد</span>
                          </>
                      }
                    </td>
                    <td>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>
                        {debt.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <TableActions
                        onView={() => setSelectedDebt(debt)}
                        onDelete={debt.createdFrom === "manual" ? () => setDeleteTarget({ id: debt.id, name: debt.reference }) : undefined}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className={styles.empty}>لا توجد ديون تطابق معايير البحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Debt Modal ──────────────────────────────────────────────── */}
      {showAddModal && createPortal(
        <div className={styles.modalBackdrop} style={{ zIndex: 9100 }} onClick={() => setShowAddModal(false)}>
          <div className={styles.addModal} dir="rtl" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>إضافة دين جديد</h2>
                <p className={styles.modalSubtitle}>أدخل تفاصيل الدين</p>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <div className={styles.modalBody}>
              {/* نوع الدين */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>نوع الدين *</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {(["لنا", "علينا"] as const).map(dir => (
                    <label key={dir} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1, padding: "10px 14px", border: `2px solid ${formDebtDirection === dir ? "#2563EB" : "#E2E8F0"}`, borderRadius: 10, background: formDebtDirection === dir ? "#EFF6FF" : "white", transition: "all 150ms ease" }}>
                      <input type="radio" name="debtDir" value={dir} checked={formDebtDirection === dir} onChange={() => applyDirection(dir)} style={{ accentColor: "#2563EB" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: formDebtDirection === dir ? "#1E40AF" : "#475569" }}>
                        {dir === "لنا" ? "دين لنا (نحن الدائن)" : "دين علينا (نحن المدين)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* المدين / الدائن */}
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>المدين (من يدفع) *</label>
                  <input type="text" className={styles.formInput} value={formDebtorName} onChange={e => setFormDebtorName(e.target.value)} placeholder="اسم المدين" />
                  <select className={styles.formInput} style={{ marginTop: 4, height: 34 }} value={formDebtorType} onChange={e => setFormDebtorType(e.target.value as PartyType)}>
                    {PARTY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>الدائن (من يستلم) *</label>
                  <input type="text" className={styles.formInput} value={formCreditorName} onChange={e => setFormCreditorName(e.target.value)} placeholder="اسم الدائن" />
                  <select className={styles.formInput} style={{ marginTop: 4, height: 34 }} value={formCreditorType} onChange={e => setFormCreditorType(e.target.value as PartyType)}>
                    {PARTY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* المبلغ */}
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>المبلغ الكلي *</label>
                  <div className={styles.amountWrap}>
                    <span className={styles.currencyPfx}>₪</span>
                    <input type="number" className={`${styles.formInput} ${styles.formInputDebit}`} value={formTotal} onChange={e => setFormTotal(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>المبلغ المدفوع مسبقاً</label>
                  <div className={styles.amountWrap}>
                    <span className={styles.currencyPfx}>₪</span>
                    <input type="number" className={`${styles.formInput} ${styles.formInputCredit}`} value={formPaid} onChange={e => setFormPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>
              </div>

              {/* التواريخ */}
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>تاريخ الدين *</label>
                  <input type="date" className={styles.formInput} value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>تاريخ الاستحقاق</label>
                  <input type="date" className={styles.formInput} value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
                </div>
              </div>

              {/* الوصف */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>السبب / الوصف</label>
                <textarea className={`${styles.formInput} ${styles.formTextarea}`} rows={2} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="وصف الدين أو سببه..." />
              </div>

              {/* مرتبط بفاتورة */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>مرتبط بفاتورة (اختياري)</label>
                <select className={styles.formInput} value={formInvoiceId} onChange={e => {
                  const inv = invoices.find(i => i.id === e.target.value);
                  setFormInvoiceId(e.target.value);
                  if (inv) {
                    const customer = customers.find(c => c.id === inv.customerId);
                    setFormDebtorName(customer?.name ?? inv.customerId);
                    setFormDebtorType("customer");
                    setFormCreditorName("شركة Atlas");
                    setFormCreditorType("company");
                    setFormTotal(String(inv.total ?? inv.amount ?? ""));
                    setFormDate(inv.date);
                  }
                }}>
                  <option value="">بدون فاتورة</option>
                  {invoices.filter(i => !i.isDeleted).map(i => (
                    <option key={i.id} value={i.id}>{i.id} — {customers.find(c => c.id === i.customerId)?.name ?? i.customerId}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.modalBtnGhost} onClick={() => setShowAddModal(false)}>إلغاء</button>
              <button type="button" className={styles.modalBtnPrimary} onClick={handleSaveDebt} disabled={!formDebtorName.trim() || !formCreditorName.trim() || !parseFloat(formTotal)}>
                حفظ الدين
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Detail Modal ────────────────────────────────────────────────── */}
      {selectedDebt && createPortal(
        <div className={styles.modalBackdrop} style={{ zIndex: 9100 }} onClick={() => { setSelectedDebt(null); setShowAddPayment(false); }}>
          <div className={styles.detailModal} dir="rtl" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: 13, color: "#64748B" }}>{selectedDebt.reference}</span>
                <h2 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 700 }}>
                  {selectedDebt.debtorName} ← {selectedDebt.creditorName}
                </h2>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => { setSelectedDebt(null); setShowAddPayment(false); }}><X size={16} /></button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, padding: "0 24px 24px" }}>
              {/* Hero section */}
              <div style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 16, marginTop: 16 }}>
                <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 6px" }}>الباقي للسداد</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: "#1E40AF", margin: 0, fontVariantNumeric: "tabular-nums" }}>
                  ₪ {fmt(selectedDebt.remainingAmount)}
                </p>
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>من أصل ₪ {fmt(selectedDebt.totalAmount)}</p>
                {(() => {
                  const pct = selectedDebt.totalAmount > 0 ? (selectedDebt.paidAmount / selectedDebt.totalAmount) * 100 : 0;
                  return (
                    <>
                      <div style={{ height: 8, borderRadius: 99, background: "#BFDBFE", marginTop: 12, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: "#2563EB", width: `${Math.min(100, pct)}%`, transition: "width 800ms ease" }} />
                      </div>
                      <p style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{pct.toFixed(0)}% تم سداده</p>
                    </>
                  );
                })()}
              </div>

              {/* Details grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "المدين (من يدفع)", value: <PartyCell name={selectedDebt.debtorName} type={selectedDebt.debtorType} /> },
                  { label: "الدائن (من يستلم)", value: <PartyCell name={selectedDebt.creditorName} type={selectedDebt.creditorType} /> },
                  { label: "المبلغ الكلي", value: `₪ ${fmt(selectedDebt.totalAmount)}` },
                  { label: "المدفوع", value: <span style={{ color: "#16A34A", fontWeight: 600 }}>₪ {fmt(selectedDebt.paidAmount)}</span> },
                  { label: "تاريخ الدين", value: formatDate(selectedDebt.date) },
                  { label: "تاريخ الاستحقاق", value: formatDate(selectedDebt.dueDate) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{value}</span>
                  </div>
                ))}
                {selectedDebt.description && (
                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px", gridColumn: "1 / -1" }}>
                    <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>الوصف</span>
                    <span style={{ fontSize: 13, color: "#475569" }}>{selectedDebt.description}</span>
                  </div>
                )}
                {selectedDebt.invoiceId && (
                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>الفاتورة المرتبطة</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#2563EB", fontFamily: "monospace" }}>{selectedDebt.invoiceId}</span>
                  </div>
                )}
              </div>

              {/* Payment history */}
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#374151" }}>سجل المدفوعات</h4>
                {selectedDebt.payments.length === 0 && (
                  <p style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>لا توجد مدفوعات مسجلة</p>
                )}
                {selectedDebt.payments.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#64748B" }}>{formatDate(p.date)}</span>
                      {p.notes && <span style={{ fontSize: 11, color: "#94A3B8", marginRight: 8 }}>{p.notes}</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", fontVariantNumeric: "tabular-nums" }}>+ ₪ {fmt(p.amount)}</span>
                  </div>
                ))}

                {/* Add payment button */}
                {selectedDebt.remainingAmount > 0 && selectedDebt.createdFrom === "manual" && !showAddPayment && (
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(true)}
                    style={{ marginTop: 12, width: "100%", height: 36, border: "1.5px dashed #BFDBFE", borderRadius: 8, background: "#EFF6FF", color: "#2563EB", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
                  >
                    + تسجيل دفعة جديدة
                  </button>
                )}
                {selectedDebt.remainingAmount > 0 && selectedDebt.createdFrom !== "manual" && (
                  <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 8 }}>
                    المدفوعات تُدار من صفحة الفواتير أو المشتريات
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={styles.detailFooter}>
              {selectedDebt.createdFrom === "manual" && (
                <button type="button" className={styles.detailBtnDelete} onClick={() => setDeleteTarget({ id: selectedDebt.id, name: selectedDebt.reference })}>
                  🗑 حذف
                </button>
              )}
              <button type="button" className={styles.detailBtnGhost} onClick={() => { setSelectedDebt(null); setShowAddPayment(false); }}>
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Add Payment Modal ───────────────────────────────────────────── */}
      {showAddPayment && selectedDebt && createPortal(
        <AddPaymentModal
          debt={selectedDebt}
          onClose={() => setShowAddPayment(false)}
          onSave={(amount, date, notes) => handleAddPayment(selectedDebt.id, amount, date, notes)}
        />,
        document.body,
      )}

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        itemName={deleteTarget?.name ?? ""}
        onConfirm={() => { if (deleteTarget) handleDeleteDebt(deleteTarget.id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}
