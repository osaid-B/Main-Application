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
