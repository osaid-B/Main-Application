import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useSettings } from "../../context/SettingsContext";
import { useFactory } from "../../context/FactoryContext";
import styles from "./factory.module.css";

export default function FactorySources() {
  const { t, formatCurrency } = useSettings();
  const tc = t.factory.sources;
  const { sourceRecords: SOURCE_RECORDS } = useFactory();

  const [query, setQuery]         = useState("");
  const [originFilter, setOrig]   = useState<"local" | "imported" | "">("");
  const [catFilter, setCat]       = useState("");

  const categories = [...new Set(SOURCE_RECORDS.map((r) => r.category))];

  const filtered = useMemo(() => {
    return SOURCE_RECORDS.filter((r) => {
      if (originFilter && r.origin !== originFilter) return false;
      if (catFilter && r.category !== catFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return r.materialName.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q) || r.materialNameAr.includes(q);
    });
  }, [SOURCE_RECORDS, query, originFilter, catFilter]);

  const totalValue    = SOURCE_RECORDS.reduce((s, r) => s + r.totalValue, 0);
  const localValue    = SOURCE_RECORDS.filter((r) => r.origin === "local").reduce((s, r) => s + r.totalValue, 0);
  const importedValue = SOURCE_RECORDS.filter((r) => r.origin === "imported").reduce((s, r) => s + r.totalValue, 0);
  const localPct      = totalValue > 0 ? Math.round(localValue / totalValue * 100) : 0;

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
          <Kpi label={tc.kpi.totalValue}    value={formatCurrency(totalValue)}    tone="info"    />
          <Kpi label={tc.kpi.localValue}    value={formatCurrency(localValue)}    tone="success" />
          <Kpi label={tc.kpi.importedValue} value={formatCurrency(importedValue)} tone="warning" />
          <Kpi label={tc.kpi.localPct}      value={`${localPct}%`}               tone="neutral" />
        </Grid>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={originFilter} onChange={(e) => setOrig(e.target.value as "local" | "imported" | "")}>
            <option value="">{tc.filters.allOrigins}</option>
            <option value="local">{tc.filters.local}</option>
            <option value="imported">{tc.filters.imported}</option>
          </select>
          <select className={styles.filterSelect} value={catFilter} onChange={(e) => setCat(e.target.value)}>
            <option value="">{tc.filters.allCategories}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.material}</th>
                <th>{tc.cols.origin}</th>
                <th>{tc.cols.supplier}</th>
                <th>{tc.cols.country}</th>
                <th className={styles.numEnd}>{tc.cols.quantity}</th>
                <th className={styles.numEnd}>{tc.cols.unitCost}</th>
                <th className={styles.numEnd}>{tc.cols.totalValue}</th>
                <th>{tc.cols.purchaseDate}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.materialName}</td>
                  <td>
                    <Badge variant={r.origin === "local" ? "success" : "info"} size="sm">
                      {tc.originLabel[r.origin]}
                    </Badge>
                  </td>
                  <td>{r.supplier}</td>
                  <td>{r.country}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{r.quantity.toLocaleString()} {r.unit}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(r.unitCost)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(r.totalValue)}</td>
                  <td className={styles.mono}>{r.purchaseDate}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className={styles.empty}>{tc.noData}</td></tr>
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
