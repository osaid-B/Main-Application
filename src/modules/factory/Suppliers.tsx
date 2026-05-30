import { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useSettings } from "../../context/SettingsContext";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="ds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="ds-stat-card__label">{label}</div>
      <div className="ds-stat-card__value">{value}</div>
      {sub && <div className="ds-stat-card__sub">{sub}</div>}
    </div>
  );
}

export default function FactorySuppliers() {
  const { suppliers } = useData();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState('');

  // The base Supplier type has: id, name, phone, email, address, notes, isDeleted
  // Extended fields (totalPurchases, balance, status) are cast via `as any` since
  // they may be present in enriched data from Supabase or future mock expansions.
  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => !s.isDeleted),
    [suppliers]
  );

  const stats = useMemo(() => {
    const totalPurchases = activeSuppliers.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum, s) => sum + ((s as any).totalPurchases ?? 0),
      0
    );
    const totalBalance = activeSuppliers.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum, s) => sum + ((s as any).balance ?? 0),
      0
    );
    const activeCount = activeSuppliers.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s) => ((s as any).status ?? 'active') === 'active'
    ).length;
    return { totalPurchases, totalBalance, activeCount };
  }, [activeSuppliers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeSuppliers;
    return activeSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
    );
  }, [activeSuppliers, search]);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">الموردون</span>
          </nav>
          <p className="page-desc">قائمة موردي المواد الخام والتعبئة</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="إجمالي الموردين" value={activeSuppliers.length} accent="#0D9488" />
        <StatCard label="إجمالي المشتريات ₪" value={formatCurrency(stats.totalPurchases)} accent="#D97706" />
        <StatCard label="رصيد مستحق ₪" value={formatCurrency(stats.totalBalance)} accent="#DC2626" />
        <StatCard label="موردون نشطون" value={stats.activeCount} accent="#16A34A" />
      </div>

      <div className="ds-card">
        <div className="ds-toolbar">
          <input
            className="ds-input"
            type="text"
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="ds-table">
          <thead>
            <tr>
              <th>رمز المورد</th>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>البريد الإلكتروني</th>
              <th>العنوان</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((supplier) => (
              <tr key={supplier.id}>
                <td className="tc-code">{supplier.id}</td>
                <td className="tc-flex tc-primary">{supplier.name}</td>
                <td className="tc-text">{supplier.phone ?? '—'}</td>
                <td className="tc-text">{supplier.email ?? '—'}</td>
                <td className="tc-text">{supplier.address ?? '—'}</td>
                <td className="tc-actions">
                  <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">عرض</button>
                  <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">تعديل</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8) 0' }}>
                  لا توجد موردون مطابقون للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
