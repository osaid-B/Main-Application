import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Circle, Download, Filter, Search, Star, Tag, User, UserCheck, Users, Wallet, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import {
  CLASSIFICATION_LABELS,
  TYPE_LABELS,
} from "../data/customersMock";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import type { Customer, Invoice, Payment } from "../data/types";
import { formatNumberValue } from "../utils/displayFormatters";
import styles from "./Customers.module.css";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { TableActions } from "../components/ui/TableActions";


function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهور`;
}

function formatBalance(n: number, currency: string): string {
  return `${formatNumberValue(n, { maximumFractionDigits: 0 })} ${currency}`;
}

export default function Customers() {
  const navigate = useNavigate();
  const { customers, deleteCustomer, updateCustomer, customerBalanceMap, customerLastOrderMap, invoices, payments } = useData();
  const { t, formatNumber } = useSettings();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [statFilter, setStatFilter] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ itemName: string; onConfirm: () => void } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilterDropdown) return;
    function handleClick(e: MouseEvent) {
      if (!filterRef.current?.contains(e.target as Node)) setShowFilterDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterDropdown]);

  const active = useMemo(
    () => customers.filter((c) => !c.isDeleted),
    [customers]
  );

  const filtered = useMemo(() => {
    return active.filter((c) => {
      if (statFilter === "vip" && c.classification !== "vip") return false;
      if (statFilter === "active" && (c.status ?? "active") !== "active") return false;
      if (statFilter === "withBalance" && (customerBalanceMap.get(c.id) ?? c.outstandingBalance ?? 0) <= 0) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (classFilter && c.classification !== classFilter) return false;
      if (statusFilter && (c.status ?? "active") !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const bal = customerBalanceMap.get(c.id) ?? c.outstandingBalance ?? 0;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.code?.toLowerCase().includes(q) ?? false) ||
          c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.city?.toLowerCase().includes(q) ?? false) ||
          (c.governorate?.toLowerCase().includes(q) ?? false) ||
          (c.type ? TYPE_LABELS[c.type]?.toLowerCase().includes(q) : false) ||
          (c.classification ? CLASSIFICATION_LABELS[c.classification]?.toLowerCase().includes(q) : false) ||
          (c.status ?? "active").toLowerCase().includes(q) ||
          formatBalance(bal, "SAR").toLowerCase().includes(q) ||
          (c.salesRep?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [active, query, typeFilter, classFilter, statusFilter, statFilter, customerBalanceMap]);

  const stats = useMemo(() => ({
    total: active.length,
    vip: active.filter((c) => c.classification === "vip").length,
    customersActive: active.filter((c) => (c.status ?? "active") === "active").length,
    withBalance: active.filter((c) => (customerBalanceMap.get(c.id) ?? c.outstandingBalance ?? 0) > 0).length,
  }), [active, customerBalanceMap]);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {t.customers.pageTitle} <span className={styles.titleCount}>· {formatNumber(stats.total)}</span>
            </h1>
            <p className={styles.subtitle}>{t.customers.pageSubtitle}</p>
          </div>
        </header>

        {/* Quick stats */}
        <div className={styles.statsRow}>
          <StatCard label={t.customers.stats.total}       value={stats.total}           tone="blue"  icon={<Users size={18} />}     active={statFilter === "total"}       onClick={() => setStatFilter(statFilter === "total" ? null : "total")}       delay={0} />
          <StatCard label={t.customers.stats.active}      value={stats.customersActive}  tone="green" icon={<UserCheck size={18} />} active={statFilter === "active"}     onClick={() => setStatFilter(statFilter === "active" ? null : "active")}     delay={80} />
          <StatCard label={t.customers.stats.vip}         value={stats.vip}              tone="amber" icon={<Star size={18} />}     active={statFilter === "vip"}         onClick={() => setStatFilter(statFilter === "vip" ? null : "vip")}         delay={160} />
          <StatCard label={t.customers.stats.withBalance} value={stats.withBalance}      tone="purple" icon={<Wallet size={18} />}  active={statFilter === "withBalance"} onClick={() => setStatFilter(statFilter === "withBalance" ? null : "withBalance")} delay={240} />
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <Input
            variant="search"
            placeholder={t.customers.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={14} />}
            fullWidth
          />
          <div ref={filterRef} className={styles.filterWrap}>
            <button
              type="button"
              className={`${styles.filterBtn} ${(typeFilter || classFilter || statusFilter) ? styles.filterBtnActive : ""}`}
              onClick={() => setShowFilterDropdown((v) => !v)}
            >
              <Filter size={14} />
              <span>{t.customers.filter ?? "تصفية"}</span>
            </button>
            {showFilterDropdown && (
              <div className={styles.filterDropdown}>
                <div className={styles.filterGroup}>
                  <span className={styles.filterGroupLabel}>{t.customers.filters.allTypes}</span>
                  {["", "individual", "company", "institution"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.filterOption} ${typeFilter === v ? styles.filterOptionActive : ""}`}
                      onClick={() => { setTypeFilter(v); }}
                    >
                      {v ? <><User size={12} /><span>{TYPE_LABELS[v as keyof typeof TYPE_LABELS]}</span></> : t.customers.filters.allTypes}
                    </button>
                  ))}
                </div>
                <div className={styles.filterDivider} />
                <div className={styles.filterGroup}>
                  <span className={styles.filterGroupLabel}>{t.customers.filters.allClassifications}</span>
                  {["", "standard", "vip", "risk"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.filterOption} ${classFilter === v ? styles.filterOptionActive : ""}`}
                      onClick={() => { setClassFilter(v); }}
                    >
                      {v ? <><Tag size={12} /><span>{CLASSIFICATION_LABELS[v as keyof typeof CLASSIFICATION_LABELS]}</span></> : t.customers.filters.allClassifications}
                    </button>
                  ))}
                </div>
                <div className={styles.filterDivider} />
                <div className={styles.filterGroup}>
                  <span className={styles.filterGroupLabel}>{t.customers.filters.allStatuses}</span>
                  {["", "active", "inactive", "archived"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.filterOption} ${statusFilter === v ? styles.filterOptionActive : ""}`}
                      onClick={() => { setStatusFilter(v); }}
                    >
                      {v ? <><Circle size={12} /><span>{t.customers.status[v as "active" | "inactive" | "archived"]}</span></> : t.customers.filters.allStatuses}
                    </button>
                  ))}
                </div>
                {(typeFilter || classFilter || statusFilter) && (
                  <>
                    <div className={styles.filterDivider} />
                    <button
                      type="button"
                      className={styles.filterClear}
                      onClick={() => { setTypeFilter(""); setClassFilter(""); setStatusFilter(""); }}
                    >
                      مسح الكل
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {statFilter && (
            <span className={styles.statFilterPill}>
              <span>{statFilter === "total" ? t.customers.stats.total : statFilter === "vip" ? t.customers.stats.vip : statFilter === "active" ? t.customers.stats.active : t.customers.stats.withBalance}</span>
              <button type="button" className={styles.statFilterPillClose} onClick={() => setStatFilter(null)}>
                <X size={12} />
              </button>
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => {
              const csv = [
                ["ID", "Name", "Phone", "Type", "Classification", "Status", "Balance"],
                ...filtered.map((c) => [c.id, c.name, c.phone ?? "", c.type ?? "", c.classification ?? "", c.status ?? "active", String(c.outstandingBalance ?? 0)]),
              ].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
              const a = Object.assign(document.createElement("a"), {
                href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
                download: `customers-${new Date().toISOString().slice(0, 10)}.csv`,
              });
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            {t.customers.export}
          </Button>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={`${styles.table} atlas-table`}>
            <colgroup>
              <col style={{ width: "32%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>{t.customers.cols.customer}</th>
                <th>{t.customers.cols.type}</th>
                <th>{t.customers.cols.city}</th>
                <th>{t.customers.cols.lastOrder}</th>
                <th>{t.customers.cols.status}</th>
                <th aria-label={t.customers.ariaMore} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <CustomerRow
                  key={c.id}
                  c={c}
                  liveLastOrder={customerLastOrderMap.get(c.id)}
                  onView={() => setViewingCustomer(c)}
                  onEdit={() => navigate(`/customers/${c.id}/edit`)}
                  onDelete={() => setDeleteConfirm({ itemName: c.name || c.companyName || c.id, onConfirm: () => deleteCustomer(c.id) })}
                  onRowClick={() => setViewingCustomer(c)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>{t.customers.empty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <span>{t.customers.showing} {formatNumber(filtered.length)} {t.customers.of} {formatNumber(stats.total)}</span>
        </footer>

        {/* View Customer Modal */}
        {viewingCustomer && (
          <CustomerViewModal
            customer={viewingCustomer}
            balance={customerBalanceMap.get(viewingCustomer.id) ?? viewingCustomer.outstandingBalance ?? 0}
            invoices={invoices.filter((inv) => inv.customerId === viewingCustomer.id && !inv.isDeleted)}
            payments={payments.filter((p) => p.customerId === viewingCustomer.id)}
            onClose={() => setViewingCustomer(null)}
            onUpdateCustomer={updateCustomer}
            t={t}
            formatNumber={formatNumber}
          />
        )}

        <DeleteConfirmDialog
          isOpen={!!deleteConfirm}
          itemName={deleteConfirm?.itemName ?? ""}
          onConfirm={() => { const cb = deleteConfirm?.onConfirm; setDeleteConfirm(null); if (cb) cb(); }}
          onCancel={() => setDeleteConfirm(null)}
        />
      </Stack>
    </Container>
  );
}

function CustomerViewModal({ customer, balance, invoices, payments, onClose, onUpdateCustomer, t, formatNumber }: {
  customer: Customer;
  balance: number;
  invoices: Invoice[];
  payments: Payment[];
  onClose: () => void;
  onUpdateCustomer: (c: Customer) => void;
  t: typeof import("../i18n/translations").translations.en;
  formatNumber: (n: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"info" | "policy">("info");

  // Policy form state
  const [policyReturn, setPolicyReturn] = useState(customer.returnPolicy ?? "");
  const [policyDays, setPolicyDays] = useState<number>(customer.returnDays ?? 14);
  const [policySaved, setPolicySaved] = useState(false);

  function handleSavePolicy() {
    onUpdateCustomer({ ...customer, returnPolicy: policyReturn, returnDays: policyDays });
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2200);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const status = customer.status ?? "active";
  const statusNorm = (["active", "inactive", "archived"] as const).includes(status as "active" | "inactive" | "archived")
    ? (status as "active" | "inactive" | "archived")
    : "active";
  const invTotal = invoices.reduce((s, i) => s + Number(i.amount ?? i.total ?? 0), 0);
  const payTotal = payments.reduce((s, p) => s + Number(p.amount ?? 0), 0);

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} ref={ref} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <h2 className={styles.modalTitle}>{customer.name}</h2>
            <span className={styles.modalCode}>{customer.code ?? customer.id}</span>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Badge row */}
        <div className={styles.modalBadgeRow}>
          {customer.type && <span className={`${styles.modalBadge} ${styles.modalBadgeInfo}`}>{TYPE_LABELS[customer.type]}</span>}
          {customer.classification && <span className={`${styles.modalBadge} ${customer.classification === "vip" ? styles.modalBadgeWarning : customer.classification === "risk" ? styles.modalBadgeDanger : styles.modalBadgeNeutral}`}>{CLASSIFICATION_LABELS[customer.classification]}</span>}
          <span className={`${styles.modalBadge} ${statusNorm === "active" ? styles.modalBadgeSuccess : statusNorm === "inactive" ? styles.modalBadgeNeutral : styles.modalBadgeDanger}`}>{t.customers.status[statusNorm]}</span>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2, padding: 4, background: "#F1F5F9", borderRadius: 10, margin: "4px 0 8px" }}>
          {(["info", "policy"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, height: 34, border: "none", borderRadius: 7,
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#1E40AF" : "#64748B",
                fontSize: 13, fontWeight: activeTab === tab ? 600 : 500,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.09)" : "none",
                transition: "all 180ms ease",
              }}
            >
              {tab === "info" ? "معلومات العميل" : "السياسة"}
            </button>
          ))}
        </div>

        {activeTab === "info" && (
        <>
        {/* Info grid */}
        <div className={styles.modalGrid}>
          <div className={styles.modalCol}>
            <InfoRow label="الهاتف" value={customer.phone} />
            <InfoRow label="البريد" value={customer.email ?? "—"} />
            <InfoRow label="المحافظة" value={customer.governorate ?? "—"} />
            <InfoRow label="المدينة" value={customer.city ?? "—"} />
          </div>
          <div className={styles.modalCol}>
            <InfoRow label="تاريخ التسجيل" value={customer.joinedAt ? new Date(customer.joinedAt).toLocaleDateString("ar-u-nu-latn") : "—"} />
            <InfoRow label="آخر طلب" value={customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString("ar-u-nu-latn") : "—"} />
            <InfoRow label="مندوب المبيعات" value={customer.salesRep ?? "—"} />
          </div>
        </div>

        {/* Financial summary */}
        <div className={styles.modalFinanceRow}>
          <FinanceBox label="حد الائتمان" value={customer.creditLimit ? `${formatNumber(customer.creditLimit)} ${customer.currency ?? "ILS"}` : "—"} />
          <FinanceBox label="الرصيد المستحق" value={`${formatNumber(balance)} ${customer.currency ?? "ILS"}`} tone={balance > 0 ? "danger" : "neutral"} />
          <FinanceBox label="إجمالي الفواتير" value={`${formatNumber(invTotal)} ${customer.currency ?? "ILS"}`} />
          <FinanceBox label="إجمالي المدفوعات" value={`${formatNumber(payTotal)} ${customer.currency ?? "ILS"}`} tone="success" />
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>الفواتير ({invoices.length})</h3>
            <div className={styles.modalTableWrap}>
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>المتبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((inv) => (
                    <tr key={inv.id}>
                      <td className={styles.modalDate}>{new Date(inv.date).toLocaleDateString("ar-u-nu-latn")}</td>
                      <td className={styles.modalNum}>{formatNumber(Number(inv.amount ?? inv.total ?? 0))}</td>
                      <td><span className={`${styles.modalStatus} ${inv.status === "Paid" ? styles.modalStatusPaid : inv.status === "Pending" ? styles.modalStatusPending : inv.status === "Partial" ? styles.modalStatusPartial : styles.modalStatusDebit}`}>{inv.status}</span></td>
                      <td className={styles.modalNum}>{inv.remainingAmount != null && inv.remainingAmount > 0 ? formatNumber(inv.remainingAmount) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments */}
        {payments.length > 0 && (
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>المدفوعات ({payments.length})</h3>
            <div className={styles.modalTableWrap}>
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>طريقة الدفع</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p) => (
                    <tr key={p.id}>
                      <td className={styles.modalDate}>{new Date(p.date).toLocaleDateString("ar-u-nu-latn")}</td>
                      <td className={styles.modalNum}>{formatNumber(p.amount)}</td>
                      <td>{p.method ?? "—"}</td>
                      <td><span className={`${styles.modalStatus} ${p.status === "Completed" || p.status === "Paid" ? styles.modalStatusPaid : p.status === "Pending" ? styles.modalStatusPending : styles.modalStatusDebit}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}

        {activeTab === "policy" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 4 }}>
            {/* Return window */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block" }}>
                مدة الإرجاع المسموح بها (أيام)
              </label>
              <input
                type="number"
                min={0}
                max={365}
                value={policyDays}
                onChange={(e) => setPolicyDays(Math.max(0, Number(e.target.value)))}
                style={{
                  width: 120, height: 40, padding: "0 12px", border: "1px solid #E2E8F0",
                  borderRadius: 8, fontSize: 13.5, color: "#0F172A", background: "#fff",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Return policy text */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", display: "block" }}>
                شروط وأحكام الإرجاع
              </label>
              <textarea
                value={policyReturn}
                onChange={(e) => setPolicyReturn(e.target.value)}
                placeholder="مثال: يُقبل الإرجاع للبضائع غير المفتوحة خلال المدة المحددة..."
                rows={4}
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #E2E8F0",
                  borderRadius: 8, fontSize: 13.5, color: "#0F172A", background: "#fff",
                  outline: "none", fontFamily: "inherit", resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={handleSavePolicy}
                style={{
                  height: 40, padding: "0 22px", borderRadius: 9, border: "none",
                  background: "#2563EB", color: "#fff", fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1D4ED8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#2563EB"; }}
              >
                حفظ السياسة
              </button>
              {policySaved && (
                <span style={{ fontSize: 13, color: "#16A34A", fontWeight: 600 }}>✓ تم الحفظ</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

function FinanceBox({ label, value, tone }: { label: string; value: string; tone?: "neutral" | "danger" | "success" }) {
  return (
    <div className={`${styles.financeBox} ${tone === "danger" ? styles.financeBoxDanger : tone === "success" ? styles.financeBoxSuccess : ""}`}>
      <span className={styles.financeLabel}>{label}</span>
      <strong className={styles.financeValue}>{value}</strong>
    </div>
  );
}

function StatCard({ label, value, icon, tone, active, onClick, delay }: { label: string; value: number; icon: React.ReactNode; tone: "blue" | "green" | "amber" | "purple"; active?: boolean; onClick?: () => void; delay: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const { formatNumber } = useSettings();

  useEffect(() => {
    let startTime: number | null = null;
    const end = value;
    const duration = 600;

    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <button
      type="button"
      className={`${styles.statCard} ${styles[`statCard_${tone}`]} ${active ? styles.statCardActive : ""}`}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`${styles.statCardIcon} ${styles[`statCardIcon_${tone}`]}`}>{icon}</span>
      <span className={styles.statCardLabel}>{label}</span>
      <strong className={styles.statCardValue}>{formatNumber(displayValue)}</strong>
    </button>
  );
}

const TYPE_BADGE: Record<string, "info" | "success" | "neutral"> = {
  company: "info",
  institution: "success",
  individual: "neutral",
};

function CustomerRow({
  c,
  liveLastOrder,
  onView,
  onEdit,
  onDelete,
  onRowClick,
}: {
  c: Customer;
  liveLastOrder?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRowClick: () => void;
}) {
  const { t } = useSettings();
  const status = c.status ?? "active";
  const statusNorm = (["active", "inactive", "archived"] as const).includes(
    status as "active" | "inactive" | "archived"
  )
    ? (status as "active" | "inactive" | "archived")
    : "active";


  return (
    <tr className={styles.customerRow} onClick={onRowClick}>
      <td className={styles.nameTd}>
        <div className={styles.identCell}>
          <Avatar
            name={c.name}
            size="sm"
            tone={c.classification === "vip" ? "accent" : "neutral"}
          />
          <div className={styles.identText}>
            <button type="button" className={styles.nameLink} onClick={(e) => { e.stopPropagation(); onView(); }}>{c.name}</button>
            <span>{c.code ?? c.id}</span>
            {c.phone && <span className={styles.identPhone}>{c.phone}</span>}
          </div>
          {c.classification === "vip" && <Badge variant="warning" size="sm">VIP</Badge>}
          {c.classification === "risk" && <Badge variant="danger" size="sm">{t.customers.filters.risk}</Badge>}
        </div>
      </td>
      <td className={styles.typeTd}>
        {c.type ? (
          <Badge variant={TYPE_BADGE[c.type] ?? "neutral"} size="sm">
            {TYPE_LABELS[c.type]}
          </Badge>
        ) : (
          <span className={styles.zeroBalance}>—</span>
        )}
      </td>
      <td className={styles.locTd}>
        <span>{c.governorate || c.city || "—"}</span>
        {c.governorate && c.city && <span className={styles.locSub}>{c.city}</span>}
      </td>
      <td className={styles.timeCell}>
        {(liveLastOrder ?? c.lastOrderDate) ? relativeDate((liveLastOrder ?? c.lastOrderDate)!) : c.joinedAt ? relativeDate(c.joinedAt) : "—"}
      </td>
      <td>
        <span className={`${styles.statusPill} ${styles[`statusPill_${statusNorm}`]}`}>
          {t.customers.status[statusNorm]}
        </span>
      </td>
      <td className={styles.actionsCell}>
        <TableActions
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
