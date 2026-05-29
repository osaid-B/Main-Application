import { useMemo, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Badge } from "../../components/ui/Badge";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  POS_COINS_MONTHLY,
  POS_COINS_TOP_BALANCES,
  COIN_TRANSACTIONS,
  type CoinAction,
} from "../../data/posMock";
import styles from "./CoinsReports.module.css";

const ACTION_VARIANT: Record<CoinAction, "success" | "danger" | "warning" | "info" | "neutral"> = {
  earned:   "success",
  redeemed: "danger",
  reversed: "warning",
  manual:   "info",
  expired:  "neutral",
};

export default function CoinsReports() {
  const { t } = useSettings();
  const tc = t.pos.coinsReports;

  const [actionFilter, setActionFilter] = useState<CoinAction | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  // KPIs computed from mock data
  const totalIssued   = COIN_TRANSACTIONS.filter((tx) => tx.delta > 0).reduce((s, tx) => s + tx.delta, 0);
  const totalRedeemed = Math.abs(COIN_TRANSACTIONS.filter((tx) => tx.action === "redeemed").reduce((s, tx) => s + tx.delta, 0));
  const uniqueMembers = new Set(COIN_TRANSACTIONS.filter((tx) => tx.customerCode).map((tx) => tx.customerCode)).size;
  const redemptionRate = totalIssued > 0 ? ((totalRedeemed / totalIssued) * 100).toFixed(1) + "%" : "0%";

  const filteredTx = useMemo(() => {
    return COIN_TRANSACTIONS.filter((tx) => {
      if (actionFilter && tx.action !== actionFilter) return false;
      if (dateFrom && tx.timestamp.slice(0, 10) < dateFrom) return false;
      if (dateTo   && tx.timestamp.slice(0, 10) > dateTo)   return false;
      return true;
    });
  }, [actionFilter, dateFrom, dateTo]);

  const ACTION_FILTERS: Array<{ value: CoinAction | ""; label: string }> = [
    { value: "",         label: tc.filters?.all      ?? t.common.all   },
    { value: "earned",   label: t.pos.coinsHistory.actions.earned      },
    { value: "redeemed", label: t.pos.coinsHistory.actions.redeemed    },
    { value: "reversed", label: t.pos.coinsHistory.actions.reversed    },
    { value: "manual",   label: t.pos.coinsHistory.actions.manual      },
    { value: "expired",  label: t.pos.coinsHistory.actions.expired     },
  ];

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
          <Kpi label={tc.kpi.issued}   value={totalIssued.toLocaleString()}   sub={tc.kpi.issuedSub}   tone="info"    />
          <Kpi label={tc.kpi.redeemed} value={totalRedeemed.toLocaleString()} sub={tc.kpi.redeemedSub} tone="success" />
          <Kpi label={tc.kpi.members}  value={String(uniqueMembers)}          sub={tc.kpi.membersSub}  tone="warning" />
          <Kpi label={tc.kpi.rate}     value={redemptionRate}                 sub={tc.kpi.rateSub}     tone="danger"  />
        </Grid>

        <Grid cols={2} gap="md" responsive>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{tc.charts.monthly}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={POS_COINS_MONTHLY} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="issued"   name={tc.charts.monthlyIssued}   stroke="var(--atlas-blue)"  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="redeemed" name={tc.charts.monthlyRedeemed} stroke="var(--atlas-green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{tc.charts.topCustomers}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={POS_COINS_TOP_BALANCES} layout="vertical" margin={{ top: 8, right: 16, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="balance" name={tc.cols.balanceAfter} fill="var(--atlas-blue)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Grid>

        {/* Filters */}
        <div className={styles.filterBar}>
          <div className={styles.actionTabs} role="tablist">
            {ACTION_FILTERS.map((a) => (
              <button
                key={a.value}
                type="button"
                role="tab"
                aria-selected={actionFilter === a.value}
                className={`${styles.actionTab} ${actionFilter === a.value ? styles.actionTabActive : ""}`}
                onClick={() => setActionFilter(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className={styles.dateRange}>
            <input type="date" className={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className={styles.dateSep}>—</span>
            <input type="date" className={styles.dateInput} value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   />
          </div>
        </div>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          <table className={`${styles.table} atlas-table`}>
            <colgroup>
              <col />
              <col className="col-date col-w-120" />
              <col className="col-w-100" />
              <col className="col-w-90" />
              <col className="col-w-130" />
              <col className="col-w-90" />
            </colgroup>
            <thead>
              <tr>
                <th>{tc.cols.customer}</th>
                <th className="col-date">{tc.cols.date}</th>
                <th className="col-badge">{tc.cols.action}</th>
                <th className="col-num">{tc.cols.coins}</th>
                <th>{tc.cols.trigger}</th>
                <th className="col-num">{tc.cols.balanceAfter}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div>
                      <div className={styles.custName}>{tx.customerName ?? "—"}</div>
                      {tx.customerCode && <div className={styles.custCode}>{tx.customerCode}</div>}
                    </div>
                  </td>
                  <td className={styles.mono}>{tx.timestamp.slice(0, 10)}</td>
                  <td>
                    <Badge variant={ACTION_VARIANT[tx.action]} size="sm">
                      {t.pos.coinsHistory.actions[tx.action]}
                    </Badge>
                  </td>
                  <td className={`${styles.numEnd} ${styles.mono} ${tx.delta >= 0 ? styles.pos : styles.neg}`}>
                    {tx.delta >= 0 ? `+${tx.delta}` : String(tx.delta)}
                  </td>
                  <td className={styles.reasonCell}>{tx.reason}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{tx.balanceAfter.toLocaleString()}</td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>{t.common.noMatch}</td></tr>
              )}
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
