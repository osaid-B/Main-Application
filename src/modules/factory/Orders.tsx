import { useMemo, useState } from "react";
import { useFactory } from "../../context/FactoryContext";
import type { ProductionOrderStatus } from "../../data/types";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="ds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="ds-stat-card__label">{label}</div>
      <div className="ds-stat-card__value">{value}</div>
      {sub && <div className="ds-stat-card__sub">{sub}</div>}
    </div>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="ds-progress">
      <div className="ds-progress__bar">
        <div className="ds-progress__fill" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="ds-progress__label">{pct}%</span>
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

function progressByStatus(status: ProductionOrderStatus): number {
  switch (status) {
    case 'done': return 100;
    case 'in-progress': return 50;
    case 'planned': return 0;
    case 'cancelled': return 0;
    default: return 0;
  }
}

export default function FactoryOrders() {
  const { factoryOrders, kpi } = useFactory();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const cancelledCount = useMemo(
    () => factoryOrders.filter((o) => o.status === 'cancelled').length,
    [factoryOrders]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return factoryOrders.filter((o) => {
      const matchSearch = !q || o.id.toLowerCase().includes(q) || o.productId.toLowerCase().includes(q);
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [factoryOrders, search, statusFilter]);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">أوامر الإنتاج</span>
          </nav>
          <p className="page-desc">إدارة ومتابعة أوامر الإنتاج</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="مخططة" value={kpi.plannedOrders} accent="#3B5BDB" />
        <StatCard label="جارية" value={kpi.activeOrders} accent="#0D9488" />
        <StatCard label="مكتملة" value={kpi.completedOrders} accent="#16A34A" />
        <StatCard label="ملغية" value={cancelledCount} accent="#DC2626" />
      </div>

      <div className="ds-card">
        <div className="ds-toolbar">
          <input
            className="ds-input"
            type="text"
            placeholder="بحث برقم الأمر أو المنتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="ds-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="planned">مخططة</option>
            <option value="in-progress">جارية</option>
            <option value="done">مكتملة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>

        <table className="ds-table">
          <thead>
            <tr>
              <th>رقم الأمر</th>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>تاريخ البداية</th>
              <th>تاريخ الانتهاء</th>
              <th>التقدم %</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td className="tc-code">{order.id}</td>
                <td className="tc-flex tc-primary">{order.productId}</td>
                <td className="tc-num">{order.quantity.toLocaleString()}</td>
                <td className="tc-date">{fmtDate(order.startDate)}</td>
                <td className="tc-date">{fmtDate(order.dueDate)}</td>
                <td>
                  <ProgressBar pct={progressByStatus(order.status)} />
                </td>
                <td className="tc-badge">
                  <span className={ORDER_STATUS_CLS[order.status] ?? 'ds-badge ds-badge--neutral'}>
                    {ORDER_STATUS_AR[order.status] ?? order.status}
                  </span>
                </td>
                <td className="tc-actions">
                  <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">عرض</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8) 0' }}>
                  لا توجد أوامر مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
