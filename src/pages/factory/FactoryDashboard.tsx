import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Badge } from "../../components/ui/Badge";
import { useSettings } from "../../context/SettingsContext";
import {
  FACTORY_DASHBOARD_KPI,
  FACTORY_ORDERS,
  FACTORY_QC,
} from "../../data/factoryMock";
import styles from "./factory.module.css";

const ORDER_STATUS_VARIANT = {
  planned: "info",
  "in-progress": "warning",
  done: "success",
  cancelled: "neutral",
} as const;

const QC_STATUS_VARIANT = {
  pass: "success",
  fail: "danger",
  pending: "warning",
  conditional: "info",
} as const;

export default function FactoryDashboard() {
  const { t, formatCurrency } = useSettings();
  const tc = t.factory.dashboard;
  const to = t.factory.orders;
  const tq = t.factory.qc;

  const recentOrders = FACTORY_ORDERS.slice(0, 5);
  const recentQc     = FACTORY_QC.slice(0, 5);

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

        <Grid cols={3} gap="md" responsive>
          <Kpi label={tc.kpi.activeOrders}    value={String(FACTORY_DASHBOARD_KPI.activeOrders)}    tone="warning" />
          <Kpi label={tc.kpi.plannedOrders}   value={String(FACTORY_DASHBOARD_KPI.plannedOrders)}   tone="info"    />
          <Kpi label={tc.kpi.completedOrders} value={String(FACTORY_DASHBOARD_KPI.completedOrders)} tone="success" />
          <Kpi label={tc.kpi.qcPassRate}      value={`${FACTORY_DASHBOARD_KPI.qcPassRate}%`}        tone="success" />
          <Kpi label={tc.kpi.rawAlerts}       value={String(FACTORY_DASHBOARD_KPI.rawMaterialAlerts)} tone="danger" />
          <Kpi label={tc.kpi.openImports}     value={String(FACTORY_DASHBOARD_KPI.openImports)}     tone="neutral" />
        </Grid>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTitle}>{tc.sections.recentOrders}</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{to.cols.orderId}</th>
                  <th>{to.cols.product}</th>
                  <th className={styles.numEnd}>{to.cols.quantity}</th>
                  <th>{to.cols.status}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><span className={styles.mono}>{o.id}</span></td>
                    <td>{o.productId}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{o.quantity.toLocaleString()}</td>
                    <td><Badge variant={ORDER_STATUS_VARIANT[o.status]} size="sm">{to.status[o.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTitle}>{tc.sections.qcSummary}</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{tq.cols.batch}</th>
                  <th>{tq.cols.product}</th>
                  <th>{tq.cols.inspector}</th>
                  <th>{tq.cols.status}</th>
                </tr>
              </thead>
              <tbody>
                {recentQc.map((q) => (
                  <tr key={q.id}>
                    <td><span className={styles.mono}>{q.batchId}</span></td>
                    <td>{q.productName}</td>
                    <td>{q.inspector}</td>
                    <td><Badge variant={QC_STATUS_VARIANT[q.status]} size="sm">{tq.status[q.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory snapshot */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardTitle}>Finished Goods on Hand</div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--app-text-muted)" }}>
            {formatCurrency(0)} total value · {FACTORY_DASHBOARD_KPI.totalFinishedOnHand.toLocaleString()} units
          </p>
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
