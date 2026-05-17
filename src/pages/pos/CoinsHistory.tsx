import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { COIN_TRANSACTIONS, POS_LOYALTY_KPIS, type CoinAction } from "../../data/posMock";
import styles from "./CoinsHistory.module.css";

const ACTION_FILTERS: Array<{ value: CoinAction | "all"; label: string }> = [
  { value: "all",      label: "All" },
  { value: "earned",   label: "Earned" },
  { value: "redeemed", label: "Redeemed" },
  { value: "reversed", label: "Reversed" },
  { value: "manual",   label: "Manual" },
  { value: "expired",  label: "Expired" },
];

const ACTION_VARIANT: Record<CoinAction, "success" | "danger" | "warning" | "info" | "neutral"> = {
  earned: "success",
  redeemed: "danger",
  reversed: "warning",
  manual: "info",
  expired: "neutral",
};

const ACTION_LABEL: Record<CoinAction, string> = {
  earned: "Earned",
  redeemed: "Redeemed",
  reversed: "Reversed",
  manual: "Manual",
  expired: "Expired",
};

export default function CoinsHistory() {
  const [filter, setFilter] = useState<CoinAction | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return COIN_TRANSACTIONS.filter((t) => {
      if (filter !== "all" && t.action !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (t.customerName?.toLowerCase().includes(q) ?? false) ||
        (t.customerCode?.toLowerCase().includes(q) ?? false) ||
        (t.invoice?.toLowerCase().includes(q) ?? false) ||
        t.reason.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>LOYALTY · COINS LEDGER · LAST 30 DAYS</div>
            <h1 className={styles.title}>Coins Transaction History</h1>
            <p className={styles.subtitle}>
              Every coin earned, redeemed, reversed, or manually adjusted across all POS lanes.
            </p>
          </div>
          <Button variant="secondary" size="sm">Export CSV</Button>
        </header>

        {/* KPIs */}
        <Grid cols={4} gap="md" responsive>
          <Kpi label="COINS ISSUED (30D)"      value={POS_LOYALTY_KPIS.issued30d.value}    subtitle={POS_LOYALTY_KPIS.issued30d.trend}   tone="success" />
          <Kpi label="COINS REDEEMED (30D)"    value={POS_LOYALTY_KPIS.redeemed30d.value}  subtitle={POS_LOYALTY_KPIS.redeemed30d.subtitle ?? ""}  tone="info" />
          <Kpi label="OUTSTANDING LIABILITY"   value={POS_LOYALTY_KPIS.outstanding.value}  subtitle={POS_LOYALTY_KPIS.outstanding.subtitle ?? ""}  tone="warning" />
          <Kpi label="EXPIRING NEXT 30D"        value={POS_LOYALTY_KPIS.expiring30d.value}  subtitle={POS_LOYALTY_KPIS.expiring30d.subtitle ?? ""}  tone="danger" />
        </Grid>

        {/* Filters */}
        <div className={styles.filters}>
          <Input
            variant="search"
            placeholder="Search by customer, invoice, reason, or user…"
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

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>CUSTOMER</th>
                <th>ACTION</th>
                <th>INVOICE / REF</th>
                <th>REASON</th>
                <th>USER</th>
                <th>BRANCH</th>
                <th className={styles.numCol}>Δ COINS</th>
                <th className={styles.numCol}>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className={styles.mono}>{t.timestamp}</td>
                  <td>
                    {t.customerName ? (
                      <div className={styles.custCell}>
                        <Avatar size="xs" name={t.customerName} tone="accent" />
                        <div>
                          <strong>{t.customerName}</strong>
                          <span>{t.customerCode}</span>
                        </div>
                      </div>
                    ) : (
                      <span className={styles.walkIn}>walk-in</span>
                    )}
                  </td>
                  <td><Badge variant={ACTION_VARIANT[t.action]} size="sm">{ACTION_LABEL[t.action]}</Badge></td>
                  <td className={styles.mono}>{t.invoice ?? "—"}</td>
                  <td className={styles.reasonCell}>{t.reason}</td>
                  <td>{t.user}</td>
                  <td className={styles.branchCell}>{t.branch}</td>
                  <td className={`${styles.numCol} ${styles.mono} ${t.delta >= 0 ? styles.gain : styles.loss}`}>
                    {t.delta >= 0 ? `+${t.delta}` : t.delta}
                  </td>
                  <td className={`${styles.numCol} ${styles.mono}`}>{t.balanceAfter.toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className={styles.empty}>No coin transactions match your filters.</td></tr>
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
