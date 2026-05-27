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
  POS_RECEIPTS,
  POS_CASHIERS,
  type PosReceipt,
  type PosReceiptStatus,
  type PosPaymentMethod,
} from "../../data/posMock";
import styles from "./Receipts.module.css";

const STATUS_VARIANT: Record<PosReceiptStatus, "success" | "warning" | "neutral"> = {
  completed: "success",
  refunded:  "warning",
  voided:    "neutral",
};

const METHOD_VARIANT: Record<PosPaymentMethod, "info" | "success" | "neutral" | "warning"> = {
  cash:   "success",
  card:   "info",
  wallet: "neutral",
  split:  "warning",
};

const TODAY     = "2026-05-26";
const YESTERDAY = "2026-05-25";

const ACTIVE_CASHIERS = POS_CASHIERS.filter((c) => !c.isDeleted);

export default function Receipts() {
  const { t, formatCurrency } = useSettings();
  const tc = t.pos.receipts;

  const [query,         setQuery]         = useState("");
  const [cashierFilter, setCashierFilter] = useState("");
  const [methodFilter,  setMethodFilter]  = useState<PosPaymentMethod | "">("");
  const [statusFilter,  setStatusFilter]  = useState<PosReceiptStatus | "">("");
  const [selected,      setSelected]      = useState<PosReceipt | null>(null);

  const filtered = useMemo(() => {
    return POS_RECEIPTS.filter((r) => {
      if (cashierFilter && r.cashierId !== cashierFilter) return false;
      if (methodFilter  && r.paymentMethod !== methodFilter)  return false;
      if (statusFilter  && r.status !== statusFilter)          return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return r.id.toLowerCase().includes(q) || r.cashierName.toLowerCase().includes(q);
    });
  }, [query, cashierFilter, methodFilter, statusFilter]);

  const todayRows     = POS_RECEIPTS.filter((r) => r.date === TODAY);
  const yesterdayRows = POS_RECEIPTS.filter((r) => r.date === YESTERDAY);

  const todayCount  = todayRows.length;
  const todaySales  = todayRows.reduce((s, r) => s + r.total, 0);
  const avgReceipt  = todayCount > 0 ? todaySales / todayCount : 0;
  const refunds     = todayRows.filter((r) => r.status === "refunded").length;

  const yesterdayCount  = yesterdayRows.length;
  const yesterdaySales  = yesterdayRows.reduce((s, r) => s + r.total, 0);
  const yesterdayAvg    = yesterdayCount > 0 ? yesterdaySales / yesterdayCount : 0;
  const yesterdayRefund = yesterdayRows.filter((r) => r.status === "refunded").length;

  const deltaCount  = todayCount  - yesterdayCount;
  const deltaSales  = todaySales  - yesterdaySales;
  const deltaAvg    = avgReceipt  - yesterdayAvg;
  const deltaRefund = refunds     - yesterdayRefund;

  function fmtDelta(n: number, isCurrency = false) {
    const sign = n >= 0 ? "+" : "";
    return `${sign}${isCurrency ? formatCurrency(n) : String(n)} vs yesterday`;
  }

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const csv = [
                ["ID", "Date", "Cashier", "Items", "Total", "Method", "Status"],
                ...filtered.map((r) => [r.id, r.date, r.cashierName, String(r.itemsCount), String(r.total), r.paymentMethod, r.status]),
              ].map((row) => row.join(",")).join("\n");
              const a = Object.assign(document.createElement("a"), {
                href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
                download: `receipts-${new Date().toISOString().slice(0, 10)}.csv`,
              });
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            {tc.export}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.todayCount} value={String(todayCount)}         tone="success" sub={fmtDelta(deltaCount)} />
          <Kpi label={tc.kpi.todaySales} value={formatCurrency(todaySales)} tone="info"    sub={fmtDelta(deltaSales, true)} />
          <Kpi label={tc.kpi.avgReceipt} value={formatCurrency(avgReceipt)} tone="success" sub={fmtDelta(deltaAvg, true)} />
          <Kpi label={tc.kpi.refunds}    value={String(refunds)}            tone="danger"  sub={fmtDelta(deltaRefund)} />
        </Grid>

        <div className={styles.filters}>
          <div className={styles.filterRow}>
            <Input
              variant="search"
              placeholder={tc.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
            />
            <select
              className={styles.filterSelect}
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              aria-label={tc.filters.cashier}
            >
              <option value="">{tc.filters.allCashiers}</option>
              {ACTIVE_CASHIERS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as PosPaymentMethod | "")}
              aria-label={tc.filters.paymentMethod}
            >
              <option value="">{tc.filters.allMethods}</option>
              <option value="cash">{tc.method.cash}</option>
              <option value="card">{tc.method.card}</option>
              <option value="wallet">{tc.method.wallet}</option>
              <option value="split">{tc.method.split}</option>
            </select>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PosReceiptStatus | "")}
              aria-label={tc.filters.status}
            >
              <option value="">{tc.filters.allStatuses}</option>
              <option value="completed">{tc.status.completed}</option>
              <option value="refunded">{tc.status.refunded}</option>
              <option value="voided">{tc.status.voided}</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.receipt}</th>
                <th>{tc.cols.dateTime}</th>
                <th>{tc.cols.cashier}</th>
                <th>{tc.cols.items}</th>
                <th className={styles.numEnd}>{tc.cols.total}</th>
                <th>{tc.cols.method}</th>
                <th>{tc.cols.status}</th>
                <th>{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><span className={styles.receiptId}>{r.id}</span></td>
                  <td className={styles.mono}>{r.date} {r.time}</td>
                  <td>{r.cashierName}</td>
                  <td>{r.lines.length}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(r.total)}</td>
                  <td>
                    <Badge variant={METHOD_VARIANT[r.paymentMethod]} size="sm">
                      {tc.method[r.paymentMethod]}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={STATUS_VARIANT[r.status]} size="sm">
                      {tc.status[r.status]}
                    </Badge>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => setSelected(r)}
                    >
                      {tc.actions.view}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.empty}>{tc.noReceipts}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>

      {selected && (
        <ReceiptDetailModal
          receipt={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Container>
  );
}

function ReceiptDetailModal({ receipt, onClose }: { receipt: PosReceipt; onClose: () => void }) {
  const { t, formatCurrency } = useSettings();
  const tc = t.pos.receipts;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${tc.detail.title} — ${receipt.id}`}
      size="md"
      footer={<Button variant="secondary" onClick={onClose}>{tc.detail.close}</Button>}
    >
      <div className={styles.detailMeta}>
        <span className={styles.metaKey}>{tc.cols.dateTime}</span>
        <span className={styles.metaVal}>{receipt.date} {receipt.time}</span>
        <span className={styles.metaKey}>{tc.cols.cashier}</span>
        <span className={styles.metaVal}>{receipt.cashierName}</span>
        <span className={styles.metaKey}>{tc.cols.method}</span>
        <span className={styles.metaVal}>{tc.method[receipt.paymentMethod]}</span>
        <span className={styles.metaKey}>{tc.cols.status}</span>
        <span className={styles.metaVal}>
          <Badge variant={STATUS_VARIANT[receipt.status]} size="sm">{tc.status[receipt.status]}</Badge>
        </span>
        {receipt.customerName && (
          <>
            <span className={styles.metaKey}>Customer</span>
            <span className={styles.metaVal}>{receipt.customerName}</span>
          </>
        )}
      </div>

      <table className={styles.detailTable}>
        <thead>
          <tr>
            <th>{tc.detail.product}</th>
            <th className={styles.numEnd}>{tc.detail.qty}</th>
            <th className={styles.numEnd}>{tc.detail.unitPrice}</th>
            <th className={styles.numEnd}>{tc.detail.total}</th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.map((line) => (
            <tr key={line.productId}>
              <td>{line.name}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{line.qty}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.unitPrice)}</td>
              <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.totalsBlock}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>{tc.detail.subtotal}</span>
          <span className={styles.totalVal}>{formatCurrency(receipt.subtotal)}</span>
        </div>
        {receipt.discount > 0 && (
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>{tc.detail.discount}</span>
            <span className={styles.totalVal}>-{formatCurrency(receipt.discount)}</span>
          </div>
        )}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>{tc.detail.tax}</span>
          <span className={styles.totalVal}>{formatCurrency(receipt.tax)}</span>
        </div>
        <div className={`${styles.totalRow} ${styles.grandRow}`}>
          <span className={styles.totalLabel}>{tc.detail.grandTotal}</span>
          <span className={styles.totalVal}>{formatCurrency(receipt.total)}</span>
        </div>
      </div>
    </Modal>
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
