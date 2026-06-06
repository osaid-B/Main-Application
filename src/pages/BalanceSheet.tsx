import { useEffect, useMemo, useState } from "react";
import { Container } from "../components/layout/Container";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";


const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Constants (UNCHANGED) ────────────────────────────────────────────────────
const PAID_IN_CAPITAL = 500_000;
const PROPERTY_EQUIPMENT = 120_000;
const ACCUMULATED_DEPRECIATION = 28_000;
const LONG_TERM_LOANS = 75_000;
const OTHER_CURRENT_ASSETS = 15_000;
const ACCRUED_EXPENSES_FIXED = 8_000;
const LEGAL_RESERVE = 25_000;

// ─── Amount formatting ────────────────────────────────────────────────────────

function Amt({ v, neg = false }: { v: number; neg?: boolean }) {
  if (v === 0) return <span style={{ color: "#CBD5E1" }}>—</span>;
  const abs = Math.abs(v);
  const str = `₪ ${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (neg || v < 0)
    return <span style={{ color: "#DC2626", fontStyle: "italic" }}>( {str} )</span>;
  return <>{str}</>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg, iconColor, delay, subLabel }: {
  label: string; value: string; icon: string;
  iconBg: string; iconColor: string; delay: number; subLabel?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      style={{
        height: 88, background: "white", border: "1px solid #E2E8F0", borderRadius: 12,
        padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "all 200ms ease", cursor: "default",
        opacity: visible ? 1 : 0,
        transform: prefersReduced ? "none" : (visible ? "translateY(0)" : "translateY(8px)"),
      }}
      onMouseEnter={e => { if (!prefersReduced) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{value}</span>
        {subLabel && <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{subLabel}</span>}
      </div>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
    </div>
  );
}

// ─── Table Row Primitives ─────────────────────────────────────────────────────

function SectionHeader({ label, accentColor, side }: { label: string; accentColor: string; side: "assets" | "liabilities" }) {
  const bg = side === "assets"
    ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)"
    : "linear-gradient(135deg, #FEF2F2, #FEE2E2)";
  const color = side === "assets" ? "#1E40AF" : "#B91C1C";
  const border = side === "assets" ? "#BFDBFE" : "#FECACA";
  return (
    <tr style={{ animation: prefersReduced ? "none" : "bsRowIn 200ms ease-out forwards" }}>
      <td colSpan={2} style={{
        backgroundImage: bg, color, fontWeight: 700, fontSize: 16,
        padding: "16px 20px", borderBottom: `2px solid ${border}`,
        borderLeft: `3px solid ${accentColor}`,
      }}>
        {label}
      </td>
    </tr>
  );
}

function GroupRow({ label, accentColor, delay }: { label: string; accentColor: string; delay: number }) {
  return (
    <tr style={{ animation: prefersReduced ? "none" : `bsRowIn 200ms ease-out ${delay}ms forwards`, opacity: 0 }}>
      <td colSpan={2} style={{
        background: "#F8FAFC", padding: "10px 20px",
        fontSize: 13, fontWeight: 700, color: "#374151",
        borderBottom: "1px solid #F1F5F9",
        borderLeft: `3px solid ${accentColor}`,
      }}>
        {label}
      </td>
    </tr>
  );
}

function LineRow({ label, value, neg = false, delay }: { label: string; value: number; neg?: boolean; delay: number }) {
  return (
    <tr
      style={{ animation: prefersReduced ? "none" : `bsRowIn 200ms ease-out ${delay}ms forwards`, opacity: 0 }}
      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#F8FAFC"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
    >
      <td style={{ padding: "10px 20px 10px 36px", fontSize: 13, color: "#475569", borderBottom: "1px solid #F8FAFC" }}>{label}</td>
      <td style={{
        padding: "10px 20px", fontSize: 13, fontWeight: 500,
        fontVariantNumeric: "tabular-nums", textAlign: "end",
        borderBottom: "1px solid #F8FAFC", whiteSpace: "nowrap",
      }}>
        <Amt v={value} neg={neg} />
      </td>
    </tr>
  );
}

function SubtotalRow({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  return (
    <tr style={{ animation: prefersReduced ? "none" : `bsRowIn 200ms ease-out ${delay}ms forwards`, opacity: 0 }}>
      <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#0F172A", background: "#F1F5F9", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>{label}</td>
      <td style={{
        padding: "10px 20px", fontSize: 13, fontWeight: 700,
        fontVariantNumeric: "tabular-nums", textAlign: "end",
        background: "#F1F5F9", borderTop: "1px solid #E2E8F0",
        borderBottom: "1px solid #E2E8F0", color, whiteSpace: "nowrap",
      }}>
        <Amt v={value} />
      </td>
    </tr>
  );
}

function GrandTotalRow({ label, value, gradient, color, textColor, delay }: {
  label: string; value: number; gradient: string; color: string; textColor: string; delay: number;
}) {
  return (
    <tr style={{ animation: prefersReduced ? "none" : `bsRowIn 200ms ease-out ${delay}ms forwards`, opacity: 0 }}>
      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 800, color: textColor, backgroundImage: gradient }}>{label}</td>
      <td style={{
        padding: "14px 20px", fontSize: 15, fontWeight: 800,
        fontVariantNumeric: "tabular-nums", textAlign: "end",
        backgroundImage: gradient, color, whiteSpace: "nowrap",
      }}>
        <Amt v={value} />
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BalanceSheet() {
  const { t, isArabic } = useSettings();
  const tc = t.balanceSheet;
  const { receivablesTotal, products, payablesDue, payments, expenses } = useData();

  const today = new Date().toISOString().slice(0, 10);
  const [asOf, setAsOf] = useState(today);
  const companyName = isArabic ? "أطلس لإدارة الأعمال" : "Atlas Business Management";

  // ── Balance sheet computation (UNCHANGED) ─────────────────────────────────
  const bs = useMemo(() => {
    const cash = payments
      .filter((p) => p.status === "Completed" || p.status === "Paid")
      .reduce((s, p) => s + Number(p.amount || 0), 0) * 0.6;

    const inventoryValue = products
      .filter((p) => !p.isDeleted && !p.archived)
      .reduce((s, p) => s + p.stock * (p.purchasePrice ?? p.price * 0.6), 0);

    const totalCurrentAssets = cash + receivablesTotal + inventoryValue + OTHER_CURRENT_ASSETS;
    const netFixedAssets = PROPERTY_EQUIPMENT - ACCUMULATED_DEPRECIATION;
    const totalNonCurrentAssets = netFixedAssets;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const vatPayable = expenses
      .filter((e) => !e.isDeleted)
      .reduce((s, e) => s + Number(e.amount || 0), 0) * 0.16;
    const totalCurrentLiabilities = payablesDue + vatPayable + ACCRUED_EXPENSES_FIXED;
    const totalLongTermLiabilities = LONG_TERM_LOANS;
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    const retainedEarnings = totalAssets - totalLiabilities - PAID_IN_CAPITAL - LEGAL_RESERVE;
    const totalEquity = PAID_IN_CAPITAL + retainedEarnings + LEGAL_RESERVE;
    const totalLE = totalLiabilities + totalEquity;

    return {
      cash, receivablesTotal, inventoryValue,
      totalCurrentAssets, netFixedAssets, totalNonCurrentAssets, totalAssets,
      payablesDue, vatPayable, totalCurrentLiabilities,
      totalLongTermLiabilities, totalLiabilities,
      retainedEarnings, totalEquity, totalLE,
      balanced: Math.abs(totalAssets - totalLE) < 1,
    };
  }, [payments, products, receivablesTotal, payablesDue, expenses]);

  // ── Amount helpers for stat cards ─────────────────────────────────────────
  function fmtStat(v: number) {
    return `₪ ${Math.round(v).toLocaleString("en-US")}`;
  }

  return (
    <Container maxWidth="full" padding="md">
      <div dir="rtl">

        {/* ── Section 1: Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 4px" }}>التقارير / الميزانية العمومية</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>الميزانية العمومية</h1>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>المركز المالي حتى التاريخ المحدد</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }} className="no-print">
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              style={{
                height: 40, border: "1px solid #E2E8F0", borderRadius: 10,
                padding: "0 14px", fontSize: 14, color: "#0F172A",
                background: "white", outline: "none", cursor: "pointer",
                fontFamily: "inherit", transition: "all 150ms ease",
              }}
              onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
            />
            <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 16px", border: "1px solid #E2E8F0", borderRadius: 10, background: "white", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              📊 {tc.exportCsv}
            </button>
            <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 16px", border: "none", borderRadius: 10, background: "#2563EB", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              📄 {tc.exportPdf}
            </button>
          </div>
        </div>

        {/* ── Section 2: Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }} className="no-print">
          <StatCard
            label="إجمالي الأصول" value={fmtStat(bs.totalAssets)}
            icon="🏦" iconBg="#EFF6FF" iconColor="#2563EB" delay={0}
          />
          <StatCard
            label="إجمالي الخصوم" value={fmtStat(bs.totalLiabilities)}
            icon="⚖️" iconBg="#FEF2F2" iconColor="#DC2626" delay={70}
          />
          <StatCard
            label="حقوق الملكية" value={fmtStat(bs.totalEquity)}
            icon="👥" iconBg="#F5F3FF" iconColor="#7C3AED" delay={140}
          />
          <StatCard
            label="توازن الميزانية"
            value={bs.balanced ? "متوازنة" : "غير متوازنة"}
            icon={bs.balanced ? "✅" : "⚠️"}
            iconBg={bs.balanced ? "#F0FDF4" : "#FEF2F2"}
            iconColor={bs.balanced ? "#16A34A" : "#DC2626"}
            delay={210}
            subLabel={bs.balanced ? "الأصول = الخصوم + حقوق الملكية" : undefined}
          />
        </div>

        {/* ── Section 3: Company Header ── */}
        <div style={{ textAlign: "center", marginBottom: 12, padding: "16px 0" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>{companyName}</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>{tc.pageTitle}</p>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>{tc.asOf} {asOf}</p>
        </div>

        {/* ── Section 3: Balance Sheet Table ── */}
        <div
          key={asOf}
          className="balance-sheet-container"
          style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}
        >
          <div className="bs-columns" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

            {/* ── Assets Column ── */}
            <div style={{ borderLeft: "1px solid #E2E8F0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <tbody>
                  {/* Header */}
                  <SectionHeader label={tc.assets} accentColor="#2563EB" side="assets" />

                  {/* Current Assets */}
                  <GroupRow label={tc.currentAssets} accentColor="#2563EB" delay={40} />
                  <LineRow label={tc.cash} value={bs.cash} delay={60} />
                  <LineRow label={tc.receivables} value={bs.receivablesTotal} delay={80} />
                  <LineRow label={tc.inventory} value={bs.inventoryValue} delay={100} />
                  <LineRow label={tc.otherCurrentAssets} value={OTHER_CURRENT_ASSETS} delay={120} />
                  <SubtotalRow label={tc.totalCurrentAssets} value={bs.totalCurrentAssets} color="#1D4ED8" delay={140} />

                  {/* Non-Current Assets */}
                  <GroupRow label={tc.nonCurrentAssets} accentColor="#1D4ED8" delay={160} />
                  <LineRow label={tc.propertyEquipment} value={PROPERTY_EQUIPMENT} delay={180} />
                  <LineRow label={tc.accumulatedDepreciation} value={ACCUMULATED_DEPRECIATION} neg delay={200} />
                  <LineRow label={tc.netFixedAssets} value={bs.netFixedAssets} delay={220} />
                  <SubtotalRow label={tc.totalNonCurrentAssets} value={bs.totalNonCurrentAssets} color="#1D4ED8" delay={240} />

                  {/* Grand Total */}
                  <GrandTotalRow
                    label={tc.totalAssets} value={bs.totalAssets}
                    gradient="linear-gradient(135deg, #EFF6FF, #DBEAFE)"
                    color="#1E40AF" textColor="#1E40AF" delay={260}
                  />
                </tbody>
              </table>
            </div>

            {/* ── Liabilities & Equity Column ── */}
            <div>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <tbody>
                  {/* Header */}
                  <SectionHeader label={tc.liabilitiesEquity} accentColor="#DC2626" side="liabilities" />

                  {/* Current Liabilities */}
                  <GroupRow label={tc.currentLiabilities} accentColor="#DC2626" delay={40} />
                  <LineRow label={tc.accountsPayable} value={bs.payablesDue} delay={60} />
                  <LineRow label={tc.vatPayable} value={bs.vatPayable} delay={80} />
                  <LineRow label={tc.accruedExpenses} value={ACCRUED_EXPENSES_FIXED} delay={100} />
                  <SubtotalRow label={tc.totalCurrentLiabilities} value={bs.totalCurrentLiabilities} color="#DC2626" delay={120} />

                  {/* Long-term Liabilities */}
                  <GroupRow label={tc.longTermLiabilities} accentColor="#B91C1C" delay={140} />
                  <LineRow label={tc.longTermLoans} value={LONG_TERM_LOANS} delay={160} />
                  <SubtotalRow label={tc.totalLongTermLiabilities} value={bs.totalLongTermLiabilities} color="#B91C1C" delay={180} />
                  <SubtotalRow label={tc.totalLiabilities} value={bs.totalLiabilities} color="#B91C1C" delay={200} />

                  {/* Equity */}
                  <GroupRow label={tc.equity} accentColor="#7C3AED" delay={220} />
                  <LineRow label={tc.paidInCapital} value={PAID_IN_CAPITAL} delay={240} />
                  <LineRow label={tc.retainedEarnings} value={Math.max(0, bs.retainedEarnings)} delay={260} />
                  <LineRow label="الاحتياطي القانوني" value={LEGAL_RESERVE} delay={280} />
                  <SubtotalRow label={tc.totalEquity} value={bs.totalEquity} color="#7C3AED" delay={300} />

                  {/* Grand Total */}
                  <GrandTotalRow
                    label={tc.totalLiabilitiesEquity} value={bs.totalLE}
                    gradient="linear-gradient(135deg, #FEF2F2, #FEE2E2)"
                    color="#B91C1C" textColor="#B91C1C" delay={320}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Balance Check Row ── */}
          <div style={{
            padding: "12px 20px", textAlign: "center", fontWeight: 600, fontSize: 13,
            background: bs.balanced ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${bs.balanced ? "#BBF7D0" : "#FECACA"}`,
            color: bs.balanced ? "#15803D" : "#B91C1C",
            borderTop: `1px solid ${bs.balanced ? "#BBF7D0" : "#FECACA"}`,
          }}>
            {bs.balanced
              ? "✓ معادلة الحسابات متوازنة — الأصول = الخصوم + حقوق الملكية"
              : "⚠ الميزانية غير متوازنة — يرجى مراجعة الحسابات"}
          </div>
        </div>

        {/* Keyframes + responsive + print */}
        <style>{`
          @keyframes bsRowIn {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 768px) {
            .bs-columns { grid-template-columns: 1fr !important; }
            .bs-columns > div { border-left: none !important; border-top: 1px solid #E2E8F0; }
          }
          @media print {
            .no-print { display: none !important; }
            .balance-sheet-container { border: none !important; box-shadow: none !important; }
          }
        `}</style>
      </div>
    </Container>
  );
}
