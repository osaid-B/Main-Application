import "./Treasury.css";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import type { TreasuryBankAccount } from "../types/treasury";

const BOUNCE_REASONS = [
  "رصيد غير كافٍ",
  "توقيع غير مطابق",
  "تاريخ منتهٍ",
  "حساب مغلق",
  "أمر إيقاف الصرف",
  "أخرى",
];

// ─── DepositModal ──────────────────────────────────────────────────────────────

interface DepositModalProps {
  bankAccounts: TreasuryBankAccount[];
  onConfirm: (data: { bankAccountId: string; depositDate: string; depositRef: string; notes: string }) => void;
  onClose: () => void;
}

export function DepositModal({ bankAccounts, onConfirm, onClose }: DepositModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [depositDate, setDepositDate]     = useState(today);
  const [depositRef,  setDepositRef]      = useState("");
  const [notes,       setNotes]           = useState("");

  const accountOptions = bankAccounts
    .filter(a => a.isActive)
    .map(a => ({ value: a.id, label: `${a.bankName} — ${a.accountNumber.slice(-4).padStart(a.accountNumber.length, "*")}` }));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="تسجيل إيداع"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button
            variant="primary"
            disabled={!bankAccountId || !depositDate}
            onClick={() => onConfirm({ bankAccountId, depositDate, depositRef, notes })}
          >
            تأكيد الإيداع
          </Button>
        </>
      }
    >
      <div className="trs-action-form">
        <div className="trs-form-field">
          <label className="trs-form-label required">الحساب البنكي للإيداع</label>
          <Select
            value={bankAccountId}
            onChange={e => setBankAccountId(e.target.value)}
            options={accountOptions}
          />
        </div>
        <div className="trs-form-field">
          <label className="trs-form-label required">تاريخ الإيداع</label>
          <Input
            variant="date"
            value={depositDate}
            onChange={e => setDepositDate(e.target.value)}
          />
        </div>
        <div className="trs-form-field">
          <label className="trs-form-label">مرجع الإيداع (رقم إيصال البنك)</label>
          <Input
            placeholder="مثال: DEP-8831"
            value={depositRef}
            onChange={e => setDepositRef(e.target.value)}
          />
        </div>
        <div className="trs-form-field">
          <label className="trs-form-label">ملاحظات</label>
          <textarea
            className="trs-filter-select"
            style={{ width: "100%", height: 72, padding: "8px 10px", resize: "vertical", fontFamily: "inherit", fontSize: 13 }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="ملاحظات اختيارية..."
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── ClearModal ───────────────────────────────────────────────────────────────

interface ClearModalProps {
  onConfirm: (data: { bankRef: string; clearDate: string }) => void;
  onClose: () => void;
}

export function ClearModal({ onConfirm, onClose }: ClearModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [bankRef,   setBankRef]   = useState("");
  const [clearDate, setClearDate] = useState(today);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="تأكيد التحصيل"
      description="يؤدي تأكيد التحصيل إلى تحديث حالة الفواتير المرتبطة تلقائياً."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button
            variant="primary"
            disabled={!bankRef || !clearDate}
            onClick={() => onConfirm({ bankRef, clearDate })}
            leftIcon={<CheckCircle2 size={14} />}
          >
            تأكيد التحصيل
          </Button>
        </>
      }
    >
      <div className="trs-action-form">
        <div className="trs-form-field">
          <label className="trs-form-label required">رقم مرجع البنك</label>
          <Input
            placeholder="مثال: REF-ARAB-921"
            value={bankRef}
            onChange={e => setBankRef(e.target.value)}
          />
        </div>
        <div className="trs-form-field">
          <label className="trs-form-label required">تاريخ التحصيل</label>
          <Input
            variant="date"
            value={clearDate}
            onChange={e => setClearDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── BounceModal ──────────────────────────────────────────────────────────────

interface BounceModalProps {
  onConfirm: (data: { reason: string; bankRef: string }) => void;
  onClose: () => void;
}

export function BounceModal({ onConfirm, onClose }: BounceModalProps) {
  const [reason,  setReason]  = useState(BOUNCE_REASONS[0]);
  const [bankRef, setBankRef] = useState("");

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="تسجيل ارتجاع الشيك"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button
            variant="danger"
            disabled={!reason}
            onClick={() => onConfirm({ reason, bankRef })}
            leftIcon={<AlertTriangle size={14} />}
          >
            تسجيل الارتجاع
          </Button>
        </>
      }
    >
      <div className="trs-action-form">
        <div className="trs-form-field">
          <label className="trs-form-label required">سبب الارتجاع</label>
          <Select
            value={reason}
            onChange={e => setReason(e.target.value)}
            options={BOUNCE_REASONS.map(r => ({ value: r, label: r }))}
          />
        </div>
        <div className="trs-form-field">
          <label className="trs-form-label">مرجع الإشعار البنكي</label>
          <Input
            placeholder="مثال: BNK-4421"
            value={bankRef}
            onChange={e => setBankRef(e.target.value)}
          />
        </div>
        <div
          style={{
            background: "var(--app-danger-subtle)",
            border: "1px solid #fecaca",
            borderRadius: "var(--app-radius-sm)",
            padding: "10px 14px",
            fontSize: 12.5,
            color: "var(--app-danger)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ display: "block", marginBottom: 4 }}>تنبيه مهم</strong>
          سيتم تسجيل الارتجاع وإضافته لسجل الحالات. يمكنك المتابعة قانونياً بعد التسجيل.
        </div>
      </div>
    </Modal>
  );
}

// ─── ReDepositModal ───────────────────────────────────────────────────────────

interface ReDepositModalProps {
  onConfirm: (data: { depositDate: string }) => void;
  onClose: () => void;
}

export function ReDepositModal({ onConfirm, onClose }: ReDepositModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [depositDate, setDepositDate] = useState(today);
  const [confirmed,   setConfirmed]   = useState(false);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="إعادة إيداع الشيك"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button
            variant="primary"
            disabled={!confirmed || !depositDate}
            onClick={() => onConfirm({ depositDate })}
          >
            إعادة الإيداع
          </Button>
        </>
      }
    >
      <div className="trs-action-form">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 14px",
            background: "var(--app-warning-subtle)",
            border: "1px solid #fde68a",
            borderRadius: "var(--app-radius-sm)",
          }}
        >
          <input
            type="checkbox"
            id="redeposit-confirm"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <label htmlFor="redeposit-confirm" style={{ fontSize: 13, color: "var(--app-text-soft)", cursor: "pointer" }}>
            تأكدت من توفر الرصيد الكافي لدى الساحب قبل إعادة الإيداع.
          </label>
        </div>
        <div className="trs-form-field">
          <label className="trs-form-label required">تاريخ إعادة الإيداع</label>
          <Input
            variant="date"
            value={depositDate}
            onChange={e => setDepositDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── LegalInfoModal ───────────────────────────────────────────────────────────

const LEGAL_STEPS = [
  "احتفظ بأصل الشيك والإشعار البنكي الرسمي.",
  "أرسل إشعاراً خطياً موصى للساحب على عنوانه المعروف.",
  "انتظر ٣ أيام عمل للرد من الساحب.",
  "في حال عدم الاستجابة، قدّم شكوى إلى نيابة الأموال العامة أو المحكمة المختصة في محافظتك.",
  "ستحتاج: أصل الشيك، إشعار الارتجاع البنكي، عقد أو فاتورة تثبت الدَّين.",
];

interface LegalInfoModalProps {
  onClose: () => void;
}

export function LegalInfoModal({ onClose }: LegalInfoModalProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="خطوات التعامل مع الشيك المرتجع في فلسطين"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => window.print()}>طباعة هذه التعليمات</Button>
          <Button variant="primary" onClick={onClose}>إغلاق</Button>
        </>
      }
    >
      <div>
        <div
          style={{
            background: "var(--app-danger-subtle)",
            border: "1px solid #fecaca",
            borderRadius: "var(--app-radius-sm)",
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--app-danger)",
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          وفقاً لقانون التجارة الفلسطيني، يُعتبر إصدار شيك بدون رصيد جريمة جزائية. يحق لك المطالبة قانونياً خلال ٣ أشهر من تاريخ الارتجاع.
        </div>

        {LEGAL_STEPS.map((step, i) => (
          <div key={i} className="trs-legal-step">
            <div className="trs-legal-num">{i + 1}</div>
            <p className="trs-legal-text">{step}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── CancelModal ──────────────────────────────────────────────────────────────

interface CancelModalProps {
  instrumentRef: string;
  onConfirm: (note: string) => void;
  onClose: () => void;
}

export function CancelModal({ instrumentRef, onConfirm, onClose }: CancelModalProps) {
  const [note, setNote] = useState("");

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`إلغاء الأداة ${instrumentRef}`}
      variant="alert"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>تراجع</Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(note)}
          >
            تأكيد الإلغاء
          </Button>
        </>
      }
    >
      <div className="trs-action-form">
        <p style={{ fontSize: 13.5, color: "var(--app-text-soft)", margin: 0 }}>
          لا يمكن التراجع عن الإلغاء. السجل المالي سيُحفظ للمراجعة.
        </p>
        <div className="trs-form-field">
          <label className="trs-form-label">سبب الإلغاء</label>
          <textarea
            style={{ width: "100%", height: 72, padding: "8px 10px", resize: "vertical", fontFamily: "inherit", fontSize: 13 }}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="اذكر سبب الإلغاء..."
          />
        </div>
      </div>
    </Modal>
  );
}
