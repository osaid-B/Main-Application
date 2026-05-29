import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext";
import {
  POS_STOCK_COUNTS as INITIAL_COUNTS,
  type PosStockCount,
  type StockCountItem,
  type StockCountStatus,
} from "../../data/posMock";
import styles from "./StockCounts.module.css";

const STATUS_VARIANT: Record<StockCountStatus, "warning" | "info" | "success" | "neutral"> = {
  open:          "warning",
  "in-progress": "info",
  completed:     "success",
  cancelled:     "neutral",
};

export default function StockCounts() {
  const { t, formatCurrency } = useSettings();
  const tc = t.pos.stockCounts;

  const { products, updateProduct } = useData();

  const [counts, setCounts] = useState<PosStockCount[]>(INITIAL_COUNTS);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<PosStockCount | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const filtered = useMemo(() =>
    counts.filter((c) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return c.id.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.countedBy.toLowerCase().includes(q);
    }),
  [counts, query]);

  const openCount    = counts.filter((c) => c.status === "open" || c.status === "in-progress").length;
  const itemsCounted = counts.filter((c) => c.status === "completed").reduce((s, c) => s + c.itemsCount, 0);
  const variances    = counts.filter((c) => c.status === "completed" && c.varianceValue !== 0).length;
  const lastCompleted = counts.filter((c) => c.status === "completed").sort((a, b) => b.date.localeCompare(a.date))[0];

  function addCount(data: { location: string; date: string; countedBy: string }) {
    const id = `CNT-${String(counts.length + 1).padStart(3, "0")}`;
    setCounts((prev) => [
      { id, date: data.date, location: data.location, status: "open", itemsCount: 0, varianceValue: 0, countedBy: data.countedBy, items: [] },
      ...prev,
    ]);
    setShowNewForm(false);
  }

  function completeCount(id: string) {
    const target = counts.find((c) => c.id === id);
    if (target) {
      target.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) updateProduct({ ...product, stock: item.counted });
      });
    }
    setCounts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "completed" as StockCountStatus } : c)),
    );
    setDetail((prev) => prev && prev.id === id ? { ...prev, status: "completed" } : prev);
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
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowNewForm(true)}>
            {tc.newCount}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.open}         value={String(openCount)}          tone="warning" sub={tc.kpi.openSub} />
          <Kpi label={tc.kpi.itemsCounted} value={String(itemsCounted)}       tone="info"    sub={tc.kpi.itemsSub} />
          <Kpi label={tc.kpi.variances}    value={String(variances)}          tone="danger"  sub={tc.kpi.variancesSub} />
          <Kpi label={tc.kpi.lastCount}    value={lastCompleted?.date ?? "—"} tone="success" sub={lastCompleted?.location ?? ""} />
        </Grid>

        <div className={styles.toolbar}>
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
        </div>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          <table className={`${styles.table} atlas-table`}>
            <colgroup>
              <col className="col-w-110" />
              <col className="col-date col-w-120" />
              <col />
              <col className="col-w-100" />
              <col className="col-w-80" />
              <col className="col-w-100" />
              <col className="col-w-130" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th className="col-code">{tc.cols.countId}</th>
                <th className="col-date">{tc.cols.date}</th>
                <th>{tc.cols.location}</th>
                <th className="col-badge">{tc.cols.status}</th>
                <th className="col-num">{tc.cols.items}</th>
                <th className="col-num">{tc.cols.variance}</th>
                <th>{tc.cols.countedBy}</th>
                <th className="col-actions">{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><span className={styles.mono}>{c.id}</span></td>
                  <td className={styles.mono}>{c.date}</td>
                  <td>{c.location}</td>
                  <td>
                    <Badge variant={STATUS_VARIANT[c.status]} size="sm">
                      {tc.status[c.status === "in-progress" ? "inProgress" : c.status]}
                    </Badge>
                  </td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{c.itemsCount}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>
                    {c.status === "completed" ? (
                      <span className={c.varianceValue < 0 ? styles.varNeg : c.varianceValue > 0 ? styles.varPos : styles.varZero}>
                        {c.varianceValue === 0 ? "—" : formatCurrency(Math.abs(c.varianceValue))}
                      </span>
                    ) : "—"}
                  </td>
                  <td>{c.countedBy}</td>
                  <td>
                    <button type="button" className={styles.viewBtn} onClick={() => setDetail(c)}>
                      {tc.actions.view}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.empty}>{tc.noCount}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>

      {detail && (
        <CountDetailModal
          count={detail}
          onClose={() => setDetail(null)}
          onComplete={completeCount}
        />
      )}
      {showNewForm && <NewCountModal onSave={addCount} onClose={() => setShowNewForm(false)} />}
    </Container>
  );
}

function CountDetailModal({
  count,
  onClose,
  onComplete,
}: {
  count: PosStockCount;
  onClose: () => void;
  onComplete: (id: string) => void;
}) {
  const { t } = useSettings();
  const tc = t.pos.stockCounts;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canComplete = count.status === "open" || count.status === "in-progress";

  function handleComplete() {
    setConfirmOpen(true);
  }

  function varClass(item: StockCountItem) {
    if (item.counted === 0 && item.expected > 0) return styles.varUncounted;
    if (item.variance < 0) return styles.varNeg;
    if (item.variance > 0) return styles.varPos;
    return styles.varZero;
  }

  function varDisplay(item: StockCountItem) {
    if (item.counted === 0 && item.expected > 0) return tc.detail.uncounted;
    if (item.variance === 0) return "—";
    return `${item.variance > 0 ? "+" : ""}${item.variance}`;
  }

  return (
    <>
    {confirmOpen && (
      <Modal
        isOpen
        onClose={() => setConfirmOpen(false)}
        title={tc.actions.complete}
        size="sm"
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={() => { setConfirmOpen(false); onComplete(count.id); }}>
              {tc.actions.complete}
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 13 }}>{tc.detail.confirmComplete}</p>
      </Modal>
    )}
    <Modal
      isOpen
      onClose={onClose}
      title={`${tc.detail.title} — ${count.id}`}
      size="md"
      footer={
        <div className={styles.detailFooter}>
          {canComplete && (
            <Button variant="primary" size="sm" onClick={handleComplete}>
              {tc.actions.complete}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>{tc.detail.close}</Button>
        </div>
      }
    >
      {count.items.length === 0 ? (
        <p className={styles.emptyDetail}>{tc.detail.noItems}</p>
      ) : (
        <table className={styles.detailTable}>
          <thead>
            <tr>
              <th>{tc.detail.product}</th>
              <th>{tc.detail.sku}</th>
              <th className={styles.numEnd}>{tc.detail.expected}</th>
              <th className={styles.numEnd}>{tc.detail.counted}</th>
              <th className={styles.numEnd}>{tc.detail.variance}</th>
            </tr>
          </thead>
          <tbody>
            {count.items.map((item) => (
              <tr key={item.productId}>
                <td>{item.productName}</td>
                <td className={styles.mono}>{item.sku}</td>
                <td className={`${styles.numEnd} ${styles.mono}`}>{item.expected}</td>
                <td className={`${styles.numEnd} ${styles.mono}`}>{item.counted}</td>
                <td className={`${styles.numEnd} ${styles.mono}`}>
                  <span className={varClass(item)}>{varDisplay(item)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
    </>
  );
}

function NewCountModal({ onSave, onClose }: { onSave: (data: { location: string; date: string; countedBy: string }) => void; onClose: () => void }) {
  const { t } = useSettings();
  const tc = t.pos.stockCounts;

  const [location,  setLocation]  = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10));
  const [countedBy, setCountedBy] = useState("");

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={tc.form.createTitle}
      size="sm"
      footer={
        <div className={styles.formFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={() => onSave({ location, date, countedBy })} disabled={!location.trim()}>
            {tc.newCount}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <Input label={tc.form.location}  value={location}  onChange={(e) => setLocation(e.target.value)}  required placeholder="e.g. Storeroom A" />
        <Input label={tc.form.date}      value={date}      onChange={(e) => setDate(e.target.value)}      placeholder="YYYY-MM-DD" />
        <Input label={tc.form.countedBy} value={countedBy} onChange={(e) => setCountedBy(e.target.value)} placeholder="e.g. Ahmad Qasim" />
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
