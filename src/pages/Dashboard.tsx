import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Grid } from "../components/layout/Grid";
import { WorkspaceCard } from "../components/dashboard/WorkspaceCard";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { TimelineEvent } from "../components/dashboard/TimelineEvent";
import { SignalCard } from "../components/dashboard/SignalCard";
import { PinnedActionButton } from "../components/dashboard/PinnedActionButton";
import {
  OPERATIONAL_SIGNALS,
  PINNED_ACTIONS,
  REVENUE_CHART,
  TIMELINE_EVENTS,
  WORKSPACE_STATS,
} from "../data/dashboardMock";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import styles from "./Dashboard.module.css";

/**
 * Atlas ERP — Operations Command dashboard.
 * Live view across Company, POS, and Factory workspaces.
 */
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<"week" | "month">("week");
  const { t } = useSettings();

  const {
    totalCustomers,
    lowStockCount,
    openInvoicesCount,
    totalPaymentsCount,
    outOfStockCount,
  } = useData();

  const workspaceStats = useMemo(() => {
    return WORKSPACE_STATS.map((ws) => {
      if (ws.id !== "company") return ws;
      return {
        ...ws,
        stats: [
          { label: "OPEN INVOICES", labelAr: "فواتير مفتوحة", value: String(openInvoicesCount), tone: openInvoicesCount > 0 ? ("danger" as const) : ("success" as const) },
          { label: "CUSTOMERS",     labelAr: "العملاء",        value: String(totalCustomers),    tone: "default" as const },
          { label: "PAYMENTS",      labelAr: "المدفوعات",      value: String(totalPaymentsCount), tone: "default" as const },
        ],
      };
    });
  }, [openInvoicesCount, totalCustomers, totalPaymentsCount]);

  const chartData = useMemo(
    () => (dateRange === "week" ? REVENUE_CHART.slice(-7) : REVENUE_CHART),
    [dateRange]
  );

  const operationalSignals = useMemo(() => {
    return OPERATIONAL_SIGNALS.map((sig) => {
      if (sig.id !== "sig1") return sig;
      const count = outOfStockCount + lowStockCount;
      return {
        ...sig,
        title:   `${count} SKUs low/out of stock`,
        titleAr: `${count} صنفاً منخفض المخزون أو نفد`,
        tone: count > 0 ? ("critical" as const) : ("operations" as const),
      };
    });
  }, [outOfStockCount, lowStockCount]);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        {/* 1 · Header */}
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{t.dashboard.breadcrumb}</div>
            <p className={styles.pageSubtitle}>{t.dashboard.pageSubtitle}</p>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant={dateRange === "week" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setDateRange("week")}
            >
              {t.dashboard.thisWeek}
            </Button>
            <Button
              variant={dateRange === "month" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setDateRange("month")}
            >
              {t.dashboard.thisMonth}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={() =>
                downloadCsv(
                  "atlas-revenue.csv",
                  ["Date", "Company", "POS", "Factory"],
                  chartData.map((r) => [r.date, r.company, r.pos, r.factory])
                )
              }
            >
              {t.dashboard.export}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-quick-create"))}
            >
              {t.dashboard.newAction}
            </Button>
          </div>
        </header>

        {/* 2 · Workspace cards */}
        <Grid cols={3} gap="md" responsive>
          {workspaceStats.map((w) => (
            <WorkspaceCard key={w.id} data={w} />
          ))}
        </Grid>

        {/* Main split: chart+signals left, timeline+pinned right */}
        <div className={styles.mainSplit}>
          <div className={styles.mainCol}>
            {/* 3 · Revenue chart */}
            <section className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t.dashboard.chart.title}</h2>
                  <p className={styles.cardSubtitle}>{t.dashboard.chart.subtitle}</p>
                </div>
                <div className={styles.legend}>
                  <span className={styles.legendItem}>
                    <span className="status-dot status-dot--blue" aria-hidden /> {t.dashboard.chart.company}
                  </span>
                  <span className={styles.legendItem}>
                    <span className="status-dot status-dot--green" aria-hidden /> {t.dashboard.chart.pos}
                  </span>
                  <span className={styles.legendItem}>
                    <span className="status-dot status-dot--purple" aria-hidden /> {t.dashboard.chart.factory}
                  </span>
                </div>
              </header>
              <div className={styles.chartWrap}>
                <RevenueChart data={chartData} />
              </div>
            </section>

            {/* 5 · Operational signals */}
            <Grid cols={3} gap="md" responsive>
              {operationalSignals.map((s) => (
                <SignalCard key={s.id} signal={s} />
              ))}
            </Grid>
          </div>

          <aside className={styles.sidebar}>
            {/* 4 · Timeline */}
            <section className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t.dashboard.timeline.title}</h2>
                  <p className={styles.cardSubtitle}>{t.dashboard.timeline.subtitle}</p>
                </div>
              </header>
              <ul className={styles.timeline}>
                {TIMELINE_EVENTS.map((e) => (
                  <TimelineEvent key={e.id} event={e} />
                ))}
              </ul>
            </section>

            {/* 6 · Pinned actions */}
            <section className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t.dashboard.pinnedActions.title}</h2>
                  <p className={styles.cardSubtitle}>{t.dashboard.pinnedActions.subtitle}</p>
                </div>
              </header>
              <Grid cols={2} gap="sm" responsive={false}>
                {PINNED_ACTIONS.map((a) => (
                  <PinnedActionButton key={a.id} action={a} />
                ))}
              </Grid>
            </section>
          </aside>
        </div>
      </Stack>
    </Container>
  );
}
