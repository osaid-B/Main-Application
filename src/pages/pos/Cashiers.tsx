import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import {
  POS_CASHIERS as INITIAL_CASHIERS,
  type PosCashier,
  type CashierStatus,
  type CashierShift,
} from "../../data/posMock";
import styles from "./Cashiers.module.css";

const STATUS_VARIANT: Record<CashierStatus, "success" | "neutral" | "warning"> = {
  active:     "success",
  inactive:   "neutral",
  "on-break": "warning",
};

export default function Cashiers() {
  const { t, formatCurrency } = useSettings();
  const tc = t.pos.cashiers;

  const [cashiers, setCashiers] = useState<PosCashier[]>(INITIAL_CASHIERS);
  const [query,    setQuery]    = useState("");
  const [editing,  setEditing]  = useState<PosCashier | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const filtered = useMemo(() =>
    cashiers.filter((c) => {
      if (!c.isDeleted && query) {
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      }
      return !c.isDeleted;
    }),
  [cashiers, query]);

  const activeCashiers = cashiers.filter((c) => !c.isDeleted);
  const activeCount    = activeCashiers.filter((c) => c.status === "active").length;
  const todaySalesSum  = activeCashiers.reduce((s, c) => s + c.todaySales, 0);
  const txCount        = activeCashiers.reduce((s, c) => s + c.transactions, 0);
  const topPerformer   = [...activeCashiers].sort((a, b) => b.todaySales - a.todaySales)[0];
  const avgTx          = activeCashiers.length > 0
    ? (txCount / activeCashiers.length).toFixed(1)
    : "0";

  function toggleStatus(id: string) {
    const cashier = cashiers.find((c) => c.id === id);
    if (!cashier) return;
    if (cashier.status === "active") {
      const confirmed = window.confirm(tc.actions.confirmDeactivate);
      if (!confirmed) return;
    }
    setCashiers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next: CashierStatus = c.status === "active" ? "inactive" : "active";
        return { ...c, status: next };
      }),
    );
  }

  function saveCashier(data: Omit<PosCashier, "id" | "todaySales" | "transactions" | "lastActive" | "isDeleted">) {
    if (editing) {
      setCashiers((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)));
      setEditing(null);
    } else {
      const id = `CSH-${String(cashiers.length + 1).padStart(2, "0")}`;
      setCashiers((prev) => [
        ...prev,
        { ...data, id, todaySales: 0, transactions: 0, lastActive: new Date().toISOString() },
      ]);
      setIsAdding(false);
    }
  }

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAdding(true)}>
            {tc.addCashier}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.active}       value={String(activeCount)}           tone="success" sub={tc.kpi.activeSub} />
          <Kpi label={tc.kpi.salesTotal}   value={formatCurrency(todaySalesSum)} tone="info"    sub={tc.kpi.salesTotalSub} />
          <Kpi label={tc.kpi.topPerformer} value={topPerformer?.name ?? "—"}     tone="warning" sub={topPerformer ? formatCurrency(topPerformer.todaySales) : ""} />
          <Kpi label={tc.kpi.avgTx}        value={avgTx}                         tone="success" sub={tc.kpi.avgTxSub} />
        </Grid>

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Input
              variant="search"
              placeholder={tc.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.cashier}</th>
                <th>{tc.cols.code}</th>
                <th>{tc.cols.status}</th>
                <th>{tc.cols.shift}</th>
                <th className={styles.numEnd}>{tc.cols.todaySales}</th>
                <th className={styles.numEnd}>{tc.cols.transactions}</th>
                <th>{tc.cols.lastActive}</th>
                <th>{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.cashierCell}>
                      <Avatar name={c.name} size="sm" tone="accent" />
                      <span className={styles.cashierName}>{c.name}</span>
                    </div>
                  </td>
                  <td><span className={styles.mono}>{c.code}</span></td>
                  <td>
                    <Badge variant={STATUS_VARIANT[c.status]} size="sm">
                      {tc.status[c.status === "on-break" ? "onBreak" : c.status]}
                    </Badge>
                  </td>
                  <td>{tc.shift[c.shift]}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(c.todaySales)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{c.transactions}</td>
                  <td className={styles.mono}>{new Date(c.lastActive).toLocaleDateString()}</td>
                  <td>
                    <OverflowMenu
                      onEdit={() => setEditing(c)}
                      onToggle={() => toggleStatus(c.id)}
                      isActive={c.status === "active"}
                      tc={tc}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.empty}>{tc.noCashiers}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>

      {(isAdding || editing !== null) && (
        <CashierFormModal
          initial={editing ?? undefined}
          onSave={saveCashier}
          onClose={() => { setIsAdding(false); setEditing(null); }}
        />
      )}
    </Container>
  );
}

function OverflowMenu({
  onEdit,
  onToggle,
  isActive,
  tc,
}: {
  onEdit: () => void;
  onToggle: () => void;
  isActive: boolean;
  tc: { actions: { edit: string; deactivate: string; activate: string } };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={styles.menuWrap} ref={ref}>
      <button
        type="button"
        className={styles.menuTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        ···
      </button>
      {open && (
        <div className={styles.menuPopup} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => { setOpen(false); onEdit(); }}
          >
            {tc.actions.edit}
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${styles.menuItem} ${isActive ? styles.menuItemDanger : ""}`}
            onClick={() => { setOpen(false); onToggle(); }}
          >
            {isActive ? tc.actions.deactivate : tc.actions.activate}
          </button>
        </div>
      )}
    </div>
  );
}

function CashierFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: PosCashier;
  onSave: (data: Omit<PosCashier, "id" | "todaySales" | "transactions" | "lastActive" | "isDeleted">) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const tc = t.pos.cashiers;

  const [name,   setName]   = useState(initial?.name   ?? "");
  const [code,   setCode]   = useState(initial?.code   ?? "");
  const [pin,    setPin]    = useState(initial?.pin    ?? "");
  const [shift,  setShift]  = useState<CashierShift>(initial?.shift  ?? "morning");
  const [status, setStatus] = useState<CashierStatus>(initial?.status ?? "active");

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      code: code.trim() || name.trim().toUpperCase().slice(0, 6),
      pin: pin.trim() || undefined,
      shift,
      status,
    });
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={initial ? tc.form.editTitle : tc.form.createTitle}
      size="sm"
      footer={
        <div className={styles.formFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {initial ? t.common.saveChanges : tc.addCashier}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <Input label={tc.form.name} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Ahmad Qasim" />
        <Input label={tc.form.code} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CSH-06" />
        <Input label={tc.form.pin} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" variant="password" />
        <div className={styles.formRow}>
          <div>
            <label className={styles.formLabel}>{tc.form.shift}</label>
            <select className={styles.formSelect} value={shift} onChange={(e) => setShift(e.target.value as CashierShift)}>
              <option value="morning">{tc.shift.morning}</option>
              <option value="afternoon">{tc.shift.afternoon}</option>
              <option value="evening">{tc.shift.evening}</option>
            </select>
          </div>
          <div>
            <label className={styles.formLabel}>{tc.form.status}</label>
            <select className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value as CashierStatus)}>
              <option value="active">{tc.status.active}</option>
              <option value="inactive">{tc.status.inactive}</option>
              <option value="on-break">{tc.status.onBreak}</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "success" | "info" | "warning" | "danger" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span className={styles.kpiSub}>{sub}</span>
    </article>
  );
}
