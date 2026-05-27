import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import {
  POS_SALES_HISTORY,
  type SaleTransaction,
  type SaleStatus,
} from "../../data/posMock";
import styles from "./SalesHistory.module.css";

const STATUS_VARIANT: Record<SaleStatus, "success" | "warning" | "neutral"> = {
  completed: "success",
  refunded:  "warning",
  voided:    "neutral",
};

const METHOD_VARIANT = {
  cash: "success", card: "info", wallet: "neutral", split: "warning",
} as const;

const CASHIER_NAMES = ["Ahmad Qasim", "Mona Ibrahim", "Laila Mansour", "Karim Nasser", "Hana Saeed"];
const CASHIER_IDS   = ["CSH-01", "CSH-02", "CSH-03", "CSH-04", "CSH-05"];

const TODAY = "2026-05-27";

export default function SalesHistory() {
  const { t, formatCurrency } = useSettings();
  const tc = t.salesHistory;

  const [query,         setQuery]         = useState("");
  const [cashierFilter, setCashierFilter] = useState("");
  const [methodFilter,  setMethodFilter]  = useState<"cash" | "card" | "wallet" | "split" | "">("");
  const [statusFilter,  setStatusFilter]  = useState<SaleStatus | "">("");
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [selected,      setSelected]      = useState<SaleTransaction | null>(null);

  const todayTx = POS_SALES_HISTORY.filter((tx) => tx.date === TODAY);
  const todayCount   = todayTx.length;
  const todayRevenue = todayTx.reduce((s, tx) => s + tx.total, 0);
  const avgValue     = todayCount > 0 ? todayRevenue / todayCount : 0;

  // Peak hour: find hour with most transactions
  const hourCounts = todayTx.reduce<Record<string, number>>((acc, tx) => {
    const h = tx.time.slice(0, 2) + ":00";
    acc[h] = (acc[h] ?? 0) + 1;
    return acc;
  }, {});
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const filtered = useMemo(() => {
    return POS_SALES_HISTORY.filter((tx) => {
      if (cashierFilter && tx.cashierId !== cashierFilter) return false;
      if (methodFilter  && tx.paymentMethod !== methodFilter) return false;
      if (statusFilter  && tx.status !== statusFilter) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo   && tx.date > dateTo)   return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return tx.id.toLowerCase().includes(q) || (tx.customerName?.toLowerCase().includes(q) ?? false);
    });
  }, [query, cashierFilter, methodFilter, statusFilter, dateFrom, dateTo]);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => exportCSV(filtered, formatCurrency)}>
            {tc.export}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.todayCount}   value={String(todayCount)}          sub=""                   tone="success" />
          <Kpi label={tc.kpi.todayRevenue} value={formatCurrency(todayRevenue)} sub=""                  tone="info"    />
          <Kpi label={tc.kpi.avgValue}     value={formatCurrency(avgValue)}    sub=""                   tone="warning" />
          <Kpi label={tc.kpi.peakHour}     value={peakHour}                    sub={tc.kpi.peakHourSub} tone="neutral" />
        </Grid>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input
              variant="search"
              placeholder={tc.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              fullWidth
            />
          </div>
          <select className={styles.filterSelect} value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)}>
            <option value="">{tc.filters.allCashiers}</option>
            {CASHIER_IDS.map((id, i) => <option key={id} value={id}>{CASHIER_NAMES[i]}</option>)}
          </select>
          <select className={styles.filterSelect} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}>
            <option value="">{tc.filters.allMethods}</option>
            <option value="cash">{tc.method.cash}</option>
            <option value="card">{tc.method.card}</option>
            <option value="wallet">{tc.method.wallet}</option>
            <option value="split">{tc.method.split}</option>
          </select>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SaleStatus | "")}>
            <option value="">{tc.filters.allStatuses}</option>
            <option value="completed">{tc.status.completed}</option>
            <option value="refunded">{tc.status.refunded}</option>
            <option value="voided">{tc.status.voided}</option>
          </select>
          <div className={styles.dateRange}>
            <input type="date" className={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span>—</span>
            <input type="date" className={styles.dateInput} value={dateTo}   onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.txId}</th>
                <th>{tc.cols.dateTime}</th>
                <th>{tc.cols.cashier}</th>
                <th>{tc.cols.customer}</th>
                <th className={styles.numEnd}>{tc.cols.items}</th>
                <th className={styles.numEnd}>{tc.cols.total}</th>
                <th>{tc.cols.method}</th>
                <th>{tc.cols.status}</th>
                <th>{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} onClick={() => setSelected(tx)} className={styles.clickRow}>
                  <td><span className={styles.mono}>{tx.id}</span></td>
                  <td className={styles.mono}>{tx.date} {tx.time}</td>
                  <td>{tx.cashierName}</td>
                  <td>{tx.customerName ?? <span className={styles.walkin}>—</span>}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{tx.lines.length}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(tx.total)}</td>
                  <td>
                    <Badge variant={METHOD_VARIANT[tx.paymentMethod]} size="sm">{tc.method[tx.paymentMethod]}</Badge>
                  </td>
                  <td>
                    <Badge variant={STATUS_VARIANT[tx.status]} size="sm">{tc.status[tx.status]}</Badge>
                  </td>
                  <td>
                    <button type="button" className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); setSelected(tx); }}>
                      {t.common.view}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className={styles.empty}>{tc.noData}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>

      {selected && (
        <TxDrawer tx={selected} onClose={() => setSelected(null)} />
      )}
    </Container>
  );
}

function TxDrawer({ tx, onClose }: { tx: SaleTransaction; onClose: () => void }) {
  const { t, formatCurrency } = useSettings();
  const tc = t.salesHistory;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${tc.drawer.title} — ${tx.id}`}
      size="md"
      footer={<Button variant="secondary" onClick={onClose}>{tc.drawer.close}</Button>}
    >
      <div className={styles.drawerMeta}>
        <span>{tc.cols.dateTime}</span><span className={styles.mono}>{tx.date} {tx.time}</span>
        <span>{tc.cols.cashier}</span><span>{tx.cashierName}</span>
        {tx.customerName && <><span>{tc.cols.customer}</span><span>{tx.customerName}</span></>}
        <span>{tc.drawer.receipt}</span><span className={styles.mono}>{tx.receiptId}</span>
      </div>

      <div className={styles.drawerSection}>{tc.drawer.lines}</div>
      <table className={styles.detailTable}>
        <thead>
          <tr>
            <th>{t.common.product}</th>
            <th className={styles.numEnd}>{t.common.quantity}</th>
            <th className={styles.numEnd}>{t.common.price}</th>
            <th className={styles.numEnd}>{t.common.total}</th>
          </tr>
        </thead>
        <tbody>
          {tx.lines.map((line) => (
            <tr key={line.productId}>
              <td>{line.name}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{line.qty}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.unitPrice)}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.drawerSection}>{tc.drawer.payment}</div>
      <div className={styles.totals}>
        <div className={styles.totalRow}><span>{tc.drawer.subtotal}</span><span>{formatCurrency(tx.subtotal)}</span></div>
        {tx.discount > 0 && <div className={styles.totalRow}><span>{tc.drawer.discount}</span><span>-{formatCurrency(tx.discount)}</span></div>}
        <div className={styles.totalRow}><span>{tc.drawer.tax}</span><span>{formatCurrency(tx.tax)}</span></div>
        <div className={`${styles.totalRow} ${styles.grandRow}`}><span>{tc.drawer.total}</span><span>{formatCurrency(tx.total)}</span></div>
      </div>
    </Modal>
  );
}

function exportCSV(rows: SaleTransaction[], _fmt: (n: number) => string) {
  const header = ["ID", "Date", "Time", "Cashier", "Customer", "Items", "Subtotal", "Discount", "Tax", "Total", "Method", "Status"];
  const body = rows.map((tx) => [tx.id, tx.date, tx.time, tx.cashierName, tx.customerName ?? "", tx.lines.length, tx.subtotal, tx.discount, tx.tax, tx.total, tx.paymentMethod, tx.status].join(","));
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "success" | "info" | "warning" | "neutral" | "danger" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      {sub && <span className={styles.kpiSub}>{sub}</span>}
    </article>
  );
}
