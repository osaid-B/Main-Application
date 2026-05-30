import { useMemo, useState } from "react";
import { useFactory } from "../../context/FactoryContext";
import { useSettings } from "../../context/SettingsContext";
import type { FinishedGood } from "../../data/types";

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="ds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="ds-stat-card__label">{label}</div>
      <div className="ds-stat-card__value">{value}</div>
      {sub && <div className="ds-stat-card__sub">{sub}</div>}
    </div>
  );
}

function calcMargin(good: FinishedGood): number {
  if (!good.sellingPrice || good.sellingPrice === 0) return 0;
  return ((good.sellingPrice - good.unitCost) / good.sellingPrice) * 100;
}

function marginColor(margin: number): string {
  if (margin >= 30) return 'var(--color-success)';
  if (margin >= 15) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function FactoryProducts() {
  const { finishedGoods } = useFactory();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const stats = useMemo(() => {
    const totalUnits = finishedGoods.reduce((s, g) => s + g.onHand, 0);
    const reservedUnits = finishedGoods.reduce((s, g) => s + g.reserved, 0);
    const margins = finishedGoods
      .filter((g) => g.sellingPrice > 0)
      .map(calcMargin);
    const avgMargin = margins.length > 0 ? margins.reduce((s, m) => s + m, 0) / margins.length : 0;
    return { totalUnits, reservedUnits, avgMargin };
  }, [finishedGoods]);

  const categories = useMemo(
    () => Array.from(new Set(finishedGoods.map((g) => g.category))).filter(Boolean),
    [finishedGoods]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return finishedGoods.filter((g) => {
      const matchSearch = !q || g.name.toLowerCase().includes(q) || g.nameAr.includes(q) || g.sku.toLowerCase().includes(q);
      const matchCat = !categoryFilter || g.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [finishedGoods, search, categoryFilter]);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">المنتجات النهائية</span>
          </nav>
          <p className="page-desc">مخزون المنتجات النهائية وهوامش الربح</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="إجمالي المنتجات" value={finishedGoods.length} accent="#0D9488" />
        <StatCard label="إجمالي الوحدات" value={stats.totalUnits.toLocaleString()} accent="#3B5BDB" />
        <StatCard label="وحدات محجوزة" value={stats.reservedUnits.toLocaleString()} accent="#D97706" />
        <StatCard label="متوسط هامش الربح %" value={`${stats.avgMargin.toFixed(1)}%`} accent="#16A34A" />
      </div>

      <div className="ds-card">
        <div className="ds-toolbar">
          <input
            className="ds-input"
            type="text"
            placeholder="بحث باسم المنتج أو الرمز..."
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
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <table className="ds-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>رمز التخزين</th>
              <th>الفئة</th>
              <th>المتاح</th>
              <th>المحجوز</th>
              <th>تكلفة الوحدة ₪</th>
              <th>سعر البيع ₪</th>
              <th>هامش %</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((good) => {
              const margin = calcMargin(good);
              return (
                <tr key={good.id}>
                  <td className="tc-flex tc-primary">{good.nameAr}</td>
                  <td className="tc-code">{good.sku}</td>
                  <td className="tc-badge">
                    <span className="ds-badge ds-badge--neutral">{good.category}</span>
                  </td>
                  <td className="tc-num">{good.onHand.toLocaleString()}</td>
                  <td className="tc-num">{good.reserved.toLocaleString()}</td>
                  <td className="tc-num">{formatCurrency(good.unitCost)}</td>
                  <td className="tc-num">{formatCurrency(good.sellingPrice)}</td>
                  <td className="tc-num" style={{ color: marginColor(margin), fontWeight: 600 }}>
                    {margin.toFixed(1)}%
                  </td>
                  <td className="tc-actions">
                    <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">عرض</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8) 0' }}>
                  لا توجد منتجات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
