export const CURRENCIES = [
  {
    code: "ILS",
    symbol: "₪",
    nameEn: "Israeli New Shekel",
    nameAr: "شيكل إسرائيلي جديد",
    decimals: 2,
    locale: "he-IL",
  },
  {
    code: "JOD",
    symbol: "د.أ",
    nameEn: "Jordanian Dinar",
    nameAr: "دينار أردني",
    decimals: 3,
    locale: "ar-JO",
  },
  {
    code: "USD",
    symbol: "$",
    nameEn: "US Dollar",
    nameAr: "دولار أمريكي",
    decimals: 2,
    locale: "en-US",
  },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const PALESTINIAN_GOVERNORATES = [
  // West Bank
  { id: "ramallah", nameEn: "Ramallah & Al-Bireh", nameAr: "رام الله والبيرة", region: "West Bank" },
  { id: "jerusalem", nameEn: "Jerusalem", nameAr: "القدس", region: "West Bank" },
  { id: "hebron", nameEn: "Hebron", nameAr: "الخليل", region: "West Bank" },
  { id: "nablus", nameEn: "Nablus", nameAr: "نابلس", region: "West Bank" },
  { id: "jenin", nameEn: "Jenin", nameAr: "جنين", region: "West Bank" },
  { id: "tulkarm", nameEn: "Tulkarm", nameAr: "طولكرم", region: "West Bank" },
  { id: "qalqilya", nameEn: "Qalqilya", nameAr: "قلقيلية", region: "West Bank" },
  { id: "salfit", nameEn: "Salfit", nameAr: "سلفيت", region: "West Bank" },
  { id: "jericho", nameEn: "Jericho", nameAr: "أريحا والأغوار", region: "West Bank" },
  { id: "bethlehem", nameEn: "Bethlehem", nameAr: "بيت لحم", region: "West Bank" },
  { id: "tubas", nameEn: "Tubas", nameAr: "طوباس والأغوار الشمالية", region: "West Bank" },
  // Gaza Strip
  { id: "north_gaza", nameEn: "North Gaza", nameAr: "شمال غزة", region: "Gaza Strip" },
  { id: "gaza_city", nameEn: "Gaza City", nameAr: "مدينة غزة", region: "Gaza Strip" },
  { id: "deir_balah", nameEn: "Deir al-Balah", nameAr: "دير البلح", region: "Gaza Strip" },
  { id: "khan_younis", nameEn: "Khan Yunis", nameAr: "خان يونس", region: "Gaza Strip" },
  { id: "rafah", nameEn: "Rafah", nameAr: "رفح", region: "Gaza Strip" },
] as const;

export type GovernorateId = (typeof PALESTINIAN_GOVERNORATES)[number]["id"];

export const TAX_RATES = {
  STANDARD_VAT: 0.16,
  ZERO_RATED: 0,
  EXEMPT: null,
} as const;

export const VAT_LABEL = { en: "Value Added Tax (VAT)", ar: "ضريبة القيمة المضافة" };
export const VAT_RATE_DISPLAY = "16%";

export const PAYMENT_TERMS = [
  { value: "cash",          labelEn: "Cash",            labelAr: "نقداً" },
  { value: "net_30",        labelEn: "Net 30",          labelAr: "صافي 30 يوم" },
  { value: "net_60",        labelEn: "Net 60",          labelAr: "صافي 60 يوم" },
  { value: "net_90",        labelEn: "Net 90",          labelAr: "صافي 90 يوم" },
  { value: "installments",  labelEn: "Installments",    labelAr: "أقساط" },
  { value: "bank_transfer", labelEn: "Bank Transfer",   labelAr: "تحويل بنكي" },
  { value: "check",         labelEn: "Check",           labelAr: "شيك" },
  { value: "cod",           labelEn: "Cash on Delivery",labelAr: "الدفع عند الاستلام" },
] as const;

export type PaymentTermValue = (typeof PAYMENT_TERMS)[number]["value"];

export const PALESTINIAN_BANKS = [
  { id: "arab_bank",        nameEn: "Arab Bank",                   nameAr: "البنك العربي" },
  { id: "cairo_amman",      nameEn: "Cairo Amman Bank",            nameAr: "بنك القاهرة عمان" },
  { id: "palestine_bank",   nameEn: "Palestine Bank",              nameAr: "بنك فلسطين" },
  { id: "bank_of_palestine",nameEn: "Bank of Palestine",           nameAr: "بنك فلسطين للمشاريع والتجارة" },
  { id: "islamic_bank",     nameEn: "Palestine Islamic Bank",      nameAr: "البنك الإسلامي الفلسطيني" },
  { id: "al_quds_bank",     nameEn: "Al Quds Bank",                nameAr: "بنك القدس" },
  { id: "national_bank",    nameEn: "National Bank",               nameAr: "البنك الوطني" },
  { id: "jordan_ahli_bank", nameEn: "Jordan Ahli Bank",            nameAr: "البنك الأهلي الأردني" },
] as const;

export const BUSINESS_TYPES = [
  { value: "sole_proprietorship", labelEn: "Sole Proprietorship", labelAr: "مؤسسة فردية" },
  { value: "partnership",         labelEn: "Partnership",         labelAr: "شراكة" },
  { value: "llc",                 labelEn: "LLC",                 labelAr: "شركة ذات مسؤولية محدودة" },
  { value: "corporation",         labelEn: "Corporation",         labelAr: "شركة مساهمة" },
  { value: "ngo",                 labelEn: "NGO / Non-Profit",    labelAr: "منظمة غير ربحية" },
  { value: "government",          labelEn: "Government Entity",   labelAr: "جهة حكومية" },
] as const;

export const CUSTOMER_CLASSIFICATIONS = [
  { value: "wholesale",   labelEn: "Wholesale",    labelAr: "تجارة جملة" },
  { value: "retail",      labelEn: "Retail",       labelAr: "تجارة مفرق" },
  { value: "government",  labelEn: "Government",   labelAr: "حكومي" },
  { value: "institution", labelEn: "Institution",  labelAr: "مؤسسة" },
  { value: "vip",         labelEn: "VIP",          labelAr: "VIP" },
  { value: "exporter",    labelEn: "Exporter",     labelAr: "مصدّر" },
] as const;

export const ID_TYPES = [
  { value: "national_id",   labelEn: "National ID",    labelAr: "الهوية الوطنية" },
  { value: "passport",      labelEn: "Passport",       labelAr: "جواز سفر" },
  { value: "residency",     labelEn: "Residency Card", labelAr: "بطاقة إقامة" },
  { value: "trade_license", labelEn: "Trade License",  labelAr: "رخصة تجارية" },
] as const;

export const PHONE_PREFIXES = [
  { code: "+970", label: "+970 (Palestine)" },
  { code: "+972", label: "+972 (IL)" },
  { code: "+962", label: "+962 (Jordan)" },
  { code: "+20",  label: "+20 (Egypt)" },
] as const;

export const DEFAULT_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  ILS: { ILS: 1, JOD: 0.385, USD: 0.272 },
  JOD: { ILS: 2.6,  JOD: 1,   USD: 0.707 },
  USD: { ILS: 3.67, JOD: 1.41, USD: 1 },
};

export const DATE_FORMAT = "DD/MM/YYYY";
export const NUMBER_LOCALE = "ar-PS";
