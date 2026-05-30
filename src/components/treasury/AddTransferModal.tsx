import { useState, type ChangeEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useTreasury } from '../../context/TreasuryContext';
import { PALESTINIAN_BANKS, CURRENCY_RATES, type PalestinianCurrency, type InstrumentDirection } from '../../types/treasury';

const TODAY = new Date().toISOString().split('T')[0];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

interface FormState {
  direction: InstrumentDirection;
  amount: string;
  currency: PalestinianCurrency;
  transferDate: string;
  partyName: string;
  bankId: string;
  iban: string;
  purpose: string;
  notes: string;
}

const BLANK: FormState = {
  direction: 'incoming',
  amount: '',
  currency: 'ILS',
  transferDate: TODAY,
  partyName: '',
  bankId: '',
  iban: '',
  purpose: '',
  notes: '',
};

export function AddTransferModal({ isOpen, onClose, onSuccess }: Props) {
  const { addInstrument } = useTreasury();
  const [form, setForm] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'المبلغ مطلوب';
    if (!form.transferDate) errs.transferDate = 'التاريخ مطلوب';
    if (!form.partyName.trim()) errs.partyName = 'اسم الطرف مطلوب';
    if (!form.bankId) errs.bankId = 'البنك مطلوب';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const bank = PALESTINIAN_BANKS.find(b => b.id === form.bankId);
    addInstrument({
      type: 'bank_transfer',
      direction: form.direction,
      status: 'pending',
      amount: Number(form.amount),
      currency: form.currency,
      amountInILS: Number(form.amount) * CURRENCY_RATES[form.currency],
      instrumentDate: form.transferDate,
      dueDate: form.transferDate,
      drawerName: form.direction === 'outgoing' ? 'أطلس لإدارة الأعمال' : form.partyName,
      drawerType: 'other',
      payeeName: form.direction === 'outgoing' ? form.partyName : 'أطلس لإدارة الأعمال',
      bankId: form.bankId,
      bankName: bank?.nameAr ?? form.bankId,
      accountNumber: '',
      iban: form.iban || undefined,
      micrVerified: false,
      linkedInvoiceIds: [],
      linkedPaymentIds: [],
      notes: form.notes || undefined,
      referenceNumber: form.purpose || undefined,
      createdBy: 'admin',
    });
    reset();
    onSuccess('تم إضافة الحوالة البنكية بنجاح');
    onClose();
  };

  const reset = () => { setForm(BLANK); setErrors({}); };
  const handleClose = () => { reset(); onClose(); };

  const sym = { ILS: '₪', JOD: 'د.أ', USD: '$' }[form.currency];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="إضافة حوالة بنكية"
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose}>إلغاء</Button>
          <Button variant="primary" onClick={handleSubmit}>حفظ التحويل</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="الاتجاه *"
            value={form.direction}
            onChange={set('direction')}
            options={[
              { value: 'incoming', label: '◉ وارد' },
              { value: 'outgoing', label: '○ صادر' },
            ]}
          />
          <Select
            label="العملة"
            value={form.currency}
            onChange={set('currency')}
            options={[
              { value: 'ILS', label: 'شيكل ILS' },
              { value: 'JOD', label: 'دينار JOD' },
              { value: 'USD', label: 'دولار USD' },
            ]}
          />
          <Input
            label="المبلغ *"
            variant="number"
            value={form.amount}
            onChange={set('amount')}
            error={errors.amount}
            rightIcon={<span style={{ fontSize: 13, color: '#64748b' }}>{sym}</span>}
            fullWidth
          />
          <Input
            label="التاريخ *"
            variant="date"
            value={form.transferDate}
            onChange={set('transferDate')}
            error={errors.transferDate}
            fullWidth
          />
        </div>

        <Input
          label={form.direction === 'outgoing' ? 'اسم المستفيد *' : 'اسم المرسِل *'}
          value={form.partyName}
          onChange={set('partyName')}
          error={errors.partyName}
          fullWidth
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="البنك *"
            value={form.bankId}
            onChange={set('bankId')}
            error={errors.bankId}
            options={[
              { value: '', label: 'اختر البنك…', disabled: true },
              ...PALESTINIAN_BANKS.map(b => ({ value: b.id, label: b.nameAr })),
            ]}
          />
          <Input
            label="رقم IBAN"
            value={form.iban}
            onChange={set('iban')}
            fullWidth
          />
        </div>

        <Input
          label="الغرض / المرجع"
          value={form.purpose}
          onChange={set('purpose')}
          fullWidth
        />

        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ملاحظات
          </p>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="ملاحظات اختيارية..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              color: '#0f172a',
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
