import { useState, useCallback } from 'react'
import { X, ScanLine, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useTreasury } from '../../context/TreasuryContext'
import { useData } from '../../context/DataContext'
import { PALESTINIAN_BANKS, STATUS_AR } from '../../types/treasury'
import type { TreasuryInstrument, InstrumentType, InstrumentDirection, PalestinianCurrency } from '../../types/treasury'
import { parseMicrLine, DEMO_MICR_SCAN } from '../../utils/micrParser'
import type { MicrParseResult } from '../../utils/micrParser'

/* ─── suppress STATUS_AR unused warning — it is part of the required imports ── */
void STATUS_AR

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface InstrumentFormProps {
  mode: 'check' | 'transfer'
  onClose: () => void
  onSaved: (instrument: TreasuryInstrument) => void
}

/* ─── OCR field source tracking ─────────────────────────────────────────── */

type FieldSource = 'manual' | 'ocr' | 'verified'

interface OcrFieldSources {
  bankId: FieldSource
  branchCode: FieldSource
  accountNumber: FieldSource
  checkNumber: FieldSource
  amount: FieldSource
}

/* ─── Validation errors shape ────────────────────────────────────────────── */

interface FormErrors {
  amount?: string
  instrumentDate?: string
  dueDate?: string
  drawerName?: string
  bankId?: string
  accountNumber?: string
  checkNumber?: string
  partyName?: string
  transferDate?: string
  iban?: string
  reference?: string
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function parseDDMMYYYY(str: string): Date | null {
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, d, m, y] = match
  const date = new Date(`${y}-${m}-${d}`)
  if (isNaN(date.getTime())) return null
  return date
}

function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function toISODate(ddmmyyyy: string): string {
  const match = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ddmmyyyy
  const [, d, m, y] = match
  return `${y}-${m}-${d}`
}

function todayDDMMYYYY(): string {
  const d = today()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function InstrumentForm({ mode, onClose, onSaved }: InstrumentFormProps) {
  const { addInstrument } = useTreasury()
  const { customers, suppliers } = useData()

  /* ── Shared fields ─────────────────────────────────────────────────────── */
  const [direction, setDirection] = useState<InstrumentDirection>('incoming')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<PalestinianCurrency>('ILS')
  const [notes, setNotes] = useState('')

  /* ── Check-specific fields ─────────────────────────────────────────────── */
  const [instrumentDate, setInstrumentDate] = useState(todayDDMMYYYY())
  const [dueDate, setDueDate] = useState('')
  const [partyType, setPartyType] = useState<'customer' | 'supplier' | 'other'>('customer')
  const [selectedPartyId, setSelectedPartyId] = useState('')
  const [drawerName, setDrawerName] = useState('')
  const [otherPhone, setOtherPhone] = useState('')
  const [bankId, setBankId] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [micrRaw, setMicrRaw] = useState('')
  const [micrExpanded, setMicrExpanded] = useState(false)

  /* ── Transfer-specific fields ──────────────────────────────────────────── */
  const [transferDate, setTransferDate] = useState(todayDDMMYYYY())
  const [partyName, setPartyName] = useState('')
  const [transferBankId, setTransferBankId] = useState('')
  const [iban, setIban] = useState('')
  const [reference, setReference] = useState('')

  /* ── OCR state ─────────────────────────────────────────────────────────── */
  const [ocrState, setOcrState] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [ocrResult, setOcrResult] = useState<MicrParseResult | null>(null)
  const [ocrSources, setOcrSources] = useState<OcrFieldSources>({
    bankId: 'manual',
    branchCode: 'manual',
    accountNumber: 'manual',
    checkNumber: 'manual',
    amount: 'manual',
  })

  /* ── Validation ────────────────────────────────────────────────────────── */
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  /* ── Date warnings ─────────────────────────────────────────────────────── */
  const dueDateObj = parseDDMMYYYY(dueDate)
  const instrDateObj = parseDDMMYYYY(instrumentDate)
  const todayDate = today()
  const sixMonthsFromNow = addMonths(todayDate, 6)

  const dueDateWarning: string | null = (() => {
    if (!dueDateObj) return null
    if (instrDateObj && dueDateObj < instrDateObj) {
      return 'تاريخ الاستحقاق يجب أن يكون بعد تاريخ الشيك'
    }
    if (dueDateObj < todayDate) {
      return 'تاريخ الاستحقاق منتهٍ — هذا الشيك لا يمكن صرفه'
    }
    if (dueDateObj > sixMonthsFromNow) {
      return 'شيك آجل بعيد — تأكد من صحة التاريخ'
    }
    return null
  })()

  const dueDateWarningSeverity: 'orange' | 'red' | null = (() => {
    if (!dueDateObj) return null
    if (dueDateObj < todayDate) return 'red'
    if (dueDateObj > sixMonthsFromNow) return 'orange'
    if (instrDateObj && dueDateObj < instrDateObj) return 'red'
    return null
  })()

  /* ── OCR handlers ──────────────────────────────────────────────────────── */
  const handleScan = useCallback(() => {
    setOcrState('scanning')
    setTimeout(() => {
      const result = parseMicrLine(DEMO_MICR_SCAN)
      setOcrResult(result)
      setOcrState('done')
    }, 1500)
  }, [])

  const handleConfirmOcr = useCallback(() => {
    if (!ocrResult) return
    if (ocrResult.bank) {
      setBankId(ocrResult.bank.id)
      setOcrSources(prev => ({ ...prev, bankId: 'ocr' }))
    }
    if (ocrResult.branchCode) {
      setBranchCode(ocrResult.branchCode)
      setOcrSources(prev => ({ ...prev, branchCode: 'ocr' }))
    }
    if (ocrResult.accountNumber) {
      setAccountNumber(ocrResult.accountNumber)
      setOcrSources(prev => ({ ...prev, accountNumber: 'ocr' }))
    }
    if (ocrResult.checkNumber) {
      setCheckNumber(ocrResult.checkNumber)
      setOcrSources(prev => ({ ...prev, checkNumber: 'ocr' }))
    }
    setMicrRaw(ocrResult.raw)
    setMicrExpanded(true)
  }, [ocrResult])

  const handleManualMicrParse = useCallback(() => {
    if (!micrRaw.trim()) return
    const result = parseMicrLine(micrRaw)
    setOcrResult(result)
    if (result.bank) {
      setBankId(result.bank.id)
      setOcrSources(prev => ({ ...prev, bankId: 'ocr' }))
    }
    if (result.branchCode) {
      setBranchCode(result.branchCode)
      setOcrSources(prev => ({ ...prev, branchCode: 'ocr' }))
    }
    if (result.accountNumber) {
      setAccountNumber(result.accountNumber)
      setOcrSources(prev => ({ ...prev, accountNumber: 'ocr' }))
    }
    if (result.checkNumber) {
      setCheckNumber(result.checkNumber)
      setOcrSources(prev => ({ ...prev, checkNumber: 'ocr' }))
    }
  }, [micrRaw])

  /* ── Mark field as manually edited (clears OCR yellow) ─────────────────── */
  const markVerified = useCallback((field: keyof OcrFieldSources) => {
    setOcrSources(prev => {
      if (prev[field] === 'ocr') {
        return { ...prev, [field]: 'verified' }
      }
      return prev
    })
  }, [])

  /* ── Party select ──────────────────────────────────────────────────────── */
  const partyOptions = partyType === 'customer'
    ? customers.filter(c => !c.isDeleted)
    : partyType === 'supplier'
      ? suppliers.filter(s => !s.isDeleted)
      : []

  const handlePartySelect = useCallback((id: string) => {
    setSelectedPartyId(id)
    const found = partyType === 'customer'
      ? customers.find(c => c.id === id)
      : suppliers.find(s => s.id === id)
    if (found) setDrawerName(found.name)
  }, [partyType, customers, suppliers])

  /* ── Validation ────────────────────────────────────────────────────────── */
  const validateCheck = useCallback((): FormErrors => {
    const errs: FormErrors = {}
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر'
    }
    if (!instrumentDate || !parseDDMMYYYY(instrumentDate)) {
      errs.instrumentDate = 'تاريخ الشيك مطلوب بصيغة يوم/شهر/سنة'
    }
    if (!dueDate || !parseDDMMYYYY(dueDate)) {
      errs.dueDate = 'تاريخ الاستحقاق مطلوب بصيغة يوم/شهر/سنة'
    } else if (instrDateObj && dueDateObj && dueDateObj < instrDateObj) {
      errs.dueDate = 'تاريخ الاستحقاق يجب أن يكون بعد تاريخ الشيك'
    }
    if (partyType === 'other' && !drawerName.trim()) {
      errs.drawerName = 'اسم الساحب مطلوب'
    }
    if (partyType !== 'other' && !selectedPartyId) {
      errs.drawerName = 'يجب اختيار الزبون أو المورد'
    }
    if (!bankId) {
      errs.bankId = 'يجب اختيار البنك'
    }
    if (!accountNumber.trim()) {
      errs.accountNumber = 'رقم الحساب مطلوب'
    }
    if (direction === 'incoming' && !checkNumber.trim()) {
      errs.checkNumber = 'رقم الشيك مطلوب للشيكات الواردة'
    }
    return errs
  }, [amount, instrumentDate, dueDate, partyType, drawerName, selectedPartyId, bankId, accountNumber, checkNumber, direction, instrDateObj, dueDateObj])

  const validateTransfer = useCallback((): FormErrors => {
    const errs: FormErrors = {}
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر'
    }
    if (!transferDate || !parseDDMMYYYY(transferDate)) {
      errs.transferDate = 'تاريخ التحويل مطلوب بصيغة يوم/شهر/سنة'
    }
    if (!partyName.trim()) {
      errs.partyName = 'اسم الطرف مطلوب'
    }
    return errs
  }, [amount, transferDate, partyName])

  /* ── Save ──────────────────────────────────────────────────────────────── */
  const handleSave = useCallback((status: 'draft' | 'pending') => {
    setSubmitted(true)
    const errs = mode === 'check' ? validateCheck() : validateTransfer()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    const selectedBank = PALESTINIAN_BANKS.find(b => b.id === bankId)
    const selectedTransferBank = PALESTINIAN_BANKS.find(b => b.id === transferBankId)

    const resolvedDrawerName = partyType === 'other' ? drawerName : drawerName
    const resolvedDrawerId = partyType !== 'other' ? selectedPartyId : undefined
    const resolvedDrawerType = partyType

    const instrumentType: InstrumentType = mode === 'check' ? 'check' : 'bank_transfer'
    const isoInstrDate = mode === 'check' ? toISODate(instrumentDate) : toISODate(transferDate)
    const isoDueDate = mode === 'check' ? toISODate(dueDate) : toISODate(transferDate)

    const data: Omit<TreasuryInstrument, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'> = {
      type: instrumentType,
      direction,
      status,
      amount: Number(amount),
      currency,
      amountInILS: Number(amount),
      instrumentDate: isoInstrDate,
      dueDate: isoDueDate,
      drawerName: mode === 'check' ? resolvedDrawerName : partyName,
      drawerId: mode === 'check' ? resolvedDrawerId : undefined,
      drawerType: mode === 'check' ? resolvedDrawerType : undefined,
      payeeName: direction === 'incoming' ? 'شركتنا' : resolvedDrawerName,
      bankId: mode === 'check' ? (selectedBank?.id ?? bankId) : (selectedTransferBank?.id ?? transferBankId),
      bankName: mode === 'check' ? (selectedBank?.nameAr ?? '') : (selectedTransferBank?.nameAr ?? ''),
      branchName: mode === 'check' ? branchName : undefined,
      branchCode: mode === 'check' ? branchCode : undefined,
      accountNumber: mode === 'check' ? accountNumber : '',
      checkNumber: mode === 'check' ? checkNumber : undefined,
      iban: mode === 'transfer' ? iban : undefined,
      micrRaw: mode === 'check' ? (micrRaw || undefined) : undefined,
      micrBankCode: mode === 'check' ? (ocrResult?.bankCode ?? undefined) : undefined,
      micrAccountNumber: mode === 'check' ? (ocrResult?.accountNumber ?? undefined) : undefined,
      micrCheckNumber: mode === 'check' ? (ocrResult?.checkNumber ?? undefined) : undefined,
      micrVerified: mode === 'check' ? (ocrSources.accountNumber === 'verified') : false,
      referenceNumber: mode === 'transfer' ? reference : undefined,
      notes: notes || undefined,
      linkedInvoiceIds: [],
      linkedPaymentIds: [],
      createdBy: 'admin',
      isDeleted: false,
    }

    const saved = addInstrument(data)
    onSaved(saved)
    onClose()
  }, [
    mode, validateCheck, validateTransfer, amount, currency, direction, notes,
    instrumentDate, dueDate, partyType, selectedPartyId, drawerName,
    bankId, branchName, branchCode, accountNumber, checkNumber, micrRaw, ocrResult, ocrSources,
    transferDate, partyName, transferBankId, iban, reference,
    addInstrument, onSaved, onClose,
  ])

  /* ── OCR source badge label ─────────────────────────────────────────────── */
  function sourceBadge(source: FieldSource): React.ReactNode {
    if (source === 'ocr') {
      return <span className="ocr-source-badge ocr-source-badge--ocr">مقروء آلياً</span>
    }
    if (source === 'verified') {
      return <span className="ocr-source-badge ocr-source-badge--verified">تم التحقق</span>
    }
    return null
  }

  function ocrFieldClass(source: FieldSource): string {
    return source === 'ocr' ? 'ds-input field-ocr' : 'ds-input'
  }

  /* ── Confidence label ───────────────────────────────────────────────────── */
  function confidenceLabel(conf: 'high' | 'medium' | 'low'): string {
    if (conf === 'high') return 'دقة عالية'
    if (conf === 'medium') return 'دقة متوسطة'
    return 'دقة منخفضة'
  }

  /* ────────────────────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────────────────────── */

  const title = mode === 'check' ? 'إضافة شيك' : 'إضافة تحويل بنكي'

  return (
    <>
      {/* ── Styles ──────────────────────────────────────────────────────── */}
      <style>{`
        .trs-form-overlay {
          position: fixed;
          inset: 0;
          z-index: 600;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .trs-form-modal {
          background: var(--app-surface, #ffffff);
          border-radius: 12px;
          width: 640px;
          max-width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          direction: rtl;
          font-family: var(--font-arabic, system-ui, sans-serif);
          overflow: hidden;
        }

        .trs-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--app-border, #e2e8f0);
          flex-shrink: 0;
        }

        .trs-form-header h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--app-text, #0f172a);
        }

        .trs-form-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--app-text-muted, #64748b);
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: background 0.15s, color 0.15s;
        }

        .trs-form-close-btn:hover {
          background: var(--app-surface-hover, #f4f6f9);
          color: var(--app-text, #0f172a);
        }

        .trs-form-body {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .trs-form-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid var(--app-border, #e2e8f0);
          flex-shrink: 0;
          background: var(--app-surface-muted, #f8fafc);
        }

        .trs-section {
          padding: 18px 20px;
          border-bottom: 1px solid var(--app-border, #e2e8f0);
        }

        .trs-section:last-child {
          border-bottom: none;
        }

        .trs-section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--app-text-muted, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 14px 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-field label {
          font-size: 13px;
          font-weight: 600;
          color: var(--app-text-soft, #334155);
        }

        .form-field label .required-star {
          color: var(--atlas-danger, #ef4444);
          margin-right: 2px;
        }

        .radio-group {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        .radio-group label {
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--app-text-soft, #334155);
        }

        .radio-group input[type="radio"] {
          accent-color: var(--atlas-blue, #2563eb);
          width: 16px;
          height: 16px;
        }

        .party-tabs {
          display: flex;
          gap: 0;
          border: 1px solid var(--app-border, #e2e8f0);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
          width: fit-content;
        }

        .party-tab {
          padding: 7px 18px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: var(--app-surface, #ffffff);
          color: var(--app-text-muted, #64748b);
          transition: background 0.15s, color 0.15s;
          border-left: 1px solid var(--app-border, #e2e8f0);
        }

        .party-tab:first-child {
          border-left: none;
        }

        .party-tab.active {
          background: var(--atlas-blue-600, #2563eb);
          color: #ffffff;
        }

        .party-tab:hover:not(.active) {
          background: var(--app-surface-hover, #f4f6f9);
        }

        .field-ocr {
          background: #FEF9C3 !important;
          border-color: #CA8A04 !important;
        }

        .field-ocr:focus {
          background: #ffffff !important;
          border-color: var(--atlas-blue, #2563eb) !important;
        }

        .ocr-scan-area {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .ocr-scan-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          background: var(--atlas-blue-50, #eff6ff);
          border: 1px solid var(--atlas-blue-200, #bfdbfe);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--atlas-blue-700, #1d4ed8);
          font-family: var(--font-arabic, system-ui, sans-serif);
          transition: background 0.15s, border-color 0.15s;
          align-self: flex-start;
        }

        .ocr-scan-btn:hover:not(:disabled) {
          background: var(--atlas-blue-100, #dbeafe);
        }

        .ocr-scan-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ocr-result-box {
          background: var(--app-surface-muted, #f8fafc);
          border: 1px solid var(--app-border, #e2e8f0);
          border-radius: 10px;
          padding: 14px;
        }

        .ocr-result-box-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .ocr-confidence-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .ocr-confidence-pill--high {
          background: var(--atlas-green-100, #d1fae5);
          color: var(--atlas-green-700, #047857);
        }

        .ocr-confidence-pill--medium {
          background: #FEF9C3;
          color: #92400E;
        }

        .ocr-confidence-pill--low {
          background: #FEE2E2;
          color: #991B1B;
        }

        .ocr-field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--app-border, #e2e8f0);
          font-size: 13px;
        }

        .ocr-field-row:last-child {
          border-bottom: none;
        }

        .ocr-field-label {
          color: var(--app-text-muted, #64748b);
          font-weight: 500;
        }

        .ocr-field-value {
          font-weight: 700;
          color: var(--app-text, #0f172a);
          font-family: var(--font-mono, monospace);
          direction: ltr;
          text-align: left;
        }

        .ocr-source-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 6px;
        }

        .ocr-source-badge--ocr {
          background: #FEF9C3;
          color: #92400E;
          border: 1px solid #CA8A04;
        }

        .ocr-source-badge--verified {
          background: var(--atlas-green-100, #d1fae5);
          color: var(--atlas-green-700, #047857);
          border: 1px solid var(--atlas-green-300, #6ee7b7);
        }

        .ocr-source-badge--manual {
          background: var(--app-surface-muted, #f8fafc);
          color: var(--app-text-muted, #64748b);
          border: 1px solid var(--app-border, #e2e8f0);
        }

        .ocr-disclaimer {
          font-size: 12px;
          color: var(--app-text-muted, #64748b);
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
        }

        .ocr-confirm-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--atlas-green-600, #059669);
          color: #ffffff;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: var(--font-arabic, system-ui, sans-serif);
          margin-top: 10px;
          transition: background 0.15s;
        }

        .ocr-confirm-btn:hover {
          background: var(--atlas-green-700, #047857);
        }

        .ocr-spinner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          font-size: 14px;
          color: var(--atlas-blue-700, #1d4ed8);
          font-weight: 600;
        }

        .ocr-spinner-ring {
          width: 18px;
          height: 18px;
          border: 2px solid var(--atlas-blue-200, #bfdbfe);
          border-top-color: var(--atlas-blue-600, #2563eb);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .trs-warning {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 6px;
          margin-top: 5px;
          line-height: 1.5;
        }

        .trs-warning--orange {
          background: var(--atlas-orange-100, #ffedd5);
          color: #92400E;
          border: 1px solid #FCD34D;
        }

        .trs-warning--red {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FCA5A5;
        }

        .field-error {
          font-size: 12px;
          color: var(--atlas-danger, #ef4444);
          margin-top: 3px;
          font-weight: 500;
        }

        .micr-collapsible {
          border: 1px solid var(--app-border, #e2e8f0);
          border-radius: 8px;
          overflow: hidden;
          margin-top: 14px;
        }

        .micr-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--app-surface-muted, #f8fafc);
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          color: var(--app-text-soft, #334155);
          font-family: var(--font-arabic, system-ui, sans-serif);
          text-align: right;
          direction: rtl;
        }

        .micr-toggle-btn:hover {
          background: var(--app-surface-hover, #f4f6f9);
        }

        .micr-toggle-chevron {
          transition: transform 0.2s;
        }

        .micr-toggle-chevron.open {
          transform: rotate(180deg);
        }

        .micr-body {
          padding: 14px;
          border-top: 1px solid var(--app-border, #e2e8f0);
        }

        .micr-raw-row {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 12px;
        }

        .micr-raw-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--app-text-muted, #64748b);
        }

        .micr-raw-value {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          color: var(--app-text, #0f172a);
          background: var(--app-bg, #f0f2f5);
          padding: 8px 10px;
          border-radius: 6px;
          direction: ltr;
          text-align: left;
          border: 1px solid var(--app-border, #e2e8f0);
          word-break: break-all;
        }

        .micr-analyze-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          background: var(--app-surface, #ffffff);
          border: 1px solid var(--app-border-strong, rgba(148,163,184,0.35));
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--app-text-soft, #334155);
          font-family: var(--font-arabic, system-ui, sans-serif);
          transition: background 0.15s;
        }

        .micr-analyze-btn:hover {
          background: var(--app-surface-hover, #f4f6f9);
        }

        .ocr-warnings-list {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ocr-warning-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #92400E;
          background: var(--atlas-orange-100, #ffedd5);
          padding: 5px 8px;
          border-radius: 5px;
        }
      `}</style>

      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      <div
        className="trs-form-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="trs-form-modal" role="dialog" aria-modal="true" aria-label={title}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="trs-form-header">
            <h2>{title}</h2>
            <button className="trs-form-close-btn" onClick={onClose} aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="trs-form-body">
            {mode === 'check' ? (
              <CheckForm
                direction={direction}
                setDirection={setDirection}
                amount={amount}
                setAmount={setAmount}
                currency={currency}
                setCurrency={setCurrency}
                instrumentDate={instrumentDate}
                setInstrumentDate={setInstrumentDate}
                dueDate={dueDate}
                setDueDate={setDueDate}
                dueDateWarning={dueDateWarning}
                dueDateWarningSeverity={dueDateWarningSeverity}
                partyType={partyType}
                setPartyType={setPartyType}
                selectedPartyId={selectedPartyId}
                handlePartySelect={handlePartySelect}
                partyOptions={partyOptions}
                drawerName={drawerName}
                setDrawerName={setDrawerName}
                otherPhone={otherPhone}
                setOtherPhone={setOtherPhone}
                bankId={bankId}
                setBankId={setBankId}
                branchName={branchName}
                setBranchName={setBranchName}
                branchCode={branchCode}
                setBranchCode={setBranchCode}
                accountNumber={accountNumber}
                setAccountNumber={setAccountNumber}
                checkNumber={checkNumber}
                setCheckNumber={setCheckNumber}
                micrRaw={micrRaw}
                setMicrRaw={setMicrRaw}
                micrExpanded={micrExpanded}
                setMicrExpanded={setMicrExpanded}
                ocrState={ocrState}
                ocrResult={ocrResult}
                ocrSources={ocrSources}
                handleScan={handleScan}
                handleConfirmOcr={handleConfirmOcr}
                handleManualMicrParse={handleManualMicrParse}
                markVerified={markVerified}
                notes={notes}
                setNotes={setNotes}
                errors={errors}
                submitted={submitted}
                sourceBadge={sourceBadge}
                ocrFieldClass={ocrFieldClass}
                confidenceLabel={confidenceLabel}
              />
            ) : (
              <TransferForm
                direction={direction}
                setDirection={setDirection}
                amount={amount}
                setAmount={setAmount}
                currency={currency}
                setCurrency={setCurrency}
                transferDate={transferDate}
                setTransferDate={setTransferDate}
                partyName={partyName}
                setPartyName={setPartyName}
                transferBankId={transferBankId}
                setTransferBankId={setTransferBankId}
                iban={iban}
                setIban={setIban}
                reference={reference}
                setReference={setReference}
                notes={notes}
                setNotes={setNotes}
                errors={errors}
                submitted={submitted}
              />
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div className="trs-form-footer">
            <button
              className="ds-btn"
              onClick={() => handleSave('draft')}
              type="button"
            >
              حفظ كمسودة
            </button>
            <button
              className="ds-btn ds-btn--primary"
              onClick={() => handleSave('pending')}
              type="button"
            >
              حفظ وتقديم ←
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHECK FORM (internal sub-component)
═══════════════════════════════════════════════════════════════════════════ */

interface CheckFormProps {
  direction: InstrumentDirection
  setDirection: (v: InstrumentDirection) => void
  amount: string
  setAmount: (v: string) => void
  currency: PalestinianCurrency
  setCurrency: (v: PalestinianCurrency) => void
  instrumentDate: string
  setInstrumentDate: (v: string) => void
  dueDate: string
  setDueDate: (v: string) => void
  dueDateWarning: string | null
  dueDateWarningSeverity: 'orange' | 'red' | null
  partyType: 'customer' | 'supplier' | 'other'
  setPartyType: (v: 'customer' | 'supplier' | 'other') => void
  selectedPartyId: string
  handlePartySelect: (id: string) => void
  partyOptions: Array<{ id: string; name: string }>
  drawerName: string
  setDrawerName: (v: string) => void
  otherPhone: string
  setOtherPhone: (v: string) => void
  bankId: string
  setBankId: (v: string) => void
  branchName: string
  setBranchName: (v: string) => void
  branchCode: string
  setBranchCode: (v: string) => void
  accountNumber: string
  setAccountNumber: (v: string) => void
  checkNumber: string
  setCheckNumber: (v: string) => void
  micrRaw: string
  setMicrRaw: (v: string) => void
  micrExpanded: boolean
  setMicrExpanded: (v: boolean) => void
  ocrState: 'idle' | 'scanning' | 'done'
  ocrResult: MicrParseResult | null
  ocrSources: OcrFieldSources
  handleScan: () => void
  handleConfirmOcr: () => void
  handleManualMicrParse: () => void
  markVerified: (field: keyof OcrFieldSources) => void
  notes: string
  setNotes: (v: string) => void
  errors: FormErrors
  submitted: boolean
  sourceBadge: (source: FieldSource) => React.ReactNode
  ocrFieldClass: (source: FieldSource) => string
  confidenceLabel: (conf: 'high' | 'medium' | 'low') => string
}

function CheckForm({
  direction, setDirection,
  amount, setAmount,
  currency, setCurrency,
  instrumentDate, setInstrumentDate,
  dueDate, setDueDate,
  dueDateWarning, dueDateWarningSeverity,
  partyType, setPartyType,
  selectedPartyId, handlePartySelect,
  partyOptions,
  drawerName, setDrawerName,
  otherPhone, setOtherPhone,
  bankId, setBankId,
  branchName, setBranchName,
  branchCode, setBranchCode,
  accountNumber, setAccountNumber,
  checkNumber, setCheckNumber,
  micrRaw, setMicrRaw,
  micrExpanded, setMicrExpanded,
  ocrState, ocrResult, ocrSources,
  handleScan, handleConfirmOcr, handleManualMicrParse, markVerified,
  notes, setNotes,
  errors, submitted,
  sourceBadge, ocrFieldClass, confidenceLabel,
}: CheckFormProps) {

  return (
    <>
      {/* ── Section 1: نوع الشيك ────────────────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">نوع الشيك</p>

        <div className="radio-group" style={{ marginBottom: 16 }}>
          <label>
            <input
              type="radio"
              name="direction"
              value="incoming"
              checked={direction === 'incoming'}
              onChange={() => setDirection('incoming')}
            />
            شيك وارد
          </label>
          <label>
            <input
              type="radio"
              name="direction"
              value="outgoing"
              checked={direction === 'outgoing'}
              onChange={() => setDirection('outgoing')}
            />
            شيك صادر
          </label>
        </div>

        {/* OCR Scanner */}
        <div className="ocr-scan-area">
          <button
            type="button"
            className="ocr-scan-btn"
            onClick={handleScan}
            disabled={ocrState === 'scanning'}
          >
            <ScanLine size={16} />
            مسح الشيك ضوئياً
          </button>

          {ocrState === 'scanning' && (
            <div className="ocr-spinner">
              <div className="ocr-spinner-ring" />
              جارٍ تحليل الشيك...
            </div>
          )}

          {ocrState === 'done' && ocrResult && (
            <div className="ocr-result-box">
              <div className="ocr-result-box-header">
                <CheckCircle2 size={15} color="var(--atlas-green-600, #059669)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text-soft)' }}>
                  نتائج قراءة MICR
                </span>
                <span className={`ocr-confidence-pill ocr-confidence-pill--${ocrResult.confidence}`}>
                  {confidenceLabel(ocrResult.confidence)}
                </span>
              </div>

              <div className="ocr-field-row">
                <span className="ocr-field-label">البنك</span>
                <span className="ocr-field-value">
                  {ocrResult.bank ? ocrResult.bank.nameAr : (ocrResult.bankCode ?? '—')}
                </span>
              </div>
              <div className="ocr-field-row">
                <span className="ocr-field-label">كود البنك</span>
                <span className="ocr-field-value">{ocrResult.bankCode ?? '—'}</span>
              </div>
              <div className="ocr-field-row">
                <span className="ocr-field-label">كود الفرع</span>
                <span className="ocr-field-value">{ocrResult.branchCode ?? '—'}</span>
              </div>
              <div className="ocr-field-row">
                <span className="ocr-field-label">رقم الحساب</span>
                <span className="ocr-field-value">{ocrResult.accountNumber ?? '—'}</span>
              </div>
              <div className="ocr-field-row">
                <span className="ocr-field-label">رقم الشيك</span>
                <span className="ocr-field-value">{ocrResult.checkNumber ?? '—'}</span>
              </div>

              {ocrResult.warnings.length > 0 && (
                <div className="ocr-warnings-list">
                  {ocrResult.warnings.map((w, i) => (
                    <div key={i} className="ocr-warning-item">
                      <AlertTriangle size={12} />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              <button type="button" className="ocr-confirm-btn" onClick={handleConfirmOcr}>
                <CheckCircle2 size={14} />
                تأكيد وملء النموذج
              </button>
            </div>
          )}

          <p className="ocr-disclaimer">
            <AlertTriangle size={12} />
            البيانات المقروءة آلياً يجب التحقق منها يدوياً
          </p>
        </div>
      </div>

      {/* ── Section 2: المبلغ والتواريخ ─────────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">المبلغ والتواريخ</p>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label>
              <span className="required-star">*</span>
              المبلغ (₪)
            </label>
            <input
              type="number"
              className="ds-input"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              step="0.01"
              dir="ltr"
            />
            {submitted && errors.amount && (
              <span className="field-error">{errors.amount}</span>
            )}
          </div>

          <div className="form-field">
            <label>العملة</label>
            <select
              className="ds-input"
              value={currency}
              onChange={e => setCurrency(e.target.value as PalestinianCurrency)}
            >
              <option value="ILS">شيكل (₪)</option>
              <option value="JOD">دينار أردني (د.أ)</option>
              <option value="USD">دولار أمريكي ($)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>
              <span className="required-star">*</span>
              تاريخ الشيك
            </label>
            <input
              type="text"
              className="ds-input"
              placeholder="يوم/شهر/سنة"
              value={instrumentDate}
              onChange={e => setInstrumentDate(e.target.value)}
              dir="ltr"
              maxLength={10}
            />
            {submitted && errors.instrumentDate && (
              <span className="field-error">{errors.instrumentDate}</span>
            )}
          </div>

          <div className="form-field">
            <label>
              <span className="required-star">*</span>
              تاريخ الاستحقاق
            </label>
            <input
              type="text"
              className="ds-input"
              placeholder="يوم/شهر/سنة"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              dir="ltr"
              maxLength={10}
            />
            {submitted && errors.dueDate && (
              <span className="field-error">{errors.dueDate}</span>
            )}
            {dueDateWarning && dueDateWarningSeverity && (
              <div className={`trs-warning trs-warning--${dueDateWarningSeverity}`}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                {dueDateWarning}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: بيانات الساحب ─────────────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">بيانات الساحب</p>

        <div className="party-tabs">
          {(['customer', 'supplier', 'other'] as const).map(type => (
            <button
              key={type}
              type="button"
              className={`party-tab ${partyType === type ? 'active' : ''}`}
              onClick={() => setPartyType(type)}
            >
              {type === 'customer' ? 'زبون' : type === 'supplier' ? 'مورد' : 'أخرى'}
            </button>
          ))}
        </div>

        {partyType !== 'other' && (
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label>
              <span className="required-star">*</span>
              {partyType === 'customer' ? 'اختيار الزبون' : 'اختيار المورد'}
            </label>
            <select
              className="ds-input"
              value={selectedPartyId}
              onChange={e => handlePartySelect(e.target.value)}
            >
              <option value="">-- اختر --</option>
              {partyOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {submitted && errors.drawerName && !selectedPartyId && (
              <span className="field-error">{errors.drawerName}</span>
            )}
          </div>
        )}

        <div className="form-field" style={{ marginBottom: partyType === 'other' ? 12 : 0 }}>
          <label>
            {partyType === 'other' && <span className="required-star">*</span>}
            اسم الساحب
          </label>
          <input
            type="text"
            className="ds-input"
            placeholder="الاسم الكامل"
            value={drawerName}
            onChange={e => setDrawerName(e.target.value)}
            readOnly={partyType !== 'other' && Boolean(drawerName)}
          />
          {submitted && errors.drawerName && partyType === 'other' && !drawerName.trim() && (
            <span className="field-error">{errors.drawerName}</span>
          )}
        </div>

        {partyType === 'other' && (
          <div className="form-field" style={{ marginTop: 0 }}>
            <label>رقم الهاتف</label>
            <input
              type="text"
              className="ds-input"
              placeholder="05X-XXXXXXX"
              value={otherPhone}
              onChange={e => setOtherPhone(e.target.value)}
              dir="ltr"
            />
          </div>
        )}
      </div>

      {/* ── Section 4: البيانات البنكية ──────────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">البيانات البنكية</p>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label>
              <span className="required-star">*</span>
              البنك
              {sourceBadge(ocrSources.bankId)}
            </label>
            <select
              className={ocrFieldClass(ocrSources.bankId)}
              value={bankId}
              onChange={e => {
                setBankId(e.target.value)
                markVerified('bankId')
              }}
            >
              <option value="">-- اختر البنك --</option>
              {PALESTINIAN_BANKS.map(b => (
                <option key={b.id} value={b.id}>{b.nameAr}</option>
              ))}
            </select>
            {submitted && errors.bankId && (
              <span className="field-error">{errors.bankId}</span>
            )}
          </div>

          <div className="form-field">
            <label>الفرع</label>
            <input
              type="text"
              className="ds-input"
              placeholder="اسم الفرع"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label>
              رمز الفرع
              {sourceBadge(ocrSources.branchCode)}
            </label>
            <input
              type="text"
              className={ocrFieldClass(ocrSources.branchCode)}
              placeholder="000"
              value={branchCode}
              onChange={e => {
                setBranchCode(e.target.value)
                markVerified('branchCode')
              }}
              maxLength={3}
              dir="ltr"
            />
          </div>

          <div className="form-field">
            <label>
              <span className="required-star">*</span>
              رقم الحساب
              {sourceBadge(ocrSources.accountNumber)}
            </label>
            <input
              type="text"
              className={ocrFieldClass(ocrSources.accountNumber)}
              placeholder="رقم الحساب"
              value={accountNumber}
              onChange={e => {
                setAccountNumber(e.target.value)
                markVerified('accountNumber')
              }}
              dir="ltr"
            />
            {submitted && errors.accountNumber && (
              <span className="field-error">{errors.accountNumber}</span>
            )}
          </div>
        </div>

        <div className="form-field">
          <label>
            {direction === 'incoming' && <span className="required-star">*</span>}
            رقم الشيك (6 أرقام)
            {sourceBadge(ocrSources.checkNumber)}
          </label>
          <input
            type="text"
            className={ocrFieldClass(ocrSources.checkNumber)}
            placeholder="000000"
            value={checkNumber}
            onChange={e => {
              setCheckNumber(e.target.value)
              markVerified('checkNumber')
            }}
            maxLength={6}
            dir="ltr"
          />
          {submitted && errors.checkNumber && (
            <span className="field-error">{errors.checkNumber}</span>
          )}
        </div>

        {/* MICR collapsible — show only if OCR was used */}
        {ocrResult && (
          <div className="micr-collapsible">
            <button
              type="button"
              className="micr-toggle-btn"
              onClick={() => setMicrExpanded(!micrExpanded)}
            >
              بيانات MICR المقروءة
              <span className={`micr-toggle-chevron ${micrExpanded ? 'open' : ''}`}>▾</span>
            </button>

            {micrExpanded && (
              <div className="micr-body">
                <div className="micr-raw-row">
                  <span className="micr-raw-label">سطر MICR الخام</span>
                  <div className="micr-raw-value">{ocrResult.raw || '—'}</div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  {[
                    { label: 'كود البنك', value: ocrResult.bankCode, source: ocrSources.bankId },
                    { label: 'كود الفرع', value: ocrResult.branchCode, source: ocrSources.branchCode },
                    { label: 'رقم الحساب', value: ocrResult.accountNumber, source: ocrSources.accountNumber },
                    { label: 'رقم الشيك', value: ocrResult.checkNumber, source: ocrSources.checkNumber },
                  ].map((row, i) => (
                    <div key={i} className="ocr-field-row">
                      <span className="ocr-field-label">{row.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {row.source === 'ocr' && (
                          <span className="ocr-source-badge ocr-source-badge--ocr">مقروء آلياً</span>
                        )}
                        {row.source === 'verified' && (
                          <span className="ocr-source-badge ocr-source-badge--verified">تم التحقق</span>
                        )}
                        {row.source === 'manual' && (
                          <span className="ocr-source-badge ocr-source-badge--manual">يدوي</span>
                        )}
                        <span className="ocr-field-value">{row.value ?? '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-field" style={{ marginBottom: 10 }}>
                  <label className="micr-raw-label">إدخال سطر MICR يدوياً</label>
                  <input
                    type="text"
                    className="ds-input"
                    placeholder="⑆XXXXXX⑆ XXXXXXXXXX ⑉ XXXXXX ⑈"
                    value={micrRaw}
                    onChange={e => setMicrRaw(e.target.value)}
                    dir="ltr"
                    style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}
                  />
                </div>

                <button type="button" className="micr-analyze-btn" onClick={handleManualMicrParse}>
                  <ScanLine size={14} />
                  تحليل MICR
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 5: الملفات والملاحظات ───────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">ملاحظات</p>

        <div className="form-field">
          <label>ملاحظات إضافية</label>
          <textarea
            className="ds-input"
            rows={3}
            placeholder="أي ملاحظات متعلقة بهذا الشيك..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ resize: 'vertical', minHeight: 72 }}
          />
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSFER FORM (internal sub-component)
═══════════════════════════════════════════════════════════════════════════ */

interface TransferFormProps {
  direction: InstrumentDirection
  setDirection: (v: InstrumentDirection) => void
  amount: string
  setAmount: (v: string) => void
  currency: PalestinianCurrency
  setCurrency: (v: PalestinianCurrency) => void
  transferDate: string
  setTransferDate: (v: string) => void
  partyName: string
  setPartyName: (v: string) => void
  transferBankId: string
  setTransferBankId: (v: string) => void
  iban: string
  setIban: (v: string) => void
  reference: string
  setReference: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  errors: FormErrors
  submitted: boolean
}

function TransferForm({
  direction, setDirection,
  amount, setAmount,
  currency, setCurrency,
  transferDate, setTransferDate,
  partyName, setPartyName,
  transferBankId, setTransferBankId,
  iban, setIban,
  reference, setReference,
  notes, setNotes,
  errors, submitted,
}: TransferFormProps) {

  return (
    <>
      {/* ── Section 1: الاتجاه ──────────────────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">اتجاه التحويل</p>

        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="transfer-direction"
              value="incoming"
              checked={direction === 'incoming'}
              onChange={() => setDirection('incoming')}
            />
            وارد
          </label>
          <label>
            <input
              type="radio"
              name="transfer-direction"
              value="outgoing"
              checked={direction === 'outgoing'}
              onChange={() => setDirection('outgoing')}
            />
            صادر
          </label>
        </div>
      </div>

      {/* ── Section 2: المبلغ والتاريخ ──────────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">المبلغ والتاريخ</p>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label>
              <span className="required-star">*</span>
              المبلغ
            </label>
            <input
              type="number"
              className="ds-input"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              step="0.01"
              dir="ltr"
            />
            {submitted && errors.amount && (
              <span className="field-error">{errors.amount}</span>
            )}
          </div>

          <div className="form-field">
            <label>العملة</label>
            <select
              className="ds-input"
              value={currency}
              onChange={e => setCurrency(e.target.value as PalestinianCurrency)}
            >
              <option value="ILS">شيكل (₪)</option>
              <option value="JOD">دينار أردني (د.أ)</option>
              <option value="USD">دولار أمريكي ($)</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label>
            <span className="required-star">*</span>
            تاريخ التحويل
          </label>
          <input
            type="text"
            className="ds-input"
            placeholder="يوم/شهر/سنة"
            value={transferDate}
            onChange={e => setTransferDate(e.target.value)}
            dir="ltr"
            maxLength={10}
          />
          {submitted && errors.transferDate && (
            <span className="field-error">{errors.transferDate}</span>
          )}
        </div>
      </div>

      {/* ── Section 3: الطرف الآخر والبنك ───────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">الطرف الآخر والبنك</p>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label>
            <span className="required-star">*</span>
            اسم الطرف
          </label>
          <input
            type="text"
            className="ds-input"
            placeholder="الاسم الكامل أو اسم الشركة"
            value={partyName}
            onChange={e => setPartyName(e.target.value)}
          />
          {submitted && errors.partyName && (
            <span className="field-error">{errors.partyName}</span>
          )}
        </div>

        <div className="form-row" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label>البنك</label>
            <select
              className="ds-input"
              value={transferBankId}
              onChange={e => setTransferBankId(e.target.value)}
            >
              <option value="">-- اختر البنك --</option>
              {PALESTINIAN_BANKS.map(b => (
                <option key={b.id} value={b.id}>{b.nameAr}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>رقم IBAN</label>
            <input
              type="text"
              className="ds-input"
              placeholder="PS00XXXX0000000000000000"
              value={iban}
              onChange={e => setIban(e.target.value)}
              dir="ltr"
              style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}
            />
          </div>
        </div>

        <div className="form-field">
          <label>المرجع / الغرض</label>
          <input
            type="text"
            className="ds-input"
            placeholder="سبب التحويل أو رقم المرجع"
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        </div>
      </div>

      {/* ── Section 4: الملاحظات ─────────────────────────────────────────── */}
      <div className="trs-section">
        <p className="trs-section-title">ملاحظات</p>

        <div className="form-field">
          <label>ملاحظات إضافية</label>
          <textarea
            className="ds-input"
            rows={3}
            placeholder="أي ملاحظات متعلقة بهذا التحويل..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ resize: 'vertical', minHeight: 72 }}
          />
        </div>
      </div>
    </>
  )
}
