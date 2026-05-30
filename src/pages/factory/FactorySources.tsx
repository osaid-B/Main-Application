import { useMemo, useState } from "react";
import { Search, Globe } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useSettings } from "../../context/SettingsContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFactory } from "../../context/FactoryContext";
import { useLoadingDelay } from "../../hooks/useLoadingDelay";
import styles from "./factory.module.css";

export default function FactorySources() {
  const { t, formatCurrency, isArabic } = useSettings();
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

  const isLoading = useLoadingDelay();
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

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          {isLoading ? (
            <Skeleton variant="rect" height={280} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Globe size={32} />} title={tc.noData} />
          ) : (
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col />
                <col className="col-w-90" />
                <col className="col-w-160" />
                <col className="col-w-100" />
                <col className="col-w-100" />
                <col className="col-currency col-w-120" />
                <col className="col-currency col-w-130" />
                <col className="col-date col-w-120" />
              </colgroup>
              <thead>
                <tr>
                  <th>{tc.cols.material}</th>
                  <th className="col-badge">{tc.cols.origin}</th>
                  <th>{tc.cols.supplier}</th>
                  <th>{tc.cols.country}</th>
                  <th className="col-num">{tc.cols.quantity}</th>
                  <th className="col-num">{tc.cols.unitCost}</th>
                  <th className="col-num">{tc.cols.totalValue}</th>
                  <th className="col-date">{tc.cols.purchaseDate}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{isArabic ? r.materialNameAr : r.materialName}</td>
                    <td className="col-badge">
                      <Badge variant={r.origin === "local" ? "success" : "info"} size="sm">
                        {tc.originLabel[r.origin]}
                      </Badge>
                    </td>
                    <td>{isArabic ? r.supplierAr : r.supplier}</td>
                    <td>{isArabic ? r.countryAr : r.country}</td>
                    <td className={`${styles.numEnd} ${styles.mono} col-num`}>{r.quantity.toLocaleString()} {r.unit}</td>
                    <td className={`${styles.numEnd} ${styles.mono} col-num`}>{formatCurrency(r.unitCost)}</td>
                    <td className={`${styles.numEnd} ${styles.mono} col-num`}>{formatCurrency(r.totalValue)}</td>
                    <td className={`${styles.mono} col-date`}>{r.purchaseDate}</td>
                  </tr>
                ))}
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
