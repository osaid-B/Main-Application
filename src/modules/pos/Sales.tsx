import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { POS_RECEIPTS } from "../../data/posMock";
import type { PosPaymentMethod, PosReceiptStatus } from "../../data/posMock";
import { useSettings } from "../../context/SettingsContext";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="ds-stat-card" style={{ "--accent": accent } as React.CSSProperties}>
      <div className="ds-stat-card__label">{label}</div>
      <div className="ds-stat-card__value">{value}</div>
      {sub && <div className="ds-stat-card__sub">{sub}</div>}
    </div>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtDateTime(date: string, time: string): string {
  if (!date) return "—";
  return `${fmtDate(date)} ${time}`;
}

function MethodBadge({ method }: { method: PosPaymentMethod }) {
  const map: Record<PosPaymentMethod, { cls: string; label: string }> = {
    cash: { cls: "ds-badge--success", label: "نقداً" },
    card: { cls: "ds-badge--info", label: "بطاقة" },
    wallet: { cls: "ds-badge--teal", label: "محفظة" },
    split: { cls: "ds-badge--neutral", label: "مدمج" },
  };
  const { cls, label } = map[method] ?? { cls: "ds-badge--neutral", label: method };
  return <span className={`ds-badge ${cls}`}>{label}</span>;
}

function StatusBadge({ status }: { status: PosReceiptStatus }) {
  const map: Record<PosReceiptStatus, { cls: string; label: string }> = {
    completed: { cls: "ds-badge--success", label: "مكتملة" },
    refunded: { cls: "ds-badge--danger", label: "مسترد" },
    voided: { cls: "ds-badge--neutral", label: "ملغي" },
  };
  const { cls, label } = map[status] ?? { cls: "ds-badge--neutral", label: status };
  return <span className={`ds-badge ${cls}`}>{label}</span>;
}

export default function Sales() {
  const { formatCurrency } = useSettings();
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("");

  const todayStr = new Date().toDateString();

  const todayReceipts = useMemo(
    () => POS_RECEIPTS.filter((r) => new Date(r.date).toDateString() === todayStr),
    [todayStr]
  );

  const todayTotal = useMemo(
    () => todayReceipts.reduce((s, r) => s + r.total, 0),
    [todayReceipts]
  );

  const todayCount = todayReceipts.length;

  const refundTotal = useMemo(
    () =>
      POS_RECEIPTS.filter((r) => r.status === "refunded").reduce(
        (s, r) => s + r.total,
        0
      ),
    []
  );

  const avgTicket = useMemo(
    () => (todayCount > 0 ? todayTotal / todayCount : 0),
    [todayTotal, todayCount]
  );

  const filtered = useMemo(() => {
    return POS_RECEIPTS.filter((r) => {
      if (search && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (methodFilter && r.paymentMethod !== methodFilter) return false;
      return true;
    });
  }, [search, methodFilter]);

  return (
    <div className="module-pos page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">نقطة البيع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">سجل المبيعات</span>
          </nav>
          <p className="page-desc">جميع فواتير المبيعات وعمليات الدفع</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="مبيعات اليوم ₪"
          value={formatCurrency(todayTotal)}
          accent="#7C3AED"
        />
        <StatCard
          label="عدد المعاملات"
          value={todayCount}
          accent="#3B5BDB"
        />
        <StatCard
          label="إجمالي المستردات ₪"
          value={formatCurrency(refundTotal)}
          accent="#DC2626"
        />
        <StatCard
          label="متوسط الفاتورة ₪"
          value={formatCurrency(avgTicket)}
          accent="#0D9488"
        />
      </div>

      <div className="ds-card content-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <span className="search-icon">
              <Search size={15} />
            </span>
            <input
              className="ds-input"
              placeholder="بحث برقم العملية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="ds-input ds-input--select"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">كل طرق الدفع</option>
              <option value="cash">نقداً</option>
              <option value="card">بطاقة</option>
              <option value="wallet">محفظة</option>
              <option value="split">مدمج</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-code">رقم العملية</th>
                <th>الكاشير</th>
                <th>الزبون</th>
                <th className="tc-num">عدد الأصناف</th>
                <th className="tc-num">الإجمالي ₪</th>
                <th className="tc-badge">طريقة الدفع</th>
                <th className="tc-badge">الحالة</th>
                <th className="tc-date">الوقت</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="tc-code">{r.id}</td>
                  <td>{r.cashierName}</td>
                  <td>{r.customerName ?? "زبون عادي"}</td>
                  <td className="tc-num">{r.lines.length}</td>
                  <td className="tc-num">{formatCurrency(r.total)}</td>
                  <td className="tc-badge">
                    <MethodBadge method={r.paymentMethod} />
                  </td>
                  <td className="tc-badge">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="tc-date">{fmtDateTime(r.date, r.time)}</td>
                  <td className="tc-actions">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="ds-btn ds-btn--secondary ds-btn--sm"
                      >
                        عرض
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--color-text-muted)",
                      fontFamily: "Cairo, sans-serif",
                    }}
                  >
                    لا توجد نتائج
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="table-count">
            {filtered.length} من {POS_RECEIPTS.length} عملية
          </div>
        </div>
      </div>
    </div>
  );
}
