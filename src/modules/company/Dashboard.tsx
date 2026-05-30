import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { customers, invoices, expenses } = useData();
  const { formatCurrency } = useSettings();

  const custMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c.name])),
    [customers]
  );

  const stats = useMemo(() => {
    const activeInvoices = invoices.filter((inv) => !inv.isDeleted);
    const revenue = activeInvoices
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + (inv.amount ?? 0), 0);

    const expensesTotal = expenses
      .filter((e) => !e.isDeleted && e.status === "approved")
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);

    const netProfit = revenue - expensesTotal;
    const openInvoices = activeInvoices.filter(
      (inv) => inv.status !== "Paid"
    ).length;

    return { revenue, expensesTotal, netProfit, openInvoices };
  }, [invoices, expenses]);

  const lastInvoices = useMemo(() => {
    return [...invoices]
      .filter((inv) => !inv.isDeleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">الشركة</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">لوحة التحكم</span>
          </nav>
          <p className="page-desc">نظرة عامة على الأداء المالي للشركة</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="إجمالي الإيرادات"
          value={formatCurrency(stats.revenue)}
          accent="#3B5BDB"
        />
        <StatCard
          label="المصروفات"
          value={formatCurrency(stats.expensesTotal)}
          accent="#DC2626"
        />
        <StatCard
          label="صافي الربح"
          value={formatCurrency(stats.netProfit)}
          accent="#16A34A"
        />
        <StatCard
          label="فواتير مفتوحة"
          value={stats.openInvoices}
          accent="#D97706"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60% 40%",
          gap: "var(--space-4)",
        }}
      >
        {/* آخر الفواتير */}
        <div className="ds-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--space-4)",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              آخر الفواتير
            </span>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
          >
            {lastInvoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-3) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontWeight: 500, fontSize: "13px" }}>
                    {inv.id.slice(0, 8)}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {custMap.get(inv.customerId) ?? "—"} · {fmtDate(inv.date)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, monospace",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {formatCurrency(inv.total ?? inv.amount ?? 0)}
                  </span>
                  <span className={statusBadge(inv.status ?? "")}>
                    {STATUS_AR[inv.status ?? ""] ?? inv.status}
                  </span>
                </div>
              </div>
            ))}
            {lastInvoices.length === 0 && (
              <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-8) 0" }}>
                لا توجد فواتير
              </p>
            )}
          </div>
          <div style={{ marginTop: "var(--space-4)", textAlign: "center" }}>
            <button
              type="button"
              className="ds-btn ds-btn--ghost ds-btn--sm"
              onClick={() => navigate("/company/invoices")}
            >
              عرض الكل ←
            </button>
          </div>
        </div>

        {/* إجراءات سريعة */}
        <div className="ds-card">
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--color-text)",
              marginBottom: "var(--space-5)",
            }}
          >
            إجراءات سريعة
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              style={{ justifyContent: "center" }}
              onClick={() => navigate("/company/invoices")}
            >
              + فاتورة جديدة
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--secondary"
              style={{ justifyContent: "center" }}
              onClick={() => navigate("/company/payments")}
            >
              + دفعة جديدة
            </button>
            <button
              type="button"
              className="ds-btn ds-btn--secondary"
              style={{ justifyContent: "center" }}
              onClick={() => navigate("/company/customers")}
            >
              + إضافة زبون
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
