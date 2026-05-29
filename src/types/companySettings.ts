export interface CompanySettings {
  nameAr: string;
  nameEn: string;
  logoBase64?: string;
  taglineAr?: string;
  taglineEn?: string;
  commercialRegNumber: string;
  taxId: string;
  businessType: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  governorate: string;
  city: string;
  streetAddress: string;
  phone: string;
  phone2?: string;
  email: string;
  website?: string;
  defaultCurrency: "ILS" | "JOD" | "USD";
  defaultTaxRate: number;
  taxExempt: boolean;
  fiscalYearStart: number;
  bankName?: string;
  iban?: string;
  accountNumber?: string;
  swiftCode?: string;
  invoicePrefix: string;
  invoiceStartNumber: number;
  invoiceFooterAr?: string;
  invoiceNotesAr?: string;
  showTaxOnInvoice: boolean;
  receiptHeaderAr?: string;
  receiptFooterAr?: string;
  showLogoOnReceipt: boolean;
  exchangeRates: {
    ILS_TO_JOD: number;
    ILS_TO_USD: number;
    JOD_TO_USD: number;
    lastUpdated: string;
  };
  numberFormat: "eastern" | "western";
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD";
  timezone: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  nameAr: "شركتي",
  nameEn: "My Company",
  logoBase64: undefined,
  taglineAr: "",
  taglineEn: "",
  commercialRegNumber: "",
  taxId: "",
  businessType: "llc",
  licenseNumber: "",
  licenseExpiry: "",
  governorate: "ramallah",
  city: "",
  streetAddress: "",
  phone: "",
  phone2: "",
  email: "",
  website: "",
  defaultCurrency: "ILS",
  defaultTaxRate: 16,
  taxExempt: false,
  fiscalYearStart: 1,
  bankName: "",
  iban: "",
  accountNumber: "",
  swiftCode: "",
  invoicePrefix: "فاتورة",
  invoiceStartNumber: 1,
  invoiceFooterAr: "",
  invoiceNotesAr: "",
  showTaxOnInvoice: true,
  receiptHeaderAr: "",
  receiptFooterAr: "شكراً لتعاملكم معنا",
  showLogoOnReceipt: true,
  exchangeRates: {
    ILS_TO_JOD: 0.27,
    ILS_TO_USD: 0.27,
    JOD_TO_USD: 1.41,
    lastUpdated: new Date().toISOString().slice(0, 10),
  },
  numberFormat: "eastern",
  dateFormat: "DD/MM/YYYY",
  timezone: "Asia/Hebron",
};
