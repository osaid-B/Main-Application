import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { useSettings } from "../../context/SettingsContext";
import { FINISHED_GOODS } from "../../data/factoryMock";
import styles from "./factory.module.css";

export default function FactoryFinishedGoods() {
  const { t, formatCurrency } = useSettings();
  const tc = t.factory.finishedGoods;

  const [query, setQuery]     = useState("");
  const [catFilter, setCat]   = useState("");

  const categories = [...new Set(FINISHED_GOODS.map((g) => g.category))];

  const filtered = useMemo(() => {
    return FINISHED_GOODS.filter((g) => {
      if (catFilter && g.category !== catFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.sku.toLowerCase().includes(q) || g.nameAr.includes(q);
    });
  }, [query, catFilter]);

  const totalOnHand = FINISHED_GOODS.reduce((s, g) => s + g.onHand, 0);
  const totalReserved = FINISHED_GOODS.reduce((s, g) => s + g.reserved, 0);
  const totalAvail = totalOnHand - totalReserved;

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
          <Kpi label={tc.kpi.totalOnHand} value={totalOnHand.toLocaleString()}    tone="success" />
          <Kpi label={tc.kpi.reserved}    value={totalReserved.toLocaleString()}  tone="warning" />
          <Kpi label={tc.kpi.available}   value={totalAvail.toLocaleString()}     tone="info"    />
          <Kpi label={tc.kpi.skus}        value={String(FINISHED_GOODS.length)}   tone="neutral" />
        </Grid>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={catFilter} onChange={(e) => setCat(e.target.value)}>
            <option value="">{tc.filters.allCategories}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.name}</th>
                <th>{tc.cols.sku}</th>
                <th>{tc.cols.category}</th>
                <th className={styles.numEnd}>{tc.cols.onHand}</th>
                <th className={styles.numEnd}>{tc.cols.reserved}</th>
                <th className={styles.numEnd}>{tc.cols.available}</th>
                <th className={styles.numEnd}>{tc.cols.unitCost}</th>
                <th className={styles.numEnd}>{tc.cols.sellingPrice}</th>
                <th className={styles.numEnd}>{tc.cols.margin}</th>
                <th>{tc.cols.lastProduced}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const avail  = g.onHand - g.reserved;
                const margin = g.sellingPrice > 0 ? ((g.sellingPrice - g.unitCost) / g.sellingPrice * 100).toFixed(1) : "—";
                return (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td><span className={styles.mono}>{g.sku}</span></td>
                    <td><span className={styles.tag}>{g.category}</span></td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{g.onHand.toLocaleString()}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{g.reserved.toLocaleString()}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{avail.toLocaleString()}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(g.unitCost)}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(g.sellingPrice)}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{margin}%</td>
                    <td className={styles.mono}>{g.lastProducedDate ?? "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className={styles.empty}>{tc.noData}</td></tr>
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
