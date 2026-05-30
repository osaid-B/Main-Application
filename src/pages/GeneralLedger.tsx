import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import styles from "./GeneralLedger.module.css";

type EntryType = "invoice" | "payment" | "expense" | "manual";

interface LedgerEntry {
  id: string;
  date: string;
  type: EntryType;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const PAGE_SIZE = 50;

function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default function GeneralLedger() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.generalLedger;
  const { invoices, payments, expenses } = useData();

  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(getMonthStart());
  const [dateTo,   setDateTo]   = useState(today);
  const [typeFilter, setTypeFilter] = useState<"" | EntryType>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const entries = useMemo<LedgerEntry[]>(() => {
    const list: LedgerEntry[] = [];
    invoices.filter(inv => !inv.status || inv.status !== "Paid").forEach(inv => {
      list.push({
        id: `INV-${inv.id}`,
        date: inv.date,
        type: "invoice",
        reference: inv.id,
        description: isArabic ? `فاتورة - ${inv.customerId}` : `Invoice - ${inv.customerId}`,
        debit: Number(inv.amount ?? inv.total ?? 0),
        credit: 0,
        balance: 0,
      });
    });
    payments.forEach(pay => {
      const amount = Number(pay.amount || 0);
      list.push({
        id: `PAY-${pay.id}`,
        date: pay.date ?? today,
        type: "payment",
        reference: pay.paymentId ?? pay.id,
        description: isArabic ? `دفعة - ${pay.invoiceId}` : `Payment - ${pay.invoiceId}`,
        debit: 0,
        credit: amount,
        balance: 0,
      });
    });
    expenses.filter(e => !e.isDeleted).forEach(exp => {
      list.push({
        id: `EXP-${exp.id}`,
        date: exp.date,
        type: "expense",
        reference: exp.id,
        description: exp.description ?? exp.category,
        debit: Number(exp.amount || 0),
        credit: 0,
        balance: 0,
      });
    });
    list.sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    list.forEach(e => { running += e.debit - e.credit; e.balance = running; });
    return list;
  }, [invoices, payments, expenses, isArabic, today]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (e.date < dateFrom || e.date > dateTo) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.reference.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, dateFrom, dateTo, typeFilter, search]);

  const totalDebits  = useMemo(() => filtered.reduce((s, e) => s + e.debit, 0), [filtered]);
  const totalCredits = useMemo(() => filtered.reduce((s, e) => s + e.credit, 0), [filtered]);
  const netMovement  = totalDebits - totalCredits;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportCsv() {
    const rows = [
      ["Date", "Type", "Reference", "Description", "Debit", "Credit", "Balance"],
      ...filtered.map(e => [e.date, e.type, e.reference, e.description, e.debit, e.credit, e.balance]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `general-ledger-${dateFrom}-${dateTo}.csv`;
    a.click();
  }

  const typeBadgeCls: Record<EntryType, string> = {
    invoice: styles.typeInvoice,
    payment: styles.typePayment,
    expense: styles.typeExpense,
    manual:  styles.typeManual,
  };

  function typeLabel(type: EntryType) {
    return tc.types[type];
  }

  return (
    <Container maxWidth="full" padding="md">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.breadcrumb}>{isArabic ? "المالية / دفتر الأستاذ" : "Finance / General Ledger"}</p>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={exportCsv}>
            {tc.export}
          </Button>
        </div>

        <div className={styles.kpiGrid}>
          <div className={`${styles.kpi} ${styles.kpiDebit}`}>
            <span className={styles.kpiLabel}>{tc.totalDebits}</span>
            <strong className={styles.kpiValue}>{formatCurrency(totalDebits, "ILS")}</strong>
          </div>
          <div className={`${styles.kpi} ${styles.kpiCredit}`}>
            <span className={styles.kpiLabel}>{tc.totalCredits}</span>
            <strong className={styles.kpiValue}>{formatCurrency(totalCredits, "ILS")}</strong>
          </div>
          <div className={`${styles.kpi} ${styles.kpiNet}`}>
            <span className={styles.kpiLabel}>{tc.netMovement}</span>
            <strong className={styles.kpiValue}>{formatCurrency(netMovement, "ILS")}</strong>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>{tc.entryCount}</span>
            <strong className={styles.kpiValue}>{filtered.length.toLocaleString()}</strong>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <input className={styles.filterInput} style={{ width: "100%" }} placeholder={tc.searchPlaceholder}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <input type="date" className={styles.filterInput} value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className={styles.filterInput} value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          <select className={styles.filterSelect} value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as "" | EntryType); setPage(1); }}>
            <option value="">{tc.typeAll}</option>
            <option value="invoice">{tc.typeInvoice}</option>
            <option value="payment">{tc.typePayment}</option>
            <option value="expense">{tc.typeExpense}</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              <col className="col-date" />
              <col className="col-w-100" />
              <col className="col-w-110" />
              <col />
              <col className="col-currency" />
              <col className="col-currency" />
              <col className="col-w-130" />
            </colgroup>
            <thead>
              <tr>
                <th className="col-date">{tc.cols.date}</th>
                <th>{tc.cols.type}</th>
                <th>{tc.cols.reference}</th>
                <th>{tc.cols.description}</th>
                <th className={styles.numEnd}>{tc.cols.debit}</th>
                <th className={styles.numEnd}>{tc.cols.credit}</th>
                <th className={styles.numEnd}>{tc.cols.balance}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>
                    <span className={`${styles.typeBadge} ${typeBadgeCls[e.type]}`}>
                      {typeLabel(e.type)}
                    </span>
                  </td>
                  <td>{e.reference}</td>
                  <td>{e.description}</td>
                  <td className={`${styles.numEnd} ${styles.debitAmount}`}>
                    {e.debit > 0 ? formatCurrency(e.debit, "ILS") : "—"}
                  </td>
                  <td className={`${styles.numEnd} ${styles.creditAmount}`}>
                    {e.credit > 0 ? formatCurrency(e.credit, "ILS") : "—"}
                  </td>
                  <td className={`${styles.numEnd} ${styles.balance}`}>
                    {formatCurrency(e.balance, "ILS")}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>{tc.noEntries}</td></tr>
              )}
            </tbody>
          </table>
          {pageCount > 1 && (
            <div className={styles.pagination}>
              <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
              <div className={styles.pageBtns}>
                <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className={styles.pageBtn} disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
