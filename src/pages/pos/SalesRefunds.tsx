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
import { useToast } from "../../components/ui/Toast";
import {
  POS_REFUNDS,
  POS_CASHIERS,
  type SaleRefund,
  type RefundStatus,
  type RefundReason,
} from "../../data/posMock";
import styles from "./SalesRefunds.module.css";

const STATUS_VARIANT: Record<RefundStatus, "warning" | "info" | "success" | "danger"> = {
  pending:   "warning",
  approved:  "info",
  completed: "success",
  rejected:  "danger",
};

const TODAY = new Date().toISOString().slice(0, 10);

export default function SalesRefunds() {
  const { t, formatCurrency } = useSettings();
  const tc = t.salesRefunds;
  const { toast } = useToast();

  const [refunds, setRefunds]         = useState<SaleRefund[]>(POS_REFUNDS);
  const [query, setQuery]             = useState("");
  const [cashierFilter, setCashierFilter] = useState("");
  const [statusFilter, setStatusFilter]   = useState<RefundStatus | "">("");
  const [reasonFilter, setReasonFilter]   = useState<RefundReason | "">("");
  const [detailTarget, setDetailTarget]   = useState<SaleRefund | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<SaleRefund | null>(null);
  const [rejectNote, setRejectNote]       = useState("");
  const [showNewForm, setShowNewForm]     = useState(false);

  const todayRefunds = refunds.filter((r) => r.date === TODAY);
  const todayCount   = todayRefunds.length;
  const todayValue   = todayRefunds.reduce((s, r) => s + r.refundAmount, 0);
  const pending      = refunds.filter((r) => r.status === "pending").length;
  const largest      = Math.max(0, ...refunds.map((r) => r.refundAmount));

  const filtered = useMemo(() => {
    return refunds.filter((r) => {
      if (cashierFilter && r.cashierId !== cashierFilter) return false;
      if (statusFilter  && r.status  !== statusFilter)   return false;
      if (reasonFilter  && r.reason  !== reasonFilter)   return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return r.id.toLowerCase().includes(q) || (r.customerName?.toLowerCase().includes(q) ?? false);
    });
  }, [refunds, query, cashierFilter, statusFilter, reasonFilter]);

  function approveRefund(id: string) {
    setRefunds((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" as RefundStatus } : r));
    toast(tc.actions.approve + " ✓", { type: "success" });
  }

  function rejectRefund() {
    if (!rejectTarget) return;
    setRefunds((prev) => prev.map((r) => r.id === rejectTarget.id ? { ...r, status: "rejected" as RefundStatus, rejectionNote: rejectNote } : r));
    setRejectTarget(null);
    setRejectNote("");
    toast(tc.actions.reject + " ✓", { type: "info" });
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
            {tc.newRefund}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.todayCount} value={String(todayCount)}          sub=""                   tone="warning" />
          <Kpi label={tc.kpi.todayValue} value={formatCurrency(todayValue)}  sub=""                   tone="danger"  />
          <Kpi label={tc.kpi.pending}    value={String(pending)}             sub={tc.kpi.pendingSub}  tone="info"    />
          <Kpi label={tc.kpi.largest}    value={formatCurrency(largest)}     sub={tc.kpi.largestSub}  tone="neutral" />
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
            <option value="">{tc.filters.allCashiers ?? "All Cashiers"}</option>
            {POS_CASHIERS.filter((c) => !c.isDeleted).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RefundStatus | "")}>
            <option value="">{tc.filters.allStatuses}</option>
            {(["pending", "approved", "completed", "rejected"] as RefundStatus[]).map((s) => (
              <option key={s} value={s}>{tc.status[s]}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value as RefundReason | "")}>
            <option value="">{tc.filters.allReasons}</option>
            {(["defective", "wrong_item", "customer_change", "overcharge", "other"] as RefundReason[]).map((r) => (
              <option key={r} value={r}>{tc.reason[r]}</option>
            ))}
          </select>
        </div>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          <table className={`${styles.table} atlas-table`}>
            <colgroup>
              <col className="col-w-110" />
              <col className="col-w-110" />
              <col className="col-date col-w-110" />
              <col className="col-w-120" />
              <col />
              <col className="col-currency col-w-120" />
              <col className="col-w-130" />
              <col className="col-w-90" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th className="col-code">{tc.cols.refundId}</th>
                <th className="col-code">{tc.cols.originalTx}</th>
                <th className="col-date">{tc.cols.date}</th>
                <th>{tc.cols.cashier}</th>
                <th>{tc.cols.customer}</th>
                <th className="col-num">{tc.cols.amount}</th>
                <th>{tc.cols.reason}</th>
                <th className="col-badge">{tc.cols.status}</th>
                <th className="col-actions">{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td><span className={styles.mono}>{r.id}</span></td>
                  <td><span className={styles.mono}>{r.originalTxId}</span></td>
                  <td className={styles.mono}>{r.date}</td>
                  <td>{r.cashierName}</td>
                  <td>{r.customerName ?? "—"}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(r.refundAmount)}</td>
                  <td><span className={styles.reasonTag}>{tc.reason[r.reason]}</span></td>
                  <td>
                    <Badge variant={STATUS_VARIANT[r.status]} size="sm">{tc.status[r.status]}</Badge>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button type="button" className={styles.actionBtn} onClick={() => setDetailTarget(r)}>{tc.actions.view}</button>
                      {r.status === "pending" && (
                        <>
                          <button type="button" className={styles.actionBtn} onClick={() => approveRefund(r.id)}>{tc.actions.approve}</button>
                          <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => { setRejectTarget(r); setRejectNote(""); }}>{tc.actions.reject}</button>
                        </>
                      )}
                    </div>
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

      {detailTarget && <RefundDetailDrawer refund={detailTarget} onClose={() => setDetailTarget(null)} />}

      {rejectTarget && (
        <Modal
          isOpen
          onClose={() => setRejectTarget(null)}
          title={tc.rejectModal.title}
          size="sm"
          footer={
            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>{t.common.cancel}</Button>
              <Button variant="primary" onClick={rejectRefund}>{tc.rejectModal.confirm}</Button>
            </div>
          }
        >
          <div className={styles.formGrid}>
            <label className={styles.formLabel}>{tc.rejectModal.note}</label>
            <textarea
              className={styles.formTextarea}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {showNewForm && (
        <NewRefundModal
          onSave={(data) => {
            const id = `RFD-${String(refunds.length + 1).padStart(3, "0")}`;
            setRefunds((prev) => [{ ...data, id, status: "pending", lines: [] }, ...prev]);
            setShowNewForm(false);
            toast(tc.newRefund + " ✓", { type: "success" });
          }}
          onClose={() => setShowNewForm(false)}
        />
      )}
    </Container>
  );
}

function RefundDetailDrawer({ refund, onClose }: { refund: SaleRefund; onClose: () => void }) {
  const { t, formatCurrency } = useSettings();
  const tc = t.salesRefunds;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${tc.drawer.title} — ${refund.id}`}
      size="md"
      footer={<Button variant="secondary" onClick={onClose}>{tc.drawer.close}</Button>}
    >
      <div className={styles.drawerMeta}>
        <span>{tc.cols.originalTx}</span><span className={styles.mono}>{refund.originalTxId}</span>
        <span>{tc.cols.cashier}</span><span>{refund.cashierName}</span>
        {refund.customerName && <><span>{tc.cols.customer}</span><span>{refund.customerName}</span></>}
        <span>{tc.cols.reason}</span><span>{tc.reason[refund.reason]}</span>
        <span>{tc.cols.status}</span><span><Badge variant={STATUS_VARIANT[refund.status]} size="sm">{tc.status[refund.status]}</Badge></span>
        {refund.rejectionNote && <><span>{tc.drawer.rejectionNote}</span><span className={styles.rejectNote}>{refund.rejectionNote}</span></>}
      </div>

      <div className={styles.drawerSection}>{tc.drawer.refunded}</div>
      {refund.lines.length === 0 ? (
        <p className={styles.noItems}>{tc.drawer.noItems}</p>
      ) : (
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
            {refund.lines.map((line) => (
              <tr key={line.productId}>
                <td>{line.name}</td>
                <td className={`${styles.numEnd} ${styles.mono}`}>{line.qty}</td>
                <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.unitPrice)}</td>
                <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className={styles.refundTotal}>
        <strong>{tc.cols.amount}</strong>
        <strong>{formatCurrency(refund.refundAmount)}</strong>
      </div>
    </Modal>
  );
}

function NewRefundModal({
  onSave,
  onClose,
}: {
  onSave: (data: Omit<SaleRefund, "id" | "status" | "lines">) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const tc = t.salesRefunds;
  const activeCashiers = POS_CASHIERS.filter((c) => !c.isDeleted);
  const [originalTxId, setOriginalTxId]   = useState("");
  const [reason, setReason]               = useState<RefundReason>("defective");
  const [cashierId, setCashierId]         = useState(activeCashiers[0]?.id ?? "");

  const selectedCashier = activeCashiers.find((c) => c.id === cashierId);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={tc.form.title}
      size="sm"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button
            variant="primary"
            onClick={() => onSave({
              originalTxId,
              reason,
              cashierId,
              cashierName: selectedCashier?.name ?? "",
              date: new Date().toISOString().slice(0, 10),
              refundAmount: 0,
            })}
            disabled={!originalTxId.trim() || !cashierId}
          >
            {tc.form.submit}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <label className={styles.formLabel}>{tc.form.originalTx}</label>
        <input className={styles.formInput} value={originalTxId} onChange={(e) => setOriginalTxId(e.target.value)} placeholder="TXN-03000" />
        <label className={styles.formLabel}>{tc.cols.cashier}</label>
        <select className={styles.filterSelect} value={cashierId} onChange={(e) => setCashierId(e.target.value)}>
          {activeCashiers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className={styles.formLabel}>{tc.form.reason}</label>
        <select className={styles.filterSelect} value={reason} onChange={(e) => setReason(e.target.value as RefundReason)}>
          {(["defective", "wrong_item", "customer_change", "overcharge", "other"] as RefundReason[]).map((r) => (
            <option key={r} value={r}>{tc.reason[r]}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
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
