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

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

const METHOD_AR: Record<string, string> = {
  cash: "نقداً",
  card: "بطاقة",
  bank: "تحويل",
  cheque: "شيك",
};

function methodBadge(method: string): string {
  switch (method) {
    case "cash":
      return "ds-badge ds-badge--success";
    case "card":
      return "ds-badge ds-badge--info";
    case "bank":
      return "ds-badge ds-badge--teal";
    case "cheque":
    default:
      return "ds-badge ds-badge--neutral";
  }
}

function isToday(iso: string): boolean {
  if (!iso) return false;
  const today = new Date();
  const d = new Date(iso);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { payments, customers } = useData();
  const { formatCurrency } = useSettings();

  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

  const custMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c.name])),
    [customers]
  );

  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const todayTotal = payments
      .filter((p) => isToday(p.date))
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const count = payments.length;
    const avg = count > 0 ? total / count : 0;
    return { total, todayTotal, count, avg };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const custName = custMap.get(p.customerId) ?? "";
      const matchSearch =
        !q || custName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchMethod = !filterMethod || p.method === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [payments, search, filterMethod, custMap]);

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
            <span className="bc-current">الدفعات</span>
            <span className="bc-count">{filtered.length}</span>
          </nav>
          <p className="page-desc">سجل المدفوعات الواردة من الزبائن</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={() => navigate("/company/payments/new")}
          >
            + دفعة جديدة
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="إجمالي الدفعات ₪"
          value={formatCurrency(stats.total)}
          accent="#3B5BDB"
        />
        <StatCard
          label="مدفوعة اليوم ₪"
          value={formatCurrency(stats.todayTotal)}
          accent="#16A34A"
        />
        <StatCard
          label="عدد الدفعات"
          value={stats.count}
          accent="#7C3AED"
        />
        <StatCard
          label="متوسط الدفعة ₪"
          value={formatCurrency(stats.avg)}
          accent="#D97706"
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
              placeholder="بحث باسم الزبون..."
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
              value={filterMethod}
              onChange={(e) => {
                setFilterMethod(e.target.value);
                setPage(1);
              }}
            >
              <option value="">كل الطرق</option>
              <option value="cash">نقداً</option>
              <option value="card">بطاقة</option>
              <option value="bank">تحويل</option>
              <option value="cheque">شيك</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-code">رقم الدفعة</th>
                <th className="tc-flex tc-primary">الزبون</th>
                <th className="tc-code">الفاتورة</th>
                <th className="tc-num">المبلغ ₪</th>
                <th className="tc-badge">طريقة الدفع</th>
                <th className="tc-date">التاريخ</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((payment) => (
                <tr key={payment.id}>
                  <td className="tc-code">{(payment.id ?? "").slice(0, 8)}</td>
                  <td className="tc-flex tc-primary">
                    {custMap.get(payment.customerId) ?? "—"}
                  </td>
                  <td className="tc-code">
                    {payment.invoiceId ? payment.invoiceId.slice(0, 8) : "—"}
                  </td>
                  <td className="tc-num">{formatCurrency(payment.amount ?? 0)}</td>
                  <td className="tc-badge">
                    <span className={methodBadge(payment.method ?? "")}>
                      {METHOD_AR[payment.method ?? ""] ?? payment.method}
                    </span>
                  </td>
                  <td className="tc-date">{fmtDate(payment.date)}</td>
                  <td className="tc-actions">
                    <RowActions
                      onView={() => navigate(`/company/payments/${payment.id}/edit`)}
                      primary={{ label: "عرض ←", onClick: () => navigate(`/company/payments/${payment.id}/edit`) }}
                      items={[
                        { label: "تعديل", onClick: () => navigate(`/company/payments/${payment.id}/edit`) },
                        { label: "طباعة", onClick: () => {} },
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
