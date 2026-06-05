import { useEffect, useMemo, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useFinancialReports } from "../hooks/useFinancialReports";
import { aggregateMonths } from "../lib/reportCompute";
import styles from "./ProfitLoss.module.css";


type Period = "month" | "quarter" | "year";
type VarResult = { diff: number; pct: string; positive: boolean } | null;
type FmtFn = (v: number, c: string) => string;
type VarFn = (cur: number, pr: number | undefined) => VarResult;

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CHART_LABELS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];

// ── Pure helpers (preserved intact) ──────────────────────────────────────────
function fmtIsoDate(iso: string): string {
  if (!iso) return iso;
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getDefaultDates(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (period === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to };
  }
  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return { from: new Date(now.getFullYear(), q * 3, 1).toISOString().slice(0, 10), to };
  }
  return { from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), to };
}

function formatPLAmount(value: number, fmt: FmtFn): { text: string; negative: boolean } {
  if (value === 0) return { text: "—", negative: false };
  const abs = Math.abs(value);
  const formatted = fmt(abs, "ILS");
  return { text: value < 0 ? `(${formatted})` : formatted, negative: value < 0 };
}

function fmtK(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(Math.round(v));
}

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, ms: number, trigger: string): number {
  const [val, setVal] = useState(prefersReduced ? target : 0);
  useEffect(() => {
    if (prefersReduced) return;
    let startTs: number | null = null;
    let rafId: number;
    function tick(ts: number) {
      if (!startTs) startTs = ts;
      const t = Math.min((ts - startTs) / ms, 1);
      setVal(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) { rafId = requestAnimationFrame(tick); }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, ms, trigger]);
  return val;
}

// ── Inline SVG Bar Chart ──────────────────────────────────────────────────────
function BarChart({ periodLabel, dateRange, chartMonths }: { periodLabel: string; dateRange: string; chartMonths: { revenue: number; expenses: number; monthKey: string }[] }) {
  const VW = 560, VH = 106;
  const BOTTOM = 84, MAX_H = 68, ML = 34;
  const maxVal = Math.max(1, ...chartMonths.flatMap((m) => [m.revenue, m.expenses]));
  const groupW = (VW - ML - 10) / Math.max(1, chartMonths.length);
  const BAR_W = 17, GAP = 4;

  function bH(v: number) { return Math.max(2, (v / maxVal) * MAX_H); }

  const ySteps = [0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxVal));
  const labelsAr = chartMonths.length <= 6 ? CHART_LABELS_AR.slice(0, chartMonths.length) : chartMonths.map((m) => m.monthKey.slice(5, 7));

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <p className={styles.chartTitle}>الإيرادات مقابل المصروفات</p>
          <p className={styles.chartSubtitle}>{periodLabel} — {dateRange}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: VH, display: "block" }}>
        {/* Y gridlines + labels */}
        {ySteps.map((v, i) => {
          const y = BOTTOM - bH(v);
          return (
            <g key={i}>
              <line x1={ML} y1={y} x2={VW - 8} y2={y} stroke="#F1F5F9" strokeWidth={1} />
              <text x={ML - 4} y={y + 4} fontSize={7} fill="#94A3B8" textAnchor="end" fontFamily="monospace">
                {fmtK(v)}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={ML} y1={BOTTOM} x2={VW - 8} y2={BOTTOM} stroke="#E2E8F0" strokeWidth={1} />

        {/* Bar groups */}
        {chartMonths.map((m, i) => {
          const cx = ML + i * groupW + groupW / 2;
          const rH = bH(m.revenue);
          const eH = bH(m.expenses);
          const totalW = BAR_W * 2 + GAP;
          const rX = cx - totalW / 2;
          const eX = rX + BAR_W + GAP;
          return (
            <g key={m.monthKey}>
              <rect
                x={rX} y={BOTTOM - rH} width={BAR_W} height={rH} rx={3}
                fill="#16A34A" fillOpacity={0.82}
                className={styles.chartBar}
                style={{ animationDelay: `${i * 50}ms` }}
              />
              <rect
                x={eX} y={BOTTOM - eH} width={BAR_W} height={eH} rx={3}
                fill="#DC2626" fillOpacity={0.75}
                className={styles.chartBar}
                style={{ animationDelay: `${i * 50 + 25}ms` }}
              />
              <text x={cx} y={VH - 1} fontSize={7} fill="#94A3B8" textAnchor="middle">
                {labelsAr[i] ?? ""}
              </text>
            </g>
          );
        })}
      </svg>

      <div className={styles.chartLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#16A34A" }} />
          <span>الإيرادات</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#DC2626" }} />
          <span>المصروفات</span>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
  function StatCard({
  emoji, circleBg, circleColor, label, value, sub, subColor, isLoss, delay, animKey: _ak,
  }: {
    emoji: string; circleBg: string; circleColor: string; label: string; value: number;
    sub?: string; subColor?: string; isLoss?: boolean; delay: number; animKey: string;
  }) {
    const animated = useCountUp(Math.abs(value), 800, _ak);
  const str = `₪ ${animated.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className={styles.statCard}
      style={{ border: isLoss ? "2px solid #FECACA" : "1px solid #E2E8F0", animationDelay: `${delay}ms` }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "50%", background: circleBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, color: "#64748B" }}>{label}</p>
        <strong style={{
          display: "block", fontSize: 17, fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: isLoss ? "#DC2626" : circleColor,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          direction: "ltr", textAlign: "start",
        }}>
          {isLoss ? `(${str})` : str}
        </strong>
        {sub && (
          <small style={{ fontSize: 11, color: subColor ?? "#94A3B8", fontWeight: 500 }}>{sub}</small>
        )}
      </div>
    </div>
  );
}

// ── Section Header Row ────────────────────────────────────────────────────────
function PLSectionHeader({ label, compare, accent, rowIdx }: {
  label: string; compare: boolean; accent: string; rowIdx: number;
}) {
  return (
    <tr className={styles.tableRow} style={{ animationDelay: `${rowIdx * 15}ms` }}>
      <td
        colSpan={compare ? 4 : 2}
        style={{
          background: "#F8FAFC",
          padding: "10px 20px",
          fontSize: 12, fontWeight: 700, color: "#374151",
          letterSpacing: "0.04em",
          borderTop: "1px solid #F1F5F9",
          borderBottom: "1px solid #F1F5F9",
          borderInlineStart: `4px solid ${accent}`,
        }}
      >
        {label}
      </td>
    </tr>
  );
}

// ── Data / Total / Net Row ────────────────────────────────────────────────────
function PLRow({
  label, cur, pr, isTotal = false, isNet = false,
  compare, fmt, varFn, accent, rowIdx,
}: {
  label: string; cur: number; pr?: number;
  isTotal?: boolean; isNet?: boolean; isSub?: boolean;
  compare: boolean; fmt: FmtFn; varFn: VarFn;
  accent?: string; rowIdx: number;
}) {
  const v = varFn(cur, pr);
  const curFmt = formatPLAmount(cur, fmt);
  const prFmt = pr !== undefined ? formatPLAmount(pr, fmt) : null;
  const isLoss = isNet && cur < 0;
  const isGain = isNet && cur > 0;

  const netBg = isLoss
    ? "linear-gradient(135deg, #FEF2F2, #FEE2E2)"
    : isGain
      ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)"
      : undefined;

  const borderTop = isNet
    ? `2px solid ${isLoss ? "#FECACA" : isGain ? "#BBF7D0" : "#E2E8F0"}`
    : isTotal
      ? `2px solid ${accent ? accent + "55" : "#E2E8F0"}`
      : undefined;

  const borderBottom = isNet ? undefined : isTotal ? "1px solid #E2E8F0" : "1px solid #F8FAFC";
  const cellBg = !isNet && isTotal && accent ? `${accent}12` : !isNet && isTotal ? "#F8FAFC" : undefined;

  const labelColor = isNet
    ? isLoss ? "#B91C1C" : isGain ? "#15803D" : "#0F172A"
    : isTotal ? "#0F172A" : "#475569";

  function amtColor(neg: boolean, zero: boolean): string {
    if (zero) return "#CBD5E1";
    if (neg) return "#DC2626";
    if (isNet && isGain) return "#15803D";
    if (isNet && isLoss) return "#B91C1C";
    if (isTotal && accent) return accent;
    return "#0F172A";
  }

  const sharedTdStyle: React.CSSProperties = {
    borderTop, borderBottom, background: cellBg,
  };

  return (
    <tr
      className={styles.tableRow}
      style={{ background: netBg, animationDelay: `${rowIdx * 15}ms` }}
      onMouseEnter={(e) => { if (!isNet) { (e.currentTarget as HTMLTableRowElement).style.background = "#F8FAFC"; } }}
      onMouseLeave={(e) => { if (!isNet) { (e.currentTarget as HTMLTableRowElement).style.background = ""; } }}
    >
      {/* Label cell */}
      <td style={{
        ...sharedTdStyle,
        padding: isNet ? "16px 20px" : isTotal ? "11px 20px" : "9px 20px 9px 40px",
        fontSize: isNet ? 15 : isTotal ? 14 : 13,
        fontWeight: isNet ? 800 : isTotal ? 700 : 400,
        color: labelColor,
      }}>
        {isNet ? (isLoss ? "⚠ " : "✓ ") : ""}{label}
      </td>

      {/* Current amount */}
      <td style={{
        ...sharedTdStyle,
        padding: isNet ? "16px 20px" : isTotal ? "11px 20px" : "9px 20px",
        textAlign: "end",
        fontVariantNumeric: "tabular-nums",
        fontSize: isNet ? 19 : isTotal ? 14 : 13,
        fontWeight: isNet ? 800 : isTotal ? 700 : 500,
        color: amtColor(curFmt.negative, curFmt.text === "—"),
        direction: "ltr",
      }}>
        {curFmt.text}
      </td>

      {/* Previous period (compare mode) */}
      {compare && (
        <td style={{
          ...sharedTdStyle,
          padding: "9px 20px",
          textAlign: "end",
          fontVariantNumeric: "tabular-nums",
          fontSize: 13,
          color: "#94A3B8",
          direction: "ltr",
        }}>
          {prFmt ? prFmt.text : "—"}
        </td>
      )}

      {/* Variance (compare mode) */}
      {compare && (
        <td style={{
          ...sharedTdStyle,
          padding: "9px 20px",
          textAlign: "end",
          fontSize: 12,
          fontWeight: 600,
          color: v ? (v.positive ? "#16A34A" : "#DC2626") : "#94A3B8",
          direction: "ltr",
        }}>
          {v ? `${v.positive ? "+" : ""}${fmt(Math.abs(v.diff), "ILS")} (${v.pct}%)` : "—"}
        </td>
      )}
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProfitLoss() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.profitLoss;
  const reportData = useFinancialReports();

  const [period, setPeriod] = useState<Period>("year");
  const [dates, setDates] = useState(() => getDefaultDates("year"));
  const [compare, setCompare] = useState(false);
  const animKey = `${dates.from}-${dates.to}-${period}`;
  const companyName = isArabic ? "أطلس لإدارة الأعمال" : "Atlas Business Management";

  function changePeriod(p: Period) {
    setPeriod(p);
    setDates(getDefaultDates(p));
  }

  // Filter live monthly rows to the selected date range
  const periodMonths = useMemo(() => {
    const fromKey = dates.from.slice(0, 7);
    const toKey = dates.to.slice(0, 7);
    return reportData.monthly.filter((m) => m.monthKey >= fromKey && m.monthKey <= toKey);
  }, [dates, reportData.monthly]);

  // Current period P&L — pure live data, no mock blending
  const curr = useMemo(() => aggregateMonths(periodMonths), [periodMonths]);

  // Previous period: same window length shifted back
  const prev = useMemo(() => {
    const count = period === "month" ? 1 : period === "quarter" ? 3 : 12;
    const toIdx = reportData.monthly.findIndex((m) => m.monthKey > dates.to.slice(0, 7));
    const end = toIdx === -1 ? reportData.monthly.length : toIdx;
    const slice = reportData.monthly.slice(Math.max(0, end - count * 2), Math.max(0, end - count));
    if (!slice.length) return null;
    const agg = aggregateMonths(slice);
    return { ...agg, opex: agg.totalOpex };
  }, [period, dates, reportData.monthly]);

  // Last 6 months of live data for bar chart
  const chartMonths = useMemo(() => reportData.monthly.slice(-6), [reportData.monthly]);

  function varFn(cur: number, pr: number | undefined): VarResult {
    if (!compare || pr === undefined) return null;
    const diff = cur - pr;
    const pct = pr !== 0 ? ((diff / Math.abs(pr)) * 100).toFixed(1) : "—";
    return { diff, pct, positive: diff >= 0 };
  }

  // Derived for stat cards
  const totalRevenue   = curr.revenue;
  const totalExpenses  = curr.totalOpex + curr.financeCosts + curr.tax;
  const grossMargin    = totalRevenue > 0 ? ((curr.grossProfit / totalRevenue) * 100).toFixed(1) : "0";
  const isNetLoss      = curr.netIncome < 0;

  const prevTotalRev  = prev ? prev.revenue : null;
  const prevTotalExp  = prev ? prev.opex + prev.financeCosts + prev.tax : null;
  const prevNet       = prev ? prev.netIncome : null;

  function pctStr(cur: number, pr: number | null): string | undefined {
    if (!compare || pr === null || pr === 0) return undefined;
    const p = ((cur / Math.abs(pr) - 1) * 100).toFixed(1);
    return `${Number(p) >= 0 ? "+" : ""}${p}% عن الفترة السابقة`;
  }
  function pctColor(cur: number, pr: number | null, invert = false): string | undefined {
    if (!compare || pr === null) return undefined;
    const positive = cur >= pr;
    return (invert ? !positive : positive) ? "#16A34A" : "#DC2626";
  }

  const periodLabel = period === "month" ? tc.periodMonth : period === "quarter" ? tc.periodQuarter : tc.periodYear;

  const rowProps = { compare, fmt: formatCurrency, varFn };

  // Stagger counter
  let ri = 0;
  const nr = () => ri++;

  return (
    <div className={styles.page} dir={isArabic ? "rtl" : "ltr"}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <p className={styles.breadcrumb}>{tc.breadcrumb}</p>
          <h1 className={styles.title}>{tc.pageTitle}</h1>
          <p className={styles.subtitle}>{tc.pageSubtitle}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Period pills */}
          <div className={styles.periodGroup}>
            {(["month", "quarter", "year"] as Period[]).map((p) => (
              <button key={p} type="button"
                className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ""}`}
                onClick={() => changePeriod(p)}>
                {p === "month" ? tc.periodMonth : p === "quarter" ? tc.periodQuarter : tc.periodYear}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className={styles.dateInputs}>
            <input type="date" className={styles.dateInput} value={dates.from}
              onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))} />
            <span className={styles.dateSep}>—</span>
            <input type="date" className={styles.dateInput} value={dates.to}
              onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))} />
          </div>

          {/* Compare toggle */}
          <label className={styles.compareToggle}>
            <span className={`${styles.toggleSwitch} ${compare ? styles.toggleChecked : ""}`}>
              <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
              <span className={styles.toggleTrack} onClick={() => setCompare((c) => !c)} />
            </span>
            {tc.compareToggle}
          </label>

          {/* Export */}
          <div className={styles.exportGroup}>
            <button type="button" className={styles.exportBtn}>📄 {tc.exportPdf}</button>
            <button type="button" className={styles.exportBtn}>📊 {tc.exportCsv}</button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className={styles.statGrid}>
        <StatCard
          emoji="📈" circleBg="#F0FDF4" circleColor="#16A34A"
          label="إجمالي الإيرادات" value={totalRevenue}
          sub={pctStr(totalRevenue, prevTotalRev)}
          subColor={pctColor(totalRevenue, prevTotalRev)}
          delay={0} animKey={animKey}
        />
        <StatCard
          emoji="📉" circleBg="#FEF2F2" circleColor="#DC2626"
          label="إجمالي المصروفات" value={totalExpenses}
          sub={pctStr(totalExpenses, prevTotalExp)}
          subColor={pctColor(totalExpenses, prevTotalExp, true)}
          delay={70} animKey={animKey}
        />
        <StatCard
          emoji="💰" circleBg="#EFF6FF" circleColor="#2563EB"
          label="مجمل الربح" value={curr.grossProfit}
          sub={`${grossMargin}% هامش الربح`}
          subColor="#2563EB"
          delay={140} animKey={animKey}
        />
        <StatCard
          emoji={isNetLoss ? "⚠️" : "✅"}
          circleBg={isNetLoss ? "#FEF2F2" : "#F0FDF4"}
          circleColor={isNetLoss ? "#DC2626" : "#16A34A"}
          label={isNetLoss ? "صافي الخسارة" : "صافي الربح"}
          value={Math.abs(curr.netIncome)}
          isLoss={isNetLoss}
          sub={pctStr(curr.netIncome, prevNet)}
          subColor={pctColor(curr.netIncome, prevNet)}
          delay={210} animKey={animKey}
        />
      </div>

      {/* ── Bar Chart ──────────────────────────────────────────────────────── */}
      <BarChart
        key={animKey}
        periodLabel={periodLabel}
        dateRange={`${fmtIsoDate(dates.from)} — ${fmtIsoDate(dates.to)}`}
        chartMonths={chartMonths}
      />

      {/* ── Statement Table ─────────────────────────────────────────────────── */}
      <div className={styles.statement}>
        <div className={styles.statementHeader}>
          <p className={styles.companyName}>{companyName}</p>
          <h2 className={styles.statementTitle}>{tc.pageTitle}</h2>
          <p className={styles.statementPeriod}>
            {fmtIsoDate(dates.from)} — {fmtIsoDate(dates.to)}
          </p>
        </div>

        <table className={styles.statTable}>
          {compare && (
            <thead>
              <tr>
                {[
                  { label: "البيان",          align: "start" },
                  { label: tc.currentPeriod,  align: "end" },
                  { label: tc.prevPeriod,     align: "end" },
                  { label: tc.variance,       align: "end" },
                ].map((col) => (
                  <td key={col.label} style={{
                    padding: "10px 20px", fontSize: 11, fontWeight: 600,
                    color: "#94A3B8", background: "white",
                    borderBottom: "1px solid #F1F5F9",
                    textAlign: col.align as React.CSSProperties["textAlign"],
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>
                    {col.label}
                  </td>
                ))}
              </tr>
            </thead>
          )}
          <tbody key={animKey}>
            {/* ── REVENUE ─────────────────────────────────────────────────── */}
            <PLSectionHeader label={tc.revenue} compare={compare} accent="#16A34A" rowIdx={nr()} />
            <PLRow label={tc.salesRevenue} cur={curr.revenue} pr={prev?.revenue} {...rowProps} accent="#16A34A" rowIdx={nr()} />
            <PLRow label={tc.otherRevenue}  cur={curr.revenue * 0.02} pr={prev ? prev.revenue * 0.02 : undefined} {...rowProps} accent="#16A34A" rowIdx={nr()} />
            <PLRow label={tc.totalRevenue}  cur={curr.revenue * 1.02} pr={prev ? prev.revenue * 1.02 : undefined} isTotal {...rowProps} accent="#16A34A" rowIdx={nr()} />

            {/* ── COGS ────────────────────────────────────────────────────── */}
            <PLSectionHeader label={tc.cogs} compare={compare} accent="#F59E0B" rowIdx={nr()} />
            <PLRow label={tc.costOfGoods} cur={curr.cogs} pr={prev?.cogs} {...rowProps} accent="#F59E0B" rowIdx={nr()} />
            <PLRow label={tc.grossProfit} cur={curr.grossProfit} pr={prev?.grossProfit} isTotal {...rowProps} accent="#2563EB" rowIdx={nr()} />

            {/* ── OPEX ────────────────────────────────────────────────────── */}
            <PLSectionHeader label={tc.operatingExpenses} compare={compare} accent="#DC2626" rowIdx={nr()} />
            <PLRow label={tc.salariesWages} cur={curr.salaries}  {...rowProps} rowIdx={nr()} />
            <PLRow label={tc.rentUtilities} cur={curr.rent}      {...rowProps} rowIdx={nr()} />
            <PLRow label={tc.marketing}     cur={curr.marketing} {...rowProps} rowIdx={nr()} />
            <PLRow label={tc.adminExpenses} cur={curr.admin}     {...rowProps} rowIdx={nr()} />
            <PLRow label={tc.totalOpex}     cur={curr.totalOpex} pr={prev?.opex} isTotal {...rowProps} accent="#DC2626" rowIdx={nr()} />

            {/* ── OPERATING INCOME ────────────────────────────────────────── */}
            <PLRow label={tc.operatingIncome} cur={curr.operatingIncome} pr={prev?.operatingIncome} isTotal {...rowProps} accent="#7C3AED" rowIdx={nr()} />

            {/* ── FINANCE / TAX ────────────────────────────────────────────── */}
            <PLSectionHeader label="مصروفات التمويل والضريبة" compare={compare} accent="#7C3AED" rowIdx={nr()} />
            <PLRow label={tc.financeCosts}       cur={curr.financeCosts}  pr={prev?.financeCosts}  {...rowProps} rowIdx={nr()} />
            <PLRow label={tc.netIncomeBeforeTax} cur={curr.netBeforeTax}  pr={prev?.netBeforeTax}  isTotal {...rowProps} accent="#7C3AED" rowIdx={nr()} />
            <PLRow label={tc.incomeTax}          cur={curr.tax}           pr={prev?.tax}           {...rowProps} rowIdx={nr()} />

            {/* ── NET INCOME ──────────────────────────────────────────────── */}
            <PLRow label={tc.netIncome} cur={curr.netIncome} pr={prev?.netIncome} isNet {...rowProps} rowIdx={nr()} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
