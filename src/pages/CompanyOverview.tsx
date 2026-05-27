import { useMemo, useState } from "react";
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
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
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

export default function CompanyOverview() {
  const [dateRange, setDateRange] = useState<"month" | "6months">("6months");
  const { t, formatCurrency } = useSettings();
  const {
    totalRevenue,
    receivablesTotal,
    payablesDue,
    openInvoicesCount,
    headcount,
    customers,
    invoices,
  } = useData();

  const cashFlowData = useMemo(
    () => (dateRange === "month" ? CASH_FLOW.slice(-1) : CASH_FLOW),
    [dateRange]
  );

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{t.company.breadcrumb}</div>
            <h1 className={styles.title}>{t.company.pageTitle}</h1>
            <p className={styles.subtitle}>{t.company.pageSubtitle}</p>
          </div>
          <div className={styles.actions}>
            <Button
              variant={dateRange === "month" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setDateRange("month")}
            >
              {t.company.thisMonth}
            </Button>
            <Button
              variant={dateRange === "6months" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setDateRange("6months")}
            >
              {t.company.last6Months}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={() =>
                downloadCsv(
                  "atlas-company-kpis.csv",
                  ["Label", "Value", "Trend %"],
                  COMPANY_KPIS.map((k) => [k.label, k.value, k.trend])
                )
              }
            >
              {t.company.export}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => window.dispatchEvent(new CustomEvent("atlas:open-quick-create"))}
            >
              {t.company.newEntry}
            </Button>
          </div>
        </header>

        {/* 6 KPIs (3x2) — live from DataContext */}
        <Grid cols={3} gap="md" responsive>
          <KpiCard kpi={{ label: t.company.kpi?.revenue     ?? "REVENUE",    value: formatCurrency(totalRevenue),    trend: 0, color: "green"  }} />
          <KpiCard kpi={{ label: t.company.kpi?.receivables ?? "RECEIVABLES", value: formatCurrency(receivablesTotal), trend: 0, color: "orange", subtitle: `${openInvoicesCount} invoices open` }} />
          <KpiCard kpi={{ label: t.company.kpi?.payables    ?? "PAYABLES",   value: formatCurrency(payablesDue),     trend: 0, color: "blue"   }} />
          <KpiCard kpi={{ label: t.company.kpi?.customers   ?? "CUSTOMERS",  value: String(customers.filter((c) => !c.isDeleted).length), trend: 0, color: "purple" }} />
          <KpiCard kpi={{ label: t.company.kpi?.headcount   ?? "HEADCOUNT",  value: String(headcount), trend: 0, color: "purple" }} />
          <KpiCard kpi={{ label: t.company.kpi?.openInvoices ?? "OPEN INVOICES", value: String(openInvoicesCount), trend: 0, color: "orange" }} />
        </Grid>

        {/* Cash flow + Revenue donut */}
        <div className={styles.chartsRow}>
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{t.company.cashFlow.title}</h2>
              <span className={styles.cardSub}>{t.company.cashFlow.subtitle}</span>
            </header>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cashFlowData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Bar dataKey="inflow"  name={t.company.cashFlow.inflow}  fill="var(--atlas-green)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name={t.company.cashFlow.outflow} fill="var(--atlas-orange)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{t.company.revenueDept.title}</h2>
              <span className={styles.cardSub}>{t.company.revenueDept.subtitle}</span>
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
              <h2 className={styles.cardTitle}>{t.company.openInvoices.title}</h2>
              <span className={styles.cardSub}>{t.company.openInvoices.subtitle}</span>
            </header>
            <table className={styles.invTable}>
              <thead>
                <tr>
                  <th>{t.company.openInvoices.cols.invoice}</th>
                  <th>{t.company.openInvoices.cols.customer}</th>
                  <th>{t.company.openInvoices.cols.due}</th>
                  <th>{t.company.openInvoices.cols.amount}</th>
                  <th>{t.company.openInvoices.cols.status}</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter((inv) => inv.status !== "Paid" && !inv.isDeleted)
                  .slice(0, 8)
                  .map((inv) => {
                    const customer = customers.find((c) => c.id === inv.customerId);
                    const liveInv: OpenInvoice = {
                      invoice: inv.id,
                      customer: customer?.name ?? inv.customerId,
                      issue: inv.date ?? "",
                      due: inv.dueDate ?? inv.date ?? "",
                      amount: Number(inv.remainingAmount ?? inv.total ?? inv.amount ?? 0),
                      status: inv.status === "Overdue" ? "overdue" : "due-soon",
                    };
                    return <InvoiceRow key={inv.id} inv={liveInv} />;
                  })}
              </tbody>
            </table>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{t.company.departments.title}</h2>
              <span className={styles.cardSub}>{t.company.departments.subtitle}</span>
            </header>
            <ul className={styles.deptList}>
              {DEPARTMENTS.map((d) => (
                <li key={d.name} className={styles.deptRow}>
                  <span className={`status-dot ${DEPT_DOT[d.color]}`} aria-hidden />
                  <div className={styles.deptText}>
                    <strong>{d.name}</strong>
                    <span>{d.count} {t.company.departments.people}</span>
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
