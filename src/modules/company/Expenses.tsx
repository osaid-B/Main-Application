import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useData } from "../../context/DataContext";
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

function statusBadge(status: string): string {
  switch (status) {
    case "Paid":
    case "approved":
    case "active":
      return "ds-badge ds-badge--success";
    case "Pending":
    case "pending":
    case "inactive":
      return "ds-badge ds-badge--warning";
    case "Partial":
    case "Debit":
      return "ds-badge ds-badge--info";
    case "rejected":
      return "ds-badge ds-badge--danger";
    default:
      return "ds-badge ds-badge--neutral";
  }
}

const STATUS_AR: Record<string, string> = {
  Paid: "مدفوعة",
  Pending: "معلقة",
  Partial: "جزئية",
  Debit: "دين",
  approved: "موافق عليه",
  pending: "بانتظار",
  rejected: "مرفوض",
  active: "نشط",
  inactive: "غير نشط",
  archived: "مؤرشف",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

const CATEGORIES = [
  "إيجار",
  "رواتب",
  "كهرباء وماء",
  "مواصلات",
  "تسويق",
  "صيانة",
  "قرطاسية",
  "أخرى",
];

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { expenses } = useData();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const activeExpenses = useMemo(
    () => expenses.filter((e) => !e.isDeleted),
    [expenses]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const approvedTotal = activeExpenses
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);

    const thisMonth = activeExpenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);

    const pendingCount = activeExpenses.filter((e) => e.status === "pending").length;
    const totalCount = activeExpenses.length;

    return { approvedTotal, thisMonth, pendingCount, totalCount };
  }, [activeExpenses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeExpenses.filter((e) => {
      const matchSearch =
        !q || (e.description ?? "").toLowerCase().includes(q);
      const matchCategory = !filterCategory || e.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [activeExpenses, search, filterCategory]);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">الشركة</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">المصروفات</span>
            <span className="bc-count">{filtered.length}</span>
          </nav>
          <p className="page-desc">تتبع مصروفات الشركة التشغيلية والإدارية</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={() => navigate("/company/expenses/new")}
          >
            + إضافة مصروف
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="إجمالي المصروفات ₪"
          value={formatCurrency(stats.approvedTotal)}
          accent="#DC2626"
        />
        <StatCard
          label="هذا الشهر ₪"
          value={formatCurrency(stats.thisMonth)}
          accent="#D97706"
        />
        <StatCard
          label="بانتظار الموافقة"
          value={stats.pendingCount}
          accent="#FBBF24"
        />
        <StatCard
          label="إجمالي العناصر"
          value={stats.totalCount}
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
              placeholder="بحث بالوصف..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="ds-input ds-input--select"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الفئات</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">الوصف</th>
                <th className="tc-badge">الفئة</th>
                <th className="tc-num">المبلغ ₪</th>
                <th className="tc-date">التاريخ</th>
                <th className="tc-badge">الحالة</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((expense) => (
                <tr key={expense.id}>
                  <td className="tc-flex tc-primary">
                    {expense.description ?? "—"}
                  </td>
                  <td className="tc-badge">
                    <span className="ds-badge ds-badge--neutral">
                      {expense.category ?? "—"}
                    </span>
                  </td>
                  <td className="tc-num">{formatCurrency(expense.amount ?? 0)}</td>
                  <td className="tc-date">{fmtDate(expense.date)}</td>
                  <td className="tc-badge">
                    <span className={statusBadge(expense.status ?? "")}>
                      {STATUS_AR[expense.status ?? ""] ?? expense.status}
                    </span>
                  </td>
                  <td className="tc-actions">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="ds-btn ds-btn--ghost ds-btn--sm"
                        onClick={() =>
                          navigate(`/company/expenses/${expense.id}/edit`)
                        }
                      >
                        تعديل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
