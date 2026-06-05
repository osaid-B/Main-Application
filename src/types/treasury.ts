export type PalestinianCurrency = 'ILS' | 'JOD' | 'USD';
export type InstrumentType = 'check' | 'bank_transfer' | 'bank_guarantee' | 'letter_of_credit';
export type InstrumentDirection = 'incoming' | 'outgoing';
export type InstrumentStatus =
  | 'draft'
  | 'pending'
  | 'deposited'
  | 'cleared'
  | 'bounced'
  | 'cancelled'
  | 'under_review'
  | 'partially_applied';

export interface StatusHistoryEntry {
  status: InstrumentStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface TreasuryInstrument {
  id: string;
  type: InstrumentType;
  direction: InstrumentDirection;
  status: InstrumentStatus;

  amount: number;
  currency: PalestinianCurrency;
  amountInILS: number;

  instrumentDate: string;
  dueDate: string;
  depositedDate?: string;
  clearedDate?: string;

  drawerName: string;
  drawerId?: string;
  drawerType?: 'customer' | 'supplier' | 'other';
  payeeName: string;
  payeeId?: string;

  bankId: string;
  bankName: string;
  branchName?: string;
  branchCode?: string;
  accountNumber: string;
  checkNumber?: string;
  iban?: string;
  swiftCode?: string;

  micrRaw?: string;
  micrBankCode?: string;
  micrAccountNumber?: string;
  micrCheckNumber?: string;
  micrVerified: boolean;

  imageUrl?: string;
  notes?: string;
  referenceNumber?: string;

  linkedInvoiceIds: string[];
  linkedPaymentIds: string[];

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryEntry[];
  isDeleted?: boolean;
}

export interface TreasuryBankAccount {
  id: string;
  bankId: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  iban: string;
  currency: PalestinianCurrency;
  accountType: 'current' | 'savings' | 'trust';
  balance: number;
  lastReconciled?: string;
  isActive: boolean;
}

export const PALESTINIAN_BANKS = [
  { id: 'arab_bank',         nameAr: 'البنك العربي',                swift: 'ARABJOAX', code: '01' },
  { id: 'bank_of_palestine', nameAr: 'بنك فلسطين',                  swift: 'PALBBE22', code: '02' },
  { id: 'cairo_amman',       nameAr: 'بنك القاهرة عمان',            swift: 'CAIJJOJX', code: '03' },
  { id: 'quds_bank',         nameAr: 'بنك القدس',                   swift: 'QUDSPSJX', code: '04' },
  { id: 'jordan_ahli',       nameAr: 'البنك الأهلي الأردني',        swift: 'AHLIJOAM', code: '05' },
  { id: 'pal_investment',    nameAr: 'بنك الاستثمار الفلسطيني',     swift: 'PIBNPSJX', code: '06' },
  { id: 'islamic_pal',       nameAr: 'البنك الإسلامي الفلسطيني',   swift: 'PIBKPSJX', code: '07' },
  { id: 'national_islamic',  nameAr: 'البنك الوطني الإسلامي',       swift: 'NBPSPSJX', code: '08' },
  { id: 'jordanian_comm',    nameAr: 'البنك التجاري الأردني',       swift: 'JOCBJOAM', code: '09' },
  { id: 'arab_islamic',      nameAr: 'البنك العربي الإسلامي',       swift: 'ARABILHX', code: '10' },
  { id: 'housing_bank',      nameAr: 'بنك الإسكان',                 swift: 'HBHJJOAM', code: '11' },
  { id: 'pal_monetary',      nameAr: 'سلطة النقد الفلسطينية',       swift: 'PMAPPSRM', code: '00' },
] as const;

export type PalestinianBankId = typeof PALESTINIAN_BANKS[number]['id'];

export const VALID_TRANSITIONS: Record<InstrumentStatus, InstrumentStatus[]> = {
  draft:             ['pending', 'cancelled'],
  pending:           ['deposited', 'cancelled'],
  deposited:         ['cleared', 'bounced', 'under_review'],
  under_review:      ['cleared', 'bounced', 'cancelled'],
  cleared:           [],
  bounced:           ['pending', 'cancelled'],
  cancelled:         [],
  partially_applied: ['cleared', 'bounced'],
};

export const STATUS_AR: Record<InstrumentStatus, string> = {
  draft:             'مسودة',
  pending:           'معلقة',
  deposited:         'مودعة',
  cleared:           'محصّلة',
  bounced:           'مرتجعة',
  cancelled:         'ملغاة',
  under_review:      'قيد المراجعة',
  partially_applied: 'مطبّقة جزئياً',
};

export const TYPE_AR: Record<InstrumentType, string> = {
  check:            'شيك',
  bank_transfer:    'تحويل بنكي',
  bank_guarantee:   'ضمان بنكي',
  letter_of_credit: 'خطاب اعتماد',
};

export const CURRENCY_RATES: Record<PalestinianCurrency, number> = {
  ILS: 1,
  JOD: 5.15,
  USD: 3.7,
};

export const DIRECTION_LABELS_AR: Record<InstrumentDirection, string> = {
  incoming: 'وارد',
  outgoing: 'صادر',
};

export interface ChequeStatusOption {
  value: string;
  label: string;
  color: string;
  bg: string;
  icon: string;
}

export const CHEQUE_STATUS_OPTIONS: ChequeStatusOption[] = [
  // Active statuses
  { value: 'بانتظار_التحقق',  label: 'بانتظار التحقق',            color: '#D97706', bg: '#FEF3C7', icon: '⏳' },
  { value: 'مودع',            label: 'مودع',                       color: '#2563EB', bg: '#EFF6FF', icon: '🏦' },
  { value: 'معتمد',           label: 'معتمد',                      color: '#16A34A', bg: '#DCFCE7', icon: '✅' },
  { value: 'قيد_التحصيل',     label: 'قيد التحصيل',               color: '#7C3AED', bg: '#F5F3FF', icon: '🔄' },
  { value: 'محصّل',           label: 'محصّل',                      color: '#16A34A', bg: '#DCFCE7', icon: '✓'  },
  // Problem statuses
  { value: 'مرتجع',           label: 'مرتجع',                      color: '#DC2626', bg: '#FEE2E2', icon: '↩️' },
  { value: 'مرفوض',           label: 'مرفوض من البنك',             color: '#DC2626', bg: '#FEE2E2', icon: '🚫' },
  { value: 'بدون_رصيد',       label: 'بدون رصيد كافٍ',             color: '#DC2626', bg: '#FEE2E2', icon: '❌' },
  { value: 'موقوف',           label: 'موقوف الصرف',                color: '#DC2626', bg: '#FEE2E2', icon: '🛑' },
  { value: 'مشكوك_فيه',      label: 'مشكوك فيه',                  color: '#D97706', bg: '#FEF3C7', icon: '⚠️' },
  // Resolution statuses
  { value: 'ملغي',            label: 'ملغي',                       color: '#64748B', bg: '#F1F5F9', icon: '🚫' },
  { value: 'مستبدل',          label: 'مستبدل بشيك آخر',            color: '#7C3AED', bg: '#F5F3FF', icon: '🔁' },
  { value: 'مسترد',           label: 'مسترد',                      color: '#D97706', bg: '#FEF3C7', icon: '💰' },
  { value: 'أعيد_للزبون',     label: 'أعيد للزبون',               color: '#D97706', bg: '#FEF3C7', icon: '↪️' },
  { value: 'مؤجل',            label: 'مؤجل الصرف',                 color: '#7C3AED', bg: '#F5F3FF', icon: '📅' },
  { value: 'منتهي_الصلاحية',  label: 'منتهي الصلاحية',             color: '#64748B', bg: '#F1F5F9', icon: '⌛' },
  { value: 'مكتمل',           label: 'مكتمل',                      color: '#16A34A', bg: '#DCFCE7', icon: '✅' },
  // Palestinian-specific
  { value: 'تحت_الاحتجاز',   label: 'تحت الاحتجاز القانوني',      color: '#DC2626', bg: '#FEE2E2', icon: '⚖️' },
  { value: 'مجمّد',           label: 'مجمّد (بقرار قضائي)',         color: '#DC2626', bg: '#FEE2E2', icon: '🔒' },
];

export const CHEQUE_TYPE_OPTIONS = [
  { value: 'شخصي',  label: 'شيك شخصي',       icon: '👤' },
  { value: 'شركة',  label: 'شيك شركة',        icon: '🏢' },
  { value: 'مصرفي', label: 'شيك مصرفي',       icon: '🏦' },
  { value: 'مضمون', label: 'شيك مضمون',       icon: '🛡️' },
  { value: 'مقاصة', label: 'شيك مقاصة',       icon: '🔄' },
  { value: 'آجل',   label: 'شيك آجل (مؤجل)', icon: '📅' },
  { value: 'مسطّر', label: 'شيك مسطّر',        icon: '✏️' },
  { value: 'لأمر',  label: 'شيك لأمر',         icon: '📋' },
];

// Mapping from TreasuryStatusTone (English) → CHEQUE_STATUS_OPTIONS value (Arabic)
export const TREASURY_STATUS_TO_CHEQUE: Record<string, string> = {
  'Pending Verification': 'بانتظار_التحقق',
  'Deposited':            'مودع',
  'Approved':             'معتمد',
  'Under Collection':     'قيد_التحصيل',
  'Cleared':              'محصّل',
  'Collected':            'محصّل',
  'Bounced':              'مرتجع',
  'Rejected':             'مرفوض',
  'Cancelled':            'ملغي',
  'Voided':               'ملغي',
  'Returned':             'مسترد',
  'Held':                 'تحت_الاحتجاز',
  'Partially Applied':    'مؤجل',
  'Pending':              'بانتظار_التحقق',
  'Verified':             'معتمد',
  'Issued':               'مودع',
  'Delivered':            'مودع',
  'Received':             'معتمد',
  'Draft':                'بانتظار_التحقق',
};
