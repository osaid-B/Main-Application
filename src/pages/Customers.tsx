import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Download, Filter, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import {
  CLASSIFICATION_LABELS,
  CUSTOMERS_TOTAL,
  MOCK_CUSTOMERS,
  PAYMENT_TERMS_LABELS,
  TYPE_LABELS,
  type MockCustomer,
} from "../data/customersMock";
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
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return MOCK_CUSTOMERS.filter((c) => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (classFilter && c.classification !== classFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [query, typeFilter, classFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: CUSTOMERS_TOTAL,
    vip: MOCK_CUSTOMERS.filter((c) => c.classification === "vip").length,
    active: MOCK_CUSTOMERS.filter((c) => c.status === "active").length,
    withBalance: MOCK_CUSTOMERS.filter((c) => c.outstandingBalance > 0).length,
  }), []);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Customers <span className={styles.titleCount}>· {stats.total.toLocaleString()}</span>
            </h1>
            <p className={styles.subtitle}>
              All customer accounts across workspaces · classifications, balances, and recent activity.
            </p>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" leftIcon={<Filter size={14} />}>Filter</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>Export</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => navigate("/customers/new")}>
              Add customer
            </Button>
          </div>
        </header>

        {/* Quick stats */}
        <div className={styles.statsRow}>
          <StatPill label="TOTAL"        value={stats.total.toLocaleString()} tone="default" />
          <StatPill label="VIP"          value={String(stats.vip)}            tone="warning" />
          <StatPill label="ACTIVE"       value={String(stats.active)}         tone="success" />
          <StatPill label="WITH BALANCE" value={String(stats.withBalance)}    tone="info" />
        </div>

        {/* Filters bar */}
        <div className={styles.filters}>
          <Input
            variant="search"
            placeholder="Search by name, code, phone, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={14} />}
            fullWidth
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            placeholder="All types"
            options={[
              { value: "",            label: "All types" },
              { value: "individual",  label: TYPE_LABELS.individual },
              { value: "company",     label: TYPE_LABELS.company },
              { value: "institution", label: TYPE_LABELS.institution },
            ]}
          />
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            placeholder="All classifications"
            options={[
              { value: "",         label: "All classifications" },
              { value: "standard", label: CLASSIFICATION_LABELS.standard },
              { value: "vip",      label: CLASSIFICATION_LABELS.vip },
              { value: "risk",     label: CLASSIFICATION_LABELS.risk },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All statuses"
            options={[
              { value: "",         label: "All statuses" },
              { value: "active",   label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "archived", label: "Archived" },
            ]}
          />
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>العميل</th>
                <th>النوع</th>
                <th>المدينة</th>
                <th>شروط الدفع</th>
                <th>الرصيد</th>
                <th>آخر طلب</th>
                <th>الحالة</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <CustomerRow key={c.id} c={c} onView={() => navigate(`/customers/${c.id}`)} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.empty}>No customers match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <span>Showing {filtered.length} of {stats.total.toLocaleString()}</span>
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

function CustomerRow({ c, onView }: { c: MockCustomer; onView: () => void }) {
  const statusColor = c.status === "active" ? "green" : c.status === "inactive" ? "gray" : "red";
  const balanceTone = c.outstandingBalance > c.creditLimit * 0.7 ? "danger" : c.outstandingBalance > 0 ? "warning" : "neutral";

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
            <span>{c.code}</span>
          </div>
          {c.classification === "vip" && <Badge variant="warning" size="sm">VIP</Badge>}
          {c.classification === "risk" && <Badge variant="danger" size="sm">مخاطر</Badge>}
        </div>
      </td>
      <td><Badge variant="neutral" size="sm">{TYPE_LABELS[c.type]}</Badge></td>
      <td>
        <div className={styles.locCell}>
          <strong>{c.city}</strong>
          <span>{c.governorate}</span>
        </div>
      </td>
      <td>{PAYMENT_TERMS_LABELS[c.paymentTerms]}</td>
      <td>
        <span className={`${styles.balance} ${styles[`bal_${balanceTone}`]}`}>
          {c.outstandingBalance > 0
            ? formatBalance(c.outstandingBalance, c.currency)
            : <span className={styles.zeroBalance}>—</span>}
          {c.alerts.length > 0 && <AlertTriangle size={12} className={styles.alertIcon} aria-hidden />}
        </span>
      </td>
      <td className={styles.timeCell}>{relativeDate(c.lastOrderDate)}</td>
      <td>
        <span className={styles.statusCell}>
          <span className={`status-dot status-dot--${statusColor}`} aria-hidden />
          <span>{c.status === "active" ? "نشط" : c.status === "inactive" ? "غير نشط" : "مؤرشف"}</span>
        </span>
      </td>
      <td>
        <Button variant="icon" size="sm" aria-label="More actions">
          <MoreHorizontal size={14} />
        </Button>
      </td>
    </tr>
  );
}
