import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Download, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Grid } from "../components/layout/Grid";
import {
  CASH_FLOW,
  COMPANY_KPIS,
  DEPARTMENTS,
  OPEN_INVOICES,
  REVENUE_BY_DEPT,
  type CompanyKPI,
  type DepartmentRow,
  type OpenInvoice,
} from "../data/companyMock";
import styles from "./CompanyOverview.module.css";

const KPI_BAR_COLOR: Record<CompanyKPI["color"], string> = {
  blue: "var(--atlas-blue)",
  green: "var(--atlas-green)",
  purple: "var(--atlas-purple)",
  orange: "var(--atlas-orange)",
};

const DEPT_DOT: Record<DepartmentRow["color"], string> = {
  blue: "status-dot--blue",
  green: "status-dot--green",
  purple: "status-dot--purple",
  gray: "status-dot--gray",
  orange: "status-dot--orange",
};

export default function CompanyOverview() {
  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>ATLAS ERP · COMPANY · OVERVIEW</div>
            <h1 className={styles.title}>Company Overview</h1>
            <p className={styles.subtitle}>
              The parent entity at a glance — cash, receivables, payroll, and revenue mix.
            </p>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" size="sm">This month</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>Export</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>New entry</Button>
          </div>
        </header>

        {/* 6 KPIs (3x2) */}
        <Grid cols={3} gap="md" responsive>
          {COMPANY_KPIS.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
        </Grid>

        {/* Cash flow + Revenue donut */}
        <div className={styles.chartsRow}>
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Cash Flow · 6 Months</h2>
              <span className={styles.cardSub}>Inflow vs outflow · net delta</span>
            </header>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={CASH_FLOW} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Bar dataKey="inflow"  name="Inflow"  fill="var(--atlas-green)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Outflow" fill="var(--atlas-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Revenue by Department</h2>
              <span className={styles.cardSub}>Distribution of monthly revenue</span>
            </header>
            <div className={styles.donutWrap}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={REVENUE_BY_DEPT}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="var(--app-surface)"
                    strokeWidth={2}
                  >
                    {REVENUE_BY_DEPT.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className={styles.donutLegend}>
                {REVENUE_BY_DEPT.map((s) => (
                  <li key={s.name}>
                    <span className={styles.legendSwatch} style={{ background: s.color }} />
                    <span className={styles.legendName}>{s.name}</span>
                    <strong>{s.percent}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Open invoices + Departments */}
        <div className={styles.chartsRow}>
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Open Invoices</h2>
              <span className={styles.cardSub}>Top 8 unpaid · sorted by due date</span>
            </header>
            <table className={styles.invTable}>
              <thead>
                <tr><th>Invoice</th><th>Customer</th><th>Due</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {OPEN_INVOICES.map((i) => <InvoiceRow key={i.invoice} inv={i} />)}
              </tbody>
            </table>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Departments</h2>
              <span className={styles.cardSub}>Headcount + monthly revenue contribution</span>
            </header>
            <ul className={styles.deptList}>
              {DEPARTMENTS.map((d) => (
                <li key={d.name} className={styles.deptRow}>
                  <span className={`status-dot ${DEPT_DOT[d.color]}`} aria-hidden />
                  <div className={styles.deptText}>
                    <strong>{d.name}</strong>
                    <span>{d.count} people</span>
                  </div>
                  <span className={styles.deptRevenue}>${(d.revenue / 1000).toFixed(0)}k</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Stack>
    </Container>
  );
}

function KpiCard({ kpi }: { kpi: CompanyKPI }) {
  const up = kpi.trend >= 0;
  return (
    <article className={styles.kpiCard}>
      <span className={styles.kpiBar} style={{ background: KPI_BAR_COLOR[kpi.color] }} aria-hidden />
      <span className={styles.kpiLabel}>{kpi.label}</span>
      <strong className={styles.kpiValue}>{kpi.value}</strong>
      <div className={styles.kpiTrend}>
        <span className={up ? styles.trendUp : styles.trendDown}>
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(kpi.trend)}%
        </span>
        {kpi.subtitle && <span className={styles.kpiSubtitle}>{kpi.subtitle}</span>}
      </div>
    </article>
  );
}

function InvoiceRow({ inv }: { inv: OpenInvoice }) {
  return (
    <tr>
      <td><code className={styles.invCode}>{inv.invoice}</code></td>
      <td>{inv.customer}</td>
      <td className={styles.invDue}>{inv.due}</td>
      <td className={styles.invAmount}>${inv.amount.toLocaleString()}</td>
      <td>
        <Badge variant={inv.status === "overdue" ? "danger" : "warning"} size="sm">
          {inv.status === "overdue" ? "Overdue" : "Due soon"}
        </Badge>
      </td>
    </tr>
  );
}
