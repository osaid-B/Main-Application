import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import styles from "./BalanceSheet.module.css";

const PAID_IN_CAPITAL = 500_000;
const PROPERTY_EQUIPMENT = 120_000;
const ACCUMULATED_DEPRECIATION = 28_000;
const LONG_TERM_LOANS = 75_000;
const OTHER_CURRENT_ASSETS = 15_000;
const ACCRUED_EXPENSES_FIXED = 8_000;
const LEGAL_RESERVE = 25_000;

function Row({ label, value, isTotal = false, isGrand = false, isSub = false, isNeg = false, fmt }: {
  label: string; value: number; isTotal?: boolean; isGrand?: boolean; isSub?: boolean; isNeg?: boolean;
  fmt: (v: number, c: string) => string;
}) {
  const cls = isGrand ? styles.grandTotalRow : isTotal ? styles.totalRow : isSub ? styles.subtotalRow : styles.dataRow;
  return (
    <tr className={cls}>
      <td>{label}</td>
      <td className={`${styles.mono} ${isNeg ? styles.negative : ""}`}>
        {isNeg ? `(${fmt(value, "ILS")})` : fmt(value, "ILS")}
      </td>
    </tr>
  );
}

function Section({ label }: { label: string }) {
  return <tr className={styles.sectionHeader}><td colSpan={2}>{label}</td></tr>;
}

function Group({ label }: { label: string }) {
  return <tr className={styles.groupHeader}><td colSpan={2}>{label}</td></tr>;
}

export default function BalanceSheet() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.balanceSheet;
  const { receivablesTotal, products, payablesDue, payments, expenses } = useData();

  const today = new Date().toISOString().slice(0, 10);
  const [asOf, setAsOf] = useState(today);
  const companyName = isArabic ? "أطلس لإدارة الأعمال" : "Atlas Business Management";

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

  return (
    <Container maxWidth="full" padding="md">
      <div className={styles.page}>
        <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
        <h1 className={styles.title}>{tc.pageTitle}</h1>
        <p className={styles.subtitle}>{tc.pageSubtitle}</p>

        <div className={styles.controls}>
          <span className={styles.dateLabel}>{tc.asOf}</span>
          <input type="date" className={styles.dateInput} value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          <div className={styles.exportGroup}>
            <Button variant="secondary" size="sm" leftIcon={<FileText size={13} />}>{tc.exportPdf}</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />}>{tc.exportCsv}</Button>
          </div>
        </div>

        <div className={styles.statement}>
          <div className={styles.statementHeader}>
            <p className={styles.companyName}>{companyName}</p>
            <h2 className={styles.statementTitle}>{tc.pageTitle}</h2>
            <p className={styles.statementDate}>{tc.asOf} {asOf}</p>
          </div>

          <div className={styles.columns}>
            {/* Assets Column */}
            <div className={styles.column}>
              <table className={styles.statTable}>
                <tbody>
                  <Section label={tc.assets} />
                  <Group label={tc.currentAssets} />
                  <Row fmt={formatCurrency} label={tc.cash} value={bs.cash} />
                  <Row fmt={formatCurrency} label={tc.receivables} value={bs.receivablesTotal} />
                  <Row fmt={formatCurrency} label={tc.inventory} value={bs.inventoryValue} />
                  <Row fmt={formatCurrency} label={tc.otherCurrentAssets} value={OTHER_CURRENT_ASSETS} />
                  <Row fmt={formatCurrency} label={tc.totalCurrentAssets} value={bs.totalCurrentAssets} isTotal />
                  <Group label={tc.nonCurrentAssets} />
                  <Row fmt={formatCurrency} label={tc.propertyEquipment} value={PROPERTY_EQUIPMENT} />
                  <Row fmt={formatCurrency} label={tc.accumulatedDepreciation} value={ACCUMULATED_DEPRECIATION} isNeg />
                  <Row fmt={formatCurrency} label={tc.netFixedAssets} value={bs.netFixedAssets} isSub />
                  <Row fmt={formatCurrency} label={tc.totalNonCurrentAssets} value={bs.totalNonCurrentAssets} isTotal />
                  <Row fmt={formatCurrency} label={tc.totalAssets} value={bs.totalAssets} isGrand />
                </tbody>
              </table>
            </div>

            {/* Liabilities & Equity Column */}
            <div className={styles.column}>
              <table className={styles.statTable}>
                <tbody>
                  <Section label={tc.liabilitiesEquity} />
                  <Group label={tc.currentLiabilities} />
                  <Row fmt={formatCurrency} label={tc.accountsPayable} value={bs.payablesDue} />
                  <Row fmt={formatCurrency} label={tc.vatPayable} value={bs.vatPayable} />
                  <Row fmt={formatCurrency} label={tc.accruedExpenses} value={ACCRUED_EXPENSES_FIXED} />
                  <Row fmt={formatCurrency} label={tc.totalCurrentLiabilities} value={bs.totalCurrentLiabilities} isTotal />
                  <Group label={tc.longTermLiabilities} />
                  <Row fmt={formatCurrency} label={tc.longTermLoans} value={LONG_TERM_LOANS} />
                  <Row fmt={formatCurrency} label={tc.totalLongTermLiabilities} value={bs.totalLongTermLiabilities} isTotal />
                  <Row fmt={formatCurrency} label={tc.totalLiabilities} value={bs.totalLiabilities} isTotal />
                  <Group label={tc.equity} />
                  <Row fmt={formatCurrency} label={tc.paidInCapital} value={PAID_IN_CAPITAL} />
                  <Row fmt={formatCurrency} label={tc.retainedEarnings} value={Math.max(0, bs.retainedEarnings)} />
                  <Row fmt={formatCurrency} label={tc.totalEquity} value={bs.totalEquity} isTotal />
                  <Row fmt={formatCurrency} label={tc.totalLiabilitiesEquity} value={bs.totalLE} isGrand />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={`${styles.equationBanner} ${bs.balanced ? styles.equationOk : styles.equationError}`}>
          {bs.balanced ? tc.equationOk : tc.equationError}
        </div>
      </div>
    </Container>
  );
}
