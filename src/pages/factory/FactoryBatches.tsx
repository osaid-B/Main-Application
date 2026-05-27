import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { useSettings } from "../../context/SettingsContext";
import { useFactory } from "../../context/FactoryContext";
import type { BatchStatus, QcStatus } from "../../data/types";
import styles from "./factory.module.css";

const BATCH_STATUS_VARIANT: Record<BatchStatus, "success" | "info" | "danger" | "neutral"> = {
  open:       "info",
  closed:     "success",
  quarantine: "danger",
  recalled:   "neutral",
};

const QC_VARIANT: Record<QcStatus, "success" | "danger" | "warning" | "info"> = {
  pass:        "success",
  fail:        "danger",
  pending:     "warning",
  conditional: "info",
};

export default function FactoryBatches() {
  const { t, formatCurrency } = useSettings();
  const tc = t.factory.batches;
  const { batches: PRODUCTION_BATCHES } = useFactory();

  const [query, setQuery]         = useState("");
  const [statusFilter, setFilter] = useState<BatchStatus | "">("");
  const [qcFilter, setQcFilter]   = useState<QcStatus | "">("");

  const filtered = useMemo(() => {
    return PRODUCTION_BATCHES.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (qcFilter && b.qcStatus !== qcFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return b.id.toLowerCase().includes(q) || b.productName.toLowerCase().includes(q);
    });
  }, [PRODUCTION_BATCHES, query, statusFilter, qcFilter]);

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

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setFilter(e.target.value as BatchStatus | "")}>
            <option value="">{tc.filters.allStatuses}</option>
            {(["open", "closed", "quarantine", "recalled"] as BatchStatus[]).map((s) => (
              <option key={s} value={s}>{tc.status[s]}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={qcFilter} onChange={(e) => setQcFilter(e.target.value as QcStatus | "")}>
            <option value="">{tc.filters.allQcStatuses}</option>
            {(["pass", "fail", "pending", "conditional"] as QcStatus[]).map((s) => (
              <option key={s} value={s}>{tc.qcStatus[s]}</option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.batchId}</th>
                <th>{tc.cols.order}</th>
                <th>{tc.cols.product}</th>
                <th className={styles.numEnd}>{tc.cols.quantity}</th>
                <th>{tc.cols.producedDate}</th>
                <th>{tc.cols.expiryDate}</th>
                <th>{tc.cols.status}</th>
                <th>{tc.cols.qcStatus}</th>
                <th className={styles.numEnd}>{tc.cols.unitCost}</th>
                <th className={styles.numEnd}>{tc.cols.totalCost}</th>
                <th>{tc.cols.notes}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><span className={styles.mono}>{b.id}</span></td>
                  <td><span className={styles.mono}>{b.productionOrderId}</span></td>
                  <td>{b.productName}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{b.quantity > 0 ? b.quantity.toLocaleString() : "—"}</td>
                  <td className={styles.mono}>{b.producedDate || "—"}</td>
                  <td className={styles.mono}>{b.expiryDate || "—"}</td>
                  <td><Badge variant={BATCH_STATUS_VARIANT[b.status]} size="sm">{tc.status[b.status]}</Badge></td>
                  <td><Badge variant={QC_VARIANT[b.qcStatus]} size="sm">{tc.qcStatus[b.qcStatus]}</Badge></td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{b.unitCost > 0 ? formatCurrency(b.unitCost) : "—"}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{b.totalCost > 0 ? formatCurrency(b.totalCost) : "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--app-text-muted)", maxWidth: 160 }}>{b.notes ?? "—"}</td>
                </tr>
              ))}
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
