import "./Treasury.css";
import { useState } from "react";
import { ArrowRight, Building2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useTreasury } from "../context/TreasuryContext";
import type { TreasuryBankAccount, PalestinianCurrency } from "../types/treasury";
import { PALESTINIAN_BANKS } from "../types/treasury";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENCY_LABELS: Record<PalestinianCurrency, string> = { ILS: "₪ شيكل", JOD: "د.أ دينار", USD: "$ دولار" };

function formatBalance(amount: number, currency: PalestinianCurrency): string {
  const sym: Record<string, string> = { ILS: "₪", JOD: "د.أ", USD: "$" };
  return `${sym[currency] ?? currency}${amount.toLocaleString("ar-PS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function maskAccount(num: string): string {
  if (num.length <= 4) return num;
  return "*".repeat(num.length - 4) + num.slice(-4);
}

// ─── Add Account Modal ────────────────────────────────────────────────────────

interface AddAccountModalProps {
  onSave: (account: Omit<TreasuryBankAccount, "id">) => void;
  onClose: () => void;
}

function AddAccountModal({ onSave, onClose }: AddAccountModalProps) {
  const [bankId,        setBankId]        = useState<string>(PALESTINIAN_BANKS[0].id);
  const [branchName,    setBranchName]    = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban,          setIban]          = useState("");
  const [currency,      setCurrency]      = useState<PalestinianCurrency>("ILS");
  const [accountType,   setAccountType]   = useState<TreasuryBankAccount["accountType"]>("current");
  const [balance,       setBalance]       = useState("");

  const selectedBank = PALESTINIAN_BANKS.find(b => b.id === bankId)!;

  const valid = bankId && branchName && accountNumber;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="إضافة حساب بنكي"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onSave({
                bankId,
                bankName:      selectedBank.nameAr,
                branchName,
                accountNumber,
                iban,
                currency,
                accountType,
                balance:       parseFloat(balance) || 0,
                isActive:      true,
              })
            }
          >
            حفظ الحساب
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--app-text-soft)" }}>البنك *</label>
          <Select
            value={bankId}
            onChange={e => setBankId(e.target.value)}
            options={PALESTINIAN_BANKS.map(b => ({ value: b.id, label: b.nameAr }))}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--app-text-soft)" }}>اسم الفرع *</label>
          <Input placeholder="مثال: رام الله - المنارة" value={branchName} onChange={e => setBranchName(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--app-text-soft)" }}>رقم الحساب *</label>
          <Input placeholder="10-13 رقم" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
        </div>
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--app-text-soft)" }}>IBAN</label>
          <Input placeholder="PS92ARAB..." value={iban} onChange={e => setIban(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--app-text-soft)" }}>العملة *</label>
          <Select
            value={currency}
            onChange={e => setCurrency(e.target.value as PalestinianCurrency)}
            options={Object.entries(CURRENCY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--app-text-soft)" }}>نوع الحساب</label>
          <Select
            value={accountType}
            onChange={e => setAccountType(e.target.value as TreasuryBankAccount["accountType"])}
            options={[
              { value: "current", label: "جاري" },
              { value: "savings", label: "توفير" },
              { value: "trust",   label: "أمانة" },
            ]}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--app-text-soft)" }}>الرصيد الافتتاحي</label>
          <Input variant="number" placeholder="0.00" value={balance} onChange={e => setBalance(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

// ─── TreasuryAccounts page ────────────────────────────────────────────────────

export default function TreasuryAccounts() {
  const navigate = useNavigate();
  const { bankAccounts, addBankAccount } = useTreasury();
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast,        setToast]        = useState("");

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  }

  return (
    <div className="trs-accounts-page">

      {/* Header */}
      <div>
        <button
          type="button"
          className="trs-back-link"
          onClick={() => navigate("/treasury")}
        >
          <ArrowRight size={14} />
          العودة إلى الخزينة
        </button>

        <div className="trs-accounts-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="trs-header-icon">
              <Building2 size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--app-text)" }}>
                الحسابات البنكية
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--app-text-muted)" }}>
                إدارة الحسابات لدى البنوك الفلسطينية
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowAddModal(true)}
          >
            إضافة حساب
          </Button>
        </div>
      </div>

      {/* Accounts table */}
      <div className="trs-table-card">
        <div className="trs-table-head">
          <strong>قائمة الحسابات</strong>
          <span className="trs-table-count">{bankAccounts.length} حساب</span>
        </div>
        <div className="trs-table-wrap">
          <table className="trs-table">
            <colgroup>
              <col style={{ width: 200 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 170 }} />
              <col />
              <col style={{ width: 80 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 160 }} />
            </colgroup>
            <thead>
              <tr>
                <th>البنك</th>
                <th>الفرع</th>
                <th>رقم الحساب</th>
                <th>IBAN</th>
                <th>العملة</th>
                <th>الرصيد الحالي</th>
                <th>آخر تسوية</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {bankAccounts.length === 0 ? (
                <tr className="trs-empty-row">
                  <td colSpan={9}>لا توجد حسابات بنكية مضافة بعد.</td>
                </tr>
              ) : (
                bankAccounts.map(acc => (
                  <tr key={acc.id}>
                    {/* البنك */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <strong style={{ fontSize: 13.5, fontWeight: 700 }}>{acc.bankName}</strong>
                        <span style={{ fontSize: 11.5, color: "var(--app-text-muted)", fontFamily: "var(--font-mono)" }}>
                          {PALESTINIAN_BANKS.find(b => b.id === acc.bankId)?.swift ?? ""}
                        </span>
                      </div>
                    </td>

                    {/* الفرع */}
                    <td style={{ fontSize: 13 }}>{acc.branchName}</td>

                    {/* رقم الحساب */}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                        {maskAccount(acc.accountNumber)}
                      </span>
                    </td>

                    {/* IBAN */}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--app-text-soft)", overflowWrap: "anywhere" }}>
                        {acc.iban || "—"}
                      </span>
                    </td>

                    {/* العملة */}
                    <td>
                      <span className={`trs-account-currency-badge trs-account-currency-badge--${acc.currency}`}>
                        {acc.currency}
                      </span>
                    </td>

                    {/* الرصيد */}
                    <td>
                      <strong style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {formatBalance(acc.balance, acc.currency)}
                      </strong>
                    </td>

                    {/* آخر تسوية */}
                    <td>
                      {acc.lastReconciled ? (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                          {acc.lastReconciled.split("-").reverse().join("/")}
                        </span>
                      ) : (
                        <span style={{ color: "var(--app-text-muted)", fontSize: 12 }}>لم يُسوَّ</span>
                      )}
                    </td>

                    {/* الحالة */}
                    <td>
                      <span className={`trs-badge ${acc.isActive ? "trs-badge--cleared" : "trs-badge--cancelled"}`}>
                        {acc.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>

                    {/* الإجراءات */}
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Button variant="secondary" size="sm" className="trs-act-btn">تسوية</Button>
                        <Button variant="ghost" size="sm" className="trs-act-btn">المعاملات</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <AddAccountModal
          onSave={account => {
            addBankAccount(account);
            setShowAddModal(false);
            showToast("تم إضافة الحساب البنكي بنجاح.");
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Toast */}
      {toast && <div className="trs-toast">{toast}</div>}
    </div>
  );
}
