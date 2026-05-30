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
  direction: InstrumentDirection;
  onSuccess: (msg: string) => void;
}

interface FormState {
  amount: string;
  currency: PalestinianCurrency;
  instrumentDate: string;
  dueDate: string;
  partyName: string;
  partyType: 'customer' | 'supplier' | 'other';
  bankId: string;
  branchName: string;
  accountNumber: string;
  checkNumber: string;
  notes: string;
}

const BLANK: FormState = {
  amount: '',
  currency: 'ILS',
  instrumentDate: TODAY,
  dueDate: TODAY,
  partyName: '',
  partyType: 'customer',
  bankId: '',
  branchName: '',
  accountNumber: '',
  checkNumber: '',
  notes: '',
};

const SECTION_LABEL: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 12,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const GRID2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

export function AddCheckModal({ isOpen, onClose, direction, onSuccess }: Props) {
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
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    if (!form.instrumentDate) errs.instrumentDate = 'تاريخ الشيك مطلوب';
    if (!form.dueDate) errs.dueDate = 'تاريخ الاستحقاق مطلوب';
    if (form.dueDate && form.instrumentDate && form.dueDate < form.instrumentDate)
      errs.dueDate = 'يجب أن يكون تاريخ الاستحقاق بعد تاريخ الشيك أو مساوياً له';
    if (!form.partyName.trim()) errs.partyName = 'اسم الطرف مطلوب';
    if (!form.bankId) errs.bankId = 'البنك مطلوب';
    if (!/^\d{10,13}$/.test(form.accountNumber)) errs.accountNumber = 'رقم الحساب يجب أن يتكون من 10–13 رقماً';
    if (!/^\d{6}$/.test(form.checkNumber)) errs.checkNumber = 'رقم الشيك يجب أن يتكون من 6 أرقام بالضبط';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (status: 'draft' | 'pending') => {
    if (!validate()) return;
    const bank = PALESTINIAN_BANKS.find(b => b.id === form.bankId);
    addInstrument({
      type: 'check',
      direction,
      status,
      amount: Number(form.amount),
      currency: form.currency,
      amountInILS: Number(form.amount) * CURRENCY_RATES[form.currency],
      instrumentDate: form.instrumentDate,
      dueDate: form.dueDate,
      drawerName: direction === 'incoming' ? form.partyName : 'أطلس لإدارة الأعمال',
      drawerType: direction === 'incoming' ? form.partyType : 'other',
      payeeName: direction === 'outgoing' ? form.partyName : 'أطلس لإدارة الأعمال',
      bankId: form.bankId,
      bankName: bank?.nameAr ?? form.bankId,
      branchName: form.branchName || undefined,
      accountNumber: form.accountNumber,
      checkNumber: form.checkNumber,
      micrVerified: false,
      linkedInvoiceIds: [],
      linkedPaymentIds: [],
      notes: form.notes || undefined,
      createdBy: 'admin',
    });
    reset();
    onSuccess(direction === 'incoming' ? 'تم إضافة الشيك الوارد بنجاح' : 'تم إضافة الشيك الصادر بنجاح');
    onClose();
  };

  const reset = () => { setForm(BLANK); setErrors({}); };
  const handleClose = () => { reset(); onClose(); };

  const dueDateHint = (): string | undefined => {
    if (errors.dueDate || !form.dueDate) return undefined;
    const diff = new Date(form.dueDate).getTime() - new Date(TODAY).getTime();
    if (diff > 0) return 'شيك آجل';
    if (diff < 0) return 'تاريخ الاستحقاق ماضٍ';
    return undefined;
  };

  const sym = { ILS: '₪', JOD: 'د.أ', USD: '$' }[form.currency];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={direction === 'incoming' ? 'إضافة شيك وارد' : 'إضافة شيك صادر'}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose}>إلغاء</Button>
          <Button variant="ghost" onClick={() => handleSubmit('draft')}>حفظ كمسودة</Button>
          <Button variant="primary" onClick={() => handleSubmit('pending')}>حفظ وتقديم ←</Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section>
          <p style={SECTION_LABEL}>المبلغ والتواريخ</p>
          <div style={GRID2}>
            <Input
              label="المبلغ *"
              variant="number"
              value={form.amount}
              onChange={set('amount')}
              error={errors.amount}
              rightIcon={<span style={{ fontSize: 13, color: '#64748b' }}>{sym}</span>}
              fullWidth
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
              label="تاريخ الشيك *"
              variant="date"
              value={form.instrumentDate}
              onChange={set('instrumentDate')}
              error={errors.instrumentDate}
              fullWidth
            />
            <Input
              label="تاريخ الاستحقاق *"
              variant="date"
              value={form.dueDate}
              onChange={set('dueDate')}
              error={errors.dueDate}
              hint={dueDateHint()}
              fullWidth
            />
          </div>
        </section>

        <section>
          <p style={SECTION_LABEL}>
            {direction === 'incoming' ? 'الساحب — من كتب الشيك' : 'المستفيد — من سيستلم الشيك'}
          </p>
          <div style={GRID2}>
            <Select
              label="نوع الطرف"
              value={form.partyType}
              onChange={set('partyType')}
              options={[
                { value: 'customer', label: 'زبون' },
                { value: 'supplier', label: 'مورد' },
                { value: 'other', label: 'أخرى' },
              ]}
            />
            <Input
              label={direction === 'incoming' ? 'اسم الساحب *' : 'اسم المستفيد *'}
              value={form.partyName}
              onChange={set('partyName')}
              error={errors.partyName}
              fullWidth
            />
          </div>
        </section>

        <section>
          <p style={SECTION_LABEL}>البيانات البنكية</p>
          <div style={GRID2}>
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
              label="الفرع"
              value={form.branchName}
              onChange={set('branchName')}
              fullWidth
            />
            <Input
              label="رقم الحساب *"
              variant="number"
              value={form.accountNumber}
              onChange={set('accountNumber')}
              error={errors.accountNumber}
              hint="10–13 رقماً"
              fullWidth
            />
            <Input
              label="رقم الشيك *"
              variant="number"
              value={form.checkNumber}
              onChange={set('checkNumber')}
              error={errors.checkNumber}
              hint="6 أرقام بالضبط"
              fullWidth
            />
          </div>
        </section>

        <section>
          <p style={{ ...SECTION_LABEL, marginBottom: 8 }}>ملاحظات</p>
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
        </section>
      </div>
    </Modal>
  );
}
