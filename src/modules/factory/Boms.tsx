import { useMemo, useState } from "react";
import { useFactory } from "../../context/FactoryContext";
import { useSettings } from "../../context/SettingsContext";
import type { BomTemplate } from "../../data/factoryMock";

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

/** Compute total cost from BOM lines since BomTemplate has `lines` not `components` */
function getBomCost(bom: BomTemplate): number {
  // BomTemplate has lines[]{materialId, materialName, quantity, unit, unitCost}
  return bom.lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
}

export default function FactoryBoms() {
  const { boms } = useFactory();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const avgCost = boms.length > 0 ? boms.reduce((s, b) => s + getBomCost(b), 0) / boms.length : 0;
    const totalComponents = boms.reduce((s, b) => s + b.lines.length, 0);
    // Most recent effectiveDate
    const lastUpdated = boms
      .map((b) => b.effectiveDate)
      .filter(Boolean)
      .sort()
      .at(-1) ?? '';
    return { avgCost, totalComponents, lastUpdated };
  }, [boms]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boms;
    return boms.filter((b) =>
      b.productId.toLowerCase().includes(q) ||
      b.productName.toLowerCase().includes(q) ||
      b.productNameAr.includes(q)
    );
  }, [boms, search]);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">المصنع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">قوائم المواد</span>
          </nav>
          <p className="page-desc">قوائم مكونات الإنتاج (BOM) وتكاليفها</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="قوائم المواد" value={boms.length} accent="#0D9488" />
        <StatCard label="متوسط تكلفة BOM ₪" value={formatCurrency(stats.avgCost)} accent="#D97706" />
        <StatCard label="إجمالي المكونات" value={stats.totalComponents} accent="#3B5BDB" />
        <StatCard label="آخر تحديث" value={fmtDate(stats.lastUpdated)} accent="#16A34A" />
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
        </div>

        <table className="ds-table">
          <thead>
            <tr>
              <th>رقم القائمة</th>
              <th>المنتج</th>
              <th>الإصدار</th>
              <th>عدد المكونات</th>
              <th>التكلفة الإجمالية ₪</th>
              <th>تاريخ الإنشاء</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bom) => (
              <tr key={bom.id}>
                <td className="tc-code">{bom.id}</td>
                <td className="tc-flex tc-primary">{bom.productNameAr}</td>
                <td className="tc-badge">
                  <span className="ds-badge ds-badge--info">{bom.version}</span>
                </td>
                <td className="tc-num">{bom.lines.length}</td>
                <td className="tc-num">{formatCurrency(getBomCost(bom))}</td>
                <td className="tc-date">{fmtDate(bom.effectiveDate)}</td>
                <td className="tc-actions">
                  <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">عرض</button>
                  <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm">استنساخ</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8) 0' }}>
                  لا توجد قوائم مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
