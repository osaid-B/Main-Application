import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useSettings } from "../../context/SettingsContext";
import { RowActions, type RowAction } from "../../components/ui/RowActions";

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

function invoiceActions(
  status: string,
  id: string,
  navigate: ReturnType<typeof useNavigate>
): { primary: RowAction; items: RowAction[] } {
  const edit: RowAction = { label: "تعديل", onClick: () => navigate(`/company/invoices/${id}/edit`) };
  switch (status) {
    case "Pending":
      return {
        primary: { label: "تسجيل دفعة", onClick: () => navigate(`/company/payments/new?invoice=${id}`) },
        items: [edit, { label: "إلغاء", onClick: () => {}, variant: "danger" }],
      };
    case "Partial":
    case "Debit":
      return {
        primary: { label: "تسجيل دفعة", onClick: () => navigate(`/company/payments/new?invoice=${id}`) },
        items: [edit],
      };
    case "Paid":
      return {
        primary: { label: "عرض ←", onClick: () => navigate(`/company/invoices/${id}/edit`) },
        items: [{ label: "طباعة", onClick: () => {} }],
      };
    default:
      return {
        primary: { label: "تعديل", onClick: () => navigate(`/company/invoices/${id}/edit`) },
        items: [],
      };
  }
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { invoices, customers } = useData();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const custMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c.name])),
    [customers]
  );

  const activeInvoices = useMemo(
    () => invoices.filter((inv) => !inv.isDeleted),
    [invoices]
  );

  const stats = useMemo(() => {
    const total = activeInvoices.length;
    const paid = activeInvoices.filter((inv) => inv.status === "Paid").length;
    const pending = activeInvoices.filter((inv) => inv.status === "Pending").length;
    const totalAmount = activeInvoices.reduce(
      (sum, inv) => sum + (inv.total ?? 0),
      0
    );
    return { total, paid, pending, totalAmount };
  }, [activeInvoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeInvoices.filter((inv) => {
      const matchSearch =
        !q ||
        inv.id.toLowerCase().includes(q);
      const matchStatus = !filterStatus || inv.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [activeInvoices, search, filterStatus]);

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
            <span className="bc-current">الفواتير</span>
            <span className="bc-count">{filtered.length}</span>
          </nav>
          <p className="page-desc">إدارة الفواتير ومتابعة حالة السداد</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={() => navigate("/company/invoices/new")}
          >
            + فاتورة جديدة
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="إجمالي الفواتير"
          value={stats.total}
          accent="#3B5BDB"
        />
        <StatCard
          label="مدفوعة"
          value={stats.paid}
          accent="#16A34A"
        />
        <StatCard
          label="معلقة"
          value={stats.pending}
          accent="#D97706"
        />
        <StatCard
          label="إجمالي المبالغ ₪"
          value={formatCurrency(stats.totalAmount)}
          accent="#7C3AED"
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
              placeholder="بحث برقم الفاتورة..."
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
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الحالات</option>
              <option value="Paid">مدفوعة</option>
              <option value="Pending">معلقة</option>
              <option value="Partial">جزئية</option>
              <option value="Debit">دين</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-code">الفاتورة</th>
                <th className="tc-flex tc-primary">الزبون</th>
                <th className="tc-date">التاريخ</th>
                <th className="tc-num">المبلغ ₪</th>
                <th className="tc-num">الإجمالي ₪</th>
                <th className="tc-badge">الحالة</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((inv) => (
                <tr key={inv.id}>
                  <td className="tc-code">{(inv.id ?? "").slice(0, 8)}</td>
                  <td className="tc-flex tc-primary">
                    {custMap.get(inv.customerId) ?? "—"}
                  </td>
                  <td className="tc-date">{fmtDate(inv.date)}</td>
                  <td className="tc-num">{formatCurrency(inv.amount ?? 0)}</td>
                  <td className="tc-num">{formatCurrency(inv.total ?? 0)}</td>
                  <td className="tc-badge">
                    <span className={statusBadge(inv.status ?? "")}>
                      {STATUS_AR[inv.status ?? ""] ?? inv.status}
                    </span>
                  </td>
                  <td className="tc-actions">
                    {(() => {
                      const { primary, items } = invoiceActions(inv.status ?? "", inv.id ?? "", navigate);
                      return (
                        <RowActions
                          onView={() => navigate(`/company/invoices/${inv.id}/edit`)}
                          primary={primary}
                          items={items}
                        />
                      );
                    })()}
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
