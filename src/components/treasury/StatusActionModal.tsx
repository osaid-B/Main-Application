import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useTreasury } from '../../context/TreasuryContext';
import type { TreasuryInstrument } from '../../types/treasury';

export type StatusActionType =
  | 'menu'
  | 'submit'
  | 'deposit'
  | 'clear'
  | 'bounce'
  | 'redeposit'
  | 'cancel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instrument: TreasuryInstrument;
  initialAction?: StatusActionType;
  onSuccess: (msg: string) => void;
}

const TODAY = new Date().toISOString().split('T')[0];

const BOUNCE_REASONS = [
  { value: 'insufficient_funds', label: 'رصيد غير كافٍ' },
  { value: 'signature_mismatch', label: 'توقيع غير مطابق' },
  { value: 'expired_date', label: 'تاريخ منتهٍ' },
  { value: 'closed_account', label: 'حساب مغلق' },
  { value: 'stop_payment', label: 'أمر إيقاف الصرف' },
  { value: 'other', label: 'أخرى' },
];

function getMenuActions(instrument: TreasuryInstrument): StatusActionType[] {
  switch (instrument.status) {
    case 'draft': return ['submit', 'cancel'];
    case 'pending': return ['deposit', 'cancel'];
    case 'deposited': return ['clear', 'bounce'];
    case 'bounced': return ['redeposit', 'cancel'];
    default: return [];
  }
}

const ACTION_LABELS: Record<StatusActionType, string> = {
  menu: 'الإجراءات المتاحة',
  submit: 'تقديم الشيك',
  deposit: 'تسجيل الإيداع',
  clear: 'تأكيد التحصيل',
  bounce: 'تسجيل ارتجاع',
  redeposit: 'إعادة الإيداع',
  cancel: 'إلغاء الأداة المالية',
};

const ACTION_ICON: Record<StatusActionType, string> = {
  menu: '',
  submit: '←',
  deposit: '↓',
  clear: '✓',
  bounce: '✕',
  redeposit: '↺',
  cancel: '🚫',
};

export function StatusActionModal({
  isOpen,
  onClose,
  instrument,
  initialAction = 'menu',
  onSuccess,
}: Props) {
  const { updateInstrumentStatus } = useTreasury();
  const [action, setAction] = useState<StatusActionType>(initialAction);
  const [date, setDate] = useState(TODAY);
  const [bankRef, setBankRef] = useState('');
  const [receiptNum, setReceiptNum] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bounceReason, setBounceReason] = useState('insufficient_funds');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setAction(initialAction);
    setDate(TODAY);
    setBankRef('');
    setReceiptNum('');
    setBankAccount('');
    setBounceReason('insufficient_funds');
    setNote('');
    setErrors({});
    onClose();
  };

  const handleConfirm = () => {
    const errs: Record<string, string> = {};

    switch (action) {
      case 'submit':
        updateInstrumentStatus(instrument.id, 'pending', note || 'تم تقديم الشيك');
        onSuccess('تم تقديم الشيك بنجاح');
        handleClose();
        return;

      case 'deposit':
        if (!bankAccount.trim()) errs.bankAccount = 'رقم الحساب البنكي مطلوب';
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        updateInstrumentStatus(
          instrument.id,
          'deposited',
          `تم الإيداع في ${bankAccount}${receiptNum ? ` — إيصال رقم ${receiptNum}` : ''}`,
        );
        onSuccess('تم تسجيل الإيداع بنجاح');
        handleClose();
        return;

      case 'clear':
        if (!bankRef.trim()) errs.bankRef = 'رقم مرجع البنك مطلوب';
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        updateInstrumentStatus(
          instrument.id,
          'cleared',
          `تأكيد تحصيل من البنك — مرجع ${bankRef}`,
        );
        onSuccess('تم تحصيل الشيك وتحديث الفواتير المرتبطة');
        handleClose();
        return;

      case 'bounce': {
        const reason = BOUNCE_REASONS.find(r => r.value === bounceReason)?.label ?? bounceReason;
        updateInstrumentStatus(instrument.id, 'bounced', `سبب الارتجاع: ${reason}`);
        onSuccess('تم تسجيل ارتجاع الشيك');
        handleClose();
        return;
      }

      case 'redeposit':
        updateInstrumentStatus(instrument.id, 'deposited', `إعادة إيداع بتاريخ ${date}`);
        onSuccess('تم تسجيل إعادة الإيداع');
        handleClose();
        return;

      case 'cancel':
        updateInstrumentStatus(instrument.id, 'cancelled', note || 'تم الإلغاء');
        onSuccess('تم إلغاء الأداة المالية');
        handleClose();
        return;
    }
  };

  const title = action === 'menu' ? 'الإجراءات المتاحة' : ACTION_LABELS[action];

  const renderBody = () => {
    if (action === 'menu') {
      const menuActions = getMenuActions(instrument);
      if (menuActions.length === 0) {
        return (
          <p style={{ color: '#64748b', fontSize: 14 }}>
            لا توجد إجراءات متاحة لهذه الأداة المالية.
          </p>
        );
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menuActions.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAction(a)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#fff',
                cursor: 'pointer',
                textAlign: 'start',
                fontSize: 14,
                fontWeight: 600,
                color: a === 'cancel' || a === 'bounce' ? '#b91c1c' : '#0f172a',
                transition: 'background 0.15s',
              }}
            >
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: a === 'cancel' || a === 'bounce' ? '#fee2e2' : '#dbeafe',
                color: a === 'cancel' || a === 'bounce' ? '#b91c1c' : '#1d4ed8',
                fontSize: 14,
              }}>
                {ACTION_ICON[a]}
              </span>
              {ACTION_LABELS[a]}
            </button>
          ))}
        </div>
      );
    }

    switch (action) {
      case 'submit':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#374151', fontSize: 14 }}>
              تأكيد تقديم الشيك <strong>{instrument.checkNumber ?? instrument.id}</strong> للمعالجة؟
            </p>
            <Input
              label="ملاحظة (اختياري)"
              value={note}
              onChange={e => setNote(e.target.value)}
              fullWidth
            />
          </div>
        );

      case 'deposit':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="الحساب البنكي *"
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              error={errors.bankAccount}
              hint="الحساب الذي يودع فيه الشيك"
              fullWidth
            />
            <Input
              label="تاريخ الإيداع"
              variant="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              fullWidth
            />
            <Input
              label="رقم إيصال الإيداع (اختياري)"
              value={receiptNum}
              onChange={e => setReceiptNum(e.target.value)}
              fullWidth
            />
          </div>
        );

      case 'clear':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="رقم مرجع البنك *"
              value={bankRef}
              onChange={e => setBankRef(e.target.value)}
              error={errors.bankRef}
              fullWidth
            />
            <Input
              label="تاريخ التحصيل"
              variant="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              fullWidth
            />
          </div>
        );

      case 'bounce':
        return (
          <Select
            label="سبب الارتجاع *"
            value={bounceReason}
            onChange={e => setBounceReason(e.target.value)}
            options={BOUNCE_REASONS}
          />
        );

      case 'redeposit':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, color: '#374151', fontSize: 14 }}>
              إعادة إيداع الشيك <strong>{instrument.checkNumber ?? instrument.id}</strong>
            </p>
            <Input
              label="تاريخ الإيداع الجديد"
              variant="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              fullWidth
            />
          </div>
        );

      case 'cancel':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
              <p style={{ margin: 0, color: '#b91c1c', fontSize: 14, fontWeight: 600 }}>
                تحذير: لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء الأداة المالية نهائياً.
              </p>
            </div>
            <Input
              label="سبب الإلغاء (اختياري)"
              value={note}
              onChange={e => setNote(e.target.value)}
              fullWidth
            />
          </div>
        );

      default:
        return null;
    }
  };

  const confirmLabel: Partial<Record<StatusActionType, string>> = {
    submit: 'تقديم ←',
    deposit: 'تسجيل الإيداع',
    clear: 'تأكيد التحصيل',
    bounce: 'تسجيل الارتجاع',
    redeposit: 'إعادة الإيداع',
    cancel: 'إلغاء نهائي',
  };

  const isDanger = action === 'cancel' || action === 'bounce';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        action === 'menu' ? (
          <Button variant="secondary" onClick={handleClose}>إغلاق</Button>
        ) : (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setAction('menu')}>← رجوع</Button>
            <Button variant="secondary" onClick={handleClose}>إلغاء</Button>
            <Button
              variant={isDanger ? 'danger' : 'primary'}
              onClick={handleConfirm}
            >
              {confirmLabel[action] ?? 'تأكيد'}
            </Button>
          </div>
        )
      }
    >
      {renderBody()}
    </Modal>
  );
}
