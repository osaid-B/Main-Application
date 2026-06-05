import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { TableActions } from "../../components/ui/TableActions";
import { DeleteConfirmDialog } from "../../components/ui/DeleteConfirmDialog";
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

const REASON_COLORS: Record<RefundReason, string> = {
  defective:       "#DC2626",
  wrong_item:      "#D97706",
  overcharge:      "#2563EB",
  customer_change: "#7C3AED",
  other:           "#64748B",
};

const STATUS_COLORS: Record<RefundStatus, string> = {
  pending:   "#D97706",
  approved:  "#2563EB",
  completed: "#16A34A",
  rejected:  "#DC2626",
};

// ─── FilterDropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isFiltered = Boolean(value);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          height: 34,
          padding: "0 12px",
          border: `1px solid ${isFiltered ? "#BFDBFE" : "#E2E8F0"}`,
          borderRadius: 8,
          background: isFiltered ? "#EFF6FF" : "white",
          color: isFiltered ? "#1D4ED8" : "#374151",
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          transition: "all 150ms ease",
          fontWeight: isFiltered ? 500 : 400,
          fontFamily: "inherit",
        }}
      >
        {isFiltered ? `${label}: ${selectedLabel}` : label}
        <ChevronDown
          size={13}
          style={{
            color: "#94A3B8",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 200ms ease",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            padding: 6,
            minWidth: 160,
            zIndex: 200,
            direction: "rtl",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                borderRadius: 7,
                background: value === opt.value ? "#EFF6FF" : "transparent",
                color: value === opt.value ? "#1D4ED8" : "#374151",
                fontSize: 13,
                fontWeight: value === opt.value ? 500 : 400,
                cursor: "pointer",
                textAlign: "right",
                display: "block",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.background = "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RefundChart ──────────────────────────────────────────────────────────────

function RefundChart({ refunds }: { refunds: SaleRefund[] }) {
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; name: string; count: number; pct: number; color: string;
  } | null>(null);

  const reasonKeys: RefundReason[] = ["defective", "wrong_item", "overcharge", "customer_change", "other"];
  const reasonLabels: Record<RefundReason, string> = {
    defective:       "معيب",
    wrong_item:      "منتج خاطئ",
    overcharge:      "فرق سعر",
    customer_change: "تغيير العميل",
    other:           "أخرى",
  };

  const totalCount = refunds.length;
  const reasonCounts = reasonKeys.map((r) => ({
    key: r,
    label: reasonLabels[r],
    count: refunds.filter((x) => x.reason === r).length,
    color: REASON_COLORS[r],
  }));
  const maxCount = Math.max(...reasonCounts.map((r) => r.count), 1);

  const statusKeys: RefundStatus[] = ["pending", "approved", "completed", "rejected"];
  const statusLabels: Record<RefundStatus, string> = {
    pending:   "معلق",
    approved:  "موافق عليه",
    completed: "مكتمل",
    rejected:  "مرفوض",
  };
  const statusData = statusKeys
    .map((s) => ({
      key: s,
      label: statusLabels[s],
      count: refunds.filter((x) => x.status === s).length,
      color: STATUS_COLORS[s],
    }))
    .filter((s) => s.count > 0);
  const statusTotal = statusData.reduce((sum, s) => sum + s.count, 0);

  const R = 65;
  const circumference = 2 * Math.PI * R;
  let offsetAcc = 0;
  const segments = statusData.map((s, i) => {
    const segLen = statusTotal > 0 ? (s.count / statusTotal) * circumference : circumference / statusData.length;
    const offset = offsetAcc;
    offsetAcc += segLen;
    return { ...s, i, segLen, offset };
  });

  return (
    <div style={{
      background: "white",
      border: "1px solid #E2E8F0",
      borderRadius: 14,
      padding: "20px 24px",
      display: "flex",
      gap: 24,
      alignItems: "flex-start",
    }}>
      {/* Left — horizontal bar chart by reason */}
      <div style={{ flex: "0 0 55%", minWidth: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>توزيع أسباب الاسترداد</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>تحليل الأسباب الرئيسية</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reasonCounts.map((r) => {
            const barPct = (r.count / maxCount) * 100;
            const pct = totalCount > 0 ? Math.round((r.count / totalCount) * 100) : 0;
            return (
              <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 12, color: "#475569",
                  width: 100, textAlign: "right",
                  flexShrink: 0, direction: "rtl",
                }}>
                  {r.label}
                </span>
                <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 20, overflow: "hidden" }}>
                  <div style={{
                    width: `${barPct}%`,
                    height: "100%",
                    background: r.color,
                    borderRadius: 4,
                    transition: "width 600ms ease-out",
                  }} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: r.color,
                  width: 60, textAlign: "left", flexShrink: 0,
                }}>
                  {r.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — donut by status */}
      <div style={{ flex: "0 0 45%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 14, alignSelf: "flex-start" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>حالات الاسترداد</div>
        </div>
        {statusTotal === 0 ? (
          <div style={{ color: "#94A3B8", fontSize: 13, padding: 24 }}>لا توجد بيانات</div>
        ) : (
          <>
            <svg viewBox="0 0 160 160" width={150} height={150} style={{ display: "block" }}>
              <circle cx="80" cy="80" r={R} stroke="#F1F5F9" strokeWidth="20" fill="none" />
              {segments.map(({ i, segLen, offset, color, count, label }) => {
                const hov = hoveredSeg === i;
                const pct = Math.round((count / statusTotal) * 100);
                return (
                  <circle
                    key={i}
                    cx="80" cy="80" r={R}
                    stroke={color}
                    strokeWidth={hov ? 24 : 20}
                    fill="none"
                    strokeDasharray={`${segLen} ${circumference}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 80 80)"
                    style={{
                      transition: "stroke-width 200ms ease, opacity 180ms ease",
                      opacity: hoveredSeg !== null && !hov ? 0.4 : 1,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      setHoveredSeg(i);
                      setTooltip({ x: e.clientX, y: e.clientY, name: label, count, pct, color });
                    }}
                    onMouseMove={(e) => setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : prev)}
                    onMouseLeave={() => { setHoveredSeg(null); setTooltip(null); }}
                  />
                );
              })}
              <text x="80" y="75" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0F172A">
                {statusTotal}
              </text>
              <text x="80" y="93" textAnchor="middle" fontSize="12" fill="#94A3B8">
                استرداد
              </text>
            </svg>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {segments.map(({ i, color, label, count }) => {
                const hov = hoveredSeg === i;
                const pct = Math.round((count / statusTotal) * 100);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      cursor: "pointer",
                      opacity: hoveredSeg !== null && !hov ? 0.4 : 1,
                      transition: "opacity 180ms ease",
                    }}
                    onMouseEnter={() => setHoveredSeg(i)}
                    onMouseLeave={() => setHoveredSeg(null)}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: "#475569" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{count}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 14,
          top: tooltip.y - 52,
          background: "#1E293B",
          color: "white",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12,
          pointerEvents: "none",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{tooltip.name}</div>
          <div style={{ color: "#CBD5E1" }}>{tooltip.count} استرداد</div>
          <div style={{ color: tooltip.color, fontWeight: 700 }}>{tooltip.pct}%</div>
        </div>
      )}
    </div>
  );
}

// ─── SalesRefunds ─────────────────────────────────────────────────────────────

export default function SalesRefunds() {
  const { t, formatCurrency } = useSettings();
  const tc = t.salesRefunds;
  const { toast } = useToast();

  const [refunds, setRefunds]             = useState<SaleRefund[]>(POS_REFUNDS);
  const [query, setQuery]                 = useState("");
  const [cashierFilter, setCashierFilter] = useState("");
  const [statusFilter, setStatusFilter]   = useState<RefundStatus | "">("");
  const [reasonFilter, setReasonFilter]   = useState<RefundReason | "">("");
  const [detailTarget, setDetailTarget]   = useState<SaleRefund | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<SaleRefund | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<SaleRefund | null>(null);
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
      if (statusFilter  && r.status   !== statusFilter)  return false;
      if (reasonFilter  && r.reason   !== reasonFilter)  return false;
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
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === rejectTarget.id ? { ...r, status: "rejected" as RefundStatus, rejectionNote: rejectNote } : r
      )
    );
    setRejectTarget(null);
    setRejectNote("");
    toast(tc.actions.reject + " ✓", { type: "info" });
  }

  function handleDelete(id: string) {
    setRefunds((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
    toast("تم حذف الاسترداد ✓", { type: "success" });
  }

  const cashierOptions = [
    { value: "", label: "كل الأمناء" },
    ...POS_CASHIERS.filter((c) => !c.isDeleted).map((c) => ({ value: c.id, label: c.name })),
  ];

  const statusOptions: Array<{ value: string; label: string }> = [
    { value: "",          label: "كل الحالات" },
    { value: "pending",   label: tc.status.pending },
    { value: "approved",  label: tc.status.approved },
    { value: "completed", label: tc.status.completed },
    { value: "rejected",  label: tc.status.rejected },
  ];

  const reasonOptions: Array<{ value: string; label: string }> = [
    { value: "",                label: "كل الأسباب" },
    { value: "defective",       label: tc.reason.defective },
    { value: "wrong_item",      label: tc.reason.wrong_item },
    { value: "customer_change", label: tc.reason.customer_change },
    { value: "overcharge",      label: tc.reason.overcharge },
    { value: "other",           label: tc.reason.other },
  ];

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowNewForm(true)}>
            {tc.newRefund}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.todayCount} value={String(todayCount)}         sub=""                   tone="warning" />
          <Kpi label={tc.kpi.todayValue} value={formatCurrency(todayValue)} sub=""                   tone="danger"  />
          <Kpi label={tc.kpi.pending}    value={String(pending)}            sub={tc.kpi.pendingSub}  tone="info"    />
          <Kpi label={tc.kpi.largest}    value={formatCurrency(largest)}    sub={tc.kpi.largestSub}  tone="neutral" />
        </Grid>

        <RefundChart refunds={refunds} />

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
          <FilterDropdown
            label="أمين الصندوق"
            value={cashierFilter}
            options={cashierOptions}
            onChange={setCashierFilter}
          />
          <FilterDropdown
            label="الحالة"
            value={statusFilter}
            options={statusOptions}
            onChange={(v) => setStatusFilter(v as RefundStatus | "")}
          />
          <FilterDropdown
            label="السبب"
            value={reasonFilter}
            options={reasonOptions}
            onChange={(v) => setReasonFilter(v as RefundReason | "")}
          />
        </div>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          <table
            className={`${styles.table} atlas-table`}
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="col-code">{tc.cols.refundId}</th>
                <th className="col-code">{tc.cols.originalTx}</th>
                <th className="col-date">{tc.cols.date}</th>
                <th className="col-entity">{tc.cols.cashier}</th>
                <th className="col-entity">{tc.cols.customer}</th>
                <th className="col-currency">{tc.cols.amount}</th>
                <th className="col-truncate">{tc.cols.reason}</th>
                <th className="col-badge">{tc.cols.status}</th>
                <th className="col-actions">{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => setDetailTarget(r)} className={styles.clickRow}>
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
                  <td style={{ overflow: "visible" }}>
                    {r.status === "pending" ? (
                      <TableActions
                        onView={() => setDetailTarget(r)}
                        onApprove={() => approveRefund(r.id)}
                        onReject={() => { setRejectTarget(r); setRejectNote(""); }}
                        onDelete={() => setDeleteTarget(r)}
                      />
                    ) : (
                      <TableActions
                        onView={() => setDetailTarget(r)}
                        onDelete={() => setDeleteTarget(r)}
                      />
                    )}
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

      {detailTarget && (
        <RefundDetailDrawer refund={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

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

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        itemName={deleteTarget?.id ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}

// ─── RefundDetailDrawer ───────────────────────────────────────────────────────

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
        <span>{tc.cols.status}</span>
        <span>
          <Badge variant={STATUS_VARIANT[refund.status]} size="sm">{tc.status[refund.status]}</Badge>
        </span>
        {refund.rejectionNote && (
          <><span>{tc.drawer.rejectionNote}</span><span className={styles.rejectNote}>{refund.rejectionNote}</span></>
        )}
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

// ─── NewRefundModal ───────────────────────────────────────────────────────────

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
  const [originalTxId, setOriginalTxId] = useState("");
  const [reason, setReason]             = useState<RefundReason>("defective");
  const [cashierId, setCashierId]       = useState(activeCashiers[0]?.id ?? "");

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
            onClick={() =>
              onSave({
                originalTxId,
                reason,
                cashierId,
                cashierName: selectedCashier?.name ?? "",
                date: new Date().toISOString().slice(0, 10),
                refundAmount: 0,
              })
            }
            disabled={!originalTxId.trim() || !cashierId}
          >
            {tc.form.submit}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <label className={styles.formLabel}>{tc.form.originalTx}</label>
        <input
          className={styles.formInput}
          value={originalTxId}
          onChange={(e) => setOriginalTxId(e.target.value)}
          placeholder="TXN-03000"
        />
        <label className={styles.formLabel}>{tc.cols.cashier}</label>
        <select
          className={styles.filterSelect}
          value={cashierId}
          onChange={(e) => setCashierId(e.target.value)}
        >
          {activeCashiers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className={styles.formLabel}>{tc.form.reason}</label>
        <select
          className={styles.filterSelect}
          value={reason}
          onChange={(e) => setReason(e.target.value as RefundReason)}
        >
          {(["defective", "wrong_item", "customer_change", "overcharge", "other"] as RefundReason[]).map((r) => (
            <option key={r} value={r}>{tc.reason[r]}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
}

// ─── Kpi ──────────────────────────────────────────────────────────────────────

function Kpi({
  label, value, sub, tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "success" | "info" | "warning" | "neutral" | "danger";
}) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      {sub && <span className={styles.kpiSub}>{sub}</span>}
    </article>
  );
}
