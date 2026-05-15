/**
 * Mock customer data — Palestinian businesses across multiple governorates.
 * Used by /customers list and customer-related dashboards.
 */

export type CustomerType = "individual" | "company" | "institution";
export type CustomerClassification = "standard" | "vip" | "risk";
export type CustomerStatus = "active" | "inactive" | "archived";
export type PaymentTerms = "cash" | "net15" | "net30" | "net60" | "net90";
export type Currency = "ILS" | "USD" | "JOD" | "EUR";

export interface MockCustomer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  classification: CustomerClassification;
  taxId?: string;
  phone: string;
  email?: string;
  city: string;
  governorate: string;
  paymentTerms: PaymentTerms;
  currency: Currency;
  creditLimit: number;
  outstandingBalance: number;
  lastOrderDate: string;
  salesRep: string;
  alerts: string[];
  status: CustomerStatus;
}

export const GOVERNORATES = [
  "رام الله والبيرة",
  "الخليل",
  "نابلس",
  "بيت لحم",
  "جنين",
  "طولكرم",
  "قلقيلية",
  "سلفيت",
  "أريحا",
  "طوباس",
  "غزة",
  "خان يونس",
  "رفح",
  "دير البلح",
  "شمال غزة",
  "القدس",
];

export const CITIES_BY_GOVERNORATE: Record<string, string[]> = {
  "رام الله والبيرة": ["رام الله", "البيرة", "بيتونيا", "بيرزيت", "سلواد"],
  "الخليل": ["الخليل", "دورا", "يطا", "حلحول", "بني نعيم"],
  "نابلس": ["نابلس", "بيتا", "حوارة", "بيت فوريك"],
  "بيت لحم": ["بيت لحم", "بيت جالا", "بيت ساحور", "الدوحة"],
  "جنين": ["جنين", "قباطية", "يعبد", "سيلة الظهر"],
  "طولكرم": ["طولكرم", "عنبتا", "عتيل"],
  "قلقيلية": ["قلقيلية", "حبلة", "عزون"],
  "سلفيت": ["سلفيت", "دير استيا"],
  "أريحا": ["أريحا", "العوجا"],
  "طوباس": ["طوباس", "طمون"],
  "غزة": ["غزة", "الشجاعية"],
  "خان يونس": ["خان يونس", "عبسان"],
  "رفح": ["رفح", "الشوكة"],
  "دير البلح": ["دير البلح", "النصيرات"],
  "شمال غزة": ["جباليا", "بيت لاهيا"],
  "القدس": ["القدس", "العيزرية", "أبو ديس"],
};

function ago(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: "c01", code: "C-1001", name: "شركة فلسطين للتجارة العامة", type: "company",     classification: "vip",      taxId: "562139874", phone: "+970 2 295 1100", email: "info@palestrade.ps",    city: "رام الله",   governorate: "رام الله والبيرة", paymentTerms: "net30", currency: "ILS", creditLimit: 250000, outstandingBalance: 84200,  lastOrderDate: ago(2),  salesRep: "محمد سعيد", alerts: [],                    status: "active" },
  { id: "c02", code: "C-1002", name: "مؤسسة الأمل للمواد الغذائية",   type: "institution", classification: "standard", taxId: "562128841", phone: "+970 2 240 8855", email: "amal@food.ps",          city: "البيرة",     governorate: "رام الله والبيرة", paymentTerms: "net15", currency: "ILS", creditLimit: 80000,  outstandingBalance: 12500,  lastOrderDate: ago(4),  salesRep: "رنا حسين",   alerts: [],                    status: "active" },
  { id: "c03", code: "C-1003", name: "بقالة الياسمين",                  type: "individual",  classification: "standard", phone: "+970 59 800 1234", email: "yasmin@shop.ps",       city: "بيت لحم",    governorate: "بيت لحم",            paymentTerms: "cash",  currency: "ILS", creditLimit: 5000,   outstandingBalance: 0,      lastOrderDate: ago(1),  salesRep: "خالد يوسف", alerts: [],                    status: "active" },
  { id: "c04", code: "C-1004", name: "مطعم النورس",                       type: "company",     classification: "standard", taxId: "562111100", phone: "+970 9 234 5678", email: "norras@rest.ps",        city: "نابلس",      governorate: "نابلس",              paymentTerms: "net15", currency: "ILS", creditLimit: 30000,  outstandingBalance: 5400,   lastOrderDate: ago(6),  salesRep: "محمد سعيد", alerts: [],                    status: "active" },
  { id: "c05", code: "C-1005", name: "مخبز الحلو",                          type: "individual",  classification: "standard", phone: "+970 59 711 2233", email: "helou@bakery.ps",      city: "الخليل",      governorate: "الخليل",             paymentTerms: "cash",  currency: "ILS", creditLimit: 8000,   outstandingBalance: 1800,   lastOrderDate: ago(0),  salesRep: "رنا حسين",   alerts: [],                    status: "active" },
  { id: "c06", code: "C-1006", name: "صيدلية الشفاء",                     type: "company",     classification: "vip",      taxId: "562097733", phone: "+970 4 251 4400", email: "shifa@pharm.ps",        city: "جنين",       governorate: "جنين",                paymentTerms: "net30", currency: "ILS", creditLimit: 120000, outstandingBalance: 28900,  lastOrderDate: ago(8),  salesRep: "خالد يوسف", alerts: [],                    status: "active" },
  { id: "c07", code: "C-1007", name: "مكتبة القدس",                         type: "company",     classification: "standard", taxId: "562108882", phone: "+970 2 627 7700", email: "alquds@books.ps",       city: "القدس",       governorate: "القدس",               paymentTerms: "net15", currency: "ILS", creditLimit: 40000,  outstandingBalance: 0,      lastOrderDate: ago(15), salesRep: "محمد سعيد", alerts: [],                    status: "active" },
  { id: "c08", code: "C-1008", name: "محل المدينة للأقمشة",              type: "company",     classification: "standard", taxId: "562144451", phone: "+970 9 268 1122", email: "almadina@fabric.ps",    city: "نابلس",      governorate: "نابلس",              paymentTerms: "net30", currency: "ILS", creditLimit: 60000,  outstandingBalance: 22300,  lastOrderDate: ago(11), salesRep: "رنا حسين",   alerts: ["Credit usage > 70%"], status: "active" },
  { id: "c09", code: "C-1009", name: "شركة النخيل للاستيراد",           type: "company",     classification: "vip",      taxId: "562166677", phone: "+970 2 295 9090", email: "nakheel@imports.ps",    city: "رام الله",   governorate: "رام الله والبيرة", paymentTerms: "net60", currency: "USD", creditLimit: 500000, outstandingBalance: 184300, lastOrderDate: ago(3),  salesRep: "خالد يوسف", alerts: ["High balance"],        status: "active" },
  { id: "c10", code: "C-1010", name: "مؤسسة الإبداع للأثاث",            type: "institution", classification: "standard", taxId: "562177989", phone: "+970 8 280 4455", email: "ibdaa@furniture.ps",    city: "غزة",         governorate: "غزة",                 paymentTerms: "net30", currency: "ILS", creditLimit: 90000,  outstandingBalance: 11200,  lastOrderDate: ago(20), salesRep: "رنا حسين",   alerts: [],                    status: "active" },
  { id: "c11", code: "C-1011", name: "متجر الزيتون التقليدي",          type: "individual",  classification: "standard", phone: "+970 59 401 8855", email: "olive@trad.ps",         city: "أريحا",       governorate: "أريحا",                paymentTerms: "cash",  currency: "ILS", creditLimit: 10000,  outstandingBalance: 0,      lastOrderDate: ago(5),  salesRep: "محمد سعيد", alerts: [],                    status: "active" },
  { id: "c12", code: "C-1012", name: "معرض الفنون الراقية",             type: "company",     classification: "vip",      taxId: "562194412", phone: "+970 9 256 7878", email: "art@gallery.ps",        city: "نابلس",      governorate: "نابلس",              paymentTerms: "net30", currency: "ILS", creditLimit: 70000,  outstandingBalance: 18000,  lastOrderDate: ago(10), salesRep: "خالد يوسف", alerts: [],                    status: "active" },
  { id: "c13", code: "C-1013", name: "شركة الشرق للمقاولات",            type: "company",     classification: "standard", taxId: "562121181", phone: "+970 4 274 3322", email: "sharq@const.ps",        city: "طولكرم",     governorate: "طولكرم",             paymentTerms: "net60", currency: "JOD", creditLimit: 200000, outstandingBalance: 92400,  lastOrderDate: ago(7),  salesRep: "رنا حسين",   alerts: [],                    status: "active" },
  { id: "c14", code: "C-1014", name: "مؤسسة المستقبل للخدمات",        type: "institution", classification: "standard", taxId: "562223349", phone: "+970 2 240 1100", email: "mustaqbal@svc.ps",      city: "البيرة",     governorate: "رام الله والبيرة", paymentTerms: "net30", currency: "ILS", creditLimit: 55000,  outstandingBalance: 4200,   lastOrderDate: ago(12), salesRep: "محمد سعيد", alerts: [],                    status: "active" },
  { id: "c15", code: "C-1015", name: "مطعم الورد الدمشقي",                type: "company",     classification: "standard", taxId: "562234401", phone: "+970 2 295 6677", email: "ward@rest.ps",          city: "رام الله",   governorate: "رام الله والبيرة", paymentTerms: "net15", currency: "ILS", creditLimit: 25000,  outstandingBalance: 6800,   lastOrderDate: ago(1),  salesRep: "خالد يوسف", alerts: [],                    status: "active" },
  { id: "c16", code: "C-1016", name: "مخبز الفجر",                          type: "individual",  classification: "standard", phone: "+970 59 555 9090", email: "fajr@bakery.ps",       city: "الخليل",      governorate: "الخليل",             paymentTerms: "cash",  currency: "ILS", creditLimit: 6000,   outstandingBalance: 950,    lastOrderDate: ago(2),  salesRep: "رنا حسين",   alerts: [],                    status: "active" },
  { id: "c17", code: "C-1017", name: "صيدلية السلام",                     type: "company",     classification: "standard", taxId: "562245592", phone: "+970 4 250 3344", email: "salam@pharm.ps",        city: "جنين",       governorate: "جنين",                paymentTerms: "net15", currency: "ILS", creditLimit: 35000,  outstandingBalance: 4100,   lastOrderDate: ago(9),  salesRep: "محمد سعيد", alerts: [],                    status: "active" },
  { id: "c18", code: "C-1018", name: "محل الأحذية الإيطالية",          type: "company",     classification: "standard", taxId: "562258817", phone: "+970 2 624 1199", email: "italy@shoes.ps",        city: "القدس",       governorate: "القدس",               paymentTerms: "net30", currency: "EUR", creditLimit: 80000,  outstandingBalance: 28100,  lastOrderDate: ago(18), salesRep: "خالد يوسف", alerts: ["Overdue 18d"],        status: "active" },
  { id: "c19", code: "C-1019", name: "معرض السيارات الفاخرة",          type: "company",     classification: "vip",      taxId: "562265570", phone: "+970 2 297 7755", email: "luxury@cars.ps",        city: "رام الله",   governorate: "رام الله والبيرة", paymentTerms: "net90", currency: "USD", creditLimit: 1000000,outstandingBalance: 312500, lastOrderDate: ago(25), salesRep: "رنا حسين",   alerts: ["High balance"],        status: "active" },
  { id: "c20", code: "C-1020", name: "بقالة الحي",                          type: "individual",  classification: "risk",     phone: "+970 59 222 6611",                           city: "بيت لحم",    governorate: "بيت لحم",            paymentTerms: "cash",  currency: "ILS", creditLimit: 2000,   outstandingBalance: 1850,   lastOrderDate: ago(45), salesRep: "محمد سعيد", alerts: ["Risk", "Inactive 45d"], status: "inactive" },
];

export const CUSTOMERS_TOTAL = 4218; // displayed total in header
export const SALES_REPS = ["محمد سعيد", "رنا حسين", "خالد يوسف", "فاطمة العلي", "أحمد قاسم"];

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  cash: "نقدي",
  net15: "Net 15",
  net30: "Net 30",
  net60: "Net 60",
  net90: "Net 90",
};

export const TYPE_LABELS: Record<CustomerType, string> = {
  individual: "فرد",
  company: "شركة",
  institution: "مؤسسة",
};

export const CLASSIFICATION_LABELS: Record<CustomerClassification, string> = {
  standard: "قياسي",
  vip: "VIP",
  risk: "مخاطر",
};
