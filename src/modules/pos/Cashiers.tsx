import { useMemo } from "react";
import { POS_CASHIERS } from "../../data/posMock";
import type { CashierStatus, CashierShift } from "../../data/posMock";
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

const SHIFT_AR: Record<CashierShift, string> = {
  morning: "صباحية",
  afternoon: "مسائية",
  evening: "ليلية",
};

const STATUS_AR: Record<CashierStatus, string> = {
  active: "نشط",
  inactive: "غير نشط",
  "on-break": "استراحة",
};

const STATUS_CLASS: Record<CashierStatus, string> = {
  active: "ds-badge--success",
  inactive: "ds-badge--neutral",
  "on-break": "ds-badge--warning",
};

export default function Cashiers() {
  const { formatCurrency } = useSettings();

  const activeCount = useMemo(
    () => POS_CASHIERS.filter((c) => c.status === "active" || c.status === "on-break").length,
    []
  );

  const totalSalesToday = useMemo(
    () => POS_CASHIERS.reduce((s, c) => s + c.todaySales, 0),
    []
  );

  const bestCashier = useMemo(() => {
    return POS_CASHIERS.reduce(
      (best, c) => (c.todaySales > best.todaySales ? c : best),
      POS_CASHIERS[0]
    );
  }, []);

  const avgSales = useMemo(
    () => (activeCount > 0 ? totalSalesToday / activeCount : 0),
    [totalSalesToday, activeCount]
  );

  return (
    <div className="module-pos page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">نقطة البيع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">الكاشيرون</span>
          </nav>
          <p className="page-desc">إدارة الكاشيرين وأداء الوردية</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="ds-btn ds-btn--primary">
            + إضافة كاشير
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="كاشيرون نشطون"
          value={activeCount}
          accent="#7C3AED"
        />
        <StatCard
          label="مبيعات اليوم ₪"
          value={formatCurrency(totalSalesToday)}
          accent="#0D9488"
        />
        <StatCard
          label="أفضل أداء"
          value={bestCashier?.name ?? "—"}
          sub={bestCashier ? formatCurrency(bestCashier.todaySales) : undefined}
          accent="#3B5BDB"
        />
        <StatCard
          label="متوسط المبيعات ₪"
          value={formatCurrency(avgSales)}
          accent="#16A34A"
        />
      </div>

      <div className="ds-card content-card">
        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">الكاشير</th>
                <th className="tc-code">الكود</th>
                <th>الوردية</th>
                <th className="tc-num">مبيعات اليوم ₪</th>
                <th className="tc-num">عدد المعاملات</th>
                <th className="tc-badge">الحالة</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {POS_CASHIERS.map((c) => (
                <tr key={c.id}>
                  <td className="tc-flex tc-primary">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-full)",
                          background:
                            c.status === "active"
                              ? "var(--module-pos-light)"
                              : "#F3F4F6",
                          color:
                            c.status === "active"
                              ? "var(--module-pos-primary)"
                              : "var(--color-text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "Cairo, sans-serif",
                          flexShrink: 0,
                        }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontFamily: "Cairo, sans-serif",
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-muted)",
                            fontFamily: "Cairo, sans-serif",
                          }}
                        >
                          {c.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="tc-code">{c.code}</td>
                  <td>
                    <span style={{ fontFamily: "Cairo, sans-serif" }}>
                      {SHIFT_AR[c.shift]}
                    </span>
                  </td>
                  <td className="tc-num">{formatCurrency(c.todaySales)}</td>
                  <td className="tc-num">{c.transactions}</td>
                  <td className="tc-badge">
                    <span className={`ds-badge ${STATUS_CLASS[c.status]}`}>
                      {STATUS_AR[c.status]}
                    </span>
                  </td>
                  <td className="tc-actions">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="ds-btn ds-btn--secondary ds-btn--sm"
                        onClick={() => console.log("عرض:", c.id)}
                      >
                        عرض
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="table-count">{POS_CASHIERS.length} كاشير</div>
        </div>
      </div>
    </div>
  );
}
