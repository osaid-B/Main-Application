import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { TableActions } from "../components/ui/TableActions";

import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccountsMock";
import type { ChartAccount, AccountType, NormalBalance } from "../data/types";
import styles from "./ChartOfAccounts.module.css";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextCode(accounts: ChartAccount[], type: AccountType): string {
  const prefixes: Record<AccountType, number> = { asset: 1000, liability: 2000, equity: 3000, revenue: 4000, expense: 5000 };
  const base = prefixes[type];
  const existing = accounts.filter(a => Number(a.code) >= base && Number(a.code) < base + 1000).map(a => Number(a.code));
  const max = existing.length ? Math.max(...existing) : base;
  return String(max + 10);
}

function getDepth(acc: ChartAccount, accounts: ChartAccount[], d = 0): number {
  if (!acc.parentId) return d;
  const parent = accounts.find(a => a.id === acc.parentId);
  if (!parent) return d;
  return getDepth(parent, accounts, d + 1);
}

// ─── Design constants ─────────────────────────────────────────────────────────

type TypeCfg = { ar: string; color: string; bg: string; border: string };
const TYPE_CFG: Record<AccountType, TypeCfg> = {
  asset:     { ar: "أصول",         color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  liability: { ar: "خصوم",         color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  equity:    { ar: "حقوق الملكية", color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
  revenue:   { ar: "إيرادات",      color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  expense:   { ar: "مصروفات",     color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
};
const DONUT_COLORS: Record<AccountType, string> = {
  asset: "#2563EB", liability: "#DC2626", equity: "#7C3AED", revenue: "#16A34A", expense: "#D97706",
};
const ACCENT: Record<AccountType, string> = {
  asset: "#2563EB", liability: "#DC2626", equity: "#7C3AED", revenue: "#16A34A", expense: "#D97706",
};
const TYPES: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];
const CIRC = 2 * Math.PI * 76;

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, ms = 600) {
  const [val, setVal] = useState(prefersReduced || target === 0 ? target : 0);
  useEffect(() => {
    if (prefersReduced || target === 0) return;
    const start = performance.now();
    let raf: number;
    function step(now: number) {
      const t = Math.min((now - start) / ms, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg, delay }: {
  label: string; value: string; icon: string; iconBg: string; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      style={{
        height: 80, background: "white", border: "1px solid #E2E8F0", borderRadius: 12,
        padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "all 200ms ease", cursor: "default",
        opacity: visible ? 1 : 0,
        transform: prefersReduced ? "none" : (visible ? "translateY(0)" : "translateY(8px)"),
      }}
      onMouseEnter={e => { if (!prefersReduced) { (e.currentTarget).style.transform = "translateY(-2px)"; (e.currentTarget).style.borderColor = "#BFDBFE"; } }}
      onMouseLeave={e => { (e.currentTarget).style.transform = "translateY(0)"; (e.currentTarget).style.borderColor = "#E2E8F0"; }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

const DONUT_GAP = 2; // px gap between segments

function DonutChart({ accounts }: { accounts: ChartAccount[] }) {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState<AccountType | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => { const id = requestAnimationFrame(() => setAnimated(true)); return () => cancelAnimationFrame(id); }, []);

  const counts = useMemo(() => {
    const m: Record<AccountType, number> = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 };
    accounts.forEach(a => { m[a.type]++; });
    return m;
  }, [accounts]);
  const total = accounts.length;

  const segments = useMemo(() => {
    return TYPES.reduce<{ type: AccountType; count: number; drawLen: number; dashOff: number }[]>((acc, type) => {
      const count = counts[type];
      const rawLen = total > 0 ? (count / total) * CIRC : 0;
      const drawLen = count > 0 ? Math.max(0, rawLen - DONUT_GAP) : 0;
      const running = acc.reduce((s, seg) => s + (total > 0 ? (counts[seg.type] / total) * CIRC : 0), 0);
      const dashOff = CIRC / 4 - running;
      acc.push({ type, count, drawLen, dashOff });
      return acc;
    }, []);
  }, [counts, total]);

  return (
    <div style={{
      background: "white", border: "1px solid #E2E8F0", borderRadius: 14,
      padding: "18px 22px", display: "flex", gap: 28, alignItems: "center",
    }} dir="rtl">

      {/* ── Legend ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: "0 0 3px" }}>توزيع الحسابات حسب النوع</p>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 14px" }}>نسبة كل فئة من إجمالي الحسابات</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {TYPES.map(type => {
            const count = counts[type];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isHov = hovered === type;
            return (
              <div
                key={type}
                style={{
                  display: "flex", alignItems: "center", gap: 8, cursor: "default",
                  opacity: hovered !== null && !isHov ? 0.35 : 1,
                  transition: "opacity 150ms ease",
                }}
                onMouseEnter={() => setHovered(type)}
                onMouseLeave={() => setHovered(null)}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: DONUT_COLORS[type], flexShrink: 0,
                  transform: isHov ? "scale(1.4)" : "scale(1)",
                  transition: "transform 150ms ease",
                  display: "inline-block",
                }} />
                <span style={{ flex: 1, fontSize: 12.5, color: "#374151", whiteSpace: "nowrap" }}>{TYPE_CFG[type].ar}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: isHov ? DONUT_COLORS[type] : "#374151", transition: "color 150ms", minWidth: 30, textAlign: "start" }}>{pct}%</span>
                <span style={{ fontSize: 11, color: "#94A3B8", minWidth: 60, textAlign: "start" }}>({count} حساب)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SVG Donut ── */}
      <div style={{ flexShrink: 0, lineHeight: 0 }}>
        <svg viewBox="0 0 200 200" width={200} height={200} style={{ display: "block", overflow: "visible" }}>
          {/* Background track */}
          <circle cx={100} cy={100} r={76} fill="none" stroke="#F1F5F9" strokeWidth={24} />
          {/* Data segments */}
          {segments.map((seg, i) => (
            <circle
              key={seg.type}
              cx={100} cy={100} r={76}
              fill="none"
              stroke={DONUT_COLORS[seg.type]}
              strokeWidth={24}
              strokeLinecap="butt"
              strokeDasharray={`${animated ? seg.drawLen : 0} ${CIRC}`}
              strokeDashoffset={seg.dashOff}
              style={{
                transition: prefersReduced ? "none" : `stroke-dasharray 750ms cubic-bezier(0.4,0,0.2,1) ${i * 90}ms, opacity 150ms ease`,
                opacity: hovered !== null && hovered !== seg.type ? 0.2 : 1,
                cursor: "pointer",
              }}
              onMouseEnter={e => { setHovered(seg.type); setTip({ x: e.clientX, y: e.clientY }); }}
              onMouseLeave={() => { setHovered(null); setTip(null); }}
              onMouseMove={e => setTip({ x: e.clientX, y: e.clientY })}
            />
          ))}
          {/* Center label — perfectly vertically centered */}
          <text x={100} y={94} textAnchor="middle" dominantBaseline="middle" fontSize={30} fontWeight={800} fill="#0F172A"
            style={{ fontVariantNumeric: "tabular-nums", fontFamily: "inherit" }}>{total}</text>
          <text x={100} y={116} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#94A3B8"
            style={{ letterSpacing: 1, fontFamily: "inherit" }}>حساب</text>
        </svg>
      </div>

      {/* Tooltip */}
      {hovered && tip && createPortal(
        <div style={{
          position: "fixed", left: tip.x + 14, top: tip.y - 30,
          background: "#1E293B", color: "white", borderRadius: 8, padding: "6px 12px",
          fontSize: 12, pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap",
        }}>
          {TYPE_CFG[hovered].ar} · {counts[hovered]} حساب · {total > 0 ? Math.round((counts[hovered] / total) * 100) : 0}%
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ id, label, value, options, onChange, openId, setOpenId }: {
  id: string; label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  openId: string | null; setOpenId: (id: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openId === id;
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    function onOut(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpenId(null); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpenId(null); }
    document.addEventListener("mousedown", onOut);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onOut); document.removeEventListener("keydown", onKey); };
  }, [isOpen, setOpenId]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? null : id)}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "white",
          border: "1px solid #E2E8F0", borderRadius: 10, padding: "8px 14px",
          fontSize: 13, color: value !== "all" ? "#2563EB" : "#374151",
          fontWeight: value !== "all" ? 600 : 400, cursor: "pointer",
          transition: "all 150ms", fontFamily: "inherit", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.background = "#F8FAFC"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "white"; }}
      >
        {value !== "all" ? selected?.label : label}
        {value !== "all" && (
          <span onClick={e => { e.stopPropagation(); onChange("all"); }} style={{ cursor: "pointer", color: "#94A3B8", marginInlineStart: 2 }}>×</span>
        )}
        <span style={{ fontSize: 10, color: "#94A3B8" }}>▾</span>
      </button>
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", insetInlineStart: 0,
          background: "white", border: "1px solid #E2E8F0", borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", padding: 6, minWidth: 180, zIndex: 200,
          animation: prefersReduced ? "none" : "coaDropIn 150ms ease-out",
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpenId(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", borderRadius: 8, fontSize: 13,
                background: value === opt.value ? "#EFF6FF" : "transparent",
                color: value === opt.value ? "#2563EB" : "#374151",
                fontWeight: value === opt.value ? 500 : 400,
                border: "none", cursor: "pointer", textAlign: "start", fontFamily: "inherit",
              }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = "transparent"; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function AccountViewModal({ account, accounts, onClose, onEdit, onAddSub, onNavigate }: {
  account: ChartAccount; accounts: ChartAccount[];
  onClose: () => void; onEdit: () => void; onAddSub: () => void; onNavigate: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cfg = TYPE_CFG[account.type];
  const children = accounts.filter(a => a.parentId === account.id);
  const parentAcc = account.parentId ? accounts.find(a => a.id === account.parentId) : null;

  return createPortal(
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "white", borderRadius: 20, width: 540, maxWidth: "90vw",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          animation: prefersReduced ? "none" : "coaModalIn 220ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, background: cfg.bg, color: cfg.color, padding: "4px 10px", borderRadius: 8 }}>{account.code}</span>
            <span style={{ fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: "2px 10px" }}>{cfg.ar}</span>
          </div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, border: "none", background: "#F1F5F9", borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>{account.nameAr}</p>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 20px" }}>{account.nameEn}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "رقم الحساب", value: account.code },
              { label: "النوع", value: cfg.ar },
              { label: "الرصيد الطبيعي", value: account.normalBalance === "debit" ? "↑ مدين" : "↓ دائن" },
              { label: "الرصيد الحالي", value: account.balance ? `₪ ${account.balance.toLocaleString()}` : "—" },
              { label: "الحساب الرئيسي", value: parentAcc ? parentAcc.nameAr : "حساب رئيسي" },
              { label: "الحالة", value: account.isActive ? "✅ نشط" : "⚫ غير نشط" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", margin: "0 0 3px", textTransform: "uppercase" }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
          {children.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: "0 0 10px" }}>الحسابات الفرعية ({children.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {children.map(child => (
                  <div key={child.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: cfg.color, fontWeight: 700 }}>{child.code}</span>
                    <span style={{ fontSize: 13, color: "#0F172A" }}>{child.nameAr}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ display: "flex", gap: 8, padding: "16px 24px", borderTop: "1px solid #F1F5F9", justifyContent: "flex-end" }}>
          <button type="button" onClick={onNavigate} style={{ height: 38, padding: "0 14px", border: "1px solid #E2E8F0", borderRadius: 10, background: "white", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>عرض الحركات</button>
          <button type="button" onClick={onAddSub} style={{ height: 38, padding: "0 14px", border: "1px solid #E2E8F0", borderRadius: 10, background: "white", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>➕ إضافة فرعي</button>
          <button type="button" onClick={onEdit} style={{ height: 38, padding: "0 14px", border: "1px solid #2563EB", borderRadius: 10, background: "#EFF6FF", color: "#2563EB", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>تعديل</button>
          <button type="button" onClick={onClose} style={{ height: 38, padding: "0 14px", border: "1px solid #E2E8F0", borderRadius: 10, background: "white", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>إغلاق</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChartOfAccounts() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.chartOfAccounts;
  const { invoices, payments, expenses } = useData();
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<ChartAccount[]>(CHART_OF_ACCOUNTS);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ChartAccount | null>(null);
  const [form, setForm] = useState({
    code: "", nameAr: "", nameEn: "", type: "asset" as AccountType, parentId: "", normalBalance: "debit" as NormalBalance,
  });
  const [typeFilter, setTypeFilter] = useState<AccountType | "all">("all");
  const [balanceFilter, setBalanceFilter] = useState<"debit" | "credit" | "all">("all");
  const [levelFilter, setLevelFilter] = useState<"main" | "sub" | "detail" | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewAccount, setViewAccount] = useState<ChartAccount | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ itemName: string; onConfirm: () => void } | null>(null);

  // ── Computed balances (unchanged) ─────────────────────────────────────────
  const computedBalances = useMemo(() => {
    const map = new Map<string, number>();
    const rev = payments.filter(p => p.status === "Completed" || p.status === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0);
    const rec = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + Number(i.remainingAmount ?? i.amount ?? 0), 0);
    const exp = expenses.filter(e => !e.isDeleted).reduce((s, e) => s + Number(e.amount || 0), 0);
    map.set("1110", rev * 0.6); map.set("1120", rec);
    map.set("2110", exp * 0.3); map.set("2120", exp * 0.16);
    map.set("4100", rev);
    map.set("5210", exp * 0.45); map.set("5220", exp * 0.15); map.set("5240", exp * 0.10);
    return map;
  }, [invoices, payments, expenses]);

  const getBalance = (acc: ChartAccount) => computedBalances.get(acc.code) ?? acc.balance ?? 0;

  // ── Analytics ─────────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const gb = (a: ChartAccount) => computedBalances.get(a.code) ?? a.balance ?? 0;
    return {
      total: accounts.length,
      assets: accounts.filter(a => a.type === "asset" && !a.isParent).reduce((s, a) => s + gb(a), 0),
      revenue: accounts.filter(a => a.type === "revenue" && !a.isParent).reduce((s, a) => s + gb(a), 0),
      expenses: accounts.filter(a => a.type === "expense" && !a.isParent).reduce((s, a) => s + gb(a), 0),
    };
  }, [accounts, computedBalances]);

  const totalCount = useCountUp(analytics.total);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredAccounts = useMemo(() => {
    let result = accounts;
    if (typeFilter !== "all") result = result.filter(a => a.type === typeFilter);
    if (balanceFilter !== "all") result = result.filter(a => a.normalBalance === balanceFilter);
    if (statusFilter !== "all") result = result.filter(a => statusFilter === "active" ? a.isActive : !a.isActive);
    if (levelFilter !== "all") {
      result = result.filter(a => {
        const d = getDepth(a, accounts);
        if (levelFilter === "main") return d === 0;
        if (levelFilter === "sub") return d === 1;
        return d >= 2;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.code.includes(q) || a.nameAr.toLowerCase().includes(q) ||
        a.nameEn.toLowerCase().includes(q) || a.type.includes(q) ||
        a.normalBalance.includes(q)
      );
    }
    return result;
  }, [accounts, searchQuery, typeFilter, balanceFilter, levelFilter, statusFilter]);

  // ── Existing handlers (unchanged) ─────────────────────────────────────────
  const topLevelParents = accounts.filter(a => a.isParent || !a.parentId);

  function openAdd(parentId?: string) {
    const parentAcc = parentId ? accounts.find(a => a.id === parentId) : null;
    const type: AccountType = parentAcc?.type ?? "asset";
    const nb: NormalBalance = type === "asset" || type === "expense" ? "debit" : "credit";
    let code: string;
    if (parentAcc) {
      const siblings = accounts.filter(a => a.parentId === parentId).map(a => Number(a.code)).filter(n => !isNaN(n));
      code = siblings.length > 0 ? String(Math.max(...siblings) + 10) : String(Number(parentAcc.code) + 10);
    } else {
      code = nextCode(accounts, type);
    }
    setEditTarget(null);
    setForm({ code, nameAr: "", nameEn: "", type, parentId: parentId ?? "", normalBalance: nb });
    setShowModal(true);
  }

  function openEdit(acc: ChartAccount) {
    setEditTarget(acc);
    setForm({ code: acc.code, nameAr: acc.nameAr, nameEn: acc.nameEn, type: acc.type, parentId: acc.parentId ?? "", normalBalance: acc.normalBalance });
    setShowModal(true);
    setViewAccount(null);
  }

  function saveAccount() {
    if (!form.nameAr.trim() || !form.code.trim()) return;
    if (editTarget) {
      setAccounts(prev => prev.map(a => a.id === editTarget.id ? { ...a, ...form } : a));
    } else {
      const id = `ACC-${Date.now()}`;
      setAccounts(prev => [...prev, { id, ...form, parentId: form.parentId || undefined, isActive: true }]);
    }
    setShowModal(false);
  }

  function deactivateAccount(id: string) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: false } : a));
  }

  // ── Active filter pills ────────────────────────────────────────────────────
  const activeFilters: { key: string; label: string; val: string; clear: () => void }[] = [];
  if (typeFilter !== "all") activeFilters.push({ key: "type", label: "النوع", val: TYPE_CFG[typeFilter].ar, clear: () => setTypeFilter("all") });
  if (balanceFilter !== "all") activeFilters.push({ key: "bal", label: "الرصيد", val: balanceFilter === "debit" ? "مدين" : "دائن", clear: () => setBalanceFilter("all") });
  if (levelFilter !== "all") activeFilters.push({ key: "lvl", label: "المستوى", val: levelFilter === "main" ? "رئيسي" : levelFilter === "sub" ? "فرعي" : "تفصيلي", clear: () => setLevelFilter("all") });
  if (statusFilter !== "all") activeFilters.push({ key: "stat", label: "الحالة", val: statusFilter === "active" ? "نشط" : "غير نشط", clear: () => setStatusFilter("all") });

  const isSubAccount = editTarget === null && form.parentId !== "";
  const parentAccForModal = isSubAccount ? accounts.find(a => a.id === form.parentId) : null;

  const typeBadgeCss: Record<AccountType, string> = {
    asset: styles.typeAsset, liability: styles.typeLiability,
    equity: styles.typeEquity, revenue: styles.typeRevenue, expense: styles.typeExpense,
  };

  // Suppress unused var warning on formatCurrency (kept for possible future use)
  void formatCurrency;

  return (
    <Container maxWidth="full" padding="none">
      <div dir="rtl">

        {/* ── Section 1: Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 }}>دليل الحسابات</h1>
            <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>{tc.pageSubtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", border: "1px solid #E2E8F0", borderRadius: 12, background: "white", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              📤 {tc.export}
            </button>
            <button type="button" onClick={() => openAdd()} style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", border: "none", borderRadius: 12, background: "#2563EB", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              + {tc.newAccount}
            </button>
          </div>
        </div>

        {/* ── Section 2: Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
          <StatCard label="إجمالي الحسابات" value={String(totalCount)} icon="📊" iconBg="#EFF6FF" delay={0} />
          <StatCard label="الأصول" value={`₪ ${Math.round(analytics.assets).toLocaleString()}`} icon="🏦" iconBg="#EFF6FF" delay={70} />
          <StatCard label="الإيرادات" value={`₪ ${Math.round(analytics.revenue).toLocaleString()}`} icon="📈" iconBg="#F0FDF4" delay={140} />
          <StatCard label="المصروفات" value={`₪ ${Math.round(analytics.expenses).toLocaleString()}`} icon="📉" iconBg="#FEF2F2" delay={210} />
        </div>

        {/* ── Section 3: Donut ── */}
        <div style={{ marginBottom: 16 }}>
          <DonutChart accounts={accounts} />
        </div>

        {/* ── Section 4: Filters ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <FilterDropdown id="type" label="نوع الحساب" value={typeFilter}
            options={[
              { value: "all", label: "الكل" },
              { value: "asset", label: "🏦 أصول" },
              { value: "liability", label: "⚖️ خصوم" },
              { value: "equity", label: "👥 حقوق الملكية" },
              { value: "revenue", label: "📈 إيرادات" },
              { value: "expense", label: "📉 مصروفات" },
            ]}
            onChange={v => setTypeFilter(v as AccountType | "all")}
            openId={openDropdown} setOpenId={setOpenDropdown}
          />
          <FilterDropdown id="balance" label="الرصيد الطبيعي" value={balanceFilter}
            options={[{ value: "all", label: "الكل" }, { value: "debit", label: "↑ مدين" }, { value: "credit", label: "↓ دائن" }]}
            onChange={v => setBalanceFilter(v as "debit" | "credit" | "all")}
            openId={openDropdown} setOpenId={setOpenDropdown}
          />
          <FilterDropdown id="level" label="مستوى الحساب" value={levelFilter}
            options={[{ value: "all", label: "الكل" }, { value: "main", label: "حسابات رئيسية" }, { value: "sub", label: "حسابات فرعية" }, { value: "detail", label: "حسابات تفصيلية" }]}
            onChange={v => setLevelFilter(v as "main" | "sub" | "detail" | "all")}
            openId={openDropdown} setOpenId={setOpenDropdown}
          />
          <FilterDropdown id="status" label="الحالة" value={statusFilter}
            options={[{ value: "all", label: "الكل" }, { value: "active", label: "✅ نشط" }, { value: "inactive", label: "⚫ غير نشط" }]}
            onChange={v => setStatusFilter(v as "active" | "inactive" | "all")}
            openId={openDropdown} setOpenId={setOpenDropdown}
          />
        </div>
        {activeFilters.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
            {activeFilters.map(f => (
              <span key={f.key} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EFF6FF", color: "#1D4ED8", borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 500 }}>
                {f.label}: {f.val}
                <button type="button" onClick={f.clear} style={{ border: "none", background: "none", cursor: "pointer", color: "#1D4ED8", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <button type="button" onClick={() => { setTypeFilter("all"); setBalanceFilter("all"); setLevelFilter("all"); setStatusFilter("all"); }} style={{ border: "none", background: "none", color: "#94A3B8", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>مسح الكل</button>
            )}
          </div>
        )}

        {/* ── Section 5: Search ── */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#94A3B8", pointerEvents: "none" }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الحساب أو الاسم العربي أو الإنجليزي أو النوع أو الرصيد..."
            style={{
              width: "100%", height: 44, border: "1.5px solid #E2E8F0", borderRadius: 12, outline: "none",
              paddingRight: 44, paddingLeft: searchQuery ? 36 : 16,
              fontSize: 14, color: "#0F172A", textAlign: "right", direction: "rtl",
              transition: "all 150ms ease", boxSizing: "border-box", fontFamily: "inherit",
            }}
            onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", border: "none", background: "#E2E8F0", color: "#64748B", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          )}
        </div>

        {/* ── Section 6: Table ── */}
        <div className="atlas-table-wrapper">
          <table className="atlas-table">
            <colgroup>
              <col className="col-code" />
              <col className="col-entity" />
              <col className="col-badge" />
              <col className="col-badge" />
              <col className="col-currency" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr className="odd:bg-white even:bg-slate-50/50">
                {["رقم الحساب", "اسم الحساب", "النوع", "الرصيد الطبيعي", "الرصيد الحالي", "الإجراءات"].map(h => (
                  <th key={h} className="px-3 py-3 whitespace-nowrap truncate text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b-2 border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center px-3 py-12 text-slate-400">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-sm font-semibold text-slate-600 m-0 mb-2">لا توجد نتائج{searchQuery ? ` لـ «${searchQuery}»` : ""}</p>
                    {(searchQuery || activeFilters.length > 0) && (
                      <button onClick={() => { setSearchQuery(""); setTypeFilter("all"); setBalanceFilter("all"); setLevelFilter("all"); setStatusFilter("all"); }} className="border-none bg-transparent text-blue-600 cursor-pointer text-[13px] font-inherit">مسح البحث</button>
                    )}
                  </td>
                </tr>
              ) : filteredAccounts.map((acc, idx) => {
                const depth = getDepth(acc, accounts);
                const isMain = depth === 0;
                const isSub = depth === 1;
                const bal = getBalance(acc);
                const cfg = TYPE_CFG[acc.type];
                const padStart = depth === 0 ? 12 : depth === 1 ? 28 : 44;
                const delay = Math.min(idx * 20, 800);

                return (
                  <tr
                    key={acc.id}
                    onClick={() => setViewAccount(acc)}
                    className={`cursor-pointer ${isMain ? "bg-slate-50/50" : "odd:bg-white even:bg-slate-50/30"}`}
                    style={{
                      borderBottom: `1px solid ${isMain ? "#E2E8F0" : isSub ? "#F1F5F9" : "#F8FAFC"}`,
                      opacity: 0,
                      animation: prefersReduced ? "none" : `coaRowIn 200ms ease-out ${delay}ms forwards`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(239,246,255,0.6)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = isMain ? "rgb(248 250 252)" : ""; }}
                  >
                    <td className="col-code px-3 py-3 whitespace-nowrap truncate" style={{ borderRight: `3px solid ${ACCENT[acc.type]}` }}>
                      <span className="font-mono text-sm font-bold" style={{ color: cfg.color }}>{acc.code}</span>
                    </td>
                    <td className="col-entity px-3 py-3 whitespace-nowrap truncate" style={{ paddingRight: padStart }}>
                      <span className={`block ${isMain ? "text-sm font-bold text-slate-900" : isSub ? "text-[13px] font-semibold text-slate-800" : "text-[13px] font-normal text-slate-600"}`}>{acc.nameAr}</span>
                      <span className="block text-[11px] text-slate-400">{acc.nameEn}</span>
                    </td>
                    <td className="col-badge px-3 py-3 whitespace-nowrap truncate">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.ar}</span>
                    </td>
                    <td className="col-badge px-3 py-3 whitespace-nowrap truncate">
                      <span className="text-[13px] font-medium" style={{ color: acc.normalBalance === "debit" ? "#2563EB" : "#7C3AED" }}>
                        {acc.normalBalance === "debit" ? "↑ مدين" : "↓ دائن"}
                      </span>
                    </td>
                    <td className="col-currency px-3 py-3 whitespace-nowrap truncate font-mono tabular-nums">
                      {bal > 0 ? (
                        <span className="text-emerald-600 font-semibold">₪ {Math.round(bal).toLocaleString()}</span>
                      ) : bal < 0 ? (
                        <span className="text-red-600 font-semibold">₪ ({Math.round(Math.abs(bal)).toLocaleString()})</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="col-actions px-3 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <TableActions
                        onView={() => setViewAccount(acc)}
                        onEdit={() => openEdit(acc)}
                        onAdd={() => openAdd(acc.id)}
                        onDelete={!acc.isParent && acc.isActive ? () => setDeleteConfirmItem({ itemName: `${acc.code} - ${acc.nameAr}`, onConfirm: () => deactivateAccount(acc.id) }) : undefined}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Footer */}
          <div className="px-4 py-3 text-[13px] text-slate-500 border-t border-slate-100">
            عرض <strong>{filteredAccounts.length}</strong> من <strong>{accounts.length}</strong> حساب
            {filteredAccounts.length < accounts.length && <span className="text-blue-600 mr-1.5">· فلتر نشط</span>}
          </div>
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes coaRowIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
          @keyframes coaModalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
          @keyframes coaDropIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
          @keyframes coaTipIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        `}</style>
      </div>

      {/* View Modal */}
      {viewAccount && (
        <AccountViewModal
          account={viewAccount}
          accounts={accounts}
          onClose={() => setViewAccount(null)}
          onEdit={() => openEdit(viewAccount)}
          onAddSub={() => { openAdd(viewAccount.id); setViewAccount(null); }}
          onNavigate={() => { navigate(`/general-ledger?account=${viewAccount.code}`); setViewAccount(null); }}
        />
      )}

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmItem !== null}
        itemName={deleteConfirmItem?.itemName ?? ""}
        onConfirm={() => { deleteConfirmItem?.onConfirm(); setDeleteConfirmItem(null); }}
        onCancel={() => setDeleteConfirmItem(null)}
      />

      {/* Add / Edit Modal (existing, unchanged) */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? tc.form.editTitle : isSubAccount ? "إضافة حساب فرعي" : tc.form.createTitle}
        size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={saveAccount}>{t.common.save}</Button>
          </div>
        }
      >
        {isSubAccount && parentAccForModal && (
          <div className={styles.parentInfoBox}>
            <div className={styles.parentInfoRow}>
              <span className={styles.parentInfoLabel}>الحساب الأب</span>
              <span><strong>{parentAccForModal.code}</strong> — {isArabic ? parentAccForModal.nameAr : parentAccForModal.nameEn}</span>
            </div>
            <div className={styles.parentInfoRow}>
              <span className={styles.parentInfoLabel}>النوع</span>
              <span className={`${styles.typeBadge} ${typeBadgeCss[parentAccForModal.type]}`}>{tc.types[parentAccForModal.type]}</span>
            </div>
            <div className={styles.parentInfoRow}>
              <span className={styles.parentInfoLabel}>الرصيد الطبيعي</span>
              <span>{parentAccForModal.normalBalance === "debit" ? tc.normalDebit : tc.normalCredit}</span>
            </div>
          </div>
        )}
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.code}</label>
            <input className={styles.formInput} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          {!isSubAccount ? (
            <div className={styles.formField}>
              <label className={styles.formLabel}>{tc.form.type}</label>
              <select className={styles.formSelect} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}>
                {(["asset","liability","equity","revenue","expense"] as AccountType[]).map(tp => (
                  <option key={tp} value={tp}>{tc.types[tp]}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.formField}>
              <label className={styles.formLabel}>{tc.form.type}</label>
              <input className={styles.formInput} value={tc.types[form.type]} readOnly style={{ color: "var(--app-text-muted)", cursor: "default", background: "var(--app-surface-muted)" }} />
            </div>
          )}
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.nameAr}</label>
            <input className={styles.formInput} value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} dir="rtl" />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.nameEn}</label>
            <input className={styles.formInput} value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} />
          </div>
          {!isSubAccount && (
            <>
              <div className={styles.formField}>
                <label className={styles.formLabel}>{tc.form.parent}</label>
                <select className={styles.formSelect} value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <option value="">{tc.form.noParent}</option>
                  {topLevelParents.map(p => (
                    <option key={p.id} value={p.id}>{p.code} — {isArabic ? p.nameAr : p.nameEn}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>{tc.form.normalBalance}</label>
                <select className={styles.formSelect} value={form.normalBalance} onChange={e => setForm(f => ({ ...f, normalBalance: e.target.value as NormalBalance }))}>
                  <option value="debit">{tc.normalDebit}</option>
                  <option value="credit">{tc.normalCredit}</option>
                </select>
              </div>
            </>
          )}
          {isSubAccount && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>{tc.form.normalBalance}</label>
              <input className={styles.formInput} value={form.normalBalance === "debit" ? tc.normalDebit : tc.normalCredit} readOnly style={{ color: "var(--app-text-muted)", cursor: "default", background: "var(--app-surface-muted)" }} />
            </div>
          )}
        </div>
      </Modal>
    </Container>
  );
}
