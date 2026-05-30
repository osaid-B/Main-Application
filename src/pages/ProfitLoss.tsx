import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { MONTHLY_FINANCIALS } from "../data/reportsMock";
import styles from "./ProfitLoss.module.css";

type Period = "month" | "quarter" | "year";

type VarResult = { diff: number; pct: string; positive: boolean } | null;
type FmtFn = (v: number, c: string) => string;
type VarFn = (cur: number, pr: number | undefined) => VarResult;

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

function PLRow({ label, cur, pr, isTotal = false, isNet = false, isSub = false, compare, fmt, varFn }: {
  label: string; cur: number; pr?: number; isTotal?: boolean; isNet?: boolean; isSub?: boolean;
  compare: boolean; fmt: FmtFn; varFn: VarFn;
}) {
  const v = varFn(cur, pr);
  const cls = isNet ? styles.netIncomeRow : isTotal ? styles.totalRow : isSub ? styles.subtotalRow : styles.dataRow;
  return (
    <tr className={cls}>
      <td>{label}</td>
      <td className={styles.mono}>{fmt(cur, "ILS")}</td>
      {compare && <td className={styles.mono}>{pr !== undefined ? fmt(pr, "ILS") : "—"}</td>}
      {compare && (
        <td className={v ? (v.positive ? styles.varPos : styles.varNeg) : ""}>
          {v ? `${v.positive ? "+" : ""}${fmt(v.diff, "ILS")} (${v.pct}%)` : "—"}
        </td>
      )}
    </tr>
  );
}

function PLSectionHeader({ label, compare }: { label: string; compare: boolean }) {
  return (
    <tr className={styles.sectionHeader}>
      <td colSpan={compare ? 4 : 2}>{label}</td>
    </tr>
  );
}

export default function ProfitLoss() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.profitLoss;
  const { expenses, payments } = useData();

  const [period, setPeriod] = useState<Period>("year");
  const [dates, setDates] = useState(() => getDefaultDates("year"));
  const [compare, setCompare] = useState(false);
  const companyName = isArabic ? "أطلس لإدارة الأعمال" : "Atlas Business Management";

  function changePeriod(p: Period) {
    setPeriod(p);
    setDates(getDefaultDates(p));
  }

  const curr = useMemo(() => {
    const count = period === "month" ? 1 : period === "quarter" ? 3 : 12;
    const slice = MONTHLY_FINANCIALS.slice(-count);
    const mockRevenue = slice.reduce((s, m) => s + m.revenue, 0);
    const mockExpenses = slice.reduce((s, m) => s + m.expenses, 0);
    const liveRevenue = payments
      .filter((p) => p.status === "Completed" || p.status === "Paid")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const liveExpenses = expenses
      .filter((e) => !e.isDeleted)
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    const revenue = Math.max(liveRevenue, mockRevenue * 0.5);
    const cogs = revenue * 0.55;
    const grossProfit = revenue - cogs;
    const salaries = mockExpenses * 0.40 + liveExpenses * 0.30;
    const rent = mockExpenses * 0.15;
    const marketing = mockExpenses * 0.08;
    const admin = liveExpenses * 0.25 + mockExpenses * 0.05;
    const totalOpex = salaries + rent + marketing + admin;
    const operatingIncome = grossProfit - totalOpex;
    const financeCosts = revenue * 0.01;
    const netBeforeTax = operatingIncome - financeCosts;
    const tax = Math.max(0, netBeforeTax * 0.16);
    const netIncome = netBeforeTax - tax;
    return { revenue, cogs, grossProfit, salaries, rent, marketing, admin, totalOpex, operatingIncome, financeCosts, netBeforeTax, tax, netIncome };
  }, [period, payments, expenses]);

  const prev = useMemo(() => {
    const count = period === "month" ? 1 : period === "quarter" ? 3 : 12;
    const slice = MONTHLY_FINANCIALS.slice(-(count * 2), -count);
    if (!slice.length) return null;
    const revenue = slice.reduce((s, m) => s + m.revenue, 0);
    const cogs = revenue * 0.57;
    const grossProfit = revenue - cogs;
    const opex = slice.reduce((s, m) => s + m.expenses, 0) * 0.7;
    const operatingIncome = grossProfit - opex;
    const financeCosts = revenue * 0.012;
    const netBeforeTax = operatingIncome - financeCosts;
    const tax = Math.max(0, netBeforeTax * 0.16);
    const netIncome = netBeforeTax - tax;
    return { revenue, cogs, grossProfit, opex, operatingIncome, financeCosts, netBeforeTax, tax, netIncome };
  }, [period]);

  function varFn(cur: number, pr: number | undefined): VarResult {
    if (!compare || pr === undefined) return null;
    const diff = cur - pr;
    const pct = pr !== 0 ? ((diff / Math.abs(pr)) * 100).toFixed(1) : "—";
    return { diff, pct, positive: diff >= 0 };
  }

  const rowProps = { compare, fmt: formatCurrency, varFn };

  return (
    <Container maxWidth="full" padding="md">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
          <p className={styles.subtitle}>{tc.pageSubtitle}</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.periodGroup}>
            {(["month", "quarter", "year"] as Period[]).map((p) => (
              <button key={p} type="button"
                className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ""}`}
                onClick={() => changePeriod(p)}>
                {p === "month" ? tc.periodMonth : p === "quarter" ? tc.periodQuarter : tc.periodYear}
              </button>
            ))}
          </div>
          <div className={styles.dateInputs}>
            <input type="date" className={styles.dateInput} value={dates.from}
              onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))} />
            <span className={styles.dateSep}>—</span>
            <input type="date" className={styles.dateInput} value={dates.to}
              onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))} />
          </div>
          <label className={styles.compareToggle}>
            <span className={`${styles.toggleSwitch} ${compare ? styles.toggleChecked : ""}`}>
              <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
              <span className={styles.toggleTrack} onClick={() => setCompare((c) => !c)} />
            </span>
            {tc.compareToggle}
          </label>
          <div className={styles.exportGroup}>
            <Button variant="secondary" size="sm" leftIcon={<FileText size={13} />}>{tc.exportPdf}</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />}>{tc.exportCsv}</Button>
          </div>
        </div>

        <div className={styles.statement}>
          <div className={styles.statementHeader}>
            <p className={styles.companyName}>{companyName}</p>
            <h2 className={styles.statementTitle}>{tc.pageTitle}</h2>
            <p className={styles.statementPeriod}>{dates.from} — {dates.to}</p>
          </div>
          <table className={styles.statTable}>
            <thead>
              {compare && (
                <tr className={styles.sectionHeader}>
                  <td></td>
                  <td>{tc.currentPeriod}</td>
                  <td>{tc.prevPeriod}</td>
                  <td>{tc.variance}</td>
                </tr>
              )}
            </thead>
            <tbody>
              <PLSectionHeader label={tc.revenue} compare={compare} />
              <PLRow label={tc.salesRevenue} cur={curr.revenue} pr={prev?.revenue} {...rowProps} />
              <PLRow label={tc.otherRevenue} cur={curr.revenue * 0.02} pr={prev ? prev.revenue * 0.02 : undefined} {...rowProps} />
              <PLRow label={tc.totalRevenue} cur={curr.revenue * 1.02} pr={prev ? prev.revenue * 1.02 : undefined} isTotal {...rowProps} />

              <PLSectionHeader label={tc.cogs} compare={compare} />
              <PLRow label={tc.costOfGoods} cur={curr.cogs} pr={prev?.cogs} {...rowProps} />
              <PLRow label={tc.grossProfit} cur={curr.grossProfit} pr={prev?.grossProfit} isTotal {...rowProps} />

              <PLSectionHeader label={tc.operatingExpenses} compare={compare} />
              <PLRow label={tc.salariesWages} cur={curr.salaries} {...rowProps} />
              <PLRow label={tc.rentUtilities} cur={curr.rent} {...rowProps} />
              <PLRow label={tc.marketing} cur={curr.marketing} {...rowProps} />
              <PLRow label={tc.adminExpenses} cur={curr.admin} {...rowProps} />
              <PLRow label={tc.totalOpex} cur={curr.totalOpex} pr={prev?.opex} isTotal {...rowProps} />

              <PLRow label={tc.operatingIncome} cur={curr.operatingIncome} pr={prev?.operatingIncome} isTotal {...rowProps} />
              <PLRow label={tc.financeCosts} cur={curr.financeCosts} pr={prev?.financeCosts} {...rowProps} />
              <PLRow label={tc.netIncomeBeforeTax} cur={curr.netBeforeTax} pr={prev?.netBeforeTax} isTotal {...rowProps} />
              <PLRow label={tc.incomeTax} cur={curr.tax} pr={prev?.tax} {...rowProps} />
              <PLRow label={tc.netIncome} cur={curr.netIncome} pr={prev?.netIncome} isNet {...rowProps} />
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
