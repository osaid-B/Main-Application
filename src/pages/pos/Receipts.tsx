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
  type PosReceipt,
  type PosReceiptStatus,
  type PosPaymentMethod,
} from "../../data/posMock";
import styles from "./Receipts.module.css";

type DateFilter = "all" | "today" | "week" | "month";

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

const TODAY = "2026-05-26";
const WEEK_START = "2026-05-20";
const MONTH_START = "2026-05-01";

export default function Receipts() {
  const { t, formatCurrency } = useSettings();
  const tc = t.pos.receipts;

  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selected, setSelected] = useState<PosReceipt | null>(null);

  const filtered = useMemo(() => {
    return POS_RECEIPTS.filter((r) => {
      if (dateFilter === "today"  && r.date < TODAY)       return false;
      if (dateFilter === "week"   && r.date < WEEK_START)  return false;
      if (dateFilter === "month"  && r.date < MONTH_START) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return r.id.toLowerCase().includes(q) || r.cashierName.toLowerCase().includes(q);
    });
  }, [query, dateFilter]);

  const todayRows  = POS_RECEIPTS.filter((r) => r.date === TODAY);
  const todayCount = todayRows.length;
  const todaySales = todayRows.reduce((s, r) => s + r.total, 0);
  const avgReceipt = todayCount > 0 ? todaySales / todayCount : 0;
  const refunds    = todayRows.filter((r) => r.status === "refunded").length;

  const DATE_FILTERS: Array<{ value: DateFilter; label: string }> = [
    { value: "all",   label: tc.filters.all   },
    { value: "today", label: tc.filters.today  },
    { value: "week",  label: tc.filters.week   },
    { value: "month", label: tc.filters.month  },
  ];

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>POS · RECEIPTS</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="secondary" size="sm">{tc.export}</Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.todayCount} value={String(todayCount)}                tone="success" sub="POS transactions" />
          <Kpi label={tc.kpi.todaySales} value={formatCurrency(todaySales)}        tone="info"    sub="across all cashiers" />
          <Kpi label={tc.kpi.avgReceipt} value={formatCurrency(avgReceipt)}        tone="success" sub="per receipt" />
          <Kpi label={tc.kpi.refunds}    value={String(refunds)}                   tone="danger"  sub="receipts refunded" />
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
          </div>
          <div className={styles.actionTabs} role="tablist">
            {DATE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={dateFilter === f.value}
                className={`${styles.actionTab} ${dateFilter === f.value ? styles.actionTabActive : ""}`}
                onClick={() => setDateFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
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
                      View
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
