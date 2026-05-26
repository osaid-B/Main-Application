/**
 * POS mock data for Atlas ERP.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PosCategory =
  | "all"
  | "beverages"
  | "food"
  | "snacks"
  | "dairy"
  | "household";

export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: Exclude<PosCategory, "all">;
  emoji: string;
}

export interface LoyaltyCustomer {
  id: string;
  name: string;
  code: string;
  coins: number;
  tier: "platinum" | "gold" | "silver";
}

export type CoinAction = "earned" | "redeemed" | "reversed" | "manual" | "expired";

export interface CoinTransaction {
  id: string;
  timestamp: string;
  action: CoinAction;
  customerName?: string;
  customerCode?: string;
  invoice?: string;
  reason: string;
  user: string;
  branch: string;
  delta: number;
  balanceAfter: number;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const POS_CATEGORIES: Array<{ id: PosCategory; label: string; count: number }> = [
  { id: "all",       label: "الكل",        count: 24 },
  { id: "beverages", label: "مشروبات",     count: 6  },
  { id: "food",      label: "أغذية",       count: 7  },
  { id: "snacks",    label: "وجبات خفيفة", count: 5  },
  { id: "dairy",     label: "ألبان",       count: 4  },
  { id: "household", label: "منزلية",      count: 2  },
];

// ─── Products ─────────────────────────────────────────────────────────────────

export const POS_PRODUCTS: PosProduct[] = [
  { id: "p-001", name: "مياه معدنية 500مل",   sku: "BEV-H2O-500",  price: 2.50,  stock: 120, category: "beverages", emoji: "💧" },
  { id: "p-002", name: "عصير برتقال 1ل",       sku: "BEV-OJ-1L",   price: 6.00,  stock: 44,  category: "beverages", emoji: "🍊" },
  { id: "p-003", name: "كولا 330مل",           sku: "BEV-COL-330",  price: 4.50,  stock: 88,  category: "beverages", emoji: "🥤" },
  { id: "p-004", name: "شاي أخضر علبة",        sku: "BEV-GT-BOX",  price: 12.00, stock: 30,  category: "beverages", emoji: "🍵" },
  { id: "p-005", name: "قهوة سريعة 200جم",     sku: "BEV-CF-200",  price: 18.50, stock: 22,  category: "beverages", emoji: "☕" },
  { id: "p-006", name: "مياه غازية 750مل",     sku: "BEV-SPK-750",  price: 5.00,  stock: 0,   category: "beverages", emoji: "🫧" },

  { id: "p-007", name: "أرز بسمتي 1كجم",       sku: "FOOD-RIC-1K",  price: 9.75,  stock: 55,  category: "food",      emoji: "🍚" },
  { id: "p-008", name: "زيت زيتون 500مل",       sku: "FOOD-OO-500",  price: 22.00, stock: 18,  category: "food",      emoji: "🫒" },
  { id: "p-009", name: "معكرونة 500جم",         sku: "FOOD-PAS-500", price: 5.50,  stock: 70,  category: "food",      emoji: "🍝" },
  { id: "p-010", name: "سكر أبيض 1كجم",         sku: "FOOD-SUG-1K",  price: 4.00,  stock: 90,  category: "food",      emoji: "🍬" },
  { id: "p-011", name: "طحين 2كجم",            sku: "FOOD-FLR-2K",  price: 7.25,  stock: 40,  category: "food",      emoji: "🌾" },
  { id: "p-012", name: "صلصة طماطم 400جم",      sku: "FOOD-TOM-400", price: 6.00,  stock: 33,  category: "food",      emoji: "🍅" },
  { id: "p-013", name: "تونا معلبة",            sku: "FOOD-TUN-CAN", price: 8.50,  stock: 50,  category: "food",      emoji: "🐟" },

  { id: "p-014", name: "شيبس مشوي 50جم",        sku: "SNK-CHIP-50",  price: 3.00,  stock: 200, category: "snacks",    emoji: "🥔" },
  { id: "p-015", name: "شوكولاتة حليب 100جم",   sku: "SNK-CHO-100",  price: 7.50,  stock: 65,  category: "snacks",    emoji: "🍫" },
  { id: "p-016", name: "بسكويت شاي 200جم",      sku: "SNK-BSC-200",  price: 4.50,  stock: 80,  category: "snacks",    emoji: "🍪" },
  { id: "p-017", name: "مكسرات مشكلة 250جم",    sku: "SNK-NUT-250",  price: 14.00, stock: 28,  category: "snacks",    emoji: "🥜" },
  { id: "p-018", name: "حلوى جيلي",             sku: "SNK-JEL-PKT",  price: 2.00,  stock: 0,   category: "snacks",    emoji: "🍭" },

  { id: "p-019", name: "حليب كامل الدسم 1ل",    sku: "DAI-MLK-1L",   price: 5.50,  stock: 60,  category: "dairy",     emoji: "🥛" },
  { id: "p-020", name: "جبنة بيضاء 500جم",       sku: "DAI-CHE-500",  price: 13.00, stock: 25,  category: "dairy",     emoji: "🧀" },
  { id: "p-021", name: "لبن زبادي 400جم",        sku: "DAI-YOG-400",  price: 4.75,  stock: 48,  category: "dairy",     emoji: "🫙" },
  { id: "p-022", name: "زبدة 200جم",            sku: "DAI-BUT-200",  price: 8.00,  stock: 20,  category: "dairy",     emoji: "🧈" },

  { id: "p-023", name: "صابون يدين سائل 500مل",  sku: "HH-SOAP-500",  price: 7.00,  stock: 35,  category: "household", emoji: "🧴" },
  { id: "p-024", name: "مناديل ورقية علبة",      sku: "HH-TIS-BOX",   price: 3.50,  stock: 90,  category: "household", emoji: "🧻" },
];

// ─── Loyalty Customers ────────────────────────────────────────────────────────

export const LOYALTY_CUSTOMERS: LoyaltyCustomer[] = [
  { id: "lc-001", name: "محمد العمري",    code: "LYL-00142", coins: 3_420, tier: "gold"     },
  { id: "lc-002", name: "سارة أبو حمد",   code: "LYL-00089", coins: 8_750, tier: "platinum" },
  { id: "lc-003", name: "خالد الشريف",   code: "LYL-00213", coins: 1_180, tier: "silver"   },
  { id: "lc-004", name: "نور الدين رضا", code: "LYL-00310", coins: 5_200, tier: "gold"     },
  { id: "lc-005", name: "ريم حسين",      code: "LYL-00421", coins: 640,   tier: "silver"   },
];

// ─── Coin Transactions ────────────────────────────────────────────────────────

export const COIN_TRANSACTIONS: CoinTransaction[] = [
  {
    id: "ct-001",
    timestamp: "2026-05-18 09:14:22",
    action: "earned",
    customerName: "محمد العمري",
    customerCode: "LYL-00142",
    invoice: "POS-9801",
    reason: "شراء — ₪ 85.50",
    user: "أحمد قاسم",
    branch: "غزة — صندوق 2",
    delta: 342,
    balanceAfter: 3_420,
  },
  {
    id: "ct-002",
    timestamp: "2026-05-18 09:02:05",
    action: "redeemed",
    customerName: "سارة أبو حمد",
    customerCode: "LYL-00089",
    invoice: "POS-9800",
    reason: "استبدال عملات — خصم ₪ 25",
    user: "أحمد قاسم",
    branch: "غزة — صندوق 2",
    delta: -500,
    balanceAfter: 8_750,
  },
  {
    id: "ct-003",
    timestamp: "2026-05-17 16:45:10",
    action: "earned",
    customerName: "خالد الشريف",
    customerCode: "LYL-00213",
    invoice: "POS-9798",
    reason: "شراء — ₪ 120.00",
    user: "منى إبراهيم",
    branch: "رام الله — صندوق 1",
    delta: 480,
    balanceAfter: 1_180,
  },
  {
    id: "ct-004",
    timestamp: "2026-05-17 14:22:33",
    action: "reversed",
    customerName: "نور الدين رضا",
    customerCode: "LYL-00310",
    invoice: "POS-9795",
    reason: "إلغاء فاتورة — استرداد عملات",
    user: "منى إبراهيم",
    branch: "رام الله — صندوق 1",
    delta: 200,
    balanceAfter: 5_200,
  },
  {
    id: "ct-005",
    timestamp: "2026-05-17 11:08:50",
    action: "manual",
    customerName: "ريم حسين",
    customerCode: "LYL-00421",
    reason: "تعويض — خطأ في النقطة السابقة",
    user: "المدير",
    branch: "الإدارة",
    delta: 100,
    balanceAfter: 640,
  },
  {
    id: "ct-006",
    timestamp: "2026-05-17 08:55:00",
    action: "expired",
    customerName: "محمد العمري",
    customerCode: "LYL-00142",
    reason: "انتهاء صلاحية عملات يناير 2026",
    user: "النظام",
    branch: "تلقائي",
    delta: -150,
    balanceAfter: 3_078,
  },
  {
    id: "ct-007",
    timestamp: "2026-05-16 17:30:45",
    action: "earned",
    reason: "شراء زبون عابر — ₪ 45.00",
    user: "أحمد قاسم",
    branch: "غزة — صندوق 2",
    delta: 0,
    balanceAfter: 0,
  },
  {
    id: "ct-008",
    timestamp: "2026-05-16 15:12:20",
    action: "earned",
    customerName: "سارة أبو حمد",
    customerCode: "LYL-00089",
    invoice: "POS-9790",
    reason: "شراء — ₪ 310.00",
    user: "منى إبراهيم",
    branch: "رام الله — صندوق 1",
    delta: 1_240,
    balanceAfter: 9_250,
  },
  {
    id: "ct-009",
    timestamp: "2026-05-15 10:00:00",
    action: "redeemed",
    customerName: "نور الدين رضا",
    customerCode: "LYL-00310",
    invoice: "POS-9785",
    reason: "استبدال عملات — خصم ₪ 50",
    user: "أحمد قاسم",
    branch: "غزة — صندوق 2",
    delta: -1_000,
    balanceAfter: 5_000,
  },
  {
    id: "ct-010",
    timestamp: "2026-05-15 09:20:10",
    action: "earned",
    customerName: "خالد الشريف",
    customerCode: "LYL-00213",
    invoice: "POS-9782",
    reason: "شراء — ₪ 175.00",
    user: "منى إبراهيم",
    branch: "رام الله — صندوق 1",
    delta: 700,
    balanceAfter: 700,
  },
];

// ─── Loyalty KPIs ─────────────────────────────────────────────────────────────

export const POS_LOYALTY_KPIS: {
  issued30d:   { value: string; trend: string };
  redeemed30d: { value: string; subtitle?: string };
  outstanding: { value: string; subtitle?: string };
  expiring30d: { value: string; subtitle?: string };
} = {
  issued30d:   { value: "48,320",  trend: "+12% مقارنة بالشهر الماضي" },
  redeemed30d: { value: "19,750",  subtitle: "40.9% معدل الاستبدال" },
  outstanding: { value: "284,600", subtitle: "قيمة مكافئة ₪ 14,230" },
  expiring30d: { value: "6,400",   subtitle: "تنتهي قبل 17 يونيو 2026" },
};

// ─── Receipts ─────────────────────────────────────────────────────────────────

export type PosReceiptStatus = "completed" | "refunded" | "voided";
export type PosPaymentMethod = "cash" | "card" | "wallet" | "split";

export interface PosReceiptLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface PosReceipt {
  id: string;
  date: string;
  time: string;
  cashierId: string;
  cashierName: string;
  lines: PosReceiptLine[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PosPaymentMethod;
  status: PosReceiptStatus;
  customerId?: string;
  customerName?: string;
}

export const POS_RECEIPTS: PosReceipt[] = [
  {
    id: "POS-9821", date: "2026-05-26", time: "10:45", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-001", name: "Mineral Water 500ml", qty: 4, unitPrice: 2.50, total: 10.00 },
      { productId: "p-015", name: "Milk Chocolate 100g", qty: 2, unitPrice: 7.50, total: 15.00 },
      { productId: "p-019", name: "Full-Fat Milk 1L",    qty: 1, unitPrice: 5.50, total: 5.50 },
    ],
    subtotal: 30.50, tax: 4.88, discount: 0, total: 35.38, paymentMethod: "cash", status: "completed",
    customerId: "lc-001", customerName: "Mohammed Al-Omari",
  },
  {
    id: "POS-9820", date: "2026-05-26", time: "10:12", cashierId: "CSH-02", cashierName: "Mona Ibrahim",
    lines: [
      { productId: "p-007", name: "Basmati Rice 1kg", qty: 2, unitPrice: 9.75, total: 19.50 },
      { productId: "p-008", name: "Olive Oil 500ml",  qty: 1, unitPrice: 22.00, total: 22.00 },
    ],
    subtotal: 41.50, tax: 6.64, discount: 2.00, total: 46.14, paymentMethod: "card", status: "completed",
  },
  {
    id: "POS-9819", date: "2026-05-26", time: "09:30", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-003", name: "Cola 330ml", qty: 6, unitPrice: 4.50, total: 27.00 },
      { productId: "p-014", name: "Grilled Chips 50g", qty: 3, unitPrice: 3.00, total: 9.00 },
    ],
    subtotal: 36.00, tax: 5.76, discount: 0, total: 41.76, paymentMethod: "split", status: "completed",
    customerId: "lc-002", customerName: "Sara Abu Hamad",
  },
  {
    id: "POS-9818", date: "2026-05-25", time: "17:55", cashierId: "CSH-03", cashierName: "Laila Mansour",
    lines: [
      { productId: "p-020", name: "White Cheese 500g", qty: 1, unitPrice: 13.00, total: 13.00 },
    ],
    subtotal: 13.00, tax: 2.08, discount: 0, total: 15.08, paymentMethod: "cash", status: "refunded",
  },
  {
    id: "POS-9817", date: "2026-05-25", time: "16:40", cashierId: "CSH-02", cashierName: "Mona Ibrahim",
    lines: [
      { productId: "p-005", name: "Instant Coffee 200g", qty: 2, unitPrice: 18.50, total: 37.00 },
      { productId: "p-017", name: "Mixed Nuts 250g",     qty: 1, unitPrice: 14.00, total: 14.00 },
    ],
    subtotal: 51.00, tax: 8.16, discount: 5.00, total: 54.16, paymentMethod: "wallet", status: "completed",
    customerId: "lc-004", customerName: "Nour Al-Din Rida",
  },
  {
    id: "POS-9816", date: "2026-05-25", time: "14:20", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-009", name: "Pasta 500g", qty: 4, unitPrice: 5.50, total: 22.00 },
      { productId: "p-010", name: "White Sugar 1kg", qty: 2, unitPrice: 4.00, total: 8.00 },
      { productId: "p-011", name: "Flour 2kg",       qty: 1, unitPrice: 7.25, total: 7.25 },
    ],
    subtotal: 37.25, tax: 5.96, discount: 0, total: 43.21, paymentMethod: "cash", status: "completed",
  },
  {
    id: "POS-9815", date: "2026-05-25", time: "11:05", cashierId: "CSH-03", cashierName: "Laila Mansour",
    lines: [
      { productId: "p-002", name: "Orange Juice 1L", qty: 3, unitPrice: 6.00, total: 18.00 },
    ],
    subtotal: 18.00, tax: 2.88, discount: 0, total: 20.88, paymentMethod: "card", status: "voided",
  },
  {
    id: "POS-9814", date: "2026-05-24", time: "18:30", cashierId: "CSH-02", cashierName: "Mona Ibrahim",
    lines: [
      { productId: "p-023", name: "Liquid Hand Soap 500ml", qty: 2, unitPrice: 7.00, total: 14.00 },
      { productId: "p-024", name: "Tissue Box",             qty: 3, unitPrice: 3.50, total: 10.50 },
    ],
    subtotal: 24.50, tax: 3.92, discount: 0, total: 28.42, paymentMethod: "cash", status: "completed",
    customerId: "lc-003", customerName: "Khaled Al-Sharif",
  },
  {
    id: "POS-9813", date: "2026-05-24", time: "15:15", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-004", name: "Green Tea Box",     qty: 1, unitPrice: 12.00, total: 12.00 },
      { productId: "p-021", name: "Yogurt 400g",       qty: 2, unitPrice: 4.75, total: 9.50 },
    ],
    subtotal: 21.50, tax: 3.44, discount: 1.00, total: 23.94, paymentMethod: "card", status: "completed",
    customerId: "lc-005", customerName: "Reem Hussein",
  },
  {
    id: "POS-9812", date: "2026-05-24", time: "09:00", cashierId: "CSH-03", cashierName: "Laila Mansour",
    lines: [
      { productId: "p-012", name: "Tomato Sauce 400g", qty: 4, unitPrice: 6.00, total: 24.00 },
      { productId: "p-013", name: "Canned Tuna",       qty: 3, unitPrice: 8.50, total: 25.50 },
    ],
    subtotal: 49.50, tax: 7.92, discount: 0, total: 57.42, paymentMethod: "split", status: "completed",
  },
];

// ─── Cashiers ─────────────────────────────────────────────────────────────────

export type CashierStatus = "active" | "inactive" | "on-break";
export type CashierShift = "morning" | "afternoon" | "evening";

export interface PosCashier {
  id: string;
  name: string;
  code: string;
  status: CashierStatus;
  shift: CashierShift;
  todaySales: number;
  transactions: number;
  lastActive: string;
  isDeleted?: boolean;
}

export const POS_CASHIERS: PosCashier[] = [
  { id: "CSH-01", name: "Ahmad Qasim",   code: "CSH-01", status: "active",    shift: "morning",   todaySales: 120.53, transactions: 3,  lastActive: "2026-05-26T10:45:00Z" },
  { id: "CSH-02", name: "Mona Ibrahim",  code: "CSH-02", status: "active",    shift: "afternoon", todaySales: 100.30, transactions: 2,  lastActive: "2026-05-26T10:12:00Z" },
  { id: "CSH-03", name: "Laila Mansour", code: "CSH-03", status: "on-break",  shift: "morning",   todaySales: 0,      transactions: 0,  lastActive: "2026-05-25T17:55:00Z" },
  { id: "CSH-04", name: "Karim Nasser",  code: "CSH-04", status: "inactive",  shift: "evening",   todaySales: 0,      transactions: 0,  lastActive: "2026-05-23T22:00:00Z" },
  { id: "CSH-05", name: "Hana Saeed",    code: "CSH-05", status: "active",    shift: "evening",   todaySales: 0,      transactions: 0,  lastActive: "2026-05-24T20:30:00Z" },
];

// ─── Stock Counts ─────────────────────────────────────────────────────────────

export type StockCountStatus = "open" | "in-progress" | "completed" | "cancelled";

export interface StockCountItem {
  productId: string;
  productName: string;
  sku: string;
  expected: number;
  counted: number;
  variance: number;
}

export interface PosStockCount {
  id: string;
  date: string;
  location: string;
  status: StockCountStatus;
  itemsCount: number;
  varianceValue: number;
  countedBy: string;
  items: StockCountItem[];
}

export const POS_STOCK_COUNTS: PosStockCount[] = [
  {
    id: "CNT-004", date: "2026-05-26", location: "Main Floor", status: "open", itemsCount: 0, varianceValue: 0, countedBy: "Ahmad Qasim",
    items: [],
  },
  {
    id: "CNT-003", date: "2026-05-20", location: "Storeroom A", status: "completed", itemsCount: 8, varianceValue: -42.50, countedBy: "Mona Ibrahim",
    items: [
      { productId: "p-001", productName: "Mineral Water 500ml", sku: "BEV-H2O-500",  expected: 120, counted: 118, variance: -2  },
      { productId: "p-002", productName: "Orange Juice 1L",     sku: "BEV-OJ-1L",    expected: 44,  counted: 40,  variance: -4  },
      { productId: "p-007", productName: "Basmati Rice 1kg",    sku: "FOOD-RIC-1K",  expected: 55,  counted: 55,  variance:  0  },
      { productId: "p-008", productName: "Olive Oil 500ml",     sku: "FOOD-OO-500",  expected: 18,  counted: 16,  variance: -2  },
      { productId: "p-014", productName: "Grilled Chips 50g",   sku: "SNK-CHIP-50",  expected: 200, counted: 200, variance:  0  },
      { productId: "p-015", productName: "Milk Chocolate 100g", sku: "SNK-CHO-100",  expected: 65,  counted: 62,  variance: -3  },
      { productId: "p-019", productName: "Full-Fat Milk 1L",    sku: "DAI-MLK-1L",   expected: 60,  counted: 58,  variance: -2  },
      { productId: "p-020", productName: "White Cheese 500g",   sku: "DAI-CHE-500",  expected: 25,  counted: 22,  variance: -3  },
    ],
  },
  {
    id: "CNT-002", date: "2026-05-13", location: "Dairy Section", status: "completed", itemsCount: 4, varianceValue: 0, countedBy: "Laila Mansour",
    items: [
      { productId: "p-019", productName: "Full-Fat Milk 1L",  sku: "DAI-MLK-1L",  expected: 62, counted: 62, variance: 0 },
      { productId: "p-020", productName: "White Cheese 500g", sku: "DAI-CHE-500", expected: 28, counted: 28, variance: 0 },
      { productId: "p-021", productName: "Yogurt 400g",       sku: "DAI-YOG-400", expected: 50, counted: 50, variance: 0 },
      { productId: "p-022", productName: "Butter 200g",       sku: "DAI-BUT-200", expected: 22, counted: 22, variance: 0 },
    ],
  },
  {
    id: "CNT-001", date: "2026-05-05", location: "Beverages Aisle", status: "cancelled", itemsCount: 0, varianceValue: 0, countedBy: "Ahmad Qasim",
    items: [],
  },
];

// ─── Product Categories ───────────────────────────────────────────────────────

export type PosCategoryStatus = "active" | "inactive";

export interface PosProductCategory {
  id: string;
  name: string;
  nameAr: string;
  productCount: number;
  status: PosCategoryStatus;
  parentId?: string;
  sortOrder: number;
}

export const POS_PRODUCT_CATEGORIES: PosProductCategory[] = [
  { id: "cat-01", name: "Beverages",     nameAr: "مشروبات",       productCount: 6,  status: "active",   sortOrder: 1 },
  { id: "cat-02", name: "Food",          nameAr: "أغذية",         productCount: 7,  status: "active",   sortOrder: 2 },
  { id: "cat-03", name: "Snacks",        nameAr: "وجبات خفيفة",   productCount: 5,  status: "active",   sortOrder: 3 },
  { id: "cat-04", name: "Dairy",         nameAr: "ألبان",         productCount: 4,  status: "active",   sortOrder: 4 },
  { id: "cat-05", name: "Household",     nameAr: "منزلية",        productCount: 2,  status: "active",   sortOrder: 5 },
  { id: "cat-06", name: "Hot Drinks",    nameAr: "مشروبات ساخنة", productCount: 2,  status: "active",   parentId: "cat-01", sortOrder: 1 },
  { id: "cat-07", name: "Frozen Foods",  nameAr: "أطعمة مجمدة",  productCount: 0,  status: "inactive", sortOrder: 6 },
  { id: "cat-08", name: "Personal Care", nameAr: "عناية شخصية",  productCount: 0,  status: "inactive", sortOrder: 7 },
];