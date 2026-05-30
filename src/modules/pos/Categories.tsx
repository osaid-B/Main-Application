import { useMemo } from "react";
import { POS_PRODUCT_CATEGORIES, POS_PRODUCTS } from "../../data/posMock";
import type { PosCategoryStatus } from "../../data/posMock";

function StatusBadge({ status }: { status: PosCategoryStatus }) {
  return status === "active" ? (
    <span className="ds-badge ds-badge--success">نشط</span>
  ) : (
    <span className="ds-badge ds-badge--neutral">غير نشط</span>
  );
}

export default function Categories() {
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    POS_PRODUCTS.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  // Map category name (English lowercase) to count using POS_PRODUCT_CATEGORIES
  const catCountByName = useMemo(() => {
    const result: Record<string, number> = {};
    POS_PRODUCT_CATEGORIES.forEach((cat) => {
      const key = cat.name.toLowerCase();
      result[cat.id] = productCounts[key] ?? cat.productCount;
    });
    return result;
  }, [productCounts]);

  return (
    <div className="module-pos page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">نقطة البيع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">الفئات</span>
          </nav>
          <p className="page-desc">إدارة فئات منتجات نقطة البيع</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="ds-btn ds-btn--primary">
            + إضافة فئة
          </button>
        </div>
      </div>

      <div className="ds-card content-card">
        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">الفئة</th>
                <th className="tc-num">عدد المنتجات</th>
                <th>الفئة الرئيسية</th>
                <th className="tc-num">الترتيب</th>
                <th className="tc-badge">الحالة</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {POS_PRODUCT_CATEGORIES.map((cat) => (
                <tr key={cat.id}>
                  <td className="tc-flex tc-primary">
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontFamily: "Cairo, sans-serif",
                        }}
                      >
                        {cat.nameAr}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-muted)",
                          fontFamily: "Inter, monospace",
                        }}
                      >
                        {cat.name}
                      </div>
                    </div>
                  </td>
                  <td className="tc-num">{catCountByName[cat.id] ?? 0}</td>
                  <td>
                    {cat.parentId ? (
                      <span
                        style={{
                          fontFamily: "Inter, monospace",
                          fontSize: 12,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {cat.parentId}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="tc-num">{cat.sortOrder}</td>
                  <td className="tc-badge">
                    <StatusBadge status={cat.status} />
                  </td>
                  <td className="tc-actions">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="ds-btn ds-btn--secondary ds-btn--sm"
                        onClick={() => console.log("تعديل:", cat.id)}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="ds-btn ds-btn--ghost ds-btn--sm"
                        onClick={() => console.log("حذف:", cat.id)}
                        style={{ color: "var(--color-danger)" }}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="table-count">
            {POS_PRODUCT_CATEGORIES.length} فئة
          </div>
        </div>
      </div>
    </div>
  );
}
