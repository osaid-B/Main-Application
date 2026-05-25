import { useMemo } from "react";
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
import styles from "./Dashboard.module.css";

/**
 * Atlas ERP — Operations Command dashboard.
 * Live view across Company, POS, and Factory workspaces.
 */
export default function Dashboard() {
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
          { label: "OPEN INVOICES", value: String(openInvoicesCount), tone: openInvoicesCount > 0 ? ("danger" as const) : ("success" as const) },
          { label: "CUSTOMERS", value: String(totalCustomers), tone: "default" as const },
          { label: "PAYMENTS", value: String(totalPaymentsCount), tone: "default" as const },
        ],
      };
    });
  }, [openInvoicesCount, totalCustomers, totalPaymentsCount]);

  const operationalSignals = useMemo(() => {
    return OPERATIONAL_SIGNALS.map((sig) => {
      if (sig.id !== "sig1") return sig;
      const count = outOfStockCount + lowStockCount;
      return {
        ...sig,
        title: `${count} SKUs low/out of stock`,
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
            <div className={styles.breadcrumb}>
              <span>ATLAS ERP</span>
              <span className={styles.breadcrumbSep}>·</span>
              <span>TODAY</span>
              <span className={styles.breadcrumbSep}>·</span>
              <span>WED MAY 13</span>
            </div>
            <h1 className={styles.pageTitle}>Operations Command</h1>
            <p className={styles.pageSubtitle}>
              Live view of company, POS, and factory in one operations workspace.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" size="sm">This week</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>Export</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>New action</Button>
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
                  <h2 className={styles.cardTitle}>Revenue Across All Modules</h2>
                  <p className={styles.cardSubtitle}>
                    Apr 30 → May 13 · daily revenue (USD)
                  </p>
                </div>
                <div className={styles.legend}>
                  <span className={styles.legendItem}>
                    <span className="status-dot status-dot--blue" aria-hidden /> Company
                  </span>
                  <span className={styles.legendItem}>
                    <span className="status-dot status-dot--green" aria-hidden /> POS
                  </span>
                  <span className={styles.legendItem}>
                    <span className="status-dot status-dot--purple" aria-hidden /> Factory
                  </span>
                </div>
              </header>
              <div className={styles.chartWrap}>
                <RevenueChart data={REVENUE_CHART} />
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
                  <h2 className={styles.cardTitle}>Today's Timeline</h2>
                  <p className={styles.cardSubtitle}>Live operations events</p>
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
                  <h2 className={styles.cardTitle}>Pinned Actions</h2>
                  <p className={styles.cardSubtitle}>Most-used shortcuts</p>
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
