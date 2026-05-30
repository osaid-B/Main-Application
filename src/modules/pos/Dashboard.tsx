import { useMemo } from "react";
import { POS_PRODUCTS, POS_RECEIPTS } from "../../data/posMock";
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

const METHOD_AR: Record<string, string> = {
  cash: "نقداً",
  card: "بطاقة",
  wallet: "محفظة",
  split: "مدمج",
};

export default function Dashboard() {
  const { formatCurrency } = useSettings();

  const todayStr = new Date().toDateString();

  const todayReceipts = useMemo(
    () => POS_RECEIPTS.filter((r) => new Date(r.date).toDateString() === todayStr),
    [todayStr]
  );

  const totalToday = useMemo(
    () => todayReceipts.reduce((s, r) => s + r.total, 0),
    [todayReceipts]
  );

  const countToday = todayReceipts.length;

  const avgTicket = useMemo(
    () => (countToday > 0 ? totalToday / countToday : 0),
    [totalToday, countToday]
  );

  const activeProductsCount = useMemo(
    () => POS_PRODUCTS.length,
    []
  );

  const last5Receipts = useMemo(
    () => [...POS_RECEIPTS].slice(0, 5),
    []
  );

  const topProducts = useMemo(() => {
    const counts = new Map<string, { qty: number; rev: number; name: string }>();
    todayReceipts.forEach((r) => {
      r.lines.forEach((line) => {
        const cur = counts.get(line.productId) ?? {
          qty: 0,
          rev: 0,
          name: line.name,
        };
        counts.set(line.productId, {
          qty: cur.qty + line.qty,
          rev: cur.rev + line.total,
          name: cur.name,
        });
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5);
  }, [todayReceipts]);

  return (
    <div className="module-pos page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">نقطة البيع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">لوحة التحكم</span>
          </nav>
          <p className="page-desc">نظرة عامة على أداء المبيعات اليوم</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="مبيعات اليوم ₪"
          value={formatCurrency(totalToday)}
          accent="#7C3AED"
        />
        <StatCard
          label="عدد المعاملات"
          value={countToday}
          accent="#3B5BDB"
        />
        <StatCard
          label="متوسط الفاتورة ₪"
          value={formatCurrency(avgTicket)}
          accent="#0D9488"
        />
        <StatCard
          label="المنتجات النشطة"
          value={activeProductsCount}
          accent="#16A34A"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "70% 30%",
          gap: "var(--space-4)",
        }}
      >
        {/* Left: Last Sales */}
        <div className="ds-card content-card">
          <div
            style={{
              padding: "var(--space-4) var(--space-5)",
              borderBottom: "1px solid var(--color-border)",
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--color-text)",
            }}
          >
            آخر المبيعات
          </div>
          <div className="table-wrapper">
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="tc-code">رقم الإيصال</th>
                  <th className="tc-text">الكاشير</th>
                  <th className="tc-num">الإجمالي ₪</th>
                  <th className="tc-text">طريقة الدفع</th>
                  <th className="tc-date">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {last5Receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="tc-code">{r.id}</td>
                    <td>{r.cashierName}</td>
                    <td className="tc-num">{formatCurrency(r.total)}</td>
                    <td>{METHOD_AR[r.paymentMethod] ?? r.paymentMethod}</td>
                    <td className="tc-date">
                      {fmtDate(r.date)} {r.time}
                    </td>
                  </tr>
                ))}
                {last5Receipts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--color-text-muted)",
                        fontFamily: "Cairo, sans-serif",
                      }}
                    >
                      لا توجد مبيعات اليوم
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Products */}
        <div className="ds-card">
          <div
            style={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--color-text)",
              marginBottom: "var(--space-4)",
            }}
          >
            أفضل المنتجات اليوم
          </div>
          {topProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "var(--color-text-muted)",
                fontFamily: "Cairo, sans-serif",
                fontSize: 13,
              }}
            >
              لا توجد بيانات
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              {topProducts.map(([productId, data], index) => (
                <div
                  key={productId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom:
                      index < topProducts.length - 1
                        ? "1px solid var(--color-border)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "var(--radius-full)",
                      background: "var(--module-pos-light)",
                      color: "var(--module-pos-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "Inter, monospace",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "Cairo, sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {data.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        fontFamily: "Cairo, sans-serif",
                      }}
                    >
                      {data.qty} وحدة
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--module-pos-primary)",
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(data.rev)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
