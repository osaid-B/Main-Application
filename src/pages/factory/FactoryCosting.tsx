import { useMemo, useState } from "react";
import { Search, DollarSign } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { useSettings } from "../../context/SettingsContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFactory } from "../../context/FactoryContext";
import { useLoadingDelay } from "../../hooks/useLoadingDelay";
import styles from "./factory.module.css";

export default function FactoryCosting() {
  const { t, formatCurrency } = useSettings();
  const tc = t.factory.costing;
  const { costingEntries: COSTING_ENTRIES, boms, rawMaterials } = useFactory();

  const [query, setQuery]           = useState("");
  const [periodFilter, setPeriod]   = useState("");

  const periods = [...new Set(COSTING_ENTRIES.map((e) => e.period))].sort().reverse();

  const isLoading = useLoadingDelay();

  const filtered = useMemo(() => {
    return COSTING_ENTRIES.filter((e) => {
      if (periodFilter && e.period !== periodFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return e.productName.toLowerCase().includes(q) || e.productionOrderId.toLowerCase().includes(q);
    });
  }, [COSTING_ENTRIES, query, periodFilter]);

  function computeLiveBomCost(productionOrderId: string): number | null {
    const entry = COSTING_ENTRIES.find((e) => e.productionOrderId === productionOrderId);
    if (!entry) return null;
    // find bom by product name match (costing entries store productName, not productId)
    const bom = boms.find((b) => b.productName === entry.productName || b.productId === productionOrderId);
    if (!bom) return null;
    return bom.lines.reduce((sum, line) => {
      const mat = rawMaterials.find((m) => m.id === line.materialId);
      return sum + (mat ? mat.unitCost * line.quantity : 0);
    }, 0);
  }

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

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          {isLoading ? (
            <Skeleton variant="rect" height={280} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<DollarSign size={32} />} title={tc.noData} />
          ) : (
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col className="col-w-110" />
                <col className="col-w-110" />
                <col />
                <col className="col-w-90" />
                <col className="col-currency col-w-120" />
                <col className="col-currency col-w-100" />
                <col className="col-currency col-w-100" />
                <col className="col-currency col-w-110" />
                <col className="col-w-80" />
                <col className="col-currency col-w-110" />
                <col className="col-w-90" />
                <col className="col-currency col-w-120" />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{tc.cols.costId}</th>
                  <th className="col-code">{tc.cols.order}</th>
                  <th>{tc.cols.product}</th>
                  <th>{tc.cols.period}</th>
                  <th className="col-num">{tc.cols.rawMaterial}</th>
                  <th className="col-num">{tc.cols.labor}</th>
                  <th className="col-num">{tc.cols.overhead}</th>
                  <th className="col-num">{tc.cols.total}</th>
                  <th className="col-num">{tc.cols.units}</th>
                  <th className="col-num">{tc.cols.perUnit}</th>
                  <th className="col-num">{tc.cols.variance}</th>
                  <th className="col-num">{tc.cols.liveBomCost}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const varClass = e.variance > 0
                    ? { color: "var(--atlas-danger)" }
                    : e.variance < 0
                    ? { color: "var(--atlas-green)" }
                    : {};
                  const liveBomCost = computeLiveBomCost(e.productionOrderId);
                  return (
                    <tr key={e.id}>
                      <td className="col-code"><span className={styles.mono}>{e.id}</span></td>
                      <td className="col-code"><span className={styles.mono}>{e.productionOrderId}</span></td>
                      <td>{e.productName}</td>
                      <td className="col-badge"><span className={styles.tag}>{e.period}</span></td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{e.rawMaterialCost > 0 ? formatCurrency(e.rawMaterialCost) : "—"}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{e.laborCost > 0 ? formatCurrency(e.laborCost) : "—"}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{e.overheadCost > 0 ? formatCurrency(e.overheadCost) : "—"}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{e.totalCost > 0 ? formatCurrency(e.totalCost) : "—"}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{e.unitsProduced > 0 ? e.unitsProduced.toLocaleString() : "—"}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{e.costPerUnit > 0 ? formatCurrency(e.costPerUnit) : "—"}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`} style={varClass}>
                        {e.variance !== 0 ? formatCurrency(Math.abs(e.variance)) : "—"}
                      </td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`} style={{ color: "var(--app-text-muted)", fontSize: 12 }}>
                        {liveBomCost !== null ? formatCurrency(liveBomCost) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
