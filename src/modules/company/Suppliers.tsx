import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useData } from "../../context/DataContext";
import { RowActions } from "../../components/ui/RowActions";

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

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { suppliers } = useData();

  const [search, setSearch] = useState("");

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => !s.isDeleted),
    [suppliers]
  );

  const stats = useMemo(() => {
    const withPhone = activeSuppliers.filter((s) => !!s.phone).length;
    const withEmail = activeSuppliers.filter((s) => !!s.email).length;
    return { total: activeSuppliers.length, withPhone, withEmail };
  }, [activeSuppliers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeSuppliers.filter((s) =>
      !q || s.name.toLowerCase().includes(q) || (s.phone ?? "").includes(q)
    );
  }, [activeSuppliers, search]);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const pageItems = (filtered ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">الشركة</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">الموردون</span>
            <span className="bc-count">{filtered.length}</span>
          </nav>
          <p className="page-desc">إدارة الموردين ومتابعة بيانات الاتصال</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={() => navigate("/company/suppliers/new")}
          >
            + إضافة مورد
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="إجمالي الموردين" value={stats.total} accent="#3B5BDB" />
        <StatCard label="لديهم هاتف" value={stats.withPhone} accent="#16A34A" />
        <StatCard label="لديهم بريد إلكتروني" value={stats.withEmail} accent="#D97706" />
      </div>

      <div className="ds-card content-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <span className="search-icon">
              <Search size={15} />
            </span>
            <input
              className="ds-input"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">المورد</th>
                <th className="tc-text">الهاتف</th>
                <th className="tc-text">البريد الإلكتروني</th>
                <th className="tc-text">العنوان</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="tc-flex tc-primary">
                    <div>{supplier.name}</div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        fontFamily: "Inter, monospace",
                      }}
                    >
                      {(supplier.id ?? "").slice(0, 8)}
                    </div>
                  </td>
                  <td className="tc-text">{supplier.phone ?? "—"}</td>
                  <td className="tc-text">{supplier.email ?? "—"}</td>
                  <td className="tc-text">{supplier.address ?? "—"}</td>
                  <td className="tc-actions">
                    <RowActions
                      onView={() => navigate(`/company/suppliers/${supplier.id}/edit`)}
                      primary={{ label: "عرض ←", onClick: () => navigate(`/company/suppliers/${supplier.id}/edit`) }}
                      items={[
                        { label: "تعديل", onClick: () => navigate(`/company/suppliers/${supplier.id}/edit`) },
                        { label: "طلبات الشراء", onClick: () => navigate(`/company/purchases?supplier=${supplier.id}`) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    لا توجد نتائج
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="table-count">
            عرض {Math.min(filtered.length, PAGE_SIZE)} من {filtered.length}
          </span>
          {filtered.length > PAGE_SIZE && (
            <div className="ds-pagination">
              <button
                type="button"
                className="ds-pagination__btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </button>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  padding: "0 4px",
                }}
              >
                {page}
              </span>
              <button
                type="button"
                className="ds-pagination__btn"
                disabled={page * PAGE_SIZE >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
