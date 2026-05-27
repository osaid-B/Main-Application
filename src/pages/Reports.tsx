import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Container } from "../components/layout/Container";
import { Grid } from "../components/layout/Grid";
import { Stack } from "../components/layout/Stack";
import { Button } from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { Skeleton } from "../components/ui/Skeleton";
import { useLoadingDelay } from "../hooks/useLoadingDelay";
import {
  MONTHLY_FINANCIALS,
  SALES_BY_CASHIER,
  SALES_BY_METHOD,
  SALES_BY_CATEGORY,
  PL_ITEMS,
  type BreakdownRow,
  type PLLineItem,
} from "../data/reportsMock";
import styles from "./Reports.module.css";

type TabId = "overview" | "sales" | "expenses" | "pl" | "custom" | "vat";

// Previous month baseline for delta calculations
const PREV = MONTHLY_FINANCIALS[MONTHLY_FINANCIALS.length - 2];

export default function Reports() {
  const { t, formatCurrency } = useSettings();
  const tc = t.reports;
  const { totalRevenue, expenses } = useData();

  const [tab, setTab] = useState<TabId>("overview");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [generated,  setGenerated]  = useState(false);

  const isLoading = useLoadingDelay();

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview",  label: tc.tabs.overview  },
    { id: "sales",     label: tc.tabs.sales      },
    { id: "expenses",  label: tc.tabs.expenses   },
    { id: "pl",        label: tc.tabs.pl         },
    { id: "custom",    label: tc.tabs.custom     },
    { id: "vat",       label: tc.tabs.vat        },
  ];

  const liveExpenses = useMemo(
    () => expenses.filter((e) => !e.isDeleted).reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses]
  );
  const liveNetProfit = totalRevenue - liveExpenses;
  const margin = totalRevenue > 0
    ? ((liveNetProfit / totalRevenue) * 100).toFixed(1) + "%"
    : "0%";

  function exportTabCSV(activeTab: TabId) {
    let rows: string[][];
    if (activeTab === "sales") {
      rows = [
        ["Name", "Transactions", "Amount", "Share %"],
        ...SALES_BY_CASHIER.map((r) => [r.name, String(r.transactions), String(r.amount), r.share.toFixed(1)]),
      ];
    } else if (activeTab === "pl") {
      rows = [["Label", "Amount"], ...PL_ITEMS.map((r) => [r.label, String(r.amount)])];
    } else {
      rows = [
        ["Month", "Revenue", "Expenses", "Gross Profit", "Net Profit"],
        ...MONTHLY_FINANCIALS.map((r) => [r.month, String(r.revenue), String(r.expenses), String(r.grossProfit), String(r.netProfit)]),
      ];
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => exportTabCSV(tab)}>
            {t.common.export} CSV
          </Button>
        </header>

        {/* KPI cards */}
        <Grid cols={4} gap="md" responsive>
          <Kpi
            label={tc.kpi.revenue}
            value={formatCurrency(totalRevenue)}
            sub={tc.kpi.revenueSub}
            delta={totalRevenue - PREV.revenue}
            tone="info"
            formatCurrency={formatCurrency}
          />
          <Kpi
            label={tc.kpi.expenses}
            value={formatCurrency(liveExpenses)}
            sub={tc.kpi.expensesSub}
            delta={liveExpenses - PREV.expenses}
            tone="warning"
            formatCurrency={formatCurrency}
            invertDelta
          />
          <Kpi
            label={tc.kpi.netProfit}
            value={formatCurrency(liveNetProfit)}
            sub={tc.kpi.netProfitSub}
            delta={liveNetProfit - PREV.netProfit}
            tone="success"
            formatCurrency={formatCurrency}
          />
          <Kpi
            label={tc.kpi.margin}
            value={margin}
            sub={tc.kpi.marginSub}
            tone="neutral"
            formatCurrency={formatCurrency}
          />
        </Grid>

        {/* Tabs */}
        <div className={styles.tabBar}>
          {TABS.map((tb) => (
            <button
              key={tb.id}
              type="button"
              className={`${styles.tabBtn} ${tab === tb.id ? styles.tabBtnActive : ""}`}
              onClick={() => setTab(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {isLoading ? (
          <Skeleton variant="rect" height={360} />
        ) : (
          <>
            {tab === "overview" && (
              <OverviewTab tc={tc} formatCurrency={formatCurrency} />
            )}
            {tab === "sales" && (
              <SalesTab tc={tc} formatCurrency={formatCurrency} />
            )}
            {tab === "expenses" && (
              <ExpensesTableTab tc={tc} formatCurrency={formatCurrency} />
            )}
            {tab === "pl" && (
              <PLTab tc={tc} formatCurrency={formatCurrency} />
            )}
            {tab === "custom" && (
              <CustomTab
                tc={tc}
                formatCurrency={formatCurrency}
                customFrom={customFrom}
                customTo={customTo}
                setCustomFrom={setCustomFrom}
                setCustomTo={setCustomTo}
                generated={generated}
                setGenerated={setGenerated}
              />
            )}
            {tab === "vat" && (
              <VatTab tc={tc} formatCurrency={formatCurrency} totalRevenue={totalRevenue} />
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

/* ---------- Overview tab ---------- */
function OverviewTab({
  tc,
  formatCurrency,
}: {
  tc: ReturnType<typeof useSettings>["t"]["reports"];
  formatCurrency: (n: number) => string;
}) {
  return (
    <Stack gap="lg">
      {/* Line chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>{tc.chart.revenue} / {tc.chart.expenses} / {tc.chart.profit}</div>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MONTHLY_FINANCIALS} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              <Line type="monotone" dataKey="revenue"   name={tc.chart.revenue}   stroke="var(--atlas-blue)"   strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses"  name={tc.chart.expenses}  stroke="var(--atlas-orange)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netProfit" name={tc.chart.profit}    stroke="var(--atlas-green)"  strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly summary table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{tc.table.period}</th>
              <th className={styles.numEnd}>{tc.table.revenue}</th>
              <th className={styles.numEnd}>{tc.table.expenses}</th>
              <th className={styles.numEnd}>{tc.table.grossProfit}</th>
              <th className={styles.numEnd}>{tc.table.netProfit}</th>
              <th className={styles.numEnd}>{tc.table.margin}</th>
            </tr>
          </thead>
          <tbody>
            {[...MONTHLY_FINANCIALS].reverse().map((row) => {
              const m = row.revenue > 0 ? ((row.netProfit / row.revenue) * 100).toFixed(1) : "0";
              return (
                <tr key={row.month}>
                  <td className={styles.mono}>{row.month}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.revenue)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.expenses)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.grossProfit)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.netProfit)}</td>
                  <td className={`${styles.numEnd} ${styles.mono} ${styles.marginCell}`}>{m}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Stack>
  );
}

/* ---------- Sales tab ---------- */
function SalesTab({
  tc,
  formatCurrency,
}: {
  tc: ReturnType<typeof useSettings>["t"]["reports"];
  formatCurrency: (n: number) => string;
}) {
  return (
    <Stack gap="lg">
      <div className={styles.twoCol}>
        <BreakdownTable title={tc.sales.byCashier}  rows={SALES_BY_CASHIER}  tc={tc} formatCurrency={formatCurrency} />
        <BreakdownTable title={tc.sales.byMethod}   rows={SALES_BY_METHOD}   tc={tc} formatCurrency={formatCurrency} />
      </div>
      <BreakdownTable title={tc.sales.byCategory} rows={SALES_BY_CATEGORY} tc={tc} formatCurrency={formatCurrency} />

      {/* Bar chart by category */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>{tc.sales.byCategory}</div>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={SALES_BY_CATEGORY} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="amount" name={tc.chart.revenue} fill="var(--atlas-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Stack>
  );
}

function BreakdownTable({
  title,
  rows,
  tc,
  formatCurrency,
}: {
  title: string;
  rows: BreakdownRow[];
  tc: ReturnType<typeof useSettings>["t"]["reports"];
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHeader}>{title}</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{tc.sales.cols.name}</th>
            <th className={styles.numEnd}>{tc.sales.cols.transactions}</th>
            <th className={styles.numEnd}>{tc.sales.cols.amount}</th>
            <th className={styles.numEnd}>{tc.sales.cols.share}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{row.transactions}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.amount)}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{row.share.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Expenses tab (monthly bar chart + table) ---------- */
function ExpensesTableTab({
  tc,
  formatCurrency,
}: {
  tc: ReturnType<typeof useSettings>["t"]["reports"];
  formatCurrency: (n: number) => string;
}) {
  return (
    <Stack gap="lg">
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>{tc.tabs.expenses}</div>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MONTHLY_FINANCIALS} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="expenses" name={tc.chart.expenses} fill="var(--atlas-orange)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{tc.table.period}</th>
              <th className={styles.numEnd}>{tc.table.revenue}</th>
              <th className={styles.numEnd}>{tc.table.expenses}</th>
              <th className={styles.numEnd}>{tc.table.margin}</th>
            </tr>
          </thead>
          <tbody>
            {[...MONTHLY_FINANCIALS].reverse().map((row) => {
              const ratio = row.revenue > 0 ? ((row.expenses / row.revenue) * 100).toFixed(1) : "0";
              return (
                <tr key={row.month}>
                  <td className={styles.mono}>{row.month}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.revenue)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.expenses)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{ratio}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Stack>
  );
}

/* ---------- P&L tab ---------- */
function PLTab({
  tc,
  formatCurrency,
}: {
  tc: ReturnType<typeof useSettings>["t"]["reports"];
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHeader}>{tc.pl.title}</div>
      <table className={styles.table}>
        <tbody>
          {PL_ITEMS.map((item: PLLineItem, idx) => (
            <tr key={idx} className={item.isTotal ? styles.plTotalRow : ""}>
              <td className={item.isTotal ? styles.plTotalLabel : styles.plLabel}>
                {item.label}
                <span className={styles.plLabelAr}>{item.labelAr}</span>
              </td>
              <td className={`${styles.numEnd} ${styles.mono} ${item.isNegative ? styles.plNeg : item.isTotal && item.amount > 0 ? styles.plPos : ""}`}>
                {item.isNegative ? `(${formatCurrency(item.amount)})` : formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Custom range tab ---------- */
function CustomTab({
  tc,
  formatCurrency,
  customFrom,
  customTo,
  setCustomFrom,
  setCustomTo,
  generated,
  setGenerated,
}: {
  tc: ReturnType<typeof useSettings>["t"]["reports"];
  formatCurrency: (n: number) => string;
  customFrom: string;
  customTo: string;
  setCustomFrom: (v: string) => void;
  setCustomTo: (v: string) => void;
  generated: boolean;
  setGenerated: (v: boolean) => void;
}) {
  const canGenerate = customFrom && customTo;

  // Filter MONTHLY_FINANCIALS to months within the selected range
  const filteredData = useMemo(() => {
    if (!generated || !customFrom || !customTo) return MONTHLY_FINANCIALS;
    return MONTHLY_FINANCIALS.filter((row) => {
      return row.month >= customFrom.slice(0, 7) && row.month <= customTo.slice(0, 7);
    });
  }, [generated, customFrom, customTo]);

  return (
    <Stack gap="lg">
      <div className={styles.customBar}>
        <div className={styles.customField}>
          <label className={styles.customLabel}>{tc.custom.from}</label>
          <input
            type="date"
            className={styles.customInput}
            value={customFrom}
            onChange={(e) => { setCustomFrom(e.target.value); setGenerated(false); }}
          />
        </div>
        <div className={styles.customField}>
          <label className={styles.customLabel}>{tc.custom.to}</label>
          <input
            type="date"
            className={styles.customInput}
            value={customTo}
            onChange={(e) => { setCustomTo(e.target.value); setGenerated(false); }}
          />
        </div>
        <button
          type="button"
          className={styles.customBtn}
          disabled={!canGenerate}
          onClick={() => setGenerated(true)}
        >
          {tc.custom.apply}
        </button>
      </div>

      {generated ? (
        filteredData.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{tc.table.period}</th>
                  <th className={styles.numEnd}>{tc.table.revenue}</th>
                  <th className={styles.numEnd}>{tc.table.expenses}</th>
                  <th className={styles.numEnd}>{tc.table.grossProfit}</th>
                  <th className={styles.numEnd}>{tc.table.netProfit}</th>
                  <th className={styles.numEnd}>{tc.table.margin}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => {
                  const m = row.revenue > 0 ? ((row.netProfit / row.revenue) * 100).toFixed(1) : "0";
                  return (
                    <tr key={row.month}>
                      <td className={styles.mono}>{row.month}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.revenue)}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.expenses)}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.grossProfit)}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(row.netProfit)}</td>
                      <td className={`${styles.numEnd} ${styles.mono} ${styles.marginCell}`}>{m}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>{tc.custom.noData}</p>
          </div>
        )
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{tc.custom.noData}</p>
        </div>
      )}
    </Stack>
  );
}

/* ---------- KPI card ---------- */
function Kpi({
  label,
  value,
  sub,
  delta,
  tone,
  formatCurrency,
  invertDelta = false,
}: {
  label: string;
  value: string;
  sub: string;
  delta?: number;
  tone: "success" | "info" | "warning" | "neutral";
  formatCurrency: (n: number) => string;
  invertDelta?: boolean;
}) {
  const { t } = useSettings();
  const isPositive = delta !== undefined ? (invertDelta ? delta < 0 : delta > 0) : true;
  const sign = delta !== undefined && delta > 0 ? "+" : "";
  const deltaStr = delta !== undefined
    ? `${sign}${formatCurrency(Math.abs(delta))} ${t.reports.vsPrev ?? "vs prev"}`
    : undefined;

  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span className={styles.kpiSub}>{sub}</span>
      {deltaStr && (
        <span className={isPositive ? styles.kpiDeltaPos : styles.kpiDeltaNeg}>
          {deltaStr}
        </span>
      )}
    </article>
  );
}


/* ---------- VAT Report tab ---------- */
function VatTab({
  tc,
  formatCurrency,
  totalRevenue,
}: {
  tc: ReturnType<typeof useSettings>["t"]["reports"];
  formatCurrency: (n: number) => string;
  totalRevenue: number;
}) {
  const tv = tc.vat;
  const VAT_RATE = 0.16;

  // Synthetic quarterly data based on live totalRevenue
  const quarters = [
    { q: "Q1 2026", taxable: totalRevenue * 0.22, inputVat: totalRevenue * 0.022 },
    { q: "Q2 2026", taxable: totalRevenue * 0.27, inputVat: totalRevenue * 0.028 },
    { q: "Q3 2026", taxable: totalRevenue * 0.25, inputVat: totalRevenue * 0.025 },
    { q: "Q4 2026", taxable: totalRevenue * 0.26, inputVat: totalRevenue * 0.026 },
  ].map((r) => ({
    ...r,
    outputVat: r.taxable * VAT_RATE,
    net: r.taxable * VAT_RATE - r.inputVat,
  }));

  const totals = quarters.reduce(
    (acc, q) => ({
      taxable: acc.taxable + q.taxable,
      outputVat: acc.outputVat + q.outputVat,
      inputVat: acc.inputVat + q.inputVat,
      net: acc.net + q.net,
    }),
    { taxable: 0, outputVat: 0, inputVat: 0, net: 0 }
  );

  return (
    <Stack gap="lg">
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>{tv.title}</div>
        <p style={{ fontSize: 13, color: "var(--app-text-muted)", marginBottom: 16 }}>{tv.subtitle}</p>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: tv.taxableRevenue, value: formatCurrency(totals.taxable) },
            { label: tv.vatCollected,   value: formatCurrency(totals.outputVat) },
            { label: tv.vatPaid,        value: formatCurrency(totals.inputVat) },
            { label: tv.vatOwed,        value: formatCurrency(totals.net) },
          ].map((kpi) => (
            <div key={kpi.label} style={{ padding: "12px 16px", background: "var(--app-subtle)", borderRadius: "var(--app-radius-md)" }}>
              <span style={{ fontSize: 12, color: "var(--app-text-muted)", display: "block" }}>{kpi.label}</span>
              <strong style={{ fontSize: 18, color: "var(--app-text)" }}>{kpi.value}</strong>
            </div>
          ))}
        </div>

        {/* Quarterly table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tv.cols.period}</th>
                <th className={styles.numEnd}>{tv.cols.taxable}</th>
                <th className={styles.numEnd}>{tv.cols.outputVat}</th>
                <th className={styles.numEnd}>{tv.cols.inputVat}</th>
                <th className={styles.numEnd}>{tv.cols.net}</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q) => (
                <tr key={q.q}>
                  <td>{q.q}</td>
                  <td className={styles.numEnd}>{formatCurrency(q.taxable)}</td>
                  <td className={styles.numEnd}>{formatCurrency(q.outputVat)}</td>
                  <td className={styles.numEnd}>{formatCurrency(q.inputVat)}</td>
                  <td className={styles.numEnd} style={{ fontWeight: 600, color: q.net > 0 ? "var(--app-danger)" : "var(--app-success)" }}>
                    {formatCurrency(q.net)}
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, borderTop: "2px solid var(--app-border)" }}>
                <td>Total</td>
                <td className={styles.numEnd}>{formatCurrency(totals.taxable)}</td>
                <td className={styles.numEnd}>{formatCurrency(totals.outputVat)}</td>
                <td className={styles.numEnd}>{formatCurrency(totals.inputVat)}</td>
                <td className={styles.numEnd} style={{ color: "var(--app-danger)" }}>{formatCurrency(totals.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Stack>
  );
}
