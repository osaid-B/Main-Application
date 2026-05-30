import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye } from 'lucide-react'
import { useTreasury } from '../../context/TreasuryContext'
import type { TreasuryInstrument, InstrumentStatus } from '../../types/treasury'
import { STATUS_AR, TYPE_AR } from '../../types/treasury'

interface TreasuryPageProps {
  onOpenPanel: (instrument: TreasuryInstrument) => void
  onAddCheck: () => void
  onAddTransfer: () => void
  onAction: (instrument: TreasuryInstrument, action: string) => void
}

type ViewTab = 'overview' | 'incoming' | 'outgoing' | 'transfers' | 'guarantees'

const PAGE_SIZE = 20

function formatILS(n: number): string {
  return '₪' + n.toLocaleString('ar-SA', { minimumFractionDigits: 0 })
}

function fmtDate(s: string): string {
  return s || '—'
}

function isOverdue(inst: TreasuryInstrument): boolean {
  if (['cleared', 'cancelled'].includes(inst.status)) return false
  const [d, m, y] = inst.dueDate.split('/')
  return new Date(`${y}-${m}-${d}`) < new Date()
}

function currencySymbol(currency: string): string {
  if (currency === 'ILS') return '₪'
  if (currency === 'JOD') return 'د.أ'
  return '$'
}

function statusBadgeClass(status: InstrumentStatus): string {
  switch (status) {
    case 'draft':
      return 'ds-badge ds-badge--neutral'
    case 'pending':
      return 'ds-badge ds-badge--info'
    case 'deposited':
      return 'ds-badge'
    case 'cleared':
      return 'ds-badge ds-badge--success'
    case 'bounced':
      return 'ds-badge ds-badge--danger'
    case 'cancelled':
      return 'ds-badge ds-badge--neutral'
    case 'under_review':
      return 'ds-badge ds-badge--violet'
    case 'partially_applied':
      return 'ds-badge ds-badge--warning'
    default:
      return 'ds-badge ds-badge--neutral'
  }
}

function statusBadgeStyle(status: InstrumentStatus): React.CSSProperties {
  if (status === 'deposited') return { color: '#0D9488', background: '#F0FDFA', borderColor: '#99F6E4' }
  if (status === 'cancelled') return { opacity: 0.6 }
  return {}
}

function rowClass(inst: TreasuryInstrument): string {
  if (inst.status === 'bounced') return 'row-bounced'
  if (inst.status === 'under_review') return 'row-review'
  if (isOverdue(inst)) return 'row-overdue'
  return ''
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent: string
}) {
  return (
    <div className="ds-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="ds-stat-card__label">{label}</div>
      <div className="ds-stat-card__value">{value}</div>
      {sub && <div className="ds-stat-card__sub">{sub}</div>}
    </div>
  )
}

export default function TreasuryPage({
  onOpenPanel,
  onAddCheck,
  onAddTransfer,
  onAction,
}: TreasuryPageProps) {
  const navigate = useNavigate()
  const { instruments, bankAccounts } = useTreasury()

  const [activeTab, setActiveTab] = useState<ViewTab>('overview')
  const [filterDirection, setFilterDirection] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBank, setFilterBank] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const stats = useMemo(() => {
    const ilsAccounts = bankAccounts.filter(a => a.currency === 'ILS' && a.isActive)
    const bankTotal = ilsAccounts.reduce((sum, a) => sum + a.balance, 0)
    const activeAccountCount = bankAccounts.filter(a => a.isActive).length

    const pendingIncoming = instruments.filter(
      i => i.direction === 'incoming' && i.type === 'check' && ['pending', 'deposited'].includes(i.status)
    )
    const pendingIncomingTotal = pendingIncoming.reduce((sum, i) => sum + i.amountInILS, 0)

    const bouncedCount = instruments.filter(i => i.status === 'bounced').length
    const underReviewCount = instruments.filter(i => i.status === 'under_review').length

    return {
      bankTotal,
      activeAccountCount,
      pendingIncomingCount: pendingIncoming.length,
      pendingIncomingTotal,
      bouncedCount,
      underReviewCount,
    }
  }, [instruments, bankAccounts])

  const uniqueBanks = useMemo(() => {
    const names = new Set(instruments.map(i => i.bankName))
    return Array.from(names).sort()
  }, [instruments])

  const filtered = useMemo(() => {
    let list = instruments

    if (activeTab === 'incoming') {
      list = list.filter(i => i.direction === 'incoming' && i.type === 'check')
    } else if (activeTab === 'outgoing') {
      list = list.filter(i => i.direction === 'outgoing' && i.type === 'check')
    } else if (activeTab === 'transfers') {
      list = list.filter(i => i.type === 'bank_transfer')
    } else if (activeTab === 'guarantees') {
      list = list.filter(i => i.type === 'bank_guarantee' || i.type === 'letter_of_credit')
    }

    if (filterDirection) {
      list = list.filter(i => i.direction === filterDirection)
    }
    if (filterStatus) {
      list = list.filter(i => i.status === filterStatus)
    }
    if (filterBank) {
      list = list.filter(i => i.bankName === filterBank)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.drawerName.toLowerCase().includes(q) ||
        i.payeeName.toLowerCase().includes(q) ||
        (i.checkNumber ?? '').toLowerCase().includes(q) ||
        (i.referenceNumber ?? '').toLowerCase().includes(q)
      )
    }

    return list
  }, [instruments, activeTab, filterDirection, filterStatus, filterBank, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function switchTab(tab: ViewTab) {
    setActiveTab(tab)
    setPage(1)
  }

  function handleFilterChange(
    setter: React.Dispatch<React.SetStateAction<string>>
  ) {
    return (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="page-header__left">
          <nav className="page-breadcrumb">
            <span className="bc-root">أطلس</span>
            <span className="bc-sep">›</span>
            <span className="bc-section">الشركة</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">الخزينة</span>
            <span className="bc-count">{filtered.length}</span>
          </nav>
          <p className="page-desc">إدارة الشيكات والتحويلات والأدوات المالية</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--sm"
            onClick={() => navigate('/company/treasury/accounts')}
          >
            تسوية بنكية
          </button>
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--sm"
            disabled
          >
            تصدير CSV
          </button>
          <button
            type="button"
            className="ds-btn ds-btn--secondary ds-btn--sm"
            onClick={onAddTransfer}
          >
            <Plus size={14} />
            إضافة تحويل
          </button>
          <button
            type="button"
            className="ds-btn ds-btn--primary ds-btn--sm"
            onClick={onAddCheck}
          >
            <Plus size={14} />
            إضافة شيك وارد
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label="الحسابات البنكية"
          value={formatILS(stats.bankTotal)}
          sub={`${stats.activeAccountCount} حساب نشط`}
          accent="#3B5BDB"
        />
        <StatCard
          label="شيكات واردة معلقة"
          value={stats.pendingIncomingCount}
          sub={formatILS(stats.pendingIncomingTotal)}
          accent="#D97706"
        />
        <StatCard
          label="أدوات مرتجعة"
          value={stats.bouncedCount}
          sub="تحتاج إجراء فوري"
          accent="#DC2626"
        />
        <StatCard
          label="قائمة المراجعة"
          value={stats.underReviewCount}
          sub="تحتاج مراجعة يدوية"
          accent="#7C3AED"
        />
      </div>

      <div className="treasury-tabs-row">
        {(
          [
            ['overview', 'نظرة عامة'],
            ['incoming', 'الشيكات الواردة'],
            ['outgoing', 'الشيكات الصادرة'],
            ['transfers', 'التحويلات'],
            ['guarantees', 'الضمانات'],
          ] as [ViewTab, string][]
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className={`treasury-tab-pill${activeTab === tab ? ' treasury-tab-pill--active' : ''}`}
            onClick={() => switchTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ds-card content-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={15} className="toolbar-search__icon" />
            <input
              className="ds-input"
              placeholder="بحث بالمرجع أو الاسم أو رقم الشيك..."
              value={search}
              onChange={handleFilterChange(setSearch)}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="ds-input ds-input--select"
              value={filterDirection}
              onChange={handleFilterChange(setFilterDirection)}
            >
              <option value="">الاتجاه: الكل</option>
              <option value="incoming">وارد</option>
              <option value="outgoing">صادر</option>
            </select>
            <select
              className="ds-input ds-input--select"
              value={filterStatus}
              onChange={handleFilterChange(setFilterStatus)}
            >
              <option value="">الحالة: الكل</option>
              <option value="draft">مسودة</option>
              <option value="pending">معلقة</option>
              <option value="deposited">مودعة</option>
              <option value="cleared">محصّلة</option>
              <option value="bounced">مرتجعة</option>
              <option value="cancelled">ملغاة</option>
              <option value="under_review">قيد المراجعة</option>
              <option value="partially_applied">مطبّقة جزئياً</option>
            </select>
            <select
              className="ds-input ds-input--select"
              value={filterBank}
              onChange={handleFilterChange(setFilterBank)}
            >
              <option value="">البنك: الكل</option>
              {uniqueBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="tc-code">المرجع</th>
                <th className="tc-badge">النوع</th>
                <th className="tc-primary tc-flex">الطرف</th>
                <th className="tc-code">رقم الشيك</th>
                <th className="tc-num">المبلغ</th>
                <th className="tc-date">تاريخ الشيك</th>
                <th className="tc-date">تاريخ الاستحقاق</th>
                <th className="tc-badge">الحالة</th>
                <th className="tc-actions">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(inst => {
                const overdue = isOverdue(inst)
                return (
                  <tr key={inst.id} className={rowClass(inst)}>
                    <td className="tc-code">
                      <div>
                        <span>{inst.id}</span>
                        <span
                          className="ds-badge ds-badge--neutral"
                          style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}
                        >
                          {TYPE_AR[inst.type]}
                        </span>
                      </div>
                    </td>
                    <td className="tc-badge">
                      {inst.direction === 'incoming' ? (
                        <span className="ds-badge ds-badge--info">وارد</span>
                      ) : (
                        <span className="ds-badge ds-badge--warning">صادر</span>
                      )}
                    </td>
                    <td className="tc-primary tc-flex">
                      <div>
                        <span className="tc-primary-name">{inst.drawerName}</span>
                        <span className="tc-sub-muted">
                          {inst.bankName}
                          {inst.accountNumber
                            ? ` •••• ${inst.accountNumber.slice(-4)}`
                            : ''}
                        </span>
                      </div>
                    </td>
                    <td className="tc-code">{inst.checkNumber ?? '—'}</td>
                    <td className="tc-num">
                      <div>
                        <span>
                          {currencySymbol(inst.currency)}
                          {inst.amount.toLocaleString('ar-SA')}
                        </span>
                        {inst.currency !== 'ILS' && (
                          <span className="tc-sub-muted">
                            {formatILS(inst.amountInILS)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="tc-date">{fmtDate(inst.instrumentDate)}</td>
                    <td className={`tc-date${overdue ? ' overdue-date' : ''}`}>
                      {fmtDate(inst.dueDate)}
                    </td>
                    <td className="tc-badge">
                      <span
                        className={statusBadgeClass(inst.status)}
                        style={statusBadgeStyle(inst.status)}
                      >
                        {STATUS_AR[inst.status]}
                      </span>
                    </td>
                    <td className="tc-actions">
                      <div className="row-actions">
                        {inst.status === 'draft' && (
                          <>
                            <button
                              type="button"
                              className="ds-btn ds-btn--primary ds-btn--xs"
                              onClick={() => onAction(inst, 'submit')}
                            >
                              تقديم
                            </button>
                            <button
                              type="button"
                              className="ds-btn ds-btn--ghost ds-btn--xs"
                              onClick={() => onAction(inst, 'cancel')}
                            >
                              إلغاء
                            </button>
                          </>
                        )}
                        {inst.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="ds-btn ds-btn--primary ds-btn--xs"
                              onClick={() => onAction(inst, 'deposit')}
                            >
                              تسجيل إيداع
                            </button>
                            <button
                              type="button"
                              className="ds-btn ds-btn--ghost ds-btn--xs"
                              onClick={() => onAction(inst, 'cancel')}
                            >
                              إلغاء
                            </button>
                          </>
                        )}
                        {inst.status === 'deposited' && (
                          <>
                            <button
                              type="button"
                              className="ds-btn ds-btn--primary ds-btn--xs"
                              onClick={() => onAction(inst, 'clear')}
                            >
                              تأكيد التحصيل
                            </button>
                            <button
                              type="button"
                              className="ds-btn ds-btn--ghost ds-btn--xs"
                              onClick={() => onAction(inst, 'bounce')}
                            >
                              تسجيل ارتجاع
                            </button>
                          </>
                        )}
                        {inst.status === 'bounced' && (
                          <>
                            <button
                              type="button"
                              className="ds-btn ds-btn--primary ds-btn--xs"
                              onClick={() => onAction(inst, 'redeposit')}
                            >
                              إعادة إيداع
                            </button>
                            <button
                              type="button"
                              className="ds-btn ds-btn--ghost ds-btn--xs"
                              onClick={() => onAction(inst, 'legal')}
                            >
                              إجراء قانوني
                            </button>
                          </>
                        )}
                        {inst.status === 'under_review' && (
                          <button
                            type="button"
                            className="ds-btn ds-btn--secondary ds-btn--xs"
                            onClick={() => onAction(inst, 'manual_review')}
                          >
                            مراجعة يدوية
                          </button>
                        )}
                        {inst.status === 'cleared' && (
                          <button
                            type="button"
                            className="ds-btn ds-btn--ghost ds-btn--xs"
                            onClick={() => onOpenPanel(inst)}
                          >
                            عرض
                          </button>
                        )}
                        <button
                          type="button"
                          className="ds-btn ds-btn--icon ds-btn--xs"
                          title="عرض التفاصيل"
                          onClick={() => onOpenPanel(inst)}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    لا توجد أدوات مالية تطابق البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span className="table-count">
            عرض {pageItems.length} من {filtered.length}
          </span>
          {totalPages > 1 && (
            <div className="ds-pagination">
              <button
                type="button"
                className="ds-pagination__btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ›
              </button>
              <span className="ds-pagination__info">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="ds-pagination__btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                ‹
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .treasury-tabs-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .treasury-tab-pill {
          padding: 6px 16px;
          border-radius: 999px;
          border: 1px solid var(--color-border);
          background: var(--color-surface-card);
          color: var(--color-text-muted);
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .treasury-tab-pill:hover {
          border-color: #3B5BDB;
          color: #3B5BDB;
        }
        .treasury-tab-pill--active {
          background: #3B5BDB;
          border-color: #3B5BDB;
          color: #fff;
          font-weight: 600;
        }
        .tc-primary-name {
          display: block;
          font-weight: 600;
          color: var(--color-text);
          font-size: 13px;
        }
        .tc-sub-muted {
          display: block;
          font-size: 11px;
          color: var(--color-text-muted);
          margin-top: 1px;
        }
        .overdue-date {
          color: var(--color-danger);
          font-weight: 600;
        }
        .row-overdue td {
          background: #FEF2F2;
        }
        .row-bounced td {
          background: #FFF7ED;
        }
        .row-review td {
          background: #F5F3FF;
        }
        .row-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }
        .ds-btn--xs {
          padding: 3px 8px;
          font-size: 11px;
          border-radius: var(--radius-sm, 6px);
        }
        .ds-btn--icon.ds-btn--xs {
          padding: 4px;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ds-pagination {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ds-pagination__btn {
          padding: 4px 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm, 6px);
          background: var(--color-surface-card);
          color: var(--color-text);
          cursor: pointer;
          font-size: 14px;
        }
        .ds-pagination__btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ds-pagination__info {
          font-size: 12px;
          color: var(--color-text-muted);
          padding: 0 4px;
        }
        .ds-badge--violet {
          background: #F5F3FF;
          color: #7C3AED;
          border: 1px solid #DDD6FE;
        }
        .toolbar-search__icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .toolbar-search {
          position: relative;
        }
        .toolbar-search .ds-input {
          padding-right: 34px;
        }
      `}</style>
    </div>
  )
}
