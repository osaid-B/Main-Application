import { useState } from 'react'
import { X, AlertTriangle, Info } from 'lucide-react'
import { useTreasury } from '../../context/TreasuryContext'
import type { TreasuryInstrument } from '../../types/treasury'
import { TREASURY_BANK_ACCOUNTS } from '../../data/treasuryMock'

interface StatusModalsProps {
  instrument: TreasuryInstrument | null
  action: string | null
  onClose: () => void
  onDone: () => void
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function todayDDMMYYYY(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/* ─── Modal: تقديم ────────────────────────────────────────────────────────── */

function SubmitModal({
  instrument,
  onClose,
  onDone,
}: {
  instrument: TreasuryInstrument
  onClose: () => void
  onDone: () => void
}) {
  const { updateInstrumentStatus } = useTreasury()

  function handleConfirm() {
    updateInstrumentStatus(instrument.id, 'pending', 'تم التقديم للمعالجة')
    onDone()
  }

  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box">
        <div className="trs-modal-header">
          <span className="trs-modal-title">تقديم للمعالجة</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          <div className="trs-modal-confirm-message">
            <Info size={20} className="trs-modal-icon trs-modal-icon--info" />
            <p>هل تريد تقديم الشيك للمعالجة؟</p>
          </div>
          <div className="trs-modal-instrument-ref">
            المرجع: <strong>{instrument.id}</strong>
          </div>
        </div>
        <div className="trs-modal-footer">
          <button type="button" className="trs-modal-btn trs-modal-btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="trs-modal-btn trs-modal-btn--primary" onClick={handleConfirm}>
            تأكيد التقديم
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: تسجيل إيداع ──────────────────────────────────────────────────── */

function DepositModal({
  instrument,
  onClose,
  onDone,
}: {
  instrument: TreasuryInstrument
  onClose: () => void
  onDone: () => void
}) {
  const { updateInstrumentStatus } = useTreasury()
  const [bankAccountId, setBankAccountId] = useState('')
  const [depositDate, setDepositDate] = useState(todayDDMMYYYY())
  const [depositRef, setDepositRef] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ bankAccountId?: string; depositDate?: string }>({})

  function validate(): boolean {
    const errs: { bankAccountId?: string; depositDate?: string } = {}
    if (!bankAccountId) errs.bankAccountId = 'يرجى اختيار الحساب البنكي'
    if (!depositDate.trim()) errs.depositDate = 'يرجى إدخال تاريخ الإيداع'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleConfirm() {
    if (!validate()) return
    const account = TREASURY_BANK_ACCOUNTS.find(a => a.id === bankAccountId)
    const bankLabel = account ? `${account.bankName} — ${account.branchName}` : bankAccountId
    const refPart = depositRef.trim() ? ` — مرجع: ${depositRef.trim()}` : ''
    const noteText = `تم الإيداع في ${bankLabel}${refPart}`
    updateInstrumentStatus(instrument.id, 'deposited', noteText)
    onDone()
  }

  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box">
        <div className="trs-modal-header">
          <span className="trs-modal-title">تسجيل إيداع</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          <div className="trs-modal-field">
            <label className="trs-modal-label">
              الحساب البنكي <span className="trs-modal-required">*</span>
            </label>
            <select
              className={`trs-modal-input${errors.bankAccountId ? ' trs-modal-input--error' : ''}`}
              value={bankAccountId}
              onChange={e => {
                setBankAccountId(e.target.value)
                setErrors(prev => ({ ...prev, bankAccountId: undefined }))
              }}
            >
              <option value="">اختر الحساب البنكي</option>
              {TREASURY_BANK_ACCOUNTS.filter(a => a.isActive).map(account => (
                <option key={account.id} value={account.id}>
                  {account.bankName} — {account.branchName} ({account.currency})
                </option>
              ))}
            </select>
            {errors.bankAccountId && (
              <span className="trs-modal-error-msg">{errors.bankAccountId}</span>
            )}
          </div>

          <div className="trs-modal-field">
            <label className="trs-modal-label">
              تاريخ الإيداع <span className="trs-modal-required">*</span>
            </label>
            <input
              type="text"
              className={`trs-modal-input${errors.depositDate ? ' trs-modal-input--error' : ''}`}
              value={depositDate}
              onChange={e => {
                setDepositDate(e.target.value)
                setErrors(prev => ({ ...prev, depositDate: undefined }))
              }}
              placeholder="DD/MM/YYYY"
            />
            {errors.depositDate && (
              <span className="trs-modal-error-msg">{errors.depositDate}</span>
            )}
          </div>

          <div className="trs-modal-field">
            <label className="trs-modal-label">مرجع الإيداع</label>
            <input
              type="text"
              className="trs-modal-input"
              value={depositRef}
              onChange={e => setDepositRef(e.target.value)}
              placeholder="رقم إيصال الإيداع البنكي"
            />
          </div>

          <div className="trs-modal-field">
            <label className="trs-modal-label">ملاحظات</label>
            <textarea
              className="trs-modal-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>
        </div>
        <div className="trs-modal-footer">
          <button type="button" className="trs-modal-btn trs-modal-btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="trs-modal-btn trs-modal-btn--primary" onClick={handleConfirm}>
            تأكيد الإيداع
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: تأكيد التحصيل ───────────────────────────────────────────────── */

function ClearModal({
  instrument,
  onClose,
  onDone,
}: {
  instrument: TreasuryInstrument
  onClose: () => void
  onDone: () => void
}) {
  const { updateInstrumentStatus } = useTreasury()
  const [bankRef, setBankRef] = useState('')
  const [clearDate, setClearDate] = useState(todayISO())
  const [errors, setErrors] = useState<{ bankRef?: string; clearDate?: string }>({})
  const [showSuccess, setShowSuccess] = useState(false)

  function validate(): boolean {
    const errs: { bankRef?: string; clearDate?: string } = {}
    if (!bankRef.trim()) errs.bankRef = 'يرجى إدخال رقم مرجع البنك'
    if (!clearDate) errs.clearDate = 'يرجى إدخال تاريخ التحصيل'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleConfirm() {
    if (!validate()) return
    const noteText = `تم التحصيل — مرجع: ${bankRef.trim()}`
    updateInstrumentStatus(instrument.id, 'cleared', noteText)
    setShowSuccess(true)
    setTimeout(() => {
      onDone()
    }, 1500)
  }

  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box">
        <div className="trs-modal-header">
          <span className="trs-modal-title">تأكيد التحصيل</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          {showSuccess ? (
            <div className="trs-success-banner">
              تم تحصيل الشيك وتحديث حالة الفواتير المرتبطة ✓
            </div>
          ) : (
            <>
              <div className="trs-modal-field">
                <label className="trs-modal-label">
                  رقم مرجع البنك <span className="trs-modal-required">*</span>
                </label>
                <input
                  type="text"
                  className={`trs-modal-input${errors.bankRef ? ' trs-modal-input--error' : ''}`}
                  value={bankRef}
                  onChange={e => {
                    setBankRef(e.target.value)
                    setErrors(prev => ({ ...prev, bankRef: undefined }))
                  }}
                  placeholder="مثال: REF-921"
                />
                {errors.bankRef && (
                  <span className="trs-modal-error-msg">{errors.bankRef}</span>
                )}
              </div>

              <div className="trs-modal-field">
                <label className="trs-modal-label">
                  تاريخ التحصيل <span className="trs-modal-required">*</span>
                </label>
                <input
                  type="date"
                  className={`trs-modal-input${errors.clearDate ? ' trs-modal-input--error' : ''}`}
                  value={clearDate}
                  onChange={e => {
                    setClearDate(e.target.value)
                    setErrors(prev => ({ ...prev, clearDate: undefined }))
                  }}
                />
                {errors.clearDate && (
                  <span className="trs-modal-error-msg">{errors.clearDate}</span>
                )}
              </div>
            </>
          )}
        </div>
        {!showSuccess && (
          <div className="trs-modal-footer">
            <button type="button" className="trs-modal-btn trs-modal-btn--ghost" onClick={onClose}>
              إلغاء
            </button>
            <button type="button" className="trs-modal-btn trs-modal-btn--primary" onClick={handleConfirm}>
              تأكيد التحصيل
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Modal: تسجيل ارتجاع ────────────────────────────────────────────────── */

const BOUNCE_REASONS = [
  'رصيد غير كافٍ',
  'توقيع غير مطابق',
  'تاريخ منتهٍ',
  'حساب مغلق',
  'أمر إيقاف الصرف',
  'أخرى',
]

function BounceModal({
  instrument,
  onClose,
  onDone,
}: {
  instrument: TreasuryInstrument
  onClose: () => void
  onDone: () => void
}) {
  const { updateInstrumentStatus } = useTreasury()
  const [reason, setReason] = useState('')
  const [noticeRef, setNoticeRef] = useState('')
  const [errors, setErrors] = useState<{ reason?: string }>({})
  const [showLegal, setShowLegal] = useState(false)

  function validate(): boolean {
    const errs: { reason?: string } = {}
    if (!reason) errs.reason = 'يرجى اختيار سبب الارتجاع'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleRegister() {
    if (!validate()) return
    const noteText = `سبب الارتجاع: ${reason}${noticeRef.trim() ? ` — مرجع الإشعار: ${noticeRef.trim()}` : ''}`
    updateInstrumentStatus(instrument.id, 'bounced', noteText)
    setShowLegal(true)
  }

  function handleDone() {
    onDone()
  }

  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box trs-modal-box--wide">
        <div className="trs-modal-header">
          <span className="trs-modal-title">تسجيل ارتجاع</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          <div className="trs-modal-field">
            <label className="trs-modal-label">
              سبب الارتجاع <span className="trs-modal-required">*</span>
            </label>
            <select
              className={`trs-modal-input${errors.reason ? ' trs-modal-input--error' : ''}`}
              value={reason}
              onChange={e => {
                setReason(e.target.value)
                setErrors(prev => ({ ...prev, reason: undefined }))
              }}
              disabled={showLegal}
            >
              <option value="">اختر سبب الارتجاع</option>
              {BOUNCE_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.reason && (
              <span className="trs-modal-error-msg">{errors.reason}</span>
            )}
          </div>

          <div className="trs-modal-field">
            <label className="trs-modal-label">مرجع الإشعار البنكي</label>
            <input
              type="text"
              className="trs-modal-input"
              value={noticeRef}
              onChange={e => setNoticeRef(e.target.value)}
              placeholder="مثال: BNK-4421"
              disabled={showLegal}
            />
          </div>

          {showLegal && (
            <div className="trs-legal-info-panel">
              <div className="trs-legal-info-panel__header">
                <AlertTriangle size={16} className="trs-legal-info-panel__icon" />
                <span>معلومات قانونية هامة</span>
              </div>
              <p className="trs-legal-info-panel__text">
                وفقاً لقانون التجارة الفلسطيني، يحق لك متابعة الأمر قانونياً.
                يمكنك تقديم شكوى في المحكمة خلال ٣ أشهر من تاريخ الارتجاع.
              </p>
            </div>
          )}
        </div>
        <div className="trs-modal-footer">
          {showLegal ? (
            <button type="button" className="trs-modal-btn trs-modal-btn--primary" onClick={handleDone}>
              إغلاق
            </button>
          ) : (
            <>
              <button type="button" className="trs-modal-btn trs-modal-btn--ghost" onClick={onClose}>
                إلغاء
              </button>
              <button type="button" className="trs-modal-btn trs-modal-btn--danger" onClick={handleRegister}>
                تسجيل الارتجاع
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: إعادة إيداع ─────────────────────────────────────────────────── */

function ReDepositModal({
  instrument,
  onClose,
  onDone,
}: {
  instrument: TreasuryInstrument
  onClose: () => void
  onDone: () => void
}) {
  const { updateInstrumentStatus } = useTreasury()
  const [confirmed, setConfirmed] = useState(false)
  const [reDepositDate, setReDepositDate] = useState(todayISO())
  const [errors, setErrors] = useState<{ reDepositDate?: string }>({})

  function validate(): boolean {
    const errs: { reDepositDate?: string } = {}
    if (!reDepositDate) errs.reDepositDate = 'يرجى إدخال تاريخ إعادة الإيداع'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleConfirm() {
    if (!confirmed || !validate()) return
    updateInstrumentStatus(instrument.id, 'deposited', 'إعادة إيداع بعد الارتجاع')
    onDone()
  }

  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box">
        <div className="trs-modal-header">
          <span className="trs-modal-title">إعادة إيداع</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          <div className="trs-modal-field">
            <label className="trs-modal-checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="trs-modal-checkbox"
              />
              <span>تأكدت من توفر الرصيد مع الساحب</span>
            </label>
          </div>

          <div className="trs-modal-field">
            <label className="trs-modal-label">
              تاريخ إعادة الإيداع <span className="trs-modal-required">*</span>
            </label>
            <input
              type="date"
              className={`trs-modal-input${errors.reDepositDate ? ' trs-modal-input--error' : ''}`}
              value={reDepositDate}
              onChange={e => {
                setReDepositDate(e.target.value)
                setErrors(prev => ({ ...prev, reDepositDate: undefined }))
              }}
            />
            {errors.reDepositDate && (
              <span className="trs-modal-error-msg">{errors.reDepositDate}</span>
            )}
          </div>
        </div>
        <div className="trs-modal-footer">
          <button type="button" className="trs-modal-btn trs-modal-btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="trs-modal-btn trs-modal-btn--primary"
            onClick={handleConfirm}
            disabled={!confirmed}
          >
            إعادة الإيداع
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: إجراء قانوني ────────────────────────────────────────────────── */

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box trs-modal-box--wide">
        <div className="trs-modal-header">
          <span className="trs-modal-title">خطوات التعامل مع الشيك المرتجع في فلسطين</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          <ol className="trs-legal-steps">
            <li>احتفظ بأصل الشيك والإشعار البنكي</li>
            <li>أرسل إشعاراً خطياً للساحب (بريد موصى)</li>
            <li>انتظر ٣ أيام عمل للرد</li>
            <li>
              في حال عدم الاستجابة، قدّم شكوى إلى نيابة الأموال العامة أو المحكمة
              المختصة في محافظتك
            </li>
            <li>
              ستحتاج: أصل الشيك، إشعار الارتجاع، عقد أو فاتورة تثبت الدين
            </li>
          </ol>
        </div>
        <div className="trs-modal-footer">
          <button
            type="button"
            className="trs-modal-btn trs-modal-btn--ghost"
            onClick={() => window.print()}
          >
            طباعة هذه التعليمات
          </button>
          <button type="button" className="trs-modal-btn trs-modal-btn--primary" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: إلغاء ───────────────────────────────────────────────────────── */

function CancelModal({
  instrument,
  onClose,
  onDone,
}: {
  instrument: TreasuryInstrument
  onClose: () => void
  onDone: () => void
}) {
  const { updateInstrumentStatus } = useTreasury()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function handleConfirm() {
    if (!reason.trim()) {
      setError('يرجى إدخال سبب الإلغاء')
      return
    }
    updateInstrumentStatus(instrument.id, 'cancelled', reason.trim())
    onDone()
  }

  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box">
        <div className="trs-modal-header">
          <span className="trs-modal-title">إلغاء الأداة المالية</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          <div className="trs-modal-confirm-message trs-modal-confirm-message--warn">
            <AlertTriangle size={20} className="trs-modal-icon trs-modal-icon--warn" />
            <p>هذا الإجراء لا يمكن التراجع عنه. يرجى إدخال سبب الإلغاء.</p>
          </div>
          <div className="trs-modal-field" style={{ marginTop: '12px' }}>
            <label className="trs-modal-label">
              سبب الإلغاء <span className="trs-modal-required">*</span>
            </label>
            <textarea
              className={`trs-modal-textarea${error ? ' trs-modal-input--error' : ''}`}
              value={reason}
              onChange={e => {
                setReason(e.target.value)
                setError('')
              }}
              placeholder="اكتب سبب الإلغاء..."
              rows={3}
            />
            {error && <span className="trs-modal-error-msg">{error}</span>}
          </div>
        </div>
        <div className="trs-modal-footer">
          <button type="button" className="trs-modal-btn trs-modal-btn--ghost" onClick={onClose}>
            رجوع
          </button>
          <button type="button" className="trs-modal-btn trs-modal-btn--danger" onClick={handleConfirm}>
            تأكيد الإلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal: مراجعة يدوية ────────────────────────────────────────────────── */

function ReviewModal({
  instrument,
  onClose,
  onDone,
}: {
  instrument: TreasuryInstrument
  onClose: () => void
  onDone: () => void
}) {
  const { updateInstrumentStatus } = useTreasury()

  function handleConfirm() {
    updateInstrumentStatus(instrument.id, 'cleared', 'تم التحقق يدوياً')
    onDone()
  }

  return (
    <div className="trs-modal-overlay" role="dialog" aria-modal="true" dir="rtl">
      <div className="trs-modal-box trs-modal-box--wide">
        <div className="trs-modal-header">
          <span className="trs-modal-title">مراجعة يدوية لبيانات MICR</span>
          <button type="button" className="trs-modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>
        <div className="trs-modal-body">
          <div className="trs-modal-micr-box">
            <div className="trs-modal-micr-label">البيانات الخام (MICR)</div>
            <div className="trs-modal-micr-raw" dir="ltr">
              {instrument.micrRaw || '—'}
            </div>
            <div className="trs-modal-micr-fields">
              <div className="trs-modal-micr-row">
                <span className="trs-modal-micr-key">كود البنك</span>
                <span className="trs-modal-micr-val" dir="ltr">{instrument.micrBankCode || '—'}</span>
              </div>
              <div className="trs-modal-micr-row">
                <span className="trs-modal-micr-key">رقم الحساب</span>
                <span className="trs-modal-micr-val" dir="ltr">{instrument.micrAccountNumber || '—'}</span>
              </div>
              <div className="trs-modal-micr-row">
                <span className="trs-modal-micr-key">رقم الشيك</span>
                <span className="trs-modal-micr-val" dir="ltr">{instrument.micrCheckNumber || '—'}</span>
              </div>
              <div className="trs-modal-micr-row">
                <span className="trs-modal-micr-key">حالة التحقق</span>
                <span
                  className={`trs-modal-micr-val${instrument.micrVerified ? ' trs-modal-micr-val--ok' : ' trs-modal-micr-val--warn'}`}
                >
                  {instrument.micrVerified ? 'تم التحقق' : 'بانتظار المراجعة'}
                </span>
              </div>
            </div>
          </div>

          <div className="trs-modal-review-note">
            <Info size={15} />
            <span>بعد مراجعة البيانات أعلاه والتأكد من صحتها، اضغط "تأكيد البيانات يدوياً" لتحصيل الشيك.</span>
          </div>
        </div>
        <div className="trs-modal-footer">
          <button type="button" className="trs-modal-btn trs-modal-btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="trs-modal-btn trs-modal-btn--primary" onClick={handleConfirm}>
            تأكيد البيانات يدوياً
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Root component ─────────────────────────────────────────────────────── */

export default function StatusModals({ instrument, action, onClose, onDone }: StatusModalsProps) {
  if (!instrument) return null

  const normalizedAction = action === 'manual_review' ? 'review' : action

  return (
    <>
      <style>{`
        /* ── Overlay ── */
        .trs-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          z-index: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: trs-modal-fade-in 160ms ease forwards;
        }
        @keyframes trs-modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Box ── */
        .trs-modal-box {
          background: var(--app-surface);
          border-radius: 12px;
          box-shadow: 0 8px 40px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.1);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          animation: trs-modal-slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .trs-modal-box--wide {
          max-width: 560px;
        }
        @keyframes trs-modal-slide-up {
          from { transform: translateY(12px); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* ── Header ── */
        .trs-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 14px;
          border-bottom: 1px solid var(--app-border);
          flex-shrink: 0;
        }
        .trs-modal-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--app-text);
          line-height: 1.3;
        }
        .trs-modal-close {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: var(--app-surface-muted);
          border-radius: 8px;
          cursor: pointer;
          color: var(--app-text-muted);
          transition: background 150ms, color 150ms;
          flex-shrink: 0;
          margin-inline-start: 8px;
        }
        .trs-modal-close:hover {
          background: var(--atlas-danger, #ef4444);
          color: #fff;
        }

        /* ── Body ── */
        .trs-modal-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── Fields ── */
        .trs-modal-field {
          margin-bottom: 14px;
        }
        .trs-modal-field:last-child {
          margin-bottom: 0;
        }
        .trs-modal-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--app-text-soft);
          margin-bottom: 5px;
        }
        .trs-modal-required {
          color: var(--atlas-danger, #ef4444);
          margin-inline-start: 2px;
        }
        .trs-modal-input {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          border: 1px solid var(--app-border);
          border-radius: 8px;
          background: var(--app-surface);
          color: var(--app-text);
          font-size: 13px;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 150ms, box-shadow 150ms;
          appearance: auto;
        }
        .trs-modal-input:focus {
          outline: none;
          border-color: #3B5BDB;
          box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.1);
        }
        .trs-modal-input--error {
          border-color: var(--atlas-danger, #ef4444);
        }
        .trs-modal-input--error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        .trs-modal-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--app-border);
          border-radius: 8px;
          background: var(--app-surface);
          color: var(--app-text);
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
          line-height: 1.5;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .trs-modal-textarea:focus {
          outline: none;
          border-color: #3B5BDB;
          box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.1);
        }
        .trs-modal-error-msg {
          display: block;
          font-size: 11px;
          color: var(--atlas-danger, #ef4444);
          margin-top: 4px;
          font-weight: 500;
        }

        /* ── Checkbox ── */
        .trs-modal-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: var(--app-text-soft);
          cursor: pointer;
          line-height: 1.5;
          font-weight: 500;
        }
        .trs-modal-checkbox {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 2px;
          accent-color: #3B5BDB;
          cursor: pointer;
        }

        /* ── Footer ── */
        .trs-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding: 14px 20px;
          border-top: 1px solid var(--app-border);
          flex-shrink: 0;
        }

        /* ── Buttons ── */
        .trs-modal-btn {
          height: 38px;
          padding: 0 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 150ms, opacity 150ms, box-shadow 150ms;
          white-space: nowrap;
          border: none;
        }
        .trs-modal-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .trs-modal-btn--primary {
          background: #3B5BDB;
          color: #fff;
          border: none;
        }
        .trs-modal-btn--primary:hover:not(:disabled) {
          background: #2748b5;
          box-shadow: 0 2px 8px rgba(59, 91, 219, 0.25);
        }
        .trs-modal-btn--danger {
          background: var(--atlas-danger, #ef4444);
          color: #fff;
          border: none;
        }
        .trs-modal-btn--danger:hover:not(:disabled) {
          background: #dc2626;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
        }
        .trs-modal-btn--ghost {
          background: var(--app-surface-muted);
          color: var(--app-text-soft);
          border: 1px solid var(--app-border);
        }
        .trs-modal-btn--ghost:hover {
          background: var(--app-surface-hover);
        }

        /* ── Confirm message ── */
        .trs-modal-confirm-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: var(--atlas-blue-50, #eff6ff);
          border: 1px solid var(--atlas-blue-200, #bfdbfe);
          border-radius: 8px;
          font-size: 14px;
          color: var(--app-text-soft);
          line-height: 1.5;
        }
        .trs-modal-confirm-message p {
          margin: 0;
        }
        .trs-modal-confirm-message--warn {
          background: #FFF7ED;
          border-color: #FED7AA;
        }
        .trs-modal-icon--info {
          color: #3B5BDB;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .trs-modal-icon--warn {
          color: var(--atlas-warning, #f97316);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .trs-modal-instrument-ref {
          margin-top: 12px;
          font-size: 13px;
          color: var(--app-text-muted);
        }

        /* ── Success banner ── */
        .trs-success-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 18px;
          background: var(--atlas-green-50, #ecfdf5);
          border: 1px solid var(--atlas-green-200, #a7f3d0);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--atlas-green-700, #047857);
          line-height: 1.5;
        }

        /* ── Legal info panel ── */
        .trs-legal-info-panel {
          margin-top: 14px;
          padding: 14px 16px;
          background: #FFF7ED;
          border: 1px solid #FED7AA;
          border-radius: 8px;
        }
        .trs-legal-info-panel__header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--atlas-orange-600, #ea580c);
          margin-bottom: 8px;
        }
        .trs-legal-info-panel__icon {
          color: var(--atlas-orange-600, #ea580c);
          flex-shrink: 0;
        }
        .trs-legal-info-panel__text {
          font-size: 13px;
          color: var(--app-text-soft);
          line-height: 1.6;
          margin: 0;
        }

        /* ── Legal steps ── */
        .trs-legal-steps {
          margin: 0;
          padding: 0;
          padding-inline-start: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          counter-reset: legal-steps;
          list-style: none;
        }
        .trs-legal-steps li {
          counter-increment: legal-steps;
          font-size: 14px;
          color: var(--app-text-soft);
          line-height: 1.6;
          position: relative;
          padding-inline-start: 28px;
        }
        .trs-legal-steps li::before {
          content: counter(legal-steps);
          position: absolute;
          inset-inline-start: 0;
          top: 1px;
          width: 22px;
          height: 22px;
          background: #eef2ff;
          color: #3B5BDB;
          font-weight: 700;
          font-size: 12px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #c7d2fe;
          flex-shrink: 0;
        }

        /* ── MICR review box ── */
        .trs-modal-micr-box {
          background: var(--app-surface-muted);
          border: 1px solid var(--app-border);
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }
        .trs-modal-micr-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--app-text-muted);
          margin-bottom: 10px;
        }
        .trs-modal-micr-raw {
          font-family: "IBM Plex Mono", "Geist Mono", ui-monospace, monospace;
          font-size: 14px;
          color: var(--app-text);
          letter-spacing: 0.06em;
          word-break: break-all;
          margin-bottom: 12px;
          padding: 8px 10px;
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 6px;
        }
        .trs-modal-micr-fields {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .trs-modal-micr-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px;
          align-items: baseline;
        }
        .trs-modal-micr-key {
          font-size: 12px;
          color: var(--app-text-muted);
          font-weight: 500;
        }
        .trs-modal-micr-val {
          font-family: "IBM Plex Mono", "Geist Mono", ui-monospace, monospace;
          font-size: 12px;
          color: var(--app-text);
          font-weight: 600;
        }
        .trs-modal-micr-val--ok {
          color: var(--atlas-success, #10b981);
          font-family: inherit;
        }
        .trs-modal-micr-val--warn {
          color: var(--atlas-warning, #f97316);
          font-family: inherit;
        }

        /* ── Review note ── */
        .trs-modal-review-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--app-text-muted);
          line-height: 1.5;
          padding: 10px 12px;
          background: var(--atlas-blue-50, #eff6ff);
          border-radius: 6px;
          border: 1px solid var(--atlas-blue-200, #bfdbfe);
        }
        .trs-modal-review-note svg {
          color: #3B5BDB;
          flex-shrink: 0;
          margin-top: 1px;
        }
      `}</style>

      {normalizedAction === 'submit' && (
        <SubmitModal instrument={instrument} onClose={onClose} onDone={onDone} />
      )}
      {normalizedAction === 'deposit' && (
        <DepositModal instrument={instrument} onClose={onClose} onDone={onDone} />
      )}
      {normalizedAction === 'clear' && (
        <ClearModal instrument={instrument} onClose={onClose} onDone={onDone} />
      )}
      {normalizedAction === 'bounce' && (
        <BounceModal instrument={instrument} onClose={onClose} onDone={onDone} />
      )}
      {normalizedAction === 'redeposit' && (
        <ReDepositModal instrument={instrument} onClose={onClose} onDone={onDone} />
      )}
      {normalizedAction === 'legal' && (
        <LegalModal onClose={onClose} />
      )}
      {normalizedAction === 'cancel' && (
        <CancelModal instrument={instrument} onClose={onClose} onDone={onDone} />
      )}
      {normalizedAction === 'review' && (
        <ReviewModal instrument={instrument} onClose={onClose} onDone={onDone} />
      )}
    </>
  )
}
