import { useMemo, useState } from "react";
import { Search, Boxes } from "lucide-react";
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
import type { RawMaterial } from "../../data/types";
import styles from "./factory.module.css";

function materialStatus(m: RawMaterial): "ok" | "low" | "critical" {
  if (m.onHand === 0) return "critical";
  if (m.onHand <= m.reorderPoint) return "low";
  return "ok";
}

const STATUS_VARIANT = { ok: "success", low: "warning", critical: "danger" } as const;

export default function FactoryRawMaterials() {
  const { t, formatCurrency, formatNumber } = useSettings();
  const tc = t.factory.rawMaterials;
  const { rawMaterials } = useFactory();

  const [query, setQuery]       = useState("");
  const [catFilter, setCat]     = useState("");
  const [originFilter, setOrig] = useState<"local" | "imported" | "">("");

  const categories = [...new Set(rawMaterials.map((m) => m.category))];

  const filtered = useMemo(() => {
    return rawMaterials.filter((m) => {
      if (catFilter && m.category !== catFilter) return false;
      if (originFilter && m.origin !== originFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q) || m.nameAr.includes(q);
    });
  }, [rawMaterials, query, catFilter, originFilter]);

  const isLoading = useLoadingDelay();
  const totalItems    = rawMaterials.length;
  const belowReorder  = rawMaterials.filter((m) => m.onHand <= m.reorderPoint).length;
  const localCount    = rawMaterials.filter((m) => m.origin === "local").length;
  const importedCount = rawMaterials.filter((m) => m.origin === "imported").length;

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
          <Kpi label={tc.kpi.totalItems}   value={String(totalItems)}   tone="info"    />
          <Kpi label={tc.kpi.belowReorder} value={String(belowReorder)} tone="danger"  />
          <Kpi label={tc.kpi.localPct}     value={`${localCount} items`}   tone="success" />
          <Kpi label={tc.kpi.importedPct}  value={`${importedCount} items`} tone="neutral" />
        </Grid>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={catFilter} onChange={(e) => setCat(e.target.value)}>
            <option value="">{tc.filters.allCategories}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={styles.filterSelect} value={originFilter} onChange={(e) => setOrig(e.target.value as "local" | "imported" | "")}>
            <option value="">{tc.filters.allOrigins}</option>
            <option value="local">{tc.filters.local}</option>
            <option value="imported">{tc.filters.imported}</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          {isLoading ? (
            <Skeleton variant="rect" height={280} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Boxes size={32} />} title={tc.noData} />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{tc.cols.name}</th>
                  <th>{tc.cols.category}</th>
                  <th>{tc.cols.origin}</th>
                  <th>{tc.cols.supplier}</th>
                  <th className={styles.numEnd}>{tc.cols.onHand}</th>
                  <th className={styles.numEnd}>{tc.cols.reorderPoint}</th>
                  <th className={styles.numEnd}>{tc.cols.unitCost}</th>
                  <th className={styles.numEnd}>{tc.cols.totalValue}</th>
                  <th>{tc.cols.status}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const st = materialStatus(m);
                  return (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td><span className={styles.tag}>{m.category}</span></td>
                      <td><span className={styles.tag}>{tc.originLabel[m.origin]}</span></td>
                      <td>{m.supplier}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatNumber(m.onHand)} {m.unit}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatNumber(m.reorderPoint)} {m.unit}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(m.unitCost)}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(m.onHand * m.unitCost)}</td>
                      <td><Badge variant={STATUS_VARIANT[st]} size="sm">{tc.status[st]}</Badge></td>
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
