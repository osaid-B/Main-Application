import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
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
  POS_CASHIERS,
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

const METHOD_COLORS = {
  cash:   "#16A34A",
  card:   "#2563EB",
  wallet: "#7C3AED",
  split:  "#D97706",
} as const;

const ACTIVE_CASHIERS = POS_CASHIERS.filter((c) => !c.isDeleted);
const TODAY = new Date().toISOString().slice(0, 10);

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

// ─── SalesChart ───────────────────────────────────────────────────────────────

function SalesChart({ sales }: { sales: SaleTransaction[] }) {
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; name: string; count: number; pct: number; color: string;
  } | null>(null);

  // Bar chart: revenue by cashier
  const { formatCurrency } = useSettings();
  const cashierMap = new Map<string, { name: string; revenue: number }>();
  for (const tx of sales) {
    const existing = cashierMap.get(tx.cashierId);
    if (existing) {
      existing.revenue += tx.total;
    } else {
      cashierMap.set(tx.cashierId, { name: tx.cashierName, revenue: tx.total });
    }
  }
  const cashierBars = [...cashierMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxRevenue = Math.max(...cashierBars.map((c) => c.revenue), 1);
  const CASHIER_COLORS = ["#2563EB", "#16A34A", "#D97706", "#7C3AED", "#0891B2"];

  // Donut: payment method distribution
  const methodKeys = ["cash", "card", "wallet", "split"] as const;
  const methodLabels: Record<string, string> = {
    cash:   "نقدي",
    card:   "بطاقة",
    wallet: "محفظة",
    split:  "مختلط",
  };
  const methodData = methodKeys
    .map((m) => ({
      key: m,
      label: methodLabels[m],
      count: sales.filter((tx) => tx.paymentMethod === m).length,
      color: METHOD_COLORS[m],
    }))
    .filter((m) => m.count > 0);
  const methodTotal = methodData.reduce((s, m) => s + m.count, 0);

  const R = 65;
  const circumference = 2 * Math.PI * R;
  let offsetAcc = 0;
  const segments = methodData.map((m, i) => {
    const segLen = methodTotal > 0 ? (m.count / methodTotal) * circumference : circumference / methodData.length;
    const offset = offsetAcc;
    offsetAcc += segLen;
    return { ...m, i, segLen, offset };
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
      {/* Left — bar chart by cashier */}
      <div style={{ flex: "0 0 55%", minWidth: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>المبيعات حسب أمين الصندوق</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>إجمالي الإيرادات لكل أمين صندوق</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cashierBars.length === 0 ? (
            <div style={{ color: "#94A3B8", fontSize: 13 }}>لا توجد مبيعات</div>
          ) : cashierBars.map((c, i) => {
            const barPct = (c.revenue / maxRevenue) * 100;
            return (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 12, color: "#475569",
                  width: 90, textAlign: "right",
                  flexShrink: 0, direction: "rtl",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {c.name.split(" ")[0]}
                </span>
                <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 20, overflow: "hidden" }}>
                  <div style={{
                    width: `${barPct}%`,
                    height: "100%",
                    background: CASHIER_COLORS[i % CASHIER_COLORS.length],
                    borderRadius: 4,
                    transition: "width 600ms ease-out",
                  }} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: CASHIER_COLORS[i % CASHIER_COLORS.length],
                  width: 72, textAlign: "left", flexShrink: 0, fontFamily: "monospace",
                }}>
                  {formatCurrency(c.revenue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — donut by payment method */}
      <div style={{ flex: "0 0 45%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 14, alignSelf: "flex-start" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>طرق الدفع</div>
        </div>
        {methodTotal === 0 ? (
          <div style={{ color: "#94A3B8", fontSize: 13, padding: 24 }}>لا توجد بيانات</div>
        ) : (
          <>
            <svg viewBox="0 0 160 160" width={150} height={150} style={{ display: "block" }}>
              <circle cx="80" cy="80" r={R} stroke="#F1F5F9" strokeWidth="20" fill="none" />
              {segments.map(({ i, segLen, offset, color, count, label }) => {
                const hov = hoveredSeg === i;
                const pct = Math.round((count / methodTotal) * 100);
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
                {methodTotal}
              </text>
              <text x="80" y="93" textAnchor="middle" fontSize="12" fill="#94A3B8">
                معاملة
              </text>
            </svg>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {segments.map(({ i, color, label, count }) => {
                const hov = hoveredSeg === i;
                const pct = Math.round((count / methodTotal) * 100);
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
          <div style={{ color: "#CBD5E1" }}>{tooltip.count} معاملة</div>
          <div style={{ color: tooltip.color, fontWeight: 700 }}>{tooltip.pct}%</div>
        </div>
      )}
    </div>
  );
}

// ─── SalesHistory ─────────────────────────────────────────────────────────────

export default function SalesHistory() {
  const { t, formatCurrency } = useSettings();
  const tc = t.salesHistory;
  const { toast } = useToast();

  const [sales, setSales]           = useState<SaleTransaction[]>(() => POS_SALES_HISTORY);
  const [query, setQuery]           = useState("");
  const [cashierFilter, setCashierFilter] = useState("");
  const [methodFilter, setMethodFilter]   = useState<"cash" | "card" | "wallet" | "split" | "">("");
  const [statusFilter, setStatusFilter]   = useState<SaleStatus | "">("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [selected, setSelected]     = useState<SaleTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SaleTransaction | null>(null);

  const todayTx = sales.filter((tx) => tx.date === TODAY);
  const todayCount   = todayTx.length;
  const todayRevenue = todayTx.reduce((s, tx) => s + tx.total, 0);
  const avgValue     = todayCount > 0 ? todayRevenue / todayCount : 0;

  const hourCounts = todayTx.reduce<Record<string, number>>((acc, tx) => {
    const h = tx.time.slice(0, 2) + ":00";
    acc[h] = (acc[h] ?? 0) + 1;
    return acc;
  }, {});
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const filtered = useMemo(() => {
    return sales.filter((tx) => {
      if (cashierFilter && tx.cashierId !== cashierFilter) return false;
      if (methodFilter  && tx.paymentMethod !== methodFilter) return false;
      if (statusFilter  && tx.status !== statusFilter) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo   && tx.date > dateTo)   return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return tx.id.toLowerCase().includes(q) || (tx.customerName?.toLowerCase().includes(q) ?? false);
    });
  }, [sales, query, cashierFilter, methodFilter, statusFilter, dateFrom, dateTo]);

  function handleDelete(id: string) {
    setSales((prev) => prev.filter((tx) => tx.id !== id));
    setDeleteTarget(null);
    toast("تم حذف المعاملة ✓", { type: "success" });
  }

  const cashierOptions = [
    { value: "", label: "كل الأمناء" },
    ...ACTIVE_CASHIERS.map((c) => ({ value: c.id, label: c.name })),
  ];

  const methodOptions: Array<{ value: string; label: string }> = [
    { value: "",       label: "كل طرق الدفع" },
    { value: "cash",   label: tc.method.cash },
    { value: "card",   label: tc.method.card },
    { value: "wallet", label: tc.method.wallet },
    { value: "split",  label: tc.method.split },
  ];

  const statusOptions: Array<{ value: string; label: string }> = [
    { value: "",          label: "كل الحالات" },
    { value: "completed", label: tc.status.completed },
    { value: "refunded",  label: tc.status.refunded },
    { value: "voided",    label: tc.status.voided },
  ];

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => exportCSV(filtered)}>
            {tc.export}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.todayCount}   value={String(todayCount)}           sub=""                   tone="success" />
          <Kpi label={tc.kpi.todayRevenue} value={formatCurrency(todayRevenue)} sub=""                   tone="info"    />
          <Kpi label={tc.kpi.avgValue}     value={formatCurrency(avgValue)}     sub=""                   tone="warning" />
          <Kpi label={tc.kpi.peakHour}     value={peakHour}                     sub={tc.kpi.peakHourSub} tone="neutral" />
        </Grid>

        <SalesChart sales={sales} />

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
            label="طريقة الدفع"
            value={methodFilter}
            options={methodOptions}
            onChange={(v) => setMethodFilter(v as typeof methodFilter)}
          />
          <FilterDropdown
            label="الحالة"
            value={statusFilter}
            options={statusOptions}
            onChange={(v) => setStatusFilter(v as SaleStatus | "")}
          />
          <div className={styles.dateRange}>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span>—</span>
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          <table
            className={`${styles.table} atlas-table`}
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="col-code">{tc.cols.txId}</th>
                <th className="col-date">{tc.cols.dateTime}</th>
                <th className="col-entity">{tc.cols.cashier}</th>
                <th className="col-entity">{tc.cols.customer}</th>
                <th className="col-num">{tc.cols.items}</th>
                <th className="col-currency">{tc.cols.total}</th>
                <th className="col-badge">{tc.cols.method}</th>
                <th className="col-badge">{tc.cols.status}</th>
                <th className="col-actions">{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                  className={styles.clickRow}
                >
                  <td><span className={styles.mono}>{tx.id}</span></td>
                  <td className={styles.mono}>{tx.date} {tx.time}</td>
                  <td>{tx.cashierName}</td>
                  <td>{tx.customerName ?? <span className={styles.walkin}>—</span>}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{tx.lines.length}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(tx.total)}</td>
                  <td>
                    <Badge variant={METHOD_VARIANT[tx.paymentMethod]} size="sm">
                      {tc.method[tx.paymentMethod]}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={STATUS_VARIANT[tx.status]} size="sm">
                      {tc.status[tx.status]}
                    </Badge>
                  </td>
                  <td style={{ overflow: "visible" }}>
                    <TableActions
                      onView={() => setSelected(tx)}
                      onDelete={() => setDeleteTarget(tx)}
                    />
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

      {selected && <TxDrawer tx={selected} onClose={() => setSelected(null)} />}

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        itemName={deleteTarget?.id ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}

// ─── TxDrawer ─────────────────────────────────────────────────────────────────

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
        <div className={styles.totalRow}>
          <span>{tc.drawer.subtotal}</span><span>{formatCurrency(tx.subtotal)}</span>
        </div>
        {tx.discount > 0 && (
          <div className={styles.totalRow}>
            <span>{tc.drawer.discount}</span><span>-{formatCurrency(tx.discount)}</span>
          </div>
        )}
        <div className={styles.totalRow}>
          <span>{tc.drawer.tax}</span><span>{formatCurrency(tx.tax)}</span>
        </div>
        <div className={`${styles.totalRow} ${styles.grandRow}`}>
          <span>{tc.drawer.total}</span><span>{formatCurrency(tx.total)}</span>
        </div>
      </div>
    </Modal>
  );
}

// ─── exportCSV ────────────────────────────────────────────────────────────────

function exportCSV(rows: SaleTransaction[]) {
  const header = ["ID", "Date", "Time", "Cashier", "Customer", "Items", "Subtotal", "Discount", "Tax", "Total", "Method", "Status"];
  const body = rows.map((tx) => [
    tx.id, tx.date, tx.time, tx.cashierName, tx.customerName ?? "",
    tx.lines.length, tx.subtotal, tx.discount, tx.tax, tx.total,
    tx.paymentMethod, tx.status,
  ].join(","));
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
