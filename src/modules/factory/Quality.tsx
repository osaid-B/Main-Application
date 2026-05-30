import { useMemo, useState } from "react";
import { useFactory } from "../../context/FactoryContext";
import type { QcStatus } from "../../data/types";

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

const QC_STATUS_AR: Record<QcStatus, string> = {
  'pass': 'ناجح',
  'fail': 'فاشل',
  'pending': 'معلق',
  'conditional': 'مشروط',
};

const QC_STATUS_CLS: Record<QcStatus, string> = {
  'pass': 'ds-badge ds-badge--success',
  'fail': 'ds-badge ds-badge--danger',
  'pending': 'ds-badge ds-badge--warning',
  'conditional': 'ds-badge ds-badge--info',
};

function isToday(iso: string): boolean {
  if (!iso) return false;
  const today = new Date();
  const d = new Date(iso);
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}

export default function FactoryQuality() {
  const { qualityChecks, kpi } = useFactory();

  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const stats = useMemo(() => {
    const todayCount = qualityChecks.filter((q) => isToday(q.inspectionDate)).length;
    const failedCount = qualityChecks.filter((q) => q.status === 'fail').length;
    const pendingCount = qualityChecks.filter((q) => q.status === 'pending').length;
    return { todayCount, failedCount, pendingCount };
  }, [qualityChecks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return qualityChecks.filter((qc) => {
      const matchSearch = !q || qc.productId.toLowerCase().includes(q) || qc.productName.toLowerCase().includes(q);
      const matchResult = !resultFilter || qc.status === resultFilter;
      return matchSearch && matchResult;
    });
  }, [qualityChecks, search, resultFilter]);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">مراقبة الجودة</span>
          </nav>
          <p className="page-desc">نتائج فحوصات الجودة ومعدلات النجاح</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="فحوصات اليوم" value={stats.todayCount} accent="#0D9488" />
        <StatCard label="معدل النجاح %" value={`${kpi.qcPassRate.toFixed(1)}%`} accent="#16A34A" />
        <StatCard label="فاشلة" value={stats.failedCount} accent="#DC2626" />
        <StatCard label="بانتظار المراجعة" value={stats.pendingCount} accent="#D97706" />
      </div>

      <div className="ds-card">
        <div className="ds-toolbar">
          <input
            className="ds-input"
            type="text"
            placeholder="بحث بالمنتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="ds-select"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
          >
            <option value="">جميع النتائج</option>
            <option value="pass">ناجح</option>
            <option value="fail">فاشل</option>
            <option value="pending">معلق</option>
            <option value="conditional">مشروط</option>
          </select>
        </div>

        <table className="ds-table">
          <thead>
            <tr>
              <th>رقم الفحص</th>
              <th>الدفعة</th>
              <th>المنتج</th>
              <th>المفتش</th>
              <th>التاريخ</th>
              <th>النتيجة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((qc) => (
              <tr key={qc.id}>
                <td className="tc-code">{qc.id}</td>
                <td className="tc-code">{qc.batchId ?? '—'}</td>
                <td className="tc-flex tc-primary">{qc.productName}</td>
                <td className="tc-text">{qc.inspector ?? '—'}</td>
                <td className="tc-date">{fmtDate(qc.inspectionDate)}</td>
                <td className="tc-badge">
                  <span className={QC_STATUS_CLS[qc.status] ?? 'ds-badge ds-badge--neutral'}>
                    {QC_STATUS_AR[qc.status] ?? qc.status}
                  </span>
                </td>
                <td className="tc-actions">
                  <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">عرض</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8) 0' }}>
                  لا توجد فحوصات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
