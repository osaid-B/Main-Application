import React, { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { CHART_OF_ACCOUNTS } from "../data/chartOfAccountsMock";
import type { ChartAccount, AccountType, NormalBalance } from "../data/types";
import styles from "./ChartOfAccounts.module.css";

function nextCode(accounts: ChartAccount[], type: AccountType): string {
  const prefixes: Record<AccountType, number> = { asset: 1000, liability: 2000, equity: 3000, revenue: 4000, expense: 5000 };
  const base = prefixes[type];
  const existing = accounts.filter(a => Number(a.code) >= base && Number(a.code) < base + 1000).map(a => Number(a.code));
  const max = existing.length ? Math.max(...existing) : base;
  return String(max + 10);
}

export default function ChartOfAccounts() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.chartOfAccounts;
  const { invoices, payments, expenses } = useData();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<ChartAccount[]>(CHART_OF_ACCOUNTS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ChartAccount | null>(null);
  const [form, setForm] = useState({ code: "", nameAr: "", nameEn: "", type: "asset" as AccountType, parentId: "", normalBalance: "debit" as NormalBalance });

  const computedBalances = useMemo(() => {
    const map = new Map<string, number>();
    const rev = payments.filter(p => p.status === "Completed" || p.status === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0);
    const rec = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + Number(i.remainingAmount ?? i.amount ?? 0), 0);
    const exp = expenses.filter(e => !e.isDeleted).reduce((s, e) => s + Number(e.amount || 0), 0);
    map.set("1110", rev * 0.6);
    map.set("1120", rec);
    map.set("2110", exp * 0.3);
    map.set("2120", exp * 0.16);
    map.set("4100", rev);
    map.set("5210", exp * 0.45);
    map.set("5220", exp * 0.15);
    map.set("5240", exp * 0.10);
    return map;
  }, [invoices, payments, expenses]);

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a =>
      a.code.includes(q) || a.nameAr.includes(q) || a.nameEn.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const parents = accounts.filter(a => a.isParent || !a.parentId);

  function openAdd(parentId?: string) {
    const type: AccountType = parentId
      ? (accounts.find(a => a.id === parentId)?.type ?? "asset")
      : "asset";
    const nb: NormalBalance = type === "asset" || type === "expense" ? "debit" : "credit";
    setEditTarget(null);
    setForm({ code: nextCode(accounts, type), nameAr: "", nameEn: "", type, parentId: parentId ?? "", normalBalance: nb });
    setShowModal(true);
  }

  function openEdit(acc: ChartAccount) {
    setEditTarget(acc);
    setForm({ code: acc.code, nameAr: acc.nameAr, nameEn: acc.nameEn, type: acc.type, parentId: acc.parentId ?? "", normalBalance: acc.normalBalance });
    setShowModal(true);
  }

  function saveAccount() {
    if (!form.nameAr.trim() || !form.code.trim()) return;
    if (editTarget) {
      setAccounts(prev => prev.map(a => a.id === editTarget.id ? { ...a, ...form } : a));
    } else {
      const id = `ACC-${Date.now()}`;
      const newAcc: ChartAccount = { id, ...form, parentId: form.parentId || undefined, isActive: true };
      setAccounts(prev => [...prev, newAcc]);
    }
    setShowModal(false);
  }

  function deactivateAccount(id: string) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: false } : a));
  }

  const typeBadge: Record<AccountType, string> = {
    asset:     styles.typeAsset,
    liability: styles.typeLiability,
    equity:    styles.typeEquity,
    revenue:   styles.typeRevenue,
    expense:   styles.typeExpense,
  };

  function getBalance(acc: ChartAccount) {
    return computedBalances.get(acc.code) ?? acc.balance ?? 0;
  }

  function renderRows() {
    const rows: React.ReactElement[] = [];
    const topLevel = filtered.filter(a => !a.parentId);
    topLevel.forEach(parent => {
      const children = filtered.filter(a => a.parentId === parent.id);
      const grandChildren = children.flatMap(c => filtered.filter(a => a.parentId === c.id));
      const isParent = parent.isParent || children.length > 0;
      rows.push(
        <tr key={parent.id} className={`${styles.parentRow} ${!parent.parentId && !parent.isParent ? "" : ""}`}>
          <td><span className={styles.codeChip}>{parent.code}</span></td>
          <td style={{ fontWeight: 700 }}>{isArabic ? parent.nameAr : parent.nameEn}</td>
          <td><span className={`${styles.typeBadge} ${typeBadge[parent.type]}`}>{tc.types[parent.type]}</span></td>
          <td className={styles.numEnd + " " + styles.mono}>{isParent ? "—" : formatCurrency(getBalance(parent), "ILS")}</td>
          <td className={styles.normalBalance}>{parent.normalBalance === "debit" ? tc.normalDebit : tc.normalCredit}</td>
          <td>
            <div className={styles.actionsCell}>
              {isParent && <button className={styles.actionBtn} onClick={() => openAdd(parent.id)}>{tc.addSubAccount}</button>}
              <button className={styles.actionBtn} onClick={() => openEdit(parent)}>{tc.editAccount}</button>
              {!isParent && parent.isActive && <button className={styles.actionBtn} onClick={() => deactivateAccount(parent.id)}>{tc.deactivate}</button>}
              {!isParent && <button className={styles.actionBtn} onClick={() => navigate(`/general-ledger?account=${parent.code}`)}>{tc.viewTransactions}</button>}
            </div>
          </td>
        </tr>
      );
      children.forEach(child => {
        const childChildren = grandChildren.filter(a => a.parentId === child.id);
        rows.push(
          <tr key={child.id} className={styles.level1Row}>
            <td><span className={styles.codeChip}>{child.code}</span></td>
            <td>{isArabic ? child.nameAr : child.nameEn}</td>
            <td><span className={`${styles.typeBadge} ${typeBadge[child.type]}`}>{tc.types[child.type]}</span></td>
            <td className={styles.numEnd + " " + styles.mono}>{childChildren.length > 0 ? "—" : formatCurrency(getBalance(child), "ILS")}</td>
            <td className={styles.normalBalance}>{child.normalBalance === "debit" ? tc.normalDebit : tc.normalCredit}</td>
            <td>
              <div className={styles.actionsCell}>
                <button className={styles.actionBtn} onClick={() => openAdd(child.id)}>{tc.addSubAccount}</button>
                <button className={styles.actionBtn} onClick={() => openEdit(child)}>{tc.editAccount}</button>
                <button className={styles.actionBtn} onClick={() => navigate(`/general-ledger?account=${child.code}`)}>{tc.viewTransactions}</button>
              </div>
            </td>
          </tr>
        );
        childChildren.forEach(leaf => {
          rows.push(
            <tr key={leaf.id} className={styles.level2Row}>
              <td><span className={styles.codeChip}>{leaf.code}</span></td>
              <td>{isArabic ? leaf.nameAr : leaf.nameEn}</td>
              <td><span className={`${styles.typeBadge} ${typeBadge[leaf.type]}`}>{tc.types[leaf.type]}</span></td>
              <td className={styles.numEnd + " " + styles.mono}>{formatCurrency(getBalance(leaf), "ILS")}</td>
              <td className={styles.normalBalance}>{leaf.normalBalance === "debit" ? tc.normalDebit : tc.normalCredit}</td>
              <td>
                <div className={styles.actionsCell}>
                  <button className={styles.actionBtn} onClick={() => openEdit(leaf)}>{tc.editAccount}</button>
                  {leaf.isActive && <button className={styles.actionBtn} onClick={() => deactivateAccount(leaf.id)}>{tc.deactivate}</button>}
                  <button className={styles.actionBtn} onClick={() => navigate(`/general-ledger?account=${leaf.code}`)}>{tc.viewTransactions}</button>
                </div>
              </td>
            </tr>
          );
        });
      });
    });
    return rows;
  }

  void Badge;

  return (
    <Container maxWidth="full" padding="md">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.breadcrumb}>{isArabic ? "المالية / دليل الحسابات" : "Finance / Chart of Accounts"}</p>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <div style={{ display: "flex", gap: "var(--app-space-2)" }}>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />}>{tc.export}</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={13} />} onClick={() => openAdd()}>{tc.newAccount}</Button>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <input className={styles.filterInput} style={{ width: "100%" }} placeholder={tc.searchPlaceholder}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              <col className="col-w-90" />
              <col />
              <col className="col-w-120" />
              <col className="col-currency" />
              <col className="col-w-110" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>{tc.cols.code}</th>
                <th>{tc.cols.name}</th>
                <th>{tc.cols.type}</th>
                <th className={styles.numEnd}>{tc.cols.balance}</th>
                <th>{tc.cols.normalBalance}</th>
                <th className="col-actions">{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {renderRows()}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>{tc.noAccounts}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editTarget ? tc.form.editTitle : tc.form.createTitle} size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={saveAccount}>{t.common.save}</Button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.code}</label>
            <input className={styles.formInput} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.type}</label>
            <select className={styles.formSelect} value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as AccountType }))}>
              {(["asset","liability","equity","revenue","expense"] as AccountType[]).map(t => (
                <option key={t} value={t}>{tc.types[t]}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.nameAr}</label>
            <input className={styles.formInput} value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} dir="rtl" />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.nameEn}</label>
            <input className={styles.formInput} value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.parent}</label>
            <select className={styles.formSelect} value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
              <option value="">{tc.form.noParent}</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.code} — {isArabic ? p.nameAr : p.nameEn}</option>
              ))}
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.normalBalance}</label>
            <select className={styles.formSelect} value={form.normalBalance}
              onChange={e => setForm(f => ({ ...f, normalBalance: e.target.value as NormalBalance }))}>
              <option value="debit">{tc.normalDebit}</option>
              <option value="credit">{tc.normalCredit}</option>
            </select>
          </div>
        </div>
      </Modal>
    </Container>
  );
}
