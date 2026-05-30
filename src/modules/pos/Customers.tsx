import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LOYALTY_CUSTOMERS } from "../../data/posMock";
import type { LoyaltyCustomer } from "../../data/posMock";

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

const TIER_AR: Record<LoyaltyCustomer["tier"], string> = {
  platinum: "بلاتيني",
  gold: "ذهبي",
  silver: "فضي",
};

const TIER_CLASS: Record<LoyaltyCustomer["tier"], string> = {
  platinum: "ds-badge--violet",
  gold: "ds-badge--warning",
  silver: "ds-badge--neutral",
};

export default function Customers() {
  const [search, setSearch] = useState("");

  const membersCount = useMemo(() => LOYALTY_CUSTOMERS.length, []);

  const totalCoins = useMemo(
    () => LOYALTY_CUSTOMERS.reduce((s, c) => s + c.coins, 0),
    []
  );

  const platinumCount = useMemo(
    () => LOYALTY_CUSTOMERS.filter((c) => c.tier === "platinum").length,
    []
  );

  const goldCount = useMemo(
    () => LOYALTY_CUSTOMERS.filter((c) => c.tier === "gold").length,
    []
  );

  const avgCoins = useMemo(
    () => (membersCount > 0 ? totalCoins / membersCount : 0),
    [totalCoins, membersCount]
  );

  const filtered = useMemo<LoyaltyCustomer[]>(() => {
    if (!search) return LOYALTY_CUSTOMERS;
    const q = search.toLowerCase();
    return LOYALTY_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="module-pos page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">نقطة البيع</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">برنامج الولاء</span>
          </nav>
          <p className="page-desc">إدارة أعضاء برنامج الولاء ونقاط المكافآت</p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="ds-btn ds-btn--primary">
            + إضافة عضو
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="أعضاء الولاء"
          value={membersCount}
          accent="#7C3AED"
        />
        <StatCard
          label="إجمالي النقاط"
          value={totalCoins.toLocaleString()}
          accent="#3B5BDB"
        />
        <StatCard
          label="أعضاء ذهبيون وبلاتينيون"
          value={platinumCount + goldCount}
          accent="#0D9488"
        />
        <StatCard
          label="متوسط النقاط"
          value={Math.round(avgCoins).toLocaleString()}
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
              placeholder="بحث بالاسم أو رمز العضوية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-flex tc-primary">الزبون</th>
                <th className="tc-code">رمز العضوية</th>
                <th className="tc-badge">الدرجة</th>
                <th className="tc-num">نقاط الولاء ⭐</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="tc-flex tc-primary">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-full)",
                          background: "var(--module-pos-light)",
                          color: "var(--module-pos-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "Cairo, sans-serif",
                          flexShrink: 0,
                        }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontFamily: "Cairo, sans-serif",
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-muted)",
                            fontFamily: "Cairo, sans-serif",
                          }}
                        >
                          {c.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="tc-code">{c.code}</td>
                  <td className="tc-badge">
                    <span className={`ds-badge ${TIER_CLASS[c.tier]}`}>
                      {TIER_AR[c.tier]}
                    </span>
                  </td>
                  <td className="tc-num">
                    <span
                      style={{
                        fontFamily: "Inter, monospace",
                        fontWeight: 600,
                        color: "var(--module-pos-primary)",
                      }}
                    >
                      {c.coins.toLocaleString()}
                    </span>
                  </td>
                  <td className="tc-actions">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="ds-btn ds-btn--secondary ds-btn--sm"
                        onClick={() => console.log("عرض السجل:", c.id)}
                      >
                        عرض السجل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                    لا توجد نتائج
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="table-count">
            {filtered.length} من {LOYALTY_CUSTOMERS.length} عضو
          </div>
        </div>
      </div>
    </div>
  );
}
