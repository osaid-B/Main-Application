import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { useSettings } from "../../context/SettingsContext";
import { COIN_TRANSACTIONS, POS_LOYALTY_KPIS, type CoinAction } from "../../data/posMock";
import styles from "./CoinsHistory.module.css";

const ACTION_VARIANT: Record<CoinAction, "success" | "danger" | "warning" | "info" | "neutral"> = {
  earned:   "success",
  redeemed: "danger",
  reversed: "warning",
  manual:   "info",
  expired:  "neutral",
};

export default function CoinsHistory() {
  const { t } = useSettings();
  const tc = t.pos.coinsHistory;

  const ACTION_FILTERS: Array<{ value: CoinAction | "all"; label: string }> = [
    { value: "all",      label: tc.actions.all      },
    { value: "earned",   label: tc.actions.earned   },
    { value: "redeemed", label: tc.actions.redeemed },
    { value: "reversed", label: tc.actions.reversed },
    { value: "manual",   label: tc.actions.manual   },
    { value: "expired",  label: tc.actions.expired  },
  ];

  const [filter, setFilter] = useState<CoinAction | "all">("all");
  const [query,  setQuery]  = useState("");

  const filtered = useMemo(() => {
    return COIN_TRANSACTIONS.filter((tx) => {
      if (filter !== "all" && tx.action !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (tx.customerName?.toLowerCase().includes(q) ?? false) ||
        (tx.customerCode?.toLowerCase().includes(q) ?? false) ||
        (tx.invoice?.toLowerCase().includes(q) ?? false) ||
        tx.reason.toLowerCase().includes(q) ||
        tx.user.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="secondary" size="sm">{tc.exportCsv}</Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.issued}      value={POS_LOYALTY_KPIS.issued30d.value}   subtitle={POS_LOYALTY_KPIS.issued30d.trend}              tone="success" />
          <Kpi label={tc.kpi.redeemed}    value={POS_LOYALTY_KPIS.redeemed30d.value} subtitle={POS_LOYALTY_KPIS.redeemed30d.subtitle ?? ""}    tone="info"    />
          <Kpi label={tc.kpi.outstanding} value={POS_LOYALTY_KPIS.outstanding.value} subtitle={POS_LOYALTY_KPIS.outstanding.subtitle ?? ""}    tone="warning" />
          <Kpi label={tc.kpi.expiring}    value={POS_LOYALTY_KPIS.expiring30d.value} subtitle={POS_LOYALTY_KPIS.expiring30d.subtitle ?? ""}    tone="danger"  />
        </Grid>

        <div className={styles.filters}>
          <Input
            variant="search"
            placeholder={tc.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={14} />}
            fullWidth
          />
          <div className={styles.actionTabs} role="tablist">
            {ACTION_FILTERS.map((a) => (
              <button
                key={a.value}
                type="button"
                role="tab"
                aria-selected={filter === a.value}
                className={`${styles.actionTab} ${filter === a.value ? styles.actionTabActive : ""}`}
                onClick={() => setFilter(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.timestamp}</th>
                <th>{tc.cols.customer}</th>
                <th>{tc.cols.action}</th>
                <th>{tc.cols.invoiceRef}</th>
                <th>{tc.cols.reason}</th>
                <th>{tc.cols.user}</th>
                <th>{tc.cols.branch}</th>
                <th className={styles.numCol}>{tc.cols.deltaCoins}</th>
                <th className={styles.numCol}>{tc.cols.balance}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className={styles.mono}>{tx.timestamp}</td>
                  <td>
                    {tx.customerName ? (
                      <div className={styles.custCell}>
                        <Avatar size="xs" name={tx.customerName} tone="accent" />
                        <div>
                          <strong>{tx.customerName}</strong>
                          <span>{tx.customerCode}</span>
                        </div>
                      </div>
                    ) : (
                      <span className={styles.walkIn}>{tc.walkIn}</span>
                    )}
                  </td>
                  <td>
                    <Badge variant={ACTION_VARIANT[tx.action]} size="sm">
                      {tc.actions[tx.action]}
                    </Badge>
                  </td>
                  <td className={styles.mono}>{tx.invoice ?? "—"}</td>
                  <td className={styles.reasonCell}>{tx.reason}</td>
                  <td>{tx.user}</td>
                  <td className={styles.branchCell}>{tx.branch}</td>
                  <td className={`${styles.numCol} ${styles.mono} ${tx.delta >= 0 ? styles.gain : styles.loss}`}>
                    {tx.delta >= 0 ? `+${tx.delta}` : tx.delta}
                  </td>
                  <td className={`${styles.numCol} ${styles.mono}`}>{tx.balanceAfter.toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className={styles.empty}>{tc.noHistory}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>
    </Container>
  );
}

function Kpi({ label, value, subtitle, tone }: { label: string; value: string; subtitle: string; tone: "success" | "info" | "warning" | "danger" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span className={styles.kpiSub}>{subtitle}</span>
    </article>
  );
}
