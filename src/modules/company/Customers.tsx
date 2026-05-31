import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useSettings } from "../../context/SettingsContext";
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

export default function CustomersPage() {
  const navigate = useNavigate();
  const { customers: rawCustomers, deleteCustomer } = useData();
  const { formatCurrency } = useSettings();

  // Guard against null/undefined leaking through from corrupted localStorage
  const customers = Array.isArray(rawCustomers) ? rawCustomers : [];

  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const activeCustomers = useMemo(
    // Also filter out any malformed records that are missing an id — those
    // can reach localStorage when a customer is saved with an empty code field.
    () => (customers ?? []).filter((c) => !c.isDeleted && typeof c.id === "string" && c.id !== ""),
    [customers]
  );

  const stats = useMemo(() => {
    const safe = activeCustomers ?? [];
    const total = safe.length;
    const outstanding = safe.reduce(
      (sum, c) => sum + (c.outstandingBalance ?? 0),
      0
    );
    const vip = safe.filter((c) => c.classification === "vip").length;
    const active = safe.filter((c) => c.status === "active").length;
    return { total, outstanding, vip, active };
  }, [activeCustomers]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    (activeCustomers ?? []).forEach((c) => {
      if (c.governorate) set.add(c.governorate);
      else if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [activeCustomers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (activeCustomers ?? []).filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q);
      const location = c.governorate ?? c.city ?? "";
      const matchCity = !filterCity || location === filterCity;
      const matchStatus = !filterStatus || c.status === filterStatus;
      return matchSearch && matchCity && matchStatus;
    });
  }, [activeCustomers, search, filterCity, filterStatus]);

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const pageItems = (filtered ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleDelete(id: string) {
    if (window.confirm("هل أنت متأكد؟")) {
      deleteCustomer(id);
    }
  }

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">الشركة</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">الزبائن</span>
            <span className="bc-count">{filtered.length}</span>
          </nav>
          <p className="page-desc">إدارة بيانات الزبائن والأرصدة المستحقة</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={() => navigate("/company/customers/new")}
          >
            + إضافة زبون
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="إجمالي الزبائن"
          value={stats.total}
          accent="#3B5BDB"
        />
        <StatCard
          label="رصيد مستحق ₪"
          value={formatCurrency(stats.outstanding)}
          accent="#D97706"
        />
        <StatCard
          label="زبائن مميزون"
          value={stats.vip}
          accent="#7C3AED"
        />
        <StatCard
          label="زبائن نشطون"
          value={stats.active}
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
              placeholder="بحث بالاسم أو الهاتف..."
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
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل المحافظات</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              className="ds-input ds-input--select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">الزبون</th>
                <th className="tc-text">الهاتف</th>
                <th className="tc-text">المحافظة</th>
                <th className="tc-num">الرصيد ₪</th>
                <th className="tc-date">آخر فاتورة</th>
                <th className="tc-badge">الحالة</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((customer) => (
                <tr key={customer.id}>
                  <td className="tc-flex tc-primary">
                    <div>{customer.name}</div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        fontFamily: "Inter, monospace",
                      }}
                    >
                      {(customer.id ?? "").slice(0, 8)}
                    </div>
                  </td>
                  <td className="tc-text">{customer.phone ?? "—"}</td>
                  <td className="tc-text">
                    {customer.governorate ?? customer.city ?? "—"}
                  </td>
                  <td className="tc-num">
                    {formatCurrency(customer.outstandingBalance ?? 0)}
                  </td>
                  <td className="tc-date">{fmtDate(customer.lastOrderDate ?? "")}</td>
                  <td className="tc-badge">
                    <span className={statusBadge(customer.status ?? "")}>
                      {STATUS_AR[customer.status ?? ""] ?? customer.status}
                    </span>
                  </td>
                  <td className="tc-actions">
                    <RowActions
                      onView={() => navigate(`/company/customers/${customer.id}/edit`)}
                      primary={{ label: "عرض ←", onClick: () => navigate(`/company/customers/${customer.id}/edit`) }}
                      items={[
                        { label: "تعديل", onClick: () => navigate(`/company/customers/${customer.id}/edit`) },
                        { label: "فواتير الزبون", onClick: () => navigate(`/company/invoices?customer=${customer.id}`) },
                        { label: "سجل الدفعات", onClick: () => navigate(`/company/payments?customer=${customer.id}`) },
                        { label: "حذف", onClick: () => handleDelete(customer.id), variant: "danger" },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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
