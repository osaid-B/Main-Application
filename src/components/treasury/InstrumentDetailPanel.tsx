import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { TreasuryInstrument } from '../../types/treasury';
import { STATUS_AR } from '../../types/treasury';
import type { StatusActionType } from './StatusActionModal';

interface Props {
  instrument: TreasuryInstrument;
  onClose: () => void;
  onAction: (type: StatusActionType) => void;
}

function normalizeDate(d: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [day, month, year] = d.split('/');
    return `${year}-${month}-${day}`;
  }
  return d;
}

function money(value: number, currency: 'ILS' | 'JOD' | 'USD' = 'ILS'): string {
  const n = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  if (currency === 'ILS') return `₪${n}`;
  if (currency === 'JOD') return `${n} د.أ`;
  return `$${n}`;
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(normalizeDate(d)));
  } catch {
    return d;
  }
}

function daysRemaining(dueDate: string): { label: string; color: string } {
  try {
    const diff = Math.ceil(
      (new Date(normalizeDate(dueDate)).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (diff > 0) return { label: `${diff} يوماً متبقياً`, color: '#15803d' };
    if (diff === 0) return { label: 'مستحق اليوم', color: '#b45309' };
    return { label: `متأخر ${Math.abs(diff)} يوماً`, color: '#b91c1c' };
  } catch {
    return { label: '—', color: '#94a3b8' };
  }
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (['cleared'].includes(status)) return 'success';
  if (['pending', 'deposited', 'under_review', 'partially_applied'].includes(status)) return 'warning';
  if (['bounced', 'cancelled'].includes(status)) return 'danger';
  return 'neutral';
}

const STATUS_FLOW = ['draft', 'pending', 'deposited', 'cleared'] as const;

function getActionsForStatus(status: TreasuryInstrument['status']): StatusActionType[] {
  switch (status) {
    case 'draft': return ['submit', 'cancel'];
    case 'pending': return ['deposit', 'cancel'];
    case 'deposited': return ['clear', 'bounce'];
    case 'bounced': return ['redeposit', 'cancel'];
    default: return [];
  }
}

const ACTION_LABELS: Record<StatusActionType, string> = {
  menu: 'الإجراءات',
  submit: 'تقديم',
  deposit: 'تسجيل إيداع',
  clear: 'تأكيد التحصيل',
  bounce: 'تسجيل ارتجاع',
  redeposit: 'إعادة إيداع',
  cancel: 'إلغاء',
};

const ACTION_VARIANTS: Record<StatusActionType, 'primary' | 'danger' | 'secondary'> = {
  menu: 'secondary',
  submit: 'primary',
  deposit: 'primary',
  clear: 'primary',
  bounce: 'danger',
  redeposit: 'primary',
  cancel: 'danger',
};

export function InstrumentDetailPanel({ instrument, onClose, onAction }: Props) {
  const remaining = daysRemaining(instrument.dueDate);
  const actions = getActionsForStatus(instrument.status);
  const isTerminal = ['cleared', 'cancelled'].includes(instrument.status);

  const isIncoming = instrument.direction === 'incoming';
  const partyLabel = isIncoming ? 'الساحب' : 'المستفيد';
  const partyName = isIncoming ? instrument.drawerName : instrument.payeeName;

  const typeLabel = instrument.type === 'check'
    ? (isIncoming ? 'شيك وارد' : 'شيك صادر')
    : (isIncoming ? 'تحويل وارد' : 'تحويل صادر');

  const currentStepIdx = STATUS_FLOW.indexOf(
    instrument.status as typeof STATUS_FLOW[number],
  );
  const isBounced = instrument.status === 'bounced';

  return createPortal(
    <div className="treasury-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <aside
        className="treasury-drawer"
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="treasury-drawer-head">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <Badge
                variant={isIncoming ? 'info' : 'neutral'}
                className="trs-type-badge"
                style={{
                  background: isIncoming ? '#dbeafe' : '#ffedd5',
                  color: isIncoming ? '#1d4ed8' : '#ea580c',
                }}
              >
                {typeLabel}
              </Badge>
              <Badge
                variant={statusTone(instrument.status)}
                className={`trs-status-badge trs-status--${statusTone(instrument.status)}`}
              >
                {STATUS_AR[instrument.status]}
              </Badge>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
              {instrument.checkNumber ?? instrument.referenceNumber ?? instrument.id}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{instrument.id}</p>
          </div>
          <button type="button" className="icon-dismiss-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Status Timeline */}
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STATUS_FLOW.map((step, i) => {
              const stepIdx = STATUS_FLOW.indexOf(step);
              const isDone = currentStepIdx >= 0 && stepIdx <= currentStepIdx;
              const isCurrent = instrument.status === step;
              const showBounce = isBounced && step === 'deposited';

              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_FLOW.length - 1 ? 1 : 'unset' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      background: showBounce ? '#fee2e2' : (isDone ? (isCurrent ? '#2563eb' : '#dcfce7') : '#f1f5f9'),
                      color: showBounce ? '#b91c1c' : (isDone ? (isCurrent ? '#fff' : '#15803d') : '#94a3b8'),
                      border: `2px solid ${showBounce ? '#fca5a5' : (isCurrent ? '#2563eb' : (isDone ? '#86efac' : '#e2e8f0'))}`,
                      flexShrink: 0,
                    }}>
                      {showBounce ? '!' : (i + 1)}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? '#2563eb' : '#94a3b8', whiteSpace: 'nowrap' }}>
                      {STATUS_AR[step]}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div style={{
                      flex: 1,
                      height: 2,
                      background: (currentStepIdx >= 0 && i < currentStepIdx) ? '#86efac' : '#e2e8f0',
                      margin: '0 6px',
                      marginBottom: 18,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          {isBounced && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                مرتجع — {instrument.statusHistory.find(h => h.status === 'bounced')?.note ?? 'سبب غير محدد'}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="treasury-drawer-body">
          {/* Amount & Dates */}
          <section className="workspace-surface treasury-drawer-card">
            <h3>المبلغ والتواريخ</h3>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', direction: 'ltr', display: 'inline-block' }}>
                {money(instrument.amount, instrument.currency)}
              </strong>
              {instrument.currency !== 'ILS' && (
                <span style={{ fontSize: 13, color: '#64748b', marginInlineStart: 8 }}>
                  ({money(instrument.amountInILS, 'ILS')} تقريباً)
                </span>
              )}
            </div>
            <div className="treasury-detail-grid">
              <div><span>تاريخ الشيك</span><strong>{fmtDate(instrument.instrumentDate)}</strong></div>
              <div><span>تاريخ الاستحقاق</span><strong>{fmtDate(instrument.dueDate)}</strong></div>
              <div>
                <span>الأيام المتبقية</span>
                <strong style={{ color: remaining.color }}>{remaining.label}</strong>
              </div>
              {instrument.depositedDate && (
                <div><span>تاريخ الإيداع</span><strong>{fmtDate(instrument.depositedDate)}</strong></div>
              )}
              {instrument.clearedDate && (
                <div><span>تاريخ التحصيل</span><strong>{fmtDate(instrument.clearedDate)}</strong></div>
              )}
            </div>
          </section>

          {/* Party */}
          <section className="workspace-surface treasury-drawer-card">
            <h3>بيانات الطرف</h3>
            <div className="treasury-detail-grid">
              <div><span>{partyLabel}</span><strong>{partyName}</strong></div>
              <div>
                <span>النوع</span>
                <strong>
                  {instrument.drawerType === 'customer' ? 'زبون'
                    : instrument.drawerType === 'supplier' ? 'مورد'
                    : 'أخرى'}
                </strong>
              </div>
            </div>
          </section>

          {/* Bank */}
          <section className="workspace-surface treasury-drawer-card">
            <h3>البيانات البنكية</h3>
            <div className="treasury-detail-grid">
              <div><span>البنك</span><strong>{instrument.bankName}</strong></div>
              {instrument.branchName && (
                <div><span>الفرع</span><strong>{instrument.branchName}</strong></div>
              )}
              <div>
                <span>رقم الحساب</span>
                <strong dir="ltr">****{instrument.accountNumber.slice(-4)}</strong>
              </div>
              {instrument.checkNumber && (
                <div><span>رقم الشيك</span><strong dir="ltr">{instrument.checkNumber}</strong></div>
              )}
              {instrument.iban && (
                <div><span>IBAN</span><strong dir="ltr" style={{ fontSize: 11 }}>{instrument.iban}</strong></div>
              )}
            </div>
          </section>

          {/* Linked Invoices */}
          {instrument.linkedInvoiceIds.length > 0 && (
            <section className="workspace-surface treasury-drawer-card">
              <h3>الفواتير المرتبطة</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {instrument.linkedInvoiceIds.map(id => (
                  <span
                    key={id}
                    style={{
                      padding: '4px 12px',
                      background: '#dbeafe',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1d4ed8',
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {instrument.notes && (
            <section className="workspace-surface treasury-drawer-card">
              <h3>الملاحظات</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{instrument.notes}</p>
            </section>
          )}

          {/* Status History */}
          <section className="workspace-surface treasury-drawer-card">
            <h3>سجل الحالات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...instrument.statusHistory].reverse().map((entry, i) => {
                const ts = new Date(entry.changedAt);
                const datePart = ts.toLocaleDateString('ar-SA-u-nu-latn', { day: '2-digit', month: '2-digit' });
                const timePart = ts.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{datePart} {timePart}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginInlineStart: 6 }}>
                        {STATUS_AR[entry.status]}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginInlineStart: 4 }}>— {entry.changedBy}</span>
                      {entry.note && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{entry.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        {!isTerminal && actions.length > 0 && (
          <div style={{
            padding: '14px 22px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            {actions.map(a => (
              <Button
                key={a}
                variant={ACTION_VARIANTS[a]}
                className="trs-mini-btn"
                style={{ height: 36, paddingInline: 14 }}
                onClick={() => onAction(a)}
              >
                {ACTION_LABELS[a]}
              </Button>
            ))}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
