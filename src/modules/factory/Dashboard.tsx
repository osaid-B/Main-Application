import { useMemo } from "react";
import { useFactory } from "../../context/FactoryContext";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="ds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="ds-stat-card__label">{label}</div>
      <div className="ds-stat-card__value">{value}</div>
      {sub && <div className="ds-stat-card__sub">{sub}</div>}
    </div>
  );
}

const ORDER_STATUS_AR: Record<string, string> = {
  'planned': 'مخططة', 'in-progress': 'جارية', 'done': 'مكتملة', 'cancelled': 'ملغية'
};
const ORDER_STATUS_CLS: Record<string, string> = {
  'planned': 'ds-badge ds-badge--info', 'in-progress': 'ds-badge ds-badge--teal',
  'done': 'ds-badge ds-badge--success', 'cancelled': 'ds-badge ds-badge--neutral'
};

export default function FactoryDashboard() {
  const { factoryOrders, rawMaterials, kpi } = useFactory();

  const activeOrders = useMemo(
    () => factoryOrders.filter((o) => o.status === 'in-progress').slice(0, 5),
    [factoryOrders]
  );

  const lowStockMaterials = useMemo(
    () => rawMaterials.filter((m) => m.onHand <= m.reorderPoint),
    [rawMaterials]
  );

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">لوحة التحكم</span>
          </nav>
          <p className="page-desc">نظرة عامة على عمليات الإنتاج والمخزون</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="أوامر إنتاج نشطة" value={kpi.activeOrders} accent="#0D9488" />
        <StatCard label="أوامر مخططة" value={kpi.plannedOrders} accent="#3B5BDB" />
        <StatCard label="معدل اجتياز الجودة %" value={`${kpi.qcPassRate.toFixed(1)}%`} accent="#16A34A" />
        <StatCard label="مواد خام منخفضة" value={kpi.rawMaterialAlerts} accent="#D97706" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 'var(--space-4)' }}>
        {/* أوامر الإنتاج النشطة */}
        <div className="ds-card">
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
            أوامر الإنتاج النشطة
          </div>
          <table className="ds-table">
            <thead>
              <tr>
                <th>الأمر</th>
                <th>المنتج</th>
                <th>الهدف</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order) => (
                <tr key={order.id}>
                  <td className="tc-code">{order.id}</td>
                  <td className="tc-flex tc-primary">{order.productId}</td>
                  <td className="tc-num">{order.quantity.toLocaleString()}</td>
                  <td className="tc-badge">
                    <span className={ORDER_STATUS_CLS[order.status] ?? 'ds-badge ds-badge--neutral'}>
                      {ORDER_STATUS_AR[order.status] ?? order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {activeOrders.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8) 0' }}>
                    لا توجد أوامر إنتاج نشطة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* التنبيهات */}
        <div className="ds-card">
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
            التنبيهات
          </div>
          {lowStockMaterials.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
              لا توجد تنبيهات
            </p>
          ) : (
            lowStockMaterials.map((mat) => (
              <div
                key={mat.id}
                style={{
                  borderRight: '3px solid var(--color-warning)',
                  background: 'var(--color-warning-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{mat.name ?? mat.id} - مخزون منخفض</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  المتاح: {mat.onHand ?? 0}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
