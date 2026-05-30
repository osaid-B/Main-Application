import { useRef, useEffect, useState, useCallback } from 'react'
import type { TreasuryInstrument, InstrumentStatus } from '../../types/treasury'
import { STATUS_AR, TYPE_AR } from '../../types/treasury'
import { useTreasury } from '../../context/TreasuryContext'

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface InstrumentPanelProps {
  instrument: TreasuryInstrument | null
  onClose: () => void
  onAction: (instrument: TreasuryInstrument, action: string) => void
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatILS(n: number, currency: string): string {
  const sym = currency === 'ILS' ? '₪' : currency === 'JOD' ? 'د.أ' : '$'
  return sym + n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string): string {
  if (!s) return '—'
  // If already DD/MM/YYYY return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  // Try ISO → DD/MM/YYYY
  try {
    const d = new Date(s)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return s
  }
}

function fmtDateTime(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month} ${hh}:${mm}`
  } catch {
    return iso
  }
}

function daysDiff(dueDateStr: string): number {
  // Accepts DD/MM/YYYY or ISO
  let d: Date
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dueDateStr)) {
    const [day, month, year] = dueDateStr.split('/')
    d = new Date(`${year}-${month}-${day}`)
  } else {
    d = new Date(dueDateStr)
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

function statusDotColor(status: InstrumentStatus): string {
  switch (status) {
    case 'cleared':   return 'var(--app-success)'
    case 'bounced':   return 'var(--app-danger)'
    case 'cancelled': return 'var(--app-text-subtle)'
    default:          return '#3B5BDB'
  }
}

function statusBadgeStyle(status: InstrumentStatus): React.CSSProperties {
  switch (status) {
    case 'draft':
      return { background: 'var(--app-surface-muted)', color: 'var(--app-text-muted)', border: '1px solid var(--app-border)' }
    case 'pending':
      return { background: 'var(--app-info-subtle)', color: 'var(--app-info)', border: '1px solid rgba(14,165,233,0.2)' }
    case 'deposited':
      return { background: '#eef2ff', color: '#3B5BDB', border: '1px solid #c7d2fe' }
    case 'cleared':
      return { background: 'var(--app-success-subtle)', color: 'var(--app-success)', border: '1px solid rgba(22,163,74,0.2)' }
    case 'bounced':
      return { background: 'var(--app-danger-subtle)', color: 'var(--app-danger)', border: '1px solid rgba(220,38,38,0.2)' }
    case 'cancelled':
      return { background: 'var(--app-surface-muted)', color: 'var(--app-text-subtle)', border: '1px solid var(--app-border)' }
    case 'under_review':
      return { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }
    case 'partially_applied':
      return { background: 'var(--app-warning-subtle)', color: 'var(--app-warning)', border: '1px solid rgba(217,119,6,0.2)' }
    default:
      return { background: 'var(--app-surface-muted)', color: 'var(--app-text-muted)', border: '1px solid var(--app-border)' }
  }
}

/* ─── Status Flow Steps ──────────────────────────────────────────────────── */

const FLOW_STEPS: InstrumentStatus[] = ['draft', 'pending', 'deposited', 'cleared']
const FLOW_LABELS: Record<string, string> = {
  draft:     'مسودة',
  pending:   'معلقة',
  deposited: 'مودعة',
  cleared:   'محصّلة',
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function InstrumentPanel({ instrument, onClose, onAction }: InstrumentPanelProps) {
  const { updateInstrumentNotes } = useTreasury()
  const [notesValue, setNotesValue] = useState<string>('')
  const panelRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)


  // Trap focus inside panel when open
  useEffect(() => {
    if (!instrument) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [instrument, onClose])

  const handleNotesBlur = useCallback(() => {
    if (!instrument) return
    if (notesValue !== (instrument.notes ?? '')) {
      updateInstrumentNotes(instrument.id, notesValue)
    }
  }, [instrument, notesValue, updateInstrumentNotes])

  const handleCopyRef = useCallback(() => {
    if (!instrument) return
    void navigator.clipboard.writeText(instrument.id)
  }, [instrument])

  if (!instrument) return null

  /* ── Computed values ── */
  const diff = daysDiff(instrument.dueDate)
  const isTerminal = instrument.status === 'cleared' || instrument.status === 'cancelled'
  const isCancelled = instrument.status === 'cancelled'
  const isBounced = instrument.status === 'bounced'

  // Determine current flow step index
  const flowIndex = FLOW_STEPS.indexOf(
    isBounced || instrument.status === 'under_review' ? 'deposited' : instrument.status
  )

  // Direction + type label
  const directionLabel = instrument.direction === 'incoming' ? 'وارد' : 'صادر'
  const typeLabel = TYPE_AR[instrument.type]
  const fullTypeLabel = `${typeLabel} ${directionLabel}`

  // Masked account number
  const maskedAccount =
    instrument.accountNumber.length >= 4
      ? '****' + instrument.accountNumber.slice(-4)
      : instrument.accountNumber

  /* ── Primary action ── */
  type ActionEntry = { label: string; action: string } | null
  const primaryAction: ActionEntry = (() => {
    switch (instrument.status) {
      case 'draft':         return { label: 'تقديم', action: 'submit' }
      case 'pending':       return { label: 'تسجيل إيداع', action: 'deposit' }
      case 'deposited':     return { label: 'تأكيد التحصيل', action: 'clear' }
      case 'bounced':       return { label: 'إعادة إيداع', action: 'redeposit' }
      case 'under_review':  return { label: 'مراجعة يدوية', action: 'review' }
      default:              return null
    }
  })()

  /* ── Render ── */
  return (
    <>
      {/* ── CSS ── */}
      <style>{`
        .trs-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          z-index: 499;
          animation: trs-fade-in 180ms ease forwards;
        }
        @keyframes trs-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .trs-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 400px;
          background: var(--app-surface);
          box-shadow: -4px 0 32px rgba(15, 23, 42, 0.16), -1px 0 0 var(--app-border);
          z-index: 500;
          display: flex;
          flex-direction: column;
          animation: trs-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }
        @keyframes trs-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .trs-panel-header {
          position: sticky;
          top: 0;
          background: var(--app-surface);
          border-bottom: 1px solid var(--app-border);
          padding: 16px 20px 14px;
          z-index: 10;
          flex-shrink: 0;
        }
        .trs-panel-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .trs-panel-ref {
          font-family: "Inter", "Geist Mono", ui-monospace, monospace;
          font-size: 20px;
          font-weight: 700;
          color: var(--app-text);
          letter-spacing: 0.01em;
          line-height: 1.2;
        }
        .trs-panel-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: var(--app-surface-muted);
          border-radius: var(--app-radius-sm);
          cursor: pointer;
          color: var(--app-text-muted);
          font-size: 18px;
          transition: background var(--app-transition), color var(--app-transition);
          flex-shrink: 0;
          margin-inline-start: 8px;
        }
        .trs-panel-close:hover {
          background: var(--app-danger-subtle);
          color: var(--app-danger);
        }
        .trs-panel-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .trs-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: var(--app-radius-full);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.5;
        }
        .trs-status-flow {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 2px 0 4px;
          position: relative;
        }
        .trs-flow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .trs-flow-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--app-border);
          background: var(--app-surface);
          position: relative;
          z-index: 1;
          transition: background 200ms, border-color 200ms;
          flex-shrink: 0;
        }
        .trs-flow-dot--active {
          background: #3B5BDB;
          border-color: #3B5BDB;
          box-shadow: 0 0 0 3px rgba(59,91,219,0.18);
        }
        .trs-flow-dot--done {
          background: #3B5BDB;
          border-color: #3B5BDB;
        }
        .trs-flow-dot--cancelled {
          background: var(--app-text-subtle);
          border-color: var(--app-text-subtle);
          opacity: 0.45;
        }
        .trs-flow-label {
          font-size: 10px;
          color: var(--app-text-muted);
          margin-top: 5px;
          white-space: nowrap;
          font-weight: 500;
        }
        .trs-flow-label--active {
          color: #3B5BDB;
          font-weight: 700;
        }
        .trs-flow-connector {
          height: 2px;
          flex: 1;
          background: var(--app-border);
          margin-top: -17px;
          margin-bottom: 17px;
          position: relative;
          z-index: 0;
        }
        .trs-flow-connector--done {
          background: #3B5BDB;
        }
        .trs-flow-bounced-branch {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: -6px;
          position: relative;
        }
        .trs-flow-bounced-line {
          width: 2px;
          height: 14px;
          background: var(--app-danger);
          opacity: 0.6;
        }
        .trs-flow-bounced-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--app-danger);
          border: 2px solid var(--app-danger);
        }
        .trs-flow-bounced-label {
          font-size: 10px;
          color: var(--app-danger);
          font-weight: 600;
          margin-top: 3px;
          white-space: nowrap;
        }
        .trs-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 0 0 16px;
          scrollbar-width: thin;
          scrollbar-color: var(--app-border) transparent;
        }
        .trs-section {
          padding: 16px 20px;
          border-bottom: 1px solid var(--app-border);
        }
        .trs-section:last-child {
          border-bottom: none;
        }
        .trs-section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--app-text-muted);
          margin-bottom: 12px;
        }
        .trs-kv-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px 16px;
          align-items: baseline;
        }
        .trs-kv-label {
          font-size: 12px;
          color: var(--app-text-muted);
          font-weight: 500;
          white-space: nowrap;
        }
        .trs-kv-value {
          font-size: 13px;
          color: var(--app-text);
          font-weight: 500;
          text-align: start;
          word-break: break-word;
        }
        .trs-kv-value--mono {
          font-family: "IBM Plex Mono", "Geist Mono", ui-monospace, monospace;
          font-size: 12px;
          direction: ltr;
          text-align: start;
        }
        .trs-kv-value--amount {
          font-size: 20px;
          font-weight: 700;
          color: var(--app-text);
          font-variant-numeric: tabular-nums;
        }
        .trs-due-tag {
          font-size: 11px;
          font-weight: 600;
          margin-top: 2px;
        }
        .trs-due-tag--overdue {
          color: var(--app-danger);
        }
        .trs-due-tag--future {
          color: var(--app-success);
        }
        .trs-link-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: #3B5BDB;
          font-size: 12px;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .trs-link-btn:hover {
          color: #2748b5;
        }
        .trs-micr-box {
          background: var(--app-surface-muted);
          border: 1px solid var(--app-border);
          border-radius: var(--app-radius-md);
          padding: 12px 14px;
          margin-bottom: 10px;
        }
        .trs-micr-raw {
          font-family: "IBM Plex Mono", "Geist Mono", ui-monospace, monospace;
          font-size: 13px;
          color: var(--app-text);
          direction: ltr;
          display: block;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
          word-break: break-all;
        }
        .trs-invoice-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: var(--app-surface-muted);
          border: 1px solid var(--app-border);
          border-radius: var(--app-radius-full);
          font-size: 12px;
          font-weight: 600;
          color: var(--app-text-soft);
          margin: 0 4px 6px 0;
        }
        .trs-empty-text {
          font-size: 12px;
          color: var(--app-text-subtle);
          font-style: italic;
        }
        .trs-notes-area {
          width: 100%;
          min-height: 72px;
          border: 1px solid var(--app-border);
          border-radius: var(--app-radius-md);
          padding: 10px 12px;
          font-size: 13px;
          color: var(--app-text);
          background: var(--app-surface);
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          transition: border-color var(--app-transition);
          box-sizing: border-box;
        }
        .trs-notes-area:focus {
          outline: none;
          border-color: #3B5BDB;
          box-shadow: 0 0 0 3px rgba(59,91,219,0.1);
        }
        .trs-timeline {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .trs-timeline-entry {
          display: flex;
          gap: 12px;
          position: relative;
          padding-bottom: 14px;
        }
        .trs-timeline-entry:last-child {
          padding-bottom: 0;
        }
        .trs-timeline-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          width: 12px;
        }
        .trs-timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 3px;
        }
        .trs-timeline-line {
          flex: 1;
          width: 2px;
          background: var(--app-border);
          margin-top: 2px;
        }
        .trs-timeline-entry:last-child .trs-timeline-line {
          display: none;
        }
        .trs-timeline-content {
          flex: 1;
          min-width: 0;
        }
        .trs-timeline-status {
          font-size: 12px;
          font-weight: 700;
          color: var(--app-text);
          line-height: 1.4;
        }
        .trs-timeline-meta {
          font-size: 11px;
          color: var(--app-text-muted);
          margin-top: 1px;
        }
        .trs-timeline-note {
          font-size: 11px;
          color: var(--app-text-soft);
          margin-top: 2px;
          font-style: italic;
        }
        .trs-panel-footer {
          position: sticky;
          bottom: 0;
          background: var(--app-surface);
          border-top: 1px solid var(--app-border);
          padding: 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        .trs-footer-row {
          display: flex;
          gap: 8px;
        }
        .trs-btn-primary {
          flex: 1;
          height: 40px;
          background: #3B5BDB;
          color: #fff;
          border: none;
          border-radius: var(--app-radius-md);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background var(--app-transition), transform var(--app-transition);
          font-family: inherit;
        }
        .trs-btn-primary:hover {
          background: #2748b5;
        }
        .trs-btn-primary:active {
          transform: scale(0.98);
        }
        .trs-btn-secondary {
          flex: 1;
          height: 36px;
          background: var(--app-surface-muted);
          color: var(--app-text-soft);
          border: 1px solid var(--app-border);
          border-radius: var(--app-radius-md);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--app-transition);
          font-family: inherit;
        }
        .trs-btn-secondary:hover {
          background: var(--app-surface-hover);
        }
        .trs-btn-ghost {
          flex: 1;
          height: 36px;
          background: none;
          color: var(--app-text-muted);
          border: none;
          border-radius: var(--app-radius-md);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: color var(--app-transition);
          font-family: inherit;
        }
        .trs-btn-ghost:hover {
          color: #3B5BDB;
        }
        .trs-completed-text {
          font-size: 13px;
          color: var(--app-text-subtle);
          text-align: center;
          padding: 4px 0;
          font-style: italic;
        }
        .trs-small-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--app-surface-muted);
          border: 1px solid var(--app-border);
          border-radius: var(--app-radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: var(--app-text-soft);
          cursor: pointer;
          margin-top: 8px;
          font-family: inherit;
          transition: background var(--app-transition), color var(--app-transition);
        }
        .trs-small-btn:hover {
          background: #eef2ff;
          color: #3B5BDB;
          border-color: #c7d2fe;
        }
        .trs-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          background: none;
          border: 1px dashed var(--app-border);
          border-radius: var(--app-radius-md);
          font-size: 12px;
          font-weight: 600;
          color: var(--app-text-muted);
          cursor: pointer;
          margin-top: 8px;
          font-family: inherit;
          transition: border-color var(--app-transition), color var(--app-transition);
          width: 100%;
          justify-content: center;
        }
        .trs-add-btn:hover {
          border-color: #3B5BDB;
          color: #3B5BDB;
        }
        .trs-verified-ok {
          color: var(--app-success);
          font-size: 12px;
          font-weight: 600;
        }
        .trs-verified-warn {
          color: var(--app-warning);
          font-size: 12px;
          font-weight: 600;
        }
        @media (max-width: 480px) {
          .trs-panel {
            width: 100vw;
          }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className="trs-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        ref={panelRef}
        className="trs-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`أداة الخزينة ${instrument.id}`}
        dir="rtl"
      >
        {/* ─── Header ─── */}
        <div className="trs-panel-header">
          <div className="trs-panel-header-top">
            <span className="trs-panel-ref">{instrument.id}</span>
            <button
              className="trs-panel-close"
              onClick={onClose}
              aria-label="إغلاق"
              type="button"
            >
              ×
            </button>
          </div>

          {/* Direction + type + status badges */}
          <div className="trs-panel-badges">
            <span
              className="trs-badge"
              style={{ background: '#eef2ff', color: '#3B5BDB', border: '1px solid #c7d2fe' }}
            >
              {fullTypeLabel}
            </span>
            <span
              className="trs-badge"
              style={statusBadgeStyle(instrument.status)}
            >
              {STATUS_AR[instrument.status]}
            </span>
          </div>

          {/* Status flow progress */}
          <StatusFlow
            flowIndex={flowIndex}
            isCancelled={isCancelled}
            isBounced={isBounced}
          />
        </div>

        {/* ─── Scrollable Body ─── */}
        <div className="trs-panel-body">

          {/* Section: المعلومات الأساسية */}
          <div className="trs-section">
            <div className="trs-section-title">المعلومات الأساسية</div>
            <div className="trs-kv-grid">
              <span className="trs-kv-label">المبلغ</span>
              <span className="trs-kv-value trs-kv-value--amount">
                {formatILS(instrument.amount, instrument.currency)}
              </span>

              <span className="trs-kv-label">العملة</span>
              <span className="trs-kv-value">
                {instrument.currency === 'ILS'
                  ? 'شيكل إسرائيلي (₪)'
                  : instrument.currency === 'JOD'
                  ? 'دينار أردني (د.أ)'
                  : 'دولار أمريكي ($)'}
              </span>

              <span className="trs-kv-label">تاريخ الشيك</span>
              <span className="trs-kv-value">{fmtDate(instrument.instrumentDate)}</span>

              <span className="trs-kv-label">تاريخ الاستحقاق</span>
              <div>
                <span className="trs-kv-value">{fmtDate(instrument.dueDate)}</span>
                {!isTerminal && (
                  <div
                    className={`trs-due-tag ${diff < 0 ? 'trs-due-tag--overdue' : 'trs-due-tag--future'}`}
                  >
                    {diff < 0
                      ? `متأخر ${Math.abs(diff)} أيام`
                      : diff === 0
                      ? 'اليوم'
                      : `${diff} أيام متبقية`}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: بيانات الساحب */}
          {instrument.drawerName && (
            <div className="trs-section">
              <div className="trs-section-title">بيانات الساحب</div>
              <div className="trs-kv-grid">
                <span className="trs-kv-label">الاسم</span>
                <span className="trs-kv-value">{instrument.drawerName}</span>

                {instrument.drawerType && (
                  <>
                    <span className="trs-kv-label">نوع الطرف</span>
                    <span className="trs-kv-value">
                      {instrument.drawerType === 'customer'
                        ? 'زبون'
                        : instrument.drawerType === 'supplier'
                        ? 'مورد'
                        : 'أخرى'}
                    </span>
                  </>
                )}
              </div>
              {instrument.drawerId && (
                <button
                  className="trs-link-btn"
                  style={{ marginTop: '10px', display: 'block' }}
                  onClick={() => onAction(instrument, 'view_party')}
                  type="button"
                >
                  عرض ملف الطرف ←
                </button>
              )}
            </div>
          )}

          {/* Section: البيانات البنكية */}
          <div className="trs-section">
            <div className="trs-section-title">البيانات البنكية</div>
            <div className="trs-kv-grid">
              <span className="trs-kv-label">البنك</span>
              <span className="trs-kv-value">{instrument.bankName || '—'}</span>

              <span className="trs-kv-label">الفرع</span>
              <span className="trs-kv-value">{instrument.branchName || '—'}</span>

              <span className="trs-kv-label">رقم الحساب</span>
              <span className="trs-kv-value trs-kv-value--mono">{maskedAccount}</span>

              <span className="trs-kv-label">رقم الشيك</span>
              <span className="trs-kv-value trs-kv-value--mono">
                {instrument.checkNumber || '—'}
              </span>

              <span className="trs-kv-label">رمز SWIFT</span>
              <span className="trs-kv-value trs-kv-value--mono">
                {instrument.swiftCode || '—'}
              </span>
            </div>
          </div>

          {/* Section: بيانات MICR */}
          {instrument.micrRaw && (
            <div className="trs-section">
              <div className="trs-section-title">بيانات MICR</div>
              <div className="trs-micr-box">
                <span className="trs-micr-raw">{instrument.micrRaw}</span>
                <div className="trs-kv-grid" style={{ fontSize: '12px' }}>
                  <span className="trs-kv-label">كود البنك</span>
                  <span className="trs-kv-value trs-kv-value--mono">
                    {instrument.micrBankCode || '—'}
                  </span>

                  <span className="trs-kv-label">رقم الحساب</span>
                  <span className="trs-kv-value trs-kv-value--mono">
                    {instrument.micrAccountNumber || '—'}
                  </span>

                  <span className="trs-kv-label">رقم الشيك</span>
                  <span className="trs-kv-value trs-kv-value--mono">
                    {instrument.micrCheckNumber || '—'}
                  </span>

                  <span className="trs-kv-label">حالة التحقق</span>
                  <span>
                    {instrument.micrVerified ? (
                      <span className="trs-verified-ok">✓ تم التحقق يدوياً</span>
                    ) : (
                      <span className="trs-verified-warn">⚠ بانتظار المراجعة</span>
                    )}
                  </span>
                </div>
              </div>
              <button
                className="trs-small-btn"
                onClick={() => onAction(instrument, 'edit_micr')}
                type="button"
              >
                تعديل بيانات MICR
              </button>
            </div>
          )}

          {/* Section: الفواتير المرتبطة */}
          <div className="trs-section">
            <div className="trs-section-title">الفواتير المرتبطة</div>
            {instrument.linkedInvoiceIds.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '4px' }}>
                {instrument.linkedInvoiceIds.map((invId) => (
                  <span key={invId} className="trs-invoice-pill">
                    {invId}
                  </span>
                ))}
              </div>
            ) : (
              <p className="trs-empty-text">لا توجد فواتير مرتبطة</p>
            )}
            <button
              className="trs-add-btn"
              onClick={() => onAction(instrument, 'link_invoice')}
              type="button"
            >
              + ربط بفاتورة
            </button>
          </div>

          {/* Section: ملاحظات */}
          <div className="trs-section">
            <div className="trs-section-title">ملاحظات</div>
            <textarea
              ref={notesRef}
              className="trs-notes-area"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="أضف ملاحظة..."
              dir="rtl"
            />
          </div>

          {/* Section: سجل الحالات */}
          <div className="trs-section">
            <div className="trs-section-title">سجل الحالات</div>
            {instrument.statusHistory.length === 0 ? (
              <p className="trs-empty-text">لا يوجد سجل بعد</p>
            ) : (
              <ul className="trs-timeline">
                {[...instrument.statusHistory].reverse().map((entry, idx) => (
                  <li key={idx} className="trs-timeline-entry">
                    <div className="trs-timeline-left">
                      <div
                        className="trs-timeline-dot"
                        style={{ background: statusDotColor(entry.status) }}
                      />
                      <div className="trs-timeline-line" />
                    </div>
                    <div className="trs-timeline-content">
                      <div className="trs-timeline-status">
                        {STATUS_AR[entry.status]}
                      </div>
                      <div className="trs-timeline-meta">
                        {fmtDateTime(entry.changedAt)}
                        {entry.changedBy ? ` · ${entry.changedBy}` : ''}
                      </div>
                      {entry.note && (
                        <div className="trs-timeline-note">{entry.note}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="trs-panel-footer">
          {isTerminal ? (
            <p className="trs-completed-text">مكتمل</p>
          ) : primaryAction ? (
            <button
              className="trs-btn-primary"
              onClick={() => onAction(instrument, primaryAction.action)}
              type="button"
            >
              {primaryAction.label}
            </button>
          ) : null}

          <div className="trs-footer-row">
            <button
              className="trs-btn-secondary"
              onClick={() => window.print()}
              type="button"
            >
              طباعة الإيصال
            </button>
            <button
              className="trs-btn-ghost"
              onClick={handleCopyRef}
              type="button"
            >
              نسخ المرجع
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── StatusFlow sub-component ───────────────────────────────────────────── */

interface StatusFlowProps {
  flowIndex: number
  isCancelled: boolean
  isBounced: boolean
}

function StatusFlow({ flowIndex, isCancelled, isBounced }: StatusFlowProps) {
  return (
    <div style={{ paddingBottom: '2px' }}>
      <div className="trs-status-flow">
        {FLOW_STEPS.map((step, i) => {
          const isDone = !isCancelled && i < flowIndex
          const isActive = !isCancelled && i === flowIndex
          const dotClass = isCancelled
            ? 'trs-flow-dot trs-flow-dot--cancelled'
            : isDone
            ? 'trs-flow-dot trs-flow-dot--done'
            : isActive
            ? 'trs-flow-dot trs-flow-dot--active'
            : 'trs-flow-dot'

          const labelClass =
            !isCancelled && isActive
              ? 'trs-flow-label trs-flow-label--active'
              : 'trs-flow-label'

          return (
            <div
              key={step}
              style={{ display: 'flex', alignItems: 'center', flex: i < FLOW_STEPS.length - 1 ? '1' : undefined }}
            >
              {/* Step */}
              <div className="trs-flow-step">
                <div className={dotClass} />
                <span className={labelClass}>{FLOW_LABELS[step]}</span>
                {/* Bounced branch hangs below "deposited" step */}
                {step === 'deposited' && isBounced && (
                  <div className="trs-flow-bounced-branch">
                    <div className="trs-flow-bounced-line" />
                    <div className="trs-flow-bounced-dot" />
                    <span className="trs-flow-bounced-label">مرتجعة</span>
                  </div>
                )}
              </div>
              {/* Connector line between steps */}
              {i < FLOW_STEPS.length - 1 && (
                <div
                  className={`trs-flow-connector${!isCancelled && i < flowIndex ? ' trs-flow-connector--done' : ''}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
