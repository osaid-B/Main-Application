import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { POS_PRODUCTS } from "../../data/posMock";
import type { PosCategory } from "../../data/posMock";
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

const CAT_AR: Record<string, string> = {
  beverages: "مشروبات",
  food: "أغذية",
  snacks: "وجبات خفيفة",
  dairy: "ألبان",
  household: "منزلية",
};

export default function Products() {
  const { formatCurrency } = useSettings();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");

  const activeCount = useMemo(() => POS_PRODUCTS.length, []);

  const lowStockCount = useMemo(
    () => POS_PRODUCTS.filter((p) => p.stock < 5 && p.stock > 0).length,
    []
  );

  const outOfStock = useMemo(
    () => POS_PRODUCTS.filter((p) => p.stock === 0).length,
    []
  );

  const categoriesCount = useMemo(
    () => new Set(POS_PRODUCTS.map((p) => p.category)).size,
    []
  );

  const filtered = useMemo(() => {
    return POS_PRODUCTS.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q)
        )
          return false;
      }
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (stockFilter === "low" && !(p.stock < 5 && p.stock > 0)) return false;
      if (stockFilter === "out" && p.stock !== 0) return false;
      if (stockFilter === "ok" && p.stock < 5) return false;
      return true;
    });
  }, [search, categoryFilter, stockFilter]);

  const uniqueCategories = useMemo(
    () => [...new Set(POS_PRODUCTS.map((p) => p.category))] as PosCategory[],
    []
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
            <span className="bc-current">المنتجات</span>
          </nav>
          <p className="page-desc">إدارة منتجات نقطة البيع والأسعار</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="إجمالي المنتجات"
          value={activeCount}
          accent="#7C3AED"
        />
        <StatCard
          label="مخزون منخفض"
          value={lowStockCount}
          accent="#D97706"
        />
        <StatCard
          label="نفد المخزون"
          value={outOfStock}
          accent="#DC2626"
        />
        <StatCard
          label="إجمالي الفئات"
          value={categoriesCount}
          accent="#3B5BDB"
        />
      </div>

      <div className="ds-card content-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <span className="search-icon">
              <Search size={15} />
            </span>
            <input
              className="ds-input"
              placeholder="بحث بالاسم أو رمز المنتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="ds-input ds-input--select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">كل الفئات</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {CAT_AR[cat] ?? cat}
                </option>
              ))}
            </select>
            <select
              className="ds-input ds-input--select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="">كل المخزون</option>
              <option value="ok">متوفر</option>
              <option value="low">منخفض</option>
              <option value="out">نفد</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">المنتج</th>
                <th className="tc-badge">الفئة</th>
                <th className="tc-num">السعر ₪</th>
                <th className="tc-num">المخزون</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.stock < 5 && p.stock > 0;
                const isOut = p.stock === 0;
                return (
                  <tr
                    key={p.id}
                    className={isOut ? "row-danger" : isLow ? "row-warning" : ""}
                  >
                    <td className="tc-flex tc-primary">
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        {p.emoji && (
                          <span style={{ fontSize: 18 }}>{p.emoji}</span>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontFamily: "Cairo, sans-serif" }}>
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--color-text-muted)",
                              fontFamily: "Inter, monospace",
                            }}
                          >
                            {p.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="tc-badge">
                      <span className="ds-badge ds-badge--neutral">
                        {CAT_AR[p.category] ?? p.category}
                      </span>
                    </td>
                    <td className="tc-num">{formatCurrency(p.price)}</td>
                    <td className="tc-num">
                      <span
                        style={{
                          color: isOut
                            ? "var(--color-danger)"
                            : isLow
                            ? "var(--color-warning)"
                            : "var(--color-text)",
                          fontWeight: isOut || isLow ? 700 : 400,
                        }}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="tc-actions">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="ds-btn ds-btn--secondary ds-btn--sm"
                          onClick={() =>
                            console.log("تعديل السعر:", p.id)
                          }
                        >
                          تعديل السعر
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
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
                    لا توجد منتجات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="table-count">
            {filtered.length} من {POS_PRODUCTS.length} منتج
          </div>
        </div>
      </div>
    </div>
  );
}
