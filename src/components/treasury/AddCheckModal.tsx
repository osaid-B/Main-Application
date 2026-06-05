import { useRef, useState, type ChangeEvent } from 'react';
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
  defaultValues?: Partial<Record<string, string | null>>;
}

interface FormState {
  amount: string;
  currency: PalestinianCurrency;
  instrumentDate: string;
  dueDate: string;
  recipient: string;
  partyName: string;
  bankId: string;
  branchName: string;
  accountNumber: string;
  checkNumber: string;
  notes: string;
  chequeImageFront: string | null;
  chequeImageBack: string | null;
}

const BLANK: FormState = {
  amount: '',
  currency: 'ILS',
  instrumentDate: TODAY,
  dueDate: TODAY,
  recipient: '',
  partyName: '',
  bankId: '',
  branchName: '',
  accountNumber: '',
  checkNumber: '',
  notes: '',
  chequeImageFront: null,
  chequeImageBack: null,
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

// ── Image upload zone ──────────────────────────────────────────────────────

interface ImageUploadZoneProps {
  label: string;
  icon: string;
  previewSrc: string | null;
  onChange: (file: File | null, preview: string | null) => void;
}

function ImageUploadZone({ label, icon, previewSrc, onChange }: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#64748B', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div
        onClick={() => !previewSrc && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#2563EB' : previewSrc ? '#BBF7D0' : '#E2E8F0'}`,
          borderRadius: 10,
          background: isDragging ? '#EFF6FF' : previewSrc ? '#F0FDF4' : '#F8FAFC',
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: previewSrc ? 'default' : 'pointer',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 200ms ease',
        }}
      >
        {previewSrc ? (
          <>
            <img
              src={previewSrc}
              alt={label}
              style={{ width: '100%', height: 140, objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(null, null); }}
              style={{
                position: 'absolute', top: 6, left: 6,
                width: 24, height: 24, borderRadius: '50%',
                border: 'none', background: 'rgba(220,38,38,0.85)',
                color: 'white', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
              style={{
                position: 'absolute', bottom: 6, right: 6,
                background: 'rgba(0,0,0,0.6)', color: 'white',
                border: 'none', borderRadius: 6, padding: '3px 8px',
                fontSize: 11, cursor: 'pointer',
              }}
            >تغيير</button>
          </>
        ) : (
          <>
            <i className={`ti ${icon}`} style={{ fontSize: 28, color: '#94A3B8', marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
              اسحب الصورة هنا<br />
              <span style={{ color: '#2563EB', fontWeight: 500 }}>أو اضغط للاختيار</span>
            </p>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '4px 0 0' }}>JPG, PNG حتى 5MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
      />
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

export function AddCheckModal({ isOpen, onClose, direction, onSuccess, defaultValues }: Props) {
  const { addInstrument } = useTreasury();
  const [form, setForm] = useState<FormState>(() => {
    if (!defaultValues) return { ...BLANK };
    return { ...BLANK, ...(defaultValues as Partial<FormState>) };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [, setImageFiles] = useState<{ front: File | null; back: File | null }>({
    front: null, back: null,
  });

  const set = (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  const handleBankChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const bankId = e.target.value;
    setForm(prev => ({ ...prev, bankId, branchName: '' }));
    setErrors(prev => ({ ...prev, bankId: undefined }));
  };

  const handleCheckNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 8) {
      setForm(prev => ({ ...prev, checkNumber: val }));
      setErrors(prev => ({ ...prev, checkNumber: undefined }));
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    if (!form.instrumentDate) errs.instrumentDate = 'تاريخ إدخال الشيك مطلوب';
    if (!form.dueDate) errs.dueDate = 'تاريخ الاستحقاق مطلوب';
    if (form.dueDate && form.instrumentDate && form.dueDate < form.instrumentDate)
      errs.dueDate = 'يجب أن يكون تاريخ الاستحقاق بعد تاريخ الشيك أو مساوياً له';
    if (!form.recipient.trim()) errs.recipient = 'اسم المستلم / الزبون مطلوب';
    if (!form.bankId) errs.bankId = 'البنك مطلوب';
    if (!form.accountNumber) errs.accountNumber = 'رقم الحساب مطلوب';
    if (form.checkNumber.length !== 8) errs.checkNumber = 'رقم الشيك يجب أن يتكون من 8 أرقام بالضبط';
    // Images are optional — no validation
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
      drawerName: direction === 'incoming' ? (form.partyName || form.recipient) : 'أطلس لإدارة الأعمال',
      drawerType: 'customer',
      payeeName: direction === 'outgoing' ? form.recipient : 'أطلس لإدارة الأعمال',
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

  const reset = () => {
    setForm(BLANK);
    setErrors({});
    setImageFiles({ front: null, back: null });
  };
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

        {/* ── Amount & Dates ── */}
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
            {/* CHANGE 2: label renamed to "تاريخ إدخال الشيك", default = today */}
            <Input
              label="تاريخ إدخال الشيك *"
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

        {/* ── Party / Recipient ── */}
        <section>
          <p style={SECTION_LABEL}>
            {direction === 'incoming' ? 'الساحب — من كتب الشيك' : 'المستفيد — من سيستلم الشيك'}
          </p>
          <div style={GRID2}>
            {/* CHANGE 3: "نوع الطرف" dropdown → "المستلم / الزبون" text input */}
            <div>
              <label style={{
                fontSize: 13, fontWeight: 500, color: '#374151',
                display: 'block', marginBottom: 6,
              }}>
                المستلم / الزبون *
              </label>
              <input
                type="text"
                value={form.recipient}
                onChange={e => {
                  setForm(p => ({ ...p, recipient: e.target.value }));
                  setErrors(p => ({ ...p, recipient: undefined }));
                }}
                placeholder="أدخل اسم المستلم أو الزبون"
                style={{
                  width: '100%', height: 40,
                  border: `1px solid ${errors.recipient ? '#DC2626' : '#E2E8F0'}`,
                  borderRadius: 8,
                  padding: '0 12px',
                  fontSize: 14,
                  textAlign: 'right',
                  direction: 'rtl',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; }}
                onBlur={e => { e.target.style.borderColor = errors.recipient ? '#DC2626' : '#E2E8F0'; }}
              />
              {errors.recipient && (
                <span style={{ fontSize: 11, color: '#DC2626', display: 'block', marginTop: 4 }}>
                  {errors.recipient}
                </span>
              )}
            </div>

            <Input
              label={direction === 'incoming' ? 'اسم الساحب' : 'اسم المستفيد'}
              value={form.partyName}
              onChange={set('partyName')}
              fullWidth
            />
          </div>
        </section>

        {/* ── Bank Details ── */}
        <section>
          <p style={SECTION_LABEL}>البيانات البنكية</p>
          <div style={GRID2}>
            <Select
              label="البنك *"
              value={form.bankId}
              onChange={handleBankChange}
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

            {/* Account number — manually entered */}
            <div>
              <label style={{
                fontSize: 13, fontWeight: 500, color: '#374151',
                display: 'block', marginBottom: 6,
              }}>
                رقم الحساب *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={form.accountNumber}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setForm(p => ({ ...p, accountNumber: digits }));
                  setErrors(p => ({ ...p, accountNumber: undefined }));
                }}
                onKeyDown={e => {
                  if (e.ctrlKey || e.metaKey) return;
                  const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','Home','End'];
                  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
                }}
                placeholder="أدخل رقم الحساب البنكي"
                style={{
                  width: '100%', height: 40,
                  border: `1px solid ${errors.accountNumber ? '#DC2626' : '#E2E8F0'}`,
                  borderRadius: 8,
                  padding: '0 12px',
                  fontSize: 14,
                  direction: 'ltr',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; }}
                onBlur={e => { e.target.style.borderColor = errors.accountNumber ? '#DC2626' : '#E2E8F0'; }}
              />
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0', textAlign: 'right' }}>
                8-16 رقماً
              </p>
              {errors.accountNumber && (
                <span style={{ fontSize: 11, color: '#DC2626', display: 'block', marginTop: 4 }}>
                  {errors.accountNumber}
                </span>
              )}
            </div>

            {/* CHANGE 4: Check number — exactly 8 digits */}
            <div>
              <label style={{
                fontSize: 13, fontWeight: 500, color: '#374151',
                display: 'block', marginBottom: 6,
              }}>
                رقم الشيك *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={form.checkNumber}
                onChange={handleCheckNumberChange}
                placeholder="أدخل رقم الشيك (8 أرقام)"
                style={{
                  width: '100%', height: 40,
                  border: `1px solid ${
                    form.checkNumber.length === 0 ? '#E2E8F0' :
                    form.checkNumber.length === 8 ? '#BBF7D0' : '#FECACA'
                  }`,
                  borderRadius: 8,
                  padding: '0 12px',
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '4px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  outline: 'none',
                  direction: 'ltr',
                  transition: 'border-color 150ms ease',
                  background: form.checkNumber.length === 8 ? '#F0FDF4' : 'white',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{
                fontSize: 11, margin: '4px 0 0',
                color: form.checkNumber.length === 8 ? '#16A34A' :
                       form.checkNumber.length > 0  ? '#DC2626' : '#94A3B8',
                textAlign: 'right',
              }}>
                {form.checkNumber.length === 8 ? '✓ رقم صحيح' : `${form.checkNumber.length}/8 أرقام`}
              </p>
              {errors.checkNumber && (
                <span style={{ fontSize: 11, color: '#DC2626', display: 'block' }}>
                  {errors.checkNumber}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Cheque Images — optional */}
        <section>
          <p style={SECTION_LABEL}>صور الشيك (اختياري)</p>
          <div style={GRID2}>
            <ImageUploadZone
              label="وجه الشيك (اختياري)"
              icon="ti-credit-card"
              previewSrc={form.chequeImageFront}
              onChange={(file, preview) => {
                setImageFiles(p => ({ ...p, front: file }));
                setForm(p => ({ ...p, chequeImageFront: preview }));
              }}
            />
            <ImageUploadZone
              label="ظهر الشيك (اختياري)"
              icon="ti-credit-card-off"
              previewSrc={form.chequeImageBack}
              onChange={(file, preview) => {
                setImageFiles(p => ({ ...p, back: file }));
                setForm(p => ({ ...p, chequeImageBack: preview }));
              }}
            />
          </div>
        </section>

        {/* ── Notes ── */}
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
