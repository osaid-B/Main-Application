import { useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  Coffee,
  Cog,
  DollarSign,
  Download,
  FileText,
  Hammer,
  Package,
  Plus,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Grid } from "../components/layout/Grid";
import styles from "./Dashboard.module.css";

type WorkspaceTone = "blue" | "green" | "purple";

interface WorkspaceCardData {
  name: string;
  tone: WorkspaceTone;
  revenue: string;
  delta: string;
  stats: Array<{ label: string; value: string }>;
  spark: number[];
}

const WORKSPACES: WorkspaceCardData[] = [
  {
    name: "Company",
    tone: "blue",
    revenue: "$184,300",
    delta: "+8.4% vs last week",
    stats: [
      { label: "Open invoices", value: "23" },
      { label: "Net cash", value: "$62.1k" },
      { label: "Payroll due", value: "$41.0k" },
    ],
    spark: [38, 42, 39, 47, 51, 58, 62, 60, 68, 71, 74, 79, 83, 88],
  },
  {
    name: "POS",
    tone: "green",
    revenue: "$48,725",
    delta: "+2.1% vs yesterday",
    stats: [
      { label: "TX today", value: "412" },
      { label: "Avg basket", value: "$118" },
      { label: "Coins issued", value: "1,820" },
    ],
    spark: [22, 19, 24, 27, 23, 26, 31, 28, 33, 37, 34, 41, 44, 48],
  },
  {
    name: "Factory",
    tone: "purple",
    revenue: "$312,500",
    delta: "+11.7% vs last week",
    stats: [
      { label: "Active orders", value: "18" },
      { label: "QC pass", value: "96%" },
      { label: "On hold", value: "2" },
    ],
    spark: [55, 58, 62, 61, 64, 70, 72, 78, 75, 81, 84, 87, 91, 96],
  },
];

const CHART_DATA = [
  { day: "Apr 30", Company: 22, POS: 7, Factory: 41 },
  { day: "May 1", Company: 26, POS: 8, Factory: 39 },
  { day: "May 2", Company: 24, POS: 6, Factory: 44 },
  { day: "May 3", Company: 31, POS: 9, Factory: 48 },
  { day: "May 4", Company: 28, POS: 11, Factory: 52 },
  { day: "May 5", Company: 35, POS: 9, Factory: 56 },
  { day: "May 6", Company: 33, POS: 12, Factory: 61 },
  { day: "May 7", Company: 38, POS: 14, Factory: 64 },
  { day: "May 8", Company: 36, POS: 11, Factory: 68 },
  { day: "May 9", Company: 42, POS: 15, Factory: 72 },
  { day: "May 10", Company: 45, POS: 18, Factory: 76 },
  { day: "May 11", Company: 41, POS: 14, Factory: 81 },
  { day: "May 12", Company: 48, POS: 19, Factory: 86 },
  { day: "May 13", Company: 51, POS: 22, Factory: 92 },
];

type TimelineDot = "green" | "red" | "purple" | "blue" | "orange";

interface TimelineEvent {
  id: string;
  time: string;
  dot: TimelineDot;
  title: string;
  desc: string;
}

const TIMELINE: TimelineEvent[] = [
  { id: "t1", time: "07:00", dot: "green", title: "Riyadh shift open", desc: "POS terminals online · cashier sign-in complete" },
  { id: "t2", time: "08:30", dot: "purple", title: "Factory line 1 startup", desc: "Mixing run #4421 scheduled · operator: H. Yousef" },
  { id: "t3", time: "09:14", dot: "blue", title: "Invoice #INV-2031 issued", desc: "Northwind Suppliers · $12,400 · net 30" },
  { id: "t4", time: "10:02", dot: "red", title: "Stock alert raised", desc: "12 SKUs under reorder threshold · category: packaging" },
  { id: "t5", time: "11:25", dot: "orange", title: "QC hold on batch #B-77", desc: "Reason: humidity off-spec · awaiting supervisor review" },
  { id: "t6", time: "12:48", dot: "green", title: "Payroll batch approved", desc: "April cycle · 142 employees · $41.0k" },
  { id: "t7", time: "13:30", dot: "blue", title: "Customer onboarded", desc: "Halim Foodservice · region: Levant · tier: Gold" },
];

interface Signal {
  label: "CRITICAL" | "OPERATIONS" | "FINANCE";
  tone: "danger" | "warning" | "info";
  title: string;
  desc: string;
  actionText: string;
}

const SIGNALS: Signal[] = [
  {
    label: "CRITICAL",
    tone: "danger",
    title: "12 SKUs out of stock",
    desc: "Packaging line will halt within 36h if not replenished.",
    actionText: "Replenish",
  },
  {
    label: "OPERATIONS",
    tone: "warning",
    title: "Production order paused",
    desc: "Order #PO-882 on hold — awaiting QC sign-off.",
    actionText: "Open order",
  },
  {
    label: "FINANCE",
    tone: "info",
    title: "3 invoices overdue",
    desc: "Combined exposure: $48,200 · oldest aged 41 days.",
    actionText: "Start dunning",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        {/* 1. Header */}
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>
              <span>Atlas ERP</span>
              <span className={styles.breadcrumbSep}>·</span>
              <span>Today</span>
              <span className={styles.breadcrumbSep}>·</span>
              <span>Wed May 13</span>
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

        {/* 2. Three workspace cards */}
        <Grid cols={3} gap="md" responsive>
          {WORKSPACES.map((w) => (
            <WorkspaceCard key={w.name} data={w} />
          ))}
        </Grid>

        {/* Main split: chart+signals (left), timeline+pinned (right) */}
        <div className={styles.mainSplit}>
          <div className={styles.mainCol}>
            {/* 3. Revenue chart */}
            <section className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Revenue Across All Modules</h2>
                  <p className={styles.cardSubtitle}>Apr 30 → May 13 · daily revenue (USD, thousands)</p>
                </div>
                <div className={styles.legend}>
                  <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotBlue}`} /> Company</span>
                  <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotGreen}`} /> POS</span>
                  <span className={styles.legendItem}><span className={`${styles.dot} ${styles.dotPurple}`} /> Factory</span>
                </div>
              </header>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={CHART_DATA} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `$${v}k`} tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} tickLine={false} axisLine={false} width={48} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--app-surface)",
                        border: "1px solid var(--app-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v) => `$${v}k`}
                    />
                    <Line type="monotone" dataKey="Company" stroke="var(--atlas-blue)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="POS" stroke="var(--atlas-green)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Factory" stroke="var(--atlas-purple)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* 5. Operational signals */}
            <Grid cols={3} gap="md" responsive>
              {SIGNALS.map((s) => (
                <SignalCard key={s.label} signal={s} />
              ))}
            </Grid>
          </div>

          <aside className={styles.sidebar}>
            {/* 4. Timeline */}
            <section className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Today's Timeline</h2>
                  <p className={styles.cardSubtitle}>Recent operations events</p>
                </div>
              </header>
              <ul className={styles.timeline}>
                {TIMELINE.map((e) => (
                  <li key={e.id} className={styles.timelineItem}>
                    <span className={styles.timelineTime}>{e.time}</span>
                    <span className={`${styles.dot} ${styles[`dot${e.dot[0].toUpperCase() + e.dot.slice(1)}`]} ${styles.dotPulse}`} aria-hidden />
                    <div className={styles.timelineBody}>
                      <strong>{e.title}</strong>
                      <p>{e.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* 6. Pinned actions */}
            <section className={styles.card}>
              <header className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Pinned Actions</h2>
                  <p className={styles.cardSubtitle}>Most-used shortcuts</p>
                </div>
              </header>
              <Grid cols={2} gap="sm" responsive={false}>
                <Button variant="secondary" size="sm" leftIcon={<FileText size={14} />} onClick={() => navigate("/invoices")}>New invoice</Button>
                <Button variant="secondary" size="sm" leftIcon={<UserPlus size={14} />} onClick={() => navigate("/customers")}>Add customer</Button>
                <Button variant="secondary" size="sm" leftIcon={<ShoppingCart size={14} />} onClick={() => navigate("/payments")}>Open POS</Button>
                <Button variant="secondary" size="sm" leftIcon={<Package size={14} />} onClick={() => navigate("/purchases")}>New production</Button>
              </Grid>
            </section>
          </aside>
        </div>
      </Stack>
    </Container>
  );
}

function WorkspaceCard({ data }: { data: WorkspaceCardData }) {
  const Icon = data.tone === "blue" ? Building2 : data.tone === "green" ? Coffee : Hammer;
  return (
    <article className={`${styles.wsCard} ${styles[`ws_${data.tone}`]}`}>
      <span className={styles.wsAccentBar} aria-hidden />
      <header className={styles.wsHeader}>
        <span className={styles.wsIconWrap}>
          <Icon size={16} />
        </span>
        <div className={styles.wsHeaderText}>
          <h3 className={styles.wsName}>{data.name}</h3>
          <span className={styles.wsDelta}>{data.delta}</span>
        </div>
      </header>
      <div className={styles.wsRevenue}>{data.revenue}</div>
      <Sparkline data={data.spark} tone={data.tone} />
      <ul className={styles.wsStats}>
        {data.stats.map((s) => (
          <li key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Sparkline({ data, tone }: { data: number[]; tone: WorkspaceTone }) {
  const w = 100;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(" ");
  const color =
    tone === "blue" ? "var(--atlas-blue)" : tone === "green" ? "var(--atlas-green)" : "var(--atlas-purple)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.spark} preserveAspectRatio="none" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const Icon = signal.tone === "danger" ? Bell : signal.tone === "warning" ? Cog : DollarSign;
  return (
    <article className={`${styles.signalCard} ${styles[`signal_${signal.tone}`]}`}>
      <header className={styles.signalHeader}>
        <Badge variant={signal.tone === "danger" ? "danger" : signal.tone === "warning" ? "warning" : "info"} size="sm">
          {signal.label}
        </Badge>
        <Icon size={14} className={styles.signalIcon} aria-hidden />
      </header>
      <h3 className={styles.signalTitle}>{signal.title}</h3>
      <p className={styles.signalDesc}>{signal.desc}</p>
      <div className={styles.signalAction}>
        <Button variant="secondary" size="sm">{signal.actionText}</Button>
      </div>
    </article>
  );
}
