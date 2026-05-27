import { useState } from "react";
import { Plus, Search, Receipt } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Grid } from "../components/layout/Grid";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import TableFooter from "../components/ui/TableFooter";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useLoadingDelay } from "../hooks/useLoadingDelay";
import { EXPENSE_CATEGORIES } from "../data/expensesMock";
import { type Expense, type ExpenseStatus } from "../data/types";
import styles from "./Expenses.module.css";

type StepId = 1 | 2 | 3;

const STATUS_VARIANT: Record<ExpenseStatus, "success" | "warning" | "danger" | "neutral"> = {
  approved: "success",
  pending:  "warning",
  rejected: "danger",
};

export default function Expenses() {
  const { t, formatCurrency } = useSettings();
  const tc = t.expenses;

  const { expenses, addExpense, updateExpense, deleteExpense: deleteExpenseCtx } = useData();
  const isLoading = useLoadingDelay();
  const [query, setQuery]                 = useState("");
  const [filterCat, setFilterCat]         = useState("");
  const [filterStatus, setFilterStatus]   = useState<ExpenseStatus | "">("");
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding]           = useState(false);
  const [editing, setEditing]             = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<string | null>(null);
  const [page, setPage]                   = useState(0);
  const PAGE_SIZE = 15;

  const filtered = expenses.filter((e) => {
    if (filterCat && e.category !== filterCat) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !(e.description ?? "").toLowerCase().includes(q) &&
        !(e.payee ?? e.vendor ?? "").toLowerCase().includes(q) &&
        !e.category.toLowerCase().includes(q)
      ) return false;
    }
    return !e.isDeleted;
  });

  /* KPIs */
  const allActive    = expenses.filter((e) => !e.isDeleted);
  const totalAll     = allActive.reduce((s, e) => s + e.amount, 0);
  const juneCurrent  = allActive.filter((e) => e.date.startsWith("2026-06"));
  const totalMonth   = juneCurrent.reduce((s, e) => s + e.amount, 0);
  const totalPending = allActive.filter((e) => e.status === "pending").length;
  const avgTicket    = allActive.length > 0 ? totalAll / allActive.length : 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.id)));
    }
  }

  function bulkApprove() {
    expenses
      .filter((e) => selected.has(e.id) && e.status === "pending")
      .forEach((e) => updateExpense({ ...e, status: "approved" as ExpenseStatus }));
    setSelected(new Set());
  }

  function deleteExpense(id: string) {
    setDeleteTarget(id);
  }

  function confirmDeleteExpense() {
    if (!deleteTarget) return;
    deleteExpenseCtx(deleteTarget);
    setDeleteTarget(null);
  }

  const pagedRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function saveExpense(data: Omit<Expense, "id">) {
    if (editing) {
      updateExpense({ ...editing, ...data });
      setEditing(null);
    } else {
      const id = `EX-${Date.now().toString().slice(-6)}`;
      addExpense({ ...data, id });
      setIsAdding(false);
    }
  }

  const pendingSelected = filtered.filter((e) => selected.has(e.id) && e.status === "pending").length;

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAdding(true)}>
            {tc.addExpense}
          </Button>
        </header>

        {/* KPIs */}
        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.total}     value={formatCurrency(totalAll)}   sub={tc.kpi.totalSub}     tone="info"    />
          <Kpi label={tc.kpi.thisMonth} value={formatCurrency(totalMonth)} sub={tc.kpi.thisMonthSub} tone="warning" />
          <Kpi label={tc.kpi.pending}   value={String(totalPending)}        sub={tc.kpi.pendingSub}   tone="neutral" />
          <Kpi label={tc.kpi.avgTicket} value={formatCurrency(avgTicket)}  sub={tc.kpi.avgTicketSub} tone="success" />
        </Grid>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Input
              variant="search"
              placeholder={tc.filters.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              fullWidth
            />
          </div>
          <select
            className={styles.filterSelect}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">{tc.filters.allCategories}</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ExpenseStatus | "")}
          >
            <option value="">{tc.filters.allStatuses}</option>
            <option value="approved">{tc.status.approved}</option>
            <option value="pending">{tc.status.pending}</option>
            <option value="rejected">{tc.status.rejected}</option>
          </select>
          {pendingSelected > 0 && (
            <Button variant="primary" size="sm" onClick={bulkApprove}>
              {tc.bulkApprove} ({pendingSelected})
            </Button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <Skeleton variant="rect" height={300} />
        ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>{tc.cols.description}</th>
                <th>{tc.cols.category}</th>
                <th>{tc.cols.payee}</th>
                <th>{tc.cols.date}</th>
                <th className={styles.numEnd}>{tc.cols.amount}</th>
                <th>{tc.cols.status}</th>
                <th>{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((expense) => (
                <tr key={expense.id} className={selected.has(expense.id) ? styles.rowSelected : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(expense.id)}
                      onChange={() => toggleSelect(expense.id)}
                    />
                  </td>
                  <td>
                    <div className={styles.descCell}>
                      <span className={styles.descText}>{expense.description ?? expense.notes ?? "—"}</span>
                      <span className={styles.expenseId}>{expense.id}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.catTag}>{expense.category}</span>
                  </td>
                  <td className={styles.payeeCell}>{expense.payee ?? expense.vendor ?? "—"}</td>
                  <td className={styles.mono}>{expense.date}</td>
                  <td className={`${styles.numEnd} ${styles.mono} ${styles.amountCell}`}>
                    {formatCurrency(expense.amount)}
                  </td>
                  <td>
                    <Badge
                      variant={STATUS_VARIANT[expense.status ?? "pending"]}
                      size="sm"
                    >
                      {tc.status[expense.status ?? "pending"]}
                    </Badge>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setEditing(expense)}
                      >
                        {t.common.edit}
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => deleteExpense(expense.id)}
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={8}><EmptyState icon={<Receipt size={28} />} title={tc.noExpenses} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
        <TableFooter
          total={filtered.length}
          page={page}
          rowsPerPage={PAGE_SIZE}
          onRowsPerPageChange={() => setPage(0)}
          onPageChange={setPage}
        />
      </Stack>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => setDeleteTarget(null)}
          title={t.common.confirmDelete}
          size="sm"
          footer={
            <div className={styles.confirmFooter}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</Button>
              <Button variant="primary" onClick={confirmDeleteExpense}>{t.common.delete}</Button>
            </div>
          }
        >
          <p className={styles.confirmMsg}>{tc.confirmDelete}</p>
        </Modal>
      )}

      {/* Add / Edit modal (multi-step) */}
      {(isAdding || editing !== null) && (
        <ExpenseFormModal
          initial={editing ?? undefined}
          onSave={saveExpense}
          onClose={() => { setIsAdding(false); setEditing(null); }}
        />
      )}
    </Container>
  );
}

/* ─────────────────── Multi-step modal ─────────────────── */

function ExpenseFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Expense;
  onSave: (data: Omit<Expense, "id">) => void;
  onClose: () => void;
}) {
  const { t, formatCurrency } = useSettings();
  const tc = t.expenses;

  const [step, setStep] = useState<StepId>(1);

  // Step 1 fields
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category,    setCategory]    = useState(initial?.category    ?? "");
  const [amount,      setAmount]      = useState(String(initial?.amount ?? ""));
  const [date,        setDate]        = useState(initial?.date         ?? "");

  // Step 2 fields
  const [payee,  setPayee]  = useState(initial?.payee ?? initial?.vendor ?? "");
  const [notes,  setNotes]  = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<ExpenseStatus>(initial?.status ?? "pending");

  const canStep1 = description.trim() && category && amount && date;
  const canStep2 = true; // payee & notes optional

  function handleSubmit() {
    onSave({
      description: description.trim(),
      category,
      amount: parseFloat(amount) || 0,
      date,
      payee: payee.trim() || undefined,
      vendor: payee.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      currency: "ILS",
      paymentMethod: "bank",
    });
  }

  const STEPS = [tc.form.step1, tc.form.step2, tc.form.step3];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={initial ? tc.form.editTitle : tc.form.createTitle}
      size="sm"
      footer={
        <div className={styles.modalFooter}>
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as StepId)}>
              {t.common.back}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          {step < 3 ? (
            <Button
              variant="primary"
              disabled={step === 1 ? !canStep1 : !canStep2}
              onClick={() => setStep((s) => (s + 1) as StepId)}
            >
              {t.common.continue}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit}>
              {tc.form.submit}
            </Button>
          )}
        </div>
      }
    >
      {/* Step indicator */}
      <div className={styles.stepBar}>
        {STEPS.map((label, i) => (
          <div key={i} className={`${styles.stepItem} ${step === i + 1 ? styles.stepActive : step > i + 1 ? styles.stepDone : ""}`}>
            <span className={styles.stepDot}>{i + 1}</span>
            <span className={styles.stepLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className={styles.formGrid}>
          <Input
            label={tc.form.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div>
            <label className={styles.formLabel}>{tc.form.category}</label>
            <select
              className={styles.formSelect}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>{tc.form.category}</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input
            label={tc.form.amount}
            variant="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label={tc.form.date}
            variant="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className={styles.formGrid}>
          <Input
            label={tc.form.payee}
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
          />
          <div>
            <label className={styles.formLabel}>{tc.form.status}</label>
            <select
              className={styles.formSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
            >
              <option value="pending">{tc.status.pending}</option>
              <option value="approved">{tc.status.approved}</option>
              <option value="rejected">{tc.status.rejected}</option>
            </select>
          </div>
          <div>
            <label className={styles.formLabel}>{tc.form.notes}</label>
            <textarea
              className={styles.formTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className={styles.receiptNote}>
            <span className={styles.receiptNoteLabel}>{tc.form.receipt}</span>
            <span className={styles.receiptNoteText}>{tc.form.receiptNote}</span>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className={styles.review}>
          <p className={styles.reviewSub}>{tc.form.reviewSub}</p>
          <ReviewRow label={tc.form.description} value={description || "—"} />
          <ReviewRow label={tc.form.category}    value={category || "—"}    />
          <ReviewRow label={tc.form.amount}       value={formatCurrency(parseFloat(amount) || 0)} />
          <ReviewRow label={tc.form.date}         value={date || "—"} />
          <ReviewRow label={tc.form.payee}        value={payee || "—"} />
          <ReviewRow label={tc.form.status}       value={status} />
          {notes && <ReviewRow label={tc.form.notes} value={notes} />}
        </div>
      )}
    </Modal>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.reviewRow}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value}</span>
    </div>
  );
}

/* ─────────────────── KPI card ─────────────────── */
function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "success" | "info" | "warning" | "neutral" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span className={styles.kpiSub}>{sub}</span>
    </article>
  );
}
