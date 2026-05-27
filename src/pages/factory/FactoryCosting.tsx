import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { useSettings } from "../../context/SettingsContext";
import { useFactory } from "../../context/FactoryContext";
import styles from "./factory.module.css";

export default function FactoryCosting() {
  const { t, formatCurrency } = useSettings();
  const tc = t.factory.costing;
  const { costingEntries: COSTING_ENTRIES } = useFactory();

  const [query, setQuery]           = useState("");
  const [periodFilter, setPeriod]   = useState("");

  const periods = [...new Set(COSTING_ENTRIES.map((e) => e.period))].sort().reverse();

  const filtered = useMemo(() => {
    return COSTING_ENTRIES.filter((e) => {
      if (periodFilter && e.period !== periodFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return e.productName.toLowerCase().includes(q) || e.productionOrderId.toLowerCase().includes(q);
    });
  }, [COSTING_ENTRIES, query, periodFilter]);

  const costedEntries = COSTING_ENTRIES.filter((e) => e.unitsProduced > 0);
  const totalCost     = costedEntries.reduce((s, e) => s + e.totalCost, 0);
  const avgCostPU     = costedEntries.length > 0
    ? costedEntries.reduce((s, e) => s + e.costPerUnit, 0) / costedEntries.length
    : 0;
  const maxVariance   = Math.max(0, ...costedEntries.map((e) => Math.abs(e.variance)));
  const ordersCosted  = costedEntries.length;

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.totalCost}       value={formatCurrency(totalCost)}   tone="info"    />
          <Kpi label={tc.kpi.avgCostPerUnit}   value={formatCurrency(avgCostPU)}  tone="neutral" />
          <Kpi label={tc.kpi.highestVariance}  value={formatCurrency(maxVariance)} tone="warning" />
          <Kpi label={tc.kpi.ordersCosted}     value={String(ordersCosted)}       tone="success" />
        </Grid>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={periodFilter} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">{tc.filters.allPeriods}</option>
            {periods.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.costId}</th>
                <th>{tc.cols.order}</th>
                <th>{tc.cols.product}</th>
                <th>{tc.cols.period}</th>
                <th className={styles.numEnd}>{tc.cols.rawMaterial}</th>
                <th className={styles.numEnd}>{tc.cols.labor}</th>
                <th className={styles.numEnd}>{tc.cols.overhead}</th>
                <th className={styles.numEnd}>{tc.cols.total}</th>
                <th className={styles.numEnd}>{tc.cols.units}</th>
                <th className={styles.numEnd}>{tc.cols.perUnit}</th>
                <th className={styles.numEnd}>{tc.cols.variance}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const varClass = e.variance > 0
                  ? { color: "var(--atlas-danger)" }
                  : e.variance < 0
                  ? { color: "var(--atlas-green)" }
                  : {};
                return (
                  <tr key={e.id}>
                    <td><span className={styles.mono}>{e.id}</span></td>
                    <td><span className={styles.mono}>{e.productionOrderId}</span></td>
                    <td>{e.productName}</td>
                    <td><span className={styles.tag}>{e.period}</span></td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{e.rawMaterialCost > 0 ? formatCurrency(e.rawMaterialCost) : "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{e.laborCost > 0 ? formatCurrency(e.laborCost) : "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{e.overheadCost > 0 ? formatCurrency(e.overheadCost) : "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{e.totalCost > 0 ? formatCurrency(e.totalCost) : "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{e.unitsProduced > 0 ? e.unitsProduced.toLocaleString() : "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{e.costPerUnit > 0 ? formatCurrency(e.costPerUnit) : "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`} style={varClass}>
                      {e.variance !== 0 ? formatCurrency(Math.abs(e.variance)) : "—"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className={styles.empty}>{tc.noData}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>
    </Container>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: "success" | "info" | "warning" | "neutral" | "danger" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
    </article>
  );
}
