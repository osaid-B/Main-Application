import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Download, Eye, Filter, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import {
  CLASSIFICATION_LABELS,
  PAYMENT_TERMS_LABELS,
  TYPE_LABELS,
} from "../data/customersMock";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import type { Customer } from "../data/types";
import styles from "./Customers.module.css";

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهور`;
}

function formatBalance(n: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + " " + currency;
}

export default function Customers() {
  const navigate = useNavigate();
  const { customers, deleteCustomer, customerBalanceMap, customerLastOrderMap } = useData();
  const { t } = useSettings();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const active = useMemo(
    () => customers.filter((c) => !c.isDeleted),
    [customers]
  );

  const filtered = useMemo(() => {
    return active.filter((c) => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (classFilter && c.classification !== classFilter) return false;
      if (statusFilter && (c.status ?? "active") !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.code?.toLowerCase().includes(q) ?? false) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [active, query, typeFilter, classFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: active.length,
    vip: active.filter((c) => c.classification === "vip").length,
    active: active.filter((c) => (c.status ?? "active") === "active").length,
    withBalance: active.filter((c) => (customerBalanceMap.get(c.id) ?? c.outstandingBalance ?? 0) > 0).length,
  }), [active, customerBalanceMap]);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {t.customers.pageTitle} <span className={styles.titleCount}>· {stats.total.toLocaleString()}</span>
            </h1>
            <p className={styles.subtitle}>{t.customers.pageSubtitle}</p>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" leftIcon={<Filter size={14} />} onClick={() => setShowFilters((v) => !v)}>{t.customers.filter}</Button>
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
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate("/customers/new")}>
              {t.customers.addCustomer}
            </Button>
          </div>
        </header>

        {/* Quick stats */}
        <div className={styles.statsRow}>
          <StatPill label={t.customers.stats.total}       value={stats.total.toLocaleString()} tone="default" />
          <StatPill label={t.customers.stats.vip}         value={String(stats.vip)}            tone="warning" />
          <StatPill label={t.customers.stats.active}      value={String(stats.active)}         tone="success" />
          <StatPill label={t.customers.stats.withBalance} value={String(stats.withBalance)}    tone="info" />
        </div>

        {/* Filters bar */}
        {showFilters && <div className={styles.filters}>
          <Input
            variant="search"
            placeholder={t.customers.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={14} />}
            fullWidth
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            placeholder={t.customers.filters.allTypes}
            options={[
              { value: "",            label: t.customers.filters.allTypes },
              { value: "individual",  label: TYPE_LABELS.individual },
              { value: "company",     label: TYPE_LABELS.company },
              { value: "institution", label: TYPE_LABELS.institution },
            ]}
          />
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            placeholder={t.customers.filters.allClassifications}
            options={[
              { value: "",         label: t.customers.filters.allClassifications },
              { value: "standard", label: CLASSIFICATION_LABELS.standard },
              { value: "vip",      label: CLASSIFICATION_LABELS.vip },
              { value: "risk",     label: CLASSIFICATION_LABELS.risk },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder={t.customers.filters.allStatuses}
            options={[
              { value: "",         label: t.customers.filters.allStatuses },
              { value: "active",   label: t.customers.filters.active },
              { value: "inactive", label: t.customers.filters.inactive },
              { value: "archived", label: t.customers.filters.archived },
            ]}
          />
        </div>}

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.customers.cols.customer}</th>
                <th>{t.customers.cols.type}</th>
                <th>{t.customers.cols.city}</th>
                <th>{t.customers.cols.paymentTerms}</th>
                <th>{t.customers.cols.balance}</th>
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
                  liveBalance={customerBalanceMap.get(c.id)}
                  liveLastOrder={customerLastOrderMap.get(c.id)}
                  onView={() => navigate(`/customers/${c.id}`)}
                  onEdit={() => navigate(`/customers/${c.id}/edit`)}
                  onDelete={() => deleteCustomer(c.id)}
                  onLoyalty={() => navigate(`/pos/loyalty/profile?id=${c.id}`)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.empty}>{t.customers.empty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <span>{t.customers.showing} {filtered.length} {t.customers.of} {stats.total.toLocaleString()}</span>
        </footer>
      </Stack>
    </Container>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string; tone: "default" | "success" | "warning" | "info" }) {
  return (
    <div className={`${styles.statPill} ${styles[`tone_${tone}`]}`}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
    </div>
  );
}

function CustomerRow({
  c,
  liveBalance,
  liveLastOrder,
  onView,
  onEdit,
  onDelete,
  onLoyalty,
}: {
  c: Customer;
  liveBalance?: number;
  liveLastOrder?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLoyalty: () => void;
}) {
  const { t } = useSettings();
  const status = c.status ?? "active";
  const statusNorm = (["active", "inactive", "archived"] as const).includes(
    status as "active" | "inactive" | "archived"
  )
    ? (status as "active" | "inactive" | "archived")
    : "active";
  const statusColor = statusNorm === "active" ? "green" : statusNorm === "inactive" ? "gray" : "red";
  const balance = liveBalance ?? c.outstandingBalance ?? 0;
  const limit = c.creditLimit ?? 0;
  const balanceTone = balance > limit * 0.7 ? "danger" : balance > 0 ? "warning" : "neutral";
  const alerts = c.alerts ?? [];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (!menuWrapRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const typeBadgeVariant =
    c.type === "company" ? "info" : c.type === "institution" ? "success" : "neutral";

  return (
    <tr>
      <td>
        <div className={styles.identCell}>
          <Avatar
            name={c.name}
            size="sm"
            tone={c.classification === "vip" ? "accent" : "neutral"}
          />
          <div className={styles.identText}>
            <button type="button" className={styles.nameLink} onClick={onView}>{c.name}</button>
            <span>{c.code ?? c.id}</span>
          </div>
          {c.classification === "vip" && <Badge variant="warning" size="sm">VIP</Badge>}
          {c.classification === "risk" && <Badge variant="danger" size="sm">{t.customers.filters.risk}</Badge>}
        </div>
      </td>
      <td>
        {c.type ? (
          <Badge variant={typeBadgeVariant} size="sm">
            {TYPE_LABELS[c.type]}
          </Badge>
        ) : (
          <span className={styles.zeroBalance}>—</span>
        )}
      </td>
      <td>
        <div className={styles.locCell}>
          <strong>{c.city ?? "—"}</strong>
          <span>{c.governorate ?? ""}</span>
        </div>
      </td>
      <td>{c.paymentTerms ? PAYMENT_TERMS_LABELS[c.paymentTerms] : <span className={styles.zeroBalance}>—</span>}</td>
      <td>
        <span className={`${styles.balance} ${styles[`bal_${balanceTone}`]}`}>
          {balance > 0
            ? formatBalance(balance, c.currency ?? "ILS")
            : <span className={styles.zeroBalance}>—</span>}
          {alerts.length > 0 && <AlertTriangle size={12} className={styles.alertIcon} aria-hidden />}
        </span>
      </td>
      <td className={styles.timeCell}>
        {(liveLastOrder ?? c.lastOrderDate) ? relativeDate((liveLastOrder ?? c.lastOrderDate)!) : c.joinedAt ? relativeDate(c.joinedAt) : "—"}
      </td>
      <td>
        <span className={`${styles.statusPill} ${styles[`statusPill_${statusNorm}`]}`}>
          <span className={`status-dot status-dot--${statusColor}`} aria-hidden />
          {t.customers.status[statusNorm]}
        </span>
      </td>
      <td className={styles.actionsCell}>
        <div ref={menuWrapRef} className={styles.menuWrap}>
          <Button
            variant="icon"
            size="sm"
            aria-label={t.customers.ariaMore}
            aria-expanded={menuOpen}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <MoreHorizontal size={14} />
          </Button>
          {menuOpen && (
            <div className={styles.rowMenu} role="menu">
              <button
                type="button"
                className={styles.rowMenuItem}
                role="menuitem"
                onClick={() => { setMenuOpen(false); onView(); }}
              >
                <Eye size={12} aria-hidden /> {t.customers.rowMenu.view}
              </button>
              <button
                type="button"
                className={styles.rowMenuItem}
                role="menuitem"
                onClick={() => { setMenuOpen(false); onEdit(); }}
              >
                <Pencil size={12} aria-hidden /> {t.customers.rowMenu.edit}
              </button>
              <button
                type="button"
                className={styles.rowMenuItem}
                role="menuitem"
                onClick={() => { setMenuOpen(false); onLoyalty(); }}
              >
                {t.customers.rowMenu.loyalty ?? "ملف الولاء"}
              </button>
              <button
                type="button"
                className={`${styles.rowMenuItem} ${styles.rowMenuItemDanger}`}
                role="menuitem"
                onClick={() => { setMenuOpen(false); onDelete(); }}
              >
                <Trash2 size={12} aria-hidden /> {t.customers.rowMenu.delete}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
