import { useMemo, useState } from "react";
import { useFactory } from "../../context/FactoryContext";
import { useSettings } from "../../context/SettingsContext";
import type { RawMaterial } from "../../data/types";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="ds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="ds-stat-card__label">{label}</div>
      <div className="ds-stat-card__value">{value}</div>
      {sub && <div className="ds-stat-card__sub">{sub}</div>}
    </div>
  );
}

/** Returns the effective on-hand quantity for a RawMaterial record */
function getQty(mat: RawMaterial): number {
  // The RawMaterial type uses `onHand` as the primary field name
  return mat.onHand ?? 0;
}

const CATEGORY_AR: Record<string, string> = {
  oil: 'زيت',
  packaging: 'تعبئة',
  additives: 'إضافات',
  labeling: 'ملصقات',
  cleaning: 'تنظيف',
};

export default function FactoryMaterials() {
  const { rawMaterials } = useFactory();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const stats = useMemo(() => {
    const lowStock = rawMaterials.filter((m) => getQty(m) > 0 && getQty(m) <= m.reorderPoint).length;
    const outOfStock = rawMaterials.filter((m) => getQty(m) === 0).length;
    const totalValue = rawMaterials.reduce((sum, m) => sum + getQty(m) * m.unitCost, 0);
    return { lowStock, outOfStock, totalValue };
  }, [rawMaterials]);

  const categories = useMemo(
    () => Array.from(new Set(rawMaterials.map((m) => m.category))).filter(Boolean),
    [rawMaterials]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawMaterials.filter((m) => {
      const matchSearch = !q || m.name.toLowerCase().includes(q) || (m.nameAr ?? '').includes(q);
      const matchCat = !categoryFilter || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [rawMaterials, search, categoryFilter]);

  function rowClass(mat: RawMaterial): string {
    const qty = getQty(mat);
    if (qty === 0) return 'row-danger';
    if (qty <= mat.reorderPoint) return 'row-warning';
    return '';
  }

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">المواد الخام</span>
          </nav>
          <p className="page-desc">متابعة مخزون المواد الخام والتنبيهات</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="إجمالي الأصناف" value={rawMaterials.length} accent="#0D9488" />
        <StatCard label="مخزون منخفض" value={stats.lowStock} accent="#D97706" />
        <StatCard label="نفد المخزون" value={stats.outOfStock} accent="#DC2626" />
        <StatCard label="إجمالي القيمة ₪" value={formatCurrency(stats.totalValue)} accent="#3B5BDB" />
      </div>

      <div className="ds-card">
        <div className="ds-toolbar">
          <input
            className="ds-input"
            type="text"
            placeholder="بحث باسم المادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="ds-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">جميع الفئات</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_AR[cat] ?? cat}</option>
            ))}
          </select>
        </div>

        <table className="ds-table">
          <thead>
            <tr>
              <th>المادة</th>
              <th>الفئة</th>
              <th>المصدر</th>
              <th>الكمية</th>
              <th>نقطة إعادة الطلب</th>
              <th>سعر الوحدة ₪</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((mat) => {
              const qty = getQty(mat);
              const isLow = qty <= mat.reorderPoint;
              const isOut = qty === 0;
              return (
                <tr key={mat.id} className={rowClass(mat)}>
                  <td className="tc-flex tc-primary">{mat.nameAr ?? mat.name}</td>
                  <td className="tc-badge">
                    <span className="ds-badge ds-badge--neutral">{CATEGORY_AR[mat.category] ?? mat.category}</span>
                  </td>
                  <td className="tc-badge">
                    {mat.origin === 'local' ? (
                      <span className="ds-badge ds-badge--success">محلي</span>
                    ) : (
                      <span className="ds-badge ds-badge--info">مستورد</span>
                    )}
                  </td>
                  <td
                    className="tc-num"
                    style={{ color: isOut ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : undefined, fontWeight: isLow ? 600 : undefined }}
                  >
                    {qty.toLocaleString()} {mat.unit}
                  </td>
                  <td className="tc-num">{mat.reorderPoint.toLocaleString()} {mat.unit}</td>
                  <td className="tc-num">{formatCurrency(mat.unitCost)}</td>
                  <td className="tc-actions">
                    <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">تعديل</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8) 0' }}>
                  لا توجد مواد مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
