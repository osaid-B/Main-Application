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
  DEPARTMENTS,
  REVENUE_BY_DEPT,
  type CompanyKPI,
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

const KPI_LABELS = {
  revenue: { en: "Revenue", ar: "الإيرادات" },
  receivables: { en: "Receivables", ar: "المدينون" },
  payables: { en: "Payables", ar: "الدائنون" },
  customers: { en: "Customers", ar: "العملاء" },
  headcount: { en: "Headcount", ar: "عدد الموظفين" },
  openInvoices: { en: "Open invoices", ar: "فواتير مفتوحة" },
} as const;

const REVENUE_SLICE_AR: Record<string, string> = {
  Wholesale: "الجملة",
  Supermarkets: "السوبرماركت",
  Manufacturing: "التصنيع",
  "Other / royalties": "أخرى / عوائد",
};

const DEPARTMENT_NAME_AR: Record<string, string> = {
  Operations: "العمليات",
  "Sales & Wholesale": "المبيعات والجملة",
  Manufacturing: "التصنيع",
  "Finance & Accounting": "المالية والمحاسبة",
  "IT & Systems": "الأنظمة وتقنية المعلومات",
  Procurement: "المشتريات",
};

function localizeDepartmentName(name: string, isArabic: boolean) {
  return isArabic ? (DEPARTMENT_NAME_AR[name] ?? name) : name;
}

function localizeRevenueSlice(name: string, isArabic: boolean) {
  return isArabic ? (REVENUE_SLICE_AR[name] ?? name) : name;
}

function formatCompactCurrency(value: number) {
  return `$${(value / 1000).toFixed(0)}k`;
}

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
  const { t, isArabic, formatCurrency } = useSettings();
  const {
    totalRevenue,
    receivablesTotal,
    payablesDue,
    openInvoicesCount,
    headcount,
    totalCustomers,
    invoices,
    customers,
  } = useData();

  const cashFlowData = useMemo(
    () => (dateRange === "month" ? CASH_FLOW.slice(-1) : CASH_FLOW),
    [dateRange]
  );

  const companyKpis = useMemo<CompanyKPI[]>(
    () => [
      {
        label: isArabic ? KPI_LABELS.revenue.ar : KPI_LABELS.revenue.en,
        value: formatCurrency(totalRevenue),
        trend: 0,
        color: "green",
      },
      {
        label: isArabic ? KPI_LABELS.receivables.ar : KPI_LABELS.receivables.en,
        value: formatCurrency(receivablesTotal),
        trend: 0,
        color: "orange",
        subtitle: isArabic
          ? `${openInvoicesCount} فواتير مفتوحة`
          : `${openInvoicesCount} invoices open`,
      },
      {
        label: isArabic ? KPI_LABELS.payables.ar : KPI_LABELS.payables.en,
        value: formatCurrency(payablesDue),
        trend: 0,
        color: "blue",
      },
      {
        label: isArabic ? KPI_LABELS.customers.ar : KPI_LABELS.customers.en,
        value: String(customers.filter((c) => !c.isDeleted).length),
        trend: 0,
        color: "purple",
      },
      {
        label: isArabic ? KPI_LABELS.headcount.ar : KPI_LABELS.headcount.en,
        value: String(headcount),
        trend: 0,
        color: "purple",
      },
      {
        label: isArabic ? KPI_LABELS.openInvoices.ar : KPI_LABELS.openInvoices.en,
        value: String(openInvoicesCount),
        trend: 0,
        color: "orange",
      },
    ],
    [
      customers,
      formatCurrency,
      headcount,
      isArabic,
      openInvoicesCount,
      payablesDue,
      receivablesTotal,
      totalRevenue,
    ]
  );

  const revenueSlices = useMemo(
    () =>
      REVENUE_BY_DEPT.map((slice) => ({
        ...slice,
        displayName: localizeRevenueSlice(slice.name, isArabic),
      })),
    [isArabic]
  );

  const departmentRows = useMemo(() => {
    const totalDeptRevenue = DEPARTMENTS.reduce((sum, department) => sum + department.revenue, 0) || 1;

    return DEPARTMENTS.map((department) => ({
      ...department,
      displayName: localizeDepartmentName(department.name, isArabic),
      contribution: Math.round((department.revenue / totalDeptRevenue) * 100),
    }));
  }, [isArabic]);

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
                  ["Label", "Value"],
                  [
                    [t.company.kpis.revenue,      formatCurrency(totalRevenue)],
                    [t.company.kpis.receivables,  formatCurrency(receivablesTotal)],
                    [t.company.kpis.payables,     formatCurrency(payablesDue)],
                    [t.company.kpis.customers,    String(totalCustomers)],
                    [t.company.kpis.headcount,    String(headcount)],
                    [t.company.kpis.openInvoices, String(openInvoicesCount)],
                  ]
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
          {companyKpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
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
                    data={revenueSlices}
                    dataKey="value"
                    nameKey="displayName"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="var(--app-surface)"
                    strokeWidth={2}
                  >
                    {revenueSlices.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className={styles.donutLegend}>
                {revenueSlices.map((s) => (
                  <li key={s.name}>
                    <span className={styles.legendSwatch} style={{ background: s.color }} />
                    <span className={styles.legendName}>{s.displayName}</span>
                    <strong className="numeric-cell">{s.percent}%</strong>
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
                  .filter((inv) => inv.status !== "Paid")
                  .slice(0, 8)
                  .map((inv) => {
                    const customer = customers.find((c) => c.id === inv.customerId);
                    const liveInv: OpenInvoice = {
                      invoice: inv.id,
                      customer: customer?.name ?? inv.customerId,
                      issue: inv.date ?? "",
                      due: inv.date ?? "",
                      amount: Number(inv.remainingAmount ?? inv.total ?? inv.amount ?? 0),
                      status: inv.status === "Partial" ? "due-soon" : "due-soon",
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
              {departmentRows.map((department) => (
                <li key={department.name} className={styles.deptRow}>
                  <div className={styles.deptText}>
                    <strong>{department.displayName}</strong>
                    <span>
                      {department.count} {t.company.departments.people}
                      {isArabic ? " · " : " · "}
                      {department.contribution}% {isArabic ? "من الإيرادات" : "of revenue"}
                    </span>
                  </div>
                  <span className={`${styles.deptRevenue} numeric-cell`}>
                    {formatCompactCurrency(department.revenue)}
                  </span>
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
  const { isArabic } = useSettings();


  return (
    <tr>
      <td><code className={`${styles.invCode} numeric-cell`}>{inv.invoice}</code></td>
      <td>{inv.customer}</td>
      <td className={styles.invDue}>{inv.due}</td>
      <td className={`${styles.invAmount} numeric-cell`}>${inv.amount.toLocaleString()}</td>
      <td>
        <Badge variant={inv.status === "overdue" ? "danger" : "warning"} size="sm">
          {inv.status === "overdue"
            ? (isArabic ? "متأخرة" : "Overdue")
            : (isArabic ? "مستحقة قريباً" : "Due soon")}
        </Badge>
      </td>
    </tr>
  );
}
