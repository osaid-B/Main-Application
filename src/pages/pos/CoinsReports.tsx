import { useSettings } from "../../context/SettingsContext";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  POS_COINS_MONTHLY,
  POS_COINS_TOP_BALANCES,
  COIN_TRANSACTIONS,
} from "../../data/posMock";
import styles from "./CoinsReports.module.css";

export default function CoinsReports() {
  const { t } = useSettings();
  const tc = t.pos.coinsReports;

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

        {/* KPIs */}
        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.issued}   value="284,600" sub={tc.kpi.issuedSub}   tone="info"    />
          <Kpi label={tc.kpi.redeemed} value="19,750"  sub={tc.kpi.redeemedSub} tone="success" />
          <Kpi label={tc.kpi.members}  value="320"     sub={tc.kpi.membersSub}  tone="warning" />
          <Kpi label={tc.kpi.rate}     value="40.9%"   sub={tc.kpi.rateSub}     tone="danger"  />
        </Grid>

        {/* Charts row */}
        <Grid cols={2} gap="md" responsive>
          {/* Line chart: monthly issued vs redeemed */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{tc.charts.monthly}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={POS_COINS_MONTHLY} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="issued"
                  name={tc.charts.monthlyIssued}
                  stroke="var(--atlas-blue)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="redeemed"
                  name={tc.charts.monthlyRedeemed}
                  stroke="var(--atlas-green)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart: top customers */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{tc.charts.topCustomers}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={POS_COINS_TOP_BALANCES}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="balance" name="Balance" fill="var(--atlas-blue)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Grid>

        {/* Recent transactions table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.customer}</th>
                <th>{tc.cols.date}</th>
                <th>{tc.cols.action}</th>
                <th className={styles.numEnd}>{tc.cols.coins}</th>
                <th>{tc.cols.trigger}</th>
                <th className={styles.numEnd}>{tc.cols.balanceAfter}</th>
              </tr>
            </thead>
            <tbody>
              {COIN_TRANSACTIONS.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div>
                      <div className={styles.custName}>{tx.customerName ?? "—"}</div>
                      {tx.customerCode && <div className={styles.custCode}>{tx.customerCode}</div>}
                    </div>
                  </td>
                  <td className={styles.mono}>{tx.timestamp.slice(0, 10)}</td>
                  <td>
                    <span className={`${styles.actionBadge} ${styles[`action_${tx.action}`]}`}>
                      {tx.action}
                    </span>
                  </td>
                  <td className={`${styles.numEnd} ${styles.mono} ${tx.delta >= 0 ? styles.pos : styles.neg}`}>
                    {tx.delta >= 0 ? `+${tx.delta}` : String(tx.delta)}
                  </td>
                  <td className={styles.reasonCell}>{tx.reason}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{tx.balanceAfter.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Stack>
    </Container>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "success" | "info" | "warning" | "danger" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span className={styles.kpiSub}>{sub}</span>
    </article>
  );
}
