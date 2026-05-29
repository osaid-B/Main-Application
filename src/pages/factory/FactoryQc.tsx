import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
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
import type { QcStatus } from "../../data/types";
import styles from "./factory.module.css";

const QC_VARIANT: Record<QcStatus, "success" | "danger" | "warning" | "info"> = {
  pass:        "success",
  fail:        "danger",
  pending:     "warning",
  conditional: "info",
};

export default function FactoryQc() {
  const { t } = useSettings();
  const tc = t.factory.qc;
  const { qualityChecks } = useFactory();

  const [query, setQuery]             = useState("");
  const [statusFilter, setFilter]     = useState<QcStatus | "">("");

  const passCount        = qualityChecks.filter((q) => q.status === "pass").length;
  const failCount        = qualityChecks.filter((q) => q.status === "fail").length;
  const pendingCount     = qualityChecks.filter((q) => q.status === "pending").length;
  const conditionalCount = qualityChecks.filter((q) => q.status === "conditional").length;

  const isLoading = useLoadingDelay();

  const filtered = useMemo(() => {
    return qualityChecks.filter((q) => {
      if (statusFilter && q.status !== statusFilter) return false;
      if (!query) return true;
      const qs = query.toLowerCase();
      return (
        q.id.toLowerCase().includes(qs) ||
        q.batchId.toLowerCase().includes(qs) ||
        q.productName.toLowerCase().includes(qs) ||
        q.inspector.toLowerCase().includes(qs)
      );
    });
  }, [qualityChecks, query, statusFilter]);

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
          <Kpi label={tc.status.pass}        value={String(passCount)}        tone="success" />
          <Kpi label={tc.status.fail}        value={String(failCount)}        tone="danger"  />
          <Kpi label={tc.status.pending}     value={String(pendingCount)}     tone="warning" />
          <Kpi label={tc.status.conditional} value={String(conditionalCount)} tone="info"    />
        </Grid>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setFilter(e.target.value as QcStatus | "")}>
            <option value="">{tc.filters.allStatuses}</option>
            {(["pass", "fail", "pending", "conditional"] as QcStatus[]).map((s) => (
              <option key={s} value={s}>{tc.status[s]}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          {isLoading ? (
            <Skeleton variant="rect" height={240} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<ShieldCheck size={32} />} title={tc.noData} />
          ) : (
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col className="col-w-110" />
                <col className="col-w-110" />
                <col />
                <col className="col-w-110" />
                <col className="col-date" />
                <col className="col-w-120" />
                <col className="col-w-90" />
                <col className="col-w-90" />
                <col className="col-w-90" />
                <col className="col-w-100" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{tc.cols.checkId}</th>
                  <th className="col-code">{tc.cols.batch}</th>
                  <th>{tc.cols.product}</th>
                  <th className="col-code">{tc.cols.order}</th>
                  <th className="col-date">{tc.cols.date}</th>
                  <th>{tc.cols.inspector}</th>
                  <th className="col-num">{tc.cols.sampleSize}</th>
                  <th className="col-num">{tc.cols.failedUnits}</th>
                  <th className="col-num">{tc.cols.defectRate}</th>
                  <th className="col-badge">{tc.cols.status}</th>
                  <th>{tc.cols.notes}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td><span className={styles.mono}>{q.id}</span></td>
                    <td><span className={styles.mono}>{q.batchId}</span></td>
                    <td>{q.productName}</td>
                    <td><span className={styles.mono}>{q.productionOrderId}</span></td>
                    <td className={styles.mono}>{q.inspectionDate}</td>
                    <td>{q.inspector}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{q.sampleSize || "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{q.failedUnits || "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{q.defectRate > 0 ? `${q.defectRate}%` : "—"}</td>
                    <td><Badge variant={QC_VARIANT[q.status]} size="sm">{tc.status[q.status]}</Badge></td>
                    <td style={{ maxWidth: 200, color: "var(--app-text-muted)", fontSize: 11 }}>{q.notes ?? "—"}</td>
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
