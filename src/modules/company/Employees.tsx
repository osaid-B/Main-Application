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


export default function EmployeesPage() {
  const navigate = useNavigate();
  const { employees } = useData();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const activeEmployees = useMemo(
    () => employees.filter((e) => !e.isDeleted),
    [employees]
  );

  const stats = useMemo(() => {
    const totalSalary = activeEmployees.reduce((sum, e) => sum + (e.fixedSalary ?? 0), 0);
    return {
      total: activeEmployees.length,
      totalSalary,
      onLeave: 0,
      newEmployees: 0,
    };
  }, [activeEmployees]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    activeEmployees.forEach((e) => {
      if (e.departmentId) set.add(e.departmentId);
    });
    return Array.from(set).sort();
  }, [activeEmployees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeEmployees.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q);
      const matchDept =
        !filterDepartment || e.departmentId === filterDepartment;
      return matchSearch && matchDept;
    });
  }, [activeEmployees, search, filterDepartment]);

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
            <span className="bc-current">الموظفون</span>
            <span className="bc-count">{filtered.length}</span>
          </nav>
          <p className="page-desc">إدارة بيانات الموظفين والرواتب والأقسام</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={() => navigate("/company/employees/new")}
          >
            + إضافة موظف
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="إجمالي الموظفين"
          value={stats.total}
          accent="#3B5BDB"
        />
        <StatCard
          label="الرواتب الشهرية ₪"
          value={formatCurrency(stats.totalSalary)}
          accent="#D97706"
        />
        <StatCard
          label="في إجازة"
          value={stats.onLeave}
          accent="#FBBF24"
        />
        <StatCard
          label="موظفون جدد"
          value={stats.newEmployees}
          accent="#16A34A"
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
              placeholder="بحث بالاسم أو الكود..."
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
              value={filterDepartment}
              onChange={(e) => {
                setFilterDepartment(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الأقسام</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">الموظف</th>
                <th className="tc-text">المسمى الوظيفي</th>
                <th className="tc-text">القسم</th>
                <th className="tc-text">الهاتف</th>
                <th className="tc-num">الراتب ₪</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((emp) => (
                <tr key={emp.id}>
                  <td className="tc-flex tc-primary">
                    <div>{emp.name}</div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        fontFamily: "Inter, monospace",
                      }}
                    >
                      {emp.id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="tc-text">{emp.jobTitle ?? "—"}</td>
                  <td className="tc-text">{emp.departmentId ?? "—"}</td>
                  <td className="tc-text">{emp.phone ?? "—"}</td>
                  <td className="tc-num">{formatCurrency(emp.fixedSalary ?? 0)}</td>
                  <td className="tc-actions">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="ds-btn ds-btn--ghost ds-btn--sm"
                        onClick={() =>
                          navigate(`/company/employees/${emp.id}/edit`)
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
