import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CitySearch } from '../ui/CitySearch';
import { useData } from '../../context/DataContext';
import type { Customer } from '../../data/types';
import {
  PAYMENT_TERMS_LABELS,
  SALES_REPS,
  TYPE_LABELS,
  CLASSIFICATION_LABELS,
} from '../../data/customersMock';
import type { PaymentTerms } from '../../data/customersMock';

interface Props {
  customer: Customer;
  onClose: () => void;
}

type FormState = {
  name: string;
  companyName: string;
  type: string;
  classification: string;
  phone: string;
  email: string;
  city: string;
  governorate: string;
  taxId: string;
  paymentTerms: PaymentTerms;
  paymentTermsCustom: string;
  creditLimit: string;
  currency: string;
  salesRep: string;
  status: string;
  notes: string;
};

function toForm(c: Customer): FormState {
  return {
    name:               c.name ?? '',
    companyName:        c.companyName ?? '',
    type:               c.type ?? 'individual',
    classification:     c.classification ?? 'standard',
    phone:              c.phone ?? '',
    email:              c.email ?? '',
    city:               c.city ?? '',
    governorate:        c.governorate ?? '',
    taxId:              c.taxId ?? '',
    paymentTerms:       (c.paymentTerms as PaymentTerms) ?? 'cash',
    paymentTermsCustom: c.paymentTermsCustom ?? '',
    creditLimit:        String(c.creditLimit ?? ''),
    currency:           c.currency ?? 'ILS',
    salesRep:           c.salesRep ?? '',
    status:             c.status ?? 'active',
    notes:              c.notes ?? '',
  };
}

const PAYMENT_TERMS_OPTIONS = (Object.keys(PAYMENT_TERMS_LABELS) as PaymentTerms[]).map(v => ({
  value: v,
  label: PAYMENT_TERMS_LABELS[v],
}));

export function EditCustomerDrawer({ customer, onClose }: Props) {
  const { updateCustomer } = useData();
  const [form, setForm] = useState<FormState>(toForm(customer));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(toForm(customer)); setErrors({}); }, [customer]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'الاسم مطلوب';
    if (!form.phone.trim()) errs.phone = 'رقم الهاتف مطلوب';
    if (form.creditLimit && isNaN(Number(form.creditLimit))) errs.creditLimit = 'قيمة غير صحيحة';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const updated: Customer = {
      ...customer,
      name:              form.name.trim(),
      companyName:       form.companyName.trim() || undefined,
      type:              (form.type as Customer['type']) ?? 'individual',
      classification:    (form.classification as Customer['classification']) ?? 'standard',
      phone:             form.phone.trim(),
      email:             form.email.trim() || undefined,
      city:              form.city.trim() || undefined,
      governorate:       form.governorate.trim() || undefined,
      taxId:             form.taxId.trim() || undefined,
      paymentTerms:      form.paymentTerms as Customer['paymentTerms'],
      paymentTermsCustom: form.paymentTerms === 'custom' ? form.paymentTermsCustom.trim() || undefined : undefined,
      creditLimit:       form.creditLimit ? Number(form.creditLimit) : undefined,
      currency:          form.currency || undefined,
      salesRep:          form.salesRep || undefined,
      status:            form.status as Customer['status'],
      notes:             form.notes.trim() || undefined,
    };
    updateCustomer(updated);
    setSaving(false);
    onClose();
  }

  const field = (label: string, key: keyof FormState, opts?: { type?: string; hint?: string }) => (
    <Input
      label={label}
      value={form[key] as string}
      onChange={e => set(key, e.target.value)}
      error={errors[key]}
      hint={opts?.hint}
      variant={(opts?.type === 'number' ? 'number' : 'text') as 'text' | 'number'}
      fullWidth
    />
  );

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(15,23,42,0.35)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <aside
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          insetInlineEnd: 0,
          width: 420,
          maxWidth: '95vw',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>تعديل بيانات الزبون</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{customer.code ?? customer.id}</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: 4, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name */}
          {field('الاسم *', 'name')}

          {/* Company name */}
          {field('اسم الشركة / المنشأة', 'companyName')}

          {/* Type + Classification */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="نوع الزبون"
              value={form.type}
              onChange={e => set('type', e.target.value)}
              options={[
                { value: 'individual',  label: TYPE_LABELS.individual },
                { value: 'company',     label: TYPE_LABELS.company },
                { value: 'institution', label: TYPE_LABELS.institution },
              ]}
            />
            <Select
              label="التصنيف"
              value={form.classification}
              onChange={e => set('classification', e.target.value)}
              options={[
                { value: 'standard', label: CLASSIFICATION_LABELS.standard },
                { value: 'vip',      label: CLASSIFICATION_LABELS.vip },
                { value: 'risk',     label: CLASSIFICATION_LABELS.risk },
              ]}
            />
          </div>

          {/* Phone + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('الهاتف *', 'phone')}
            {field('البريد الإلكتروني', 'email')}
          </div>

          {/* City search */}
          <CitySearch
            label="المدينة / القرية"
            value={form.city}
            onChange={(city, governorate) => {
              set('city', city);
              set('governorate', governorate);
            }}
            error={errors.city}
          />

          {/* Governorate (auto-filled, read-only display) */}
          {form.governorate && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: -8 }}>
              المحافظة: <strong style={{ color: '#0f172a' }}>{form.governorate}</strong>
            </div>
          )}

          {/* Tax ID */}
          {field('الرقم الضريبي', 'taxId')}

          {/* Payment terms */}
          <div>
            <Select
              label="شروط الدفع"
              value={form.paymentTerms}
              onChange={e => set('paymentTerms', e.target.value)}
              options={PAYMENT_TERMS_OPTIONS}
            />
            {form.paymentTerms === 'custom' && (
              <div style={{ marginTop: 8 }}>
                {field('وصف شروط الدفع المخصصة', 'paymentTermsCustom')}
              </div>
            )}
          </div>

          {/* Credit limit + Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Input
              label="حد الائتمان"
              variant="number"
              value={form.creditLimit}
              onChange={e => set('creditLimit', e.target.value)}
              error={errors.creditLimit}
              fullWidth
            />
            <Select
              label="العملة"
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
              options={[
                { value: 'ILS', label: 'شيكل ₪' },
                { value: 'USD', label: 'دولار $' },
                { value: 'JOD', label: 'دينار د.أ' },
              ]}
            />
          </div>

          {/* Sales rep */}
          <Select
            label="مندوب المبيعات"
            value={form.salesRep}
            onChange={e => set('salesRep', e.target.value)}
            options={[
              { value: '', label: 'بدون مندوب', disabled: false },
              ...SALES_REPS.map(r => ({ value: r, label: r })),
            ]}
          />

          {/* Status */}
          <Select
            label="الحالة"
            value={form.status}
            onChange={e => set('status', e.target.value)}
            options={[
              { value: 'active',   label: 'نشط' },
              { value: 'inactive', label: 'غير نشط' },
              { value: 'archived', label: 'مؤرشف' },
            ]}
          />

          {/* Notes */}
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ملاحظات
            </p>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
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

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
        }}>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
