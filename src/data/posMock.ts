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
  {
    id: "POS-9811", date: "2026-05-23", time: "18:10", cashierId: "CSH-04", cashierName: "Karim Nasser",
    lines: [
      { productId: "p-016", name: "Tea Biscuits 200g", qty: 2, unitPrice: 4.50, total: 9.00 },
      { productId: "p-017", name: "Mixed Nuts 250g",   qty: 1, unitPrice: 14.00, total: 14.00 },
    ],
    subtotal: 23.00, tax: 3.68, discount: 0, total: 26.68, paymentMethod: "cash", status: "completed",
  },
  {
    id: "POS-9810", date: "2026-05-23", time: "16:45", cashierId: "CSH-05", cashierName: "Hana Saeed",
    lines: [
      { productId: "p-001", name: "Mineral Water 500ml", qty: 6, unitPrice: 2.50, total: 15.00 },
      { productId: "p-003", name: "Cola 330ml",          qty: 4, unitPrice: 4.50, total: 18.00 },
    ],
    subtotal: 33.00, tax: 5.28, discount: 0, total: 38.28, paymentMethod: "card", status: "completed",
  },
  {
    id: "POS-9809", date: "2026-05-22", time: "14:30", cashierId: "CSH-04", cashierName: "Karim Nasser",
    lines: [
      { productId: "p-007", name: "Basmati Rice 1kg",  qty: 3, unitPrice: 9.75, total: 29.25 },
      { productId: "p-010", name: "White Sugar 1kg",   qty: 2, unitPrice: 4.00, total: 8.00 },
    ],
    subtotal: 37.25, tax: 5.96, discount: 2.00, total: 41.21, paymentMethod: "wallet", status: "completed",
    customerId: "lc-003", customerName: "Khaled Al-Sharif",
  },
  {
    id: "POS-9808", date: "2026-05-22", time: "11:05", cashierId: "CSH-05", cashierName: "Hana Saeed",
    lines: [
      { productId: "p-019", name: "Full-Fat Milk 1L",  qty: 2, unitPrice: 5.50, total: 11.00 },
      { productId: "p-022", name: "Butter 200g",       qty: 1, unitPrice: 8.00, total: 8.00 },
    ],
    subtotal: 19.00, tax: 3.04, discount: 0, total: 22.04, paymentMethod: "cash", status: "refunded",
  },
  {
    id: "POS-9807", date: "2026-05-21", time: "17:20", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-004", name: "Green Tea Box",       qty: 1, unitPrice: 12.00, total: 12.00 },
      { productId: "p-005", name: "Instant Coffee 200g", qty: 1, unitPrice: 18.50, total: 18.50 },
    ],
    subtotal: 30.50, tax: 4.88, discount: 0, total: 35.38, paymentMethod: "card", status: "completed",
    customerId: "lc-004", customerName: "Nour Al-Din Rida",
  },
  {
    id: "POS-9806", date: "2026-05-21", time: "10:15", cashierId: "CSH-02", cashierName: "Mona Ibrahim",
    lines: [
      { productId: "p-023", name: "Liquid Hand Soap 500ml", qty: 3, unitPrice: 7.00, total: 21.00 },
      { productId: "p-024", name: "Tissue Box",             qty: 2, unitPrice: 3.50, total: 7.00 },
    ],
    subtotal: 28.00, tax: 4.48, discount: 0, total: 32.48, paymentMethod: "split", status: "completed",
  },
  {
    id: "POS-9805", date: "2026-05-20", time: "19:40", cashierId: "CSH-05", cashierName: "Hana Saeed",
    lines: [
      { productId: "p-014", name: "Grilled Chips 50g",    qty: 5, unitPrice: 3.00, total: 15.00 },
      { productId: "p-015", name: "Milk Chocolate 100g",  qty: 2, unitPrice: 7.50, total: 15.00 },
    ],
    subtotal: 30.00, tax: 4.80, discount: 0, total: 34.80, paymentMethod: "cash", status: "completed",
  },
  {
    id: "POS-9804", date: "2026-05-19", time: "15:00", cashierId: "CSH-03", cashierName: "Laila Mansour",
    lines: [
      { productId: "p-009", name: "Pasta 500g",       qty: 3, unitPrice: 5.50, total: 16.50 },
      { productId: "p-012", name: "Tomato Sauce 400g", qty: 2, unitPrice: 6.00, total: 12.00 },
    ],
    subtotal: 28.50, tax: 4.56, discount: 0, total: 33.06, paymentMethod: "card", status: "voided",
  },
  {
    id: "POS-9803", date: "2026-05-18", time: "12:30", cashierId: "CSH-04", cashierName: "Karim Nasser",
    lines: [
      { productId: "p-021", name: "Yogurt 400g",       qty: 4, unitPrice: 4.75, total: 19.00 },
      { productId: "p-020", name: "White Cheese 500g", qty: 2, unitPrice: 13.00, total: 26.00 },
    ],
    subtotal: 45.00, tax: 7.20, discount: 5.00, total: 47.20, paymentMethod: "wallet", status: "completed",
    customerId: "lc-005", customerName: "Reem Hussein",
  },
  {
    id: "POS-9802", date: "2026-05-17", time: "09:55", cashierId: "CSH-02", cashierName: "Mona Ibrahim",
    lines: [
      { productId: "p-011", name: "Flour 2kg",        qty: 2, unitPrice: 7.25, total: 14.50 },
      { productId: "p-008", name: "Olive Oil 500ml",  qty: 1, unitPrice: 22.00, total: 22.00 },
    ],
    subtotal: 36.50, tax: 5.84, discount: 0, total: 42.34, paymentMethod: "cash", status: "completed",
  },
  {
    id: "POS-9801", date: "2026-05-16", time: "16:10", cashierId: "CSH-05", cashierName: "Hana Saeed",
    lines: [
      { productId: "p-002", name: "Orange Juice 1L",   qty: 4, unitPrice: 6.00, total: 24.00 },
      { productId: "p-001", name: "Mineral Water 500ml", qty: 6, unitPrice: 2.50, total: 15.00 },
    ],
    subtotal: 39.00, tax: 6.24, discount: 0, total: 45.24, paymentMethod: "card", status: "completed",
    customerId: "lc-002", customerName: "Sara Abu Hamad",
  },
  {
    id: "POS-9800", date: "2026-05-15", time: "14:00", cashierId: "CSH-04", cashierName: "Karim Nasser",
    lines: [
      { productId: "p-013", name: "Canned Tuna",      qty: 5, unitPrice: 8.50, total: 42.50 },
      { productId: "p-007", name: "Basmati Rice 1kg", qty: 2, unitPrice: 9.75, total: 19.50 },
    ],
    subtotal: 62.00, tax: 9.92, discount: 0, total: 71.92, paymentMethod: "cash", status: "completed",
  },
  {
    id: "POS-9799", date: "2026-05-14", time: "11:25", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-018", name: "Jelly Candy Packet", qty: 3, unitPrice: 2.00, total: 6.00 },
      { productId: "p-016", name: "Tea Biscuits 200g",  qty: 2, unitPrice: 4.50, total: 9.00 },
    ],
    subtotal: 15.00, tax: 2.40, discount: 0, total: 17.40, paymentMethod: "cash", status: "refunded",
  },
  {
    id: "POS-9798", date: "2026-05-13", time: "08:50", cashierId: "CSH-03", cashierName: "Laila Mansour",
    lines: [
      { productId: "p-005", name: "Instant Coffee 200g", qty: 1, unitPrice: 18.50, total: 18.50 },
      { productId: "p-004", name: "Green Tea Box",       qty: 2, unitPrice: 12.00, total: 24.00 },
    ],
    subtotal: 42.50, tax: 6.80, discount: 3.00, total: 46.30, paymentMethod: "split", status: "completed",
    customerId: "lc-001", customerName: "Mohammed Al-Omari",
  },
  {
    id: "POS-9797", date: "2026-05-12", time: "17:35", cashierId: "CSH-02", cashierName: "Mona Ibrahim",
    lines: [
      { productId: "p-022", name: "Butter 200g",      qty: 2, unitPrice: 8.00, total: 16.00 },
      { productId: "p-019", name: "Full-Fat Milk 1L", qty: 3, unitPrice: 5.50, total: 16.50 },
    ],
    subtotal: 32.50, tax: 5.20, discount: 0, total: 37.70, paymentMethod: "card", status: "completed",
  },
  {
    id: "POS-9796", date: "2026-05-11", time: "13:45", cashierId: "CSH-05", cashierName: "Hana Saeed",
    lines: [
      { productId: "p-023", name: "Liquid Hand Soap 500ml", qty: 2, unitPrice: 7.00, total: 14.00 },
      { productId: "p-010", name: "White Sugar 1kg",        qty: 3, unitPrice: 4.00, total: 12.00 },
    ],
    subtotal: 26.00, tax: 4.16, discount: 0, total: 30.16, paymentMethod: "wallet", status: "completed",
  },
  {
    id: "POS-9795", date: "2026-05-10", time: "09:20", cashierId: "CSH-04", cashierName: "Karim Nasser",
    lines: [
      { productId: "p-003", name: "Cola 330ml",        qty: 8, unitPrice: 4.50, total: 36.00 },
      { productId: "p-015", name: "Milk Chocolate 100g", qty: 3, unitPrice: 7.50, total: 22.50 },
    ],
    subtotal: 58.50, tax: 9.36, discount: 5.00, total: 62.86, paymentMethod: "cash", status: "completed",
    customerId: "lc-004", customerName: "Nour Al-Din Rida",
  },
  {
    id: "POS-9794", date: "2026-05-09", time: "18:00", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-011", name: "Flour 2kg",          qty: 1, unitPrice: 7.25, total: 7.25 },
      { productId: "p-009", name: "Pasta 500g",         qty: 2, unitPrice: 5.50, total: 11.00 },
      { productId: "p-012", name: "Tomato Sauce 400g",  qty: 3, unitPrice: 6.00, total: 18.00 },
    ],
    subtotal: 36.25, tax: 5.80, discount: 0, total: 42.05, paymentMethod: "card", status: "completed",
  },
  {
    id: "POS-9793", date: "2026-05-08", time: "15:30", cashierId: "CSH-03", cashierName: "Laila Mansour",
    lines: [
      { productId: "p-017", name: "Mixed Nuts 250g",    qty: 2, unitPrice: 14.00, total: 28.00 },
      { productId: "p-014", name: "Grilled Chips 50g",  qty: 4, unitPrice: 3.00, total: 12.00 },
    ],
    subtotal: 40.00, tax: 6.40, discount: 0, total: 46.40, paymentMethod: "split", status: "completed",
    customerId: "lc-002", customerName: "Sara Abu Hamad",
  },
  {
    id: "POS-9792", date: "2026-05-07", time: "10:05", cashierId: "CSH-05", cashierName: "Hana Saeed",
    lines: [
      { productId: "p-020", name: "White Cheese 500g", qty: 1, unitPrice: 13.00, total: 13.00 },
      { productId: "p-021", name: "Yogurt 400g",       qty: 2, unitPrice: 4.75, total: 9.50 },
    ],
    subtotal: 22.50, tax: 3.60, discount: 0, total: 26.10, paymentMethod: "card", status: "voided",
  },
  {
    id: "POS-9791", date: "2026-05-06", time: "16:55", cashierId: "CSH-02", cashierName: "Mona Ibrahim",
    lines: [
      { productId: "p-024", name: "Tissue Box",         qty: 6, unitPrice: 3.50, total: 21.00 },
      { productId: "p-023", name: "Liquid Hand Soap 500ml", qty: 2, unitPrice: 7.00, total: 14.00 },
    ],
    subtotal: 35.00, tax: 5.60, discount: 0, total: 40.60, paymentMethod: "cash", status: "completed",
  },
  {
    id: "POS-9790", date: "2026-05-05", time: "11:40", cashierId: "CSH-04", cashierName: "Karim Nasser",
    lines: [
      { productId: "p-002", name: "Orange Juice 1L",   qty: 2, unitPrice: 6.00, total: 12.00 },
      { productId: "p-006", name: "Sparkling Water 750ml", qty: 3, unitPrice: 5.00, total: 15.00 },
    ],
    subtotal: 27.00, tax: 4.32, discount: 0, total: 31.32, paymentMethod: "wallet", status: "completed",
    customerId: "lc-005", customerName: "Reem Hussein",
  },
  {
    id: "POS-9789", date: "2026-05-04", time: "09:10", cashierId: "CSH-01", cashierName: "Ahmad Qasim",
    lines: [
      { productId: "p-008", name: "Olive Oil 500ml",    qty: 2, unitPrice: 22.00, total: 44.00 },
      { productId: "p-013", name: "Canned Tuna",        qty: 4, unitPrice: 8.50, total: 34.00 },
    ],
    subtotal: 78.00, tax: 12.48, discount: 8.00, total: 82.48, paymentMethod: "card", status: "completed",
    customerId: "lc-001", customerName: "Mohammed Al-Omari",
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
  pin?: string;
  employeeId?: string;
  isDeleted?: boolean;
}

export const POS_CASHIERS: PosCashier[] = [
  { id: "CSH-01", name: "Ahmad Qasim",   code: "CSH-01", status: "active",    shift: "morning",   todaySales: 120.53, transactions: 3,  lastActive: "2026-05-26T10:45:00Z" },
  { id: "CSH-02", name: "Mona Ibrahim",  code: "CSH-02", status: "active",    shift: "afternoon", todaySales: 100.30, transactions: 2,  lastActive: "2026-05-26T10:12:00Z" },
  { id: "CSH-03", name: "Laila Mansour", code: "CSH-03", status: "on-break",  shift: "morning",   todaySales: 0,      transactions: 0,  lastActive: "2026-05-25T17:55:00Z" },
  { id: "CSH-04", name: "Karim Nasser",  code: "CSH-04", status: "inactive",  shift: "evening",   todaySales: 0,      transactions: 0,  lastActive: "2026-05-23T22:00:00Z" },
  { id: "CSH-05", name: "Hana Saeed",    code: "CSH-05", status: "active",    shift: "evening",   todaySales: 0,      transactions: 0,  lastActive: "2026-05-24T20:30:00Z" },
  { id: "CSH-06", name: "Omar Haddad",   code: "CSH-06", status: "active",    shift: "morning",   todaySales: 88.40,  transactions: 2,  lastActive: "2026-05-26T09:50:00Z" },
  { id: "CSH-07", name: "Dina Saleh",    code: "CSH-07", status: "inactive",  shift: "afternoon", todaySales: 0,      transactions: 0,  lastActive: "2026-05-20T14:00:00Z" },
  { id: "CSH-08", name: "Yusuf Barakat", code: "CSH-08", status: "on-break",  shift: "evening",   todaySales: 0,      transactions: 0,  lastActive: "2026-05-26T08:00:00Z" },
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
    id: "CNT-005", date: "2026-05-26", location: "Main Floor", status: "open", itemsCount: 0, varianceValue: 0, countedBy: "Ahmad Qasim",
    items: [],
  },
  {
    id: "CNT-004", date: "2026-05-20", location: "Storeroom A", status: "in-progress", itemsCount: 6, varianceValue: 0, countedBy: "Mona Ibrahim",
    items: [
      { productId: "p-019", productName: "Full-Fat Milk 1L",    sku: "DAI-MLK-1L",   expected: 65, counted: 65, variance: 0 },
      { productId: "p-020", productName: "White Cheese 500g",   sku: "DAI-CHE-500",  expected: 28, counted: 0,  variance: 0 },
      { productId: "p-021", productName: "Yogurt 400g",         sku: "DAI-YOG-400",  expected: 50, counted: 0,  variance: 0 },
      { productId: "p-022", productName: "Butter 200g",         sku: "DAI-BUT-200",  expected: 22, counted: 0,  variance: 0 },
      { productId: "p-023", productName: "Liquid Soap 500ml",   sku: "HH-SOAP-500",  expected: 30, counted: 30, variance: 0 },
      { productId: "p-024", productName: "Tissue Box",          sku: "HH-TSS-BOX",   expected: 40, counted: 0,  variance: 0 },
    ],
  },
  {
    id: "CNT-003", date: "2026-05-14", location: "Dairy Section", status: "completed", itemsCount: 12, varianceValue: -67.50, countedBy: "Laila Mansour",
    items: [
      { productId: "p-001", productName: "Mineral Water 500ml", sku: "BEV-H2O-500",  expected: 120, counted: 118, variance: -2 },
      { productId: "p-002", productName: "Orange Juice 1L",     sku: "BEV-OJ-1L",    expected: 44,  counted: 40,  variance: -4 },
      { productId: "p-003", productName: "Cola 330ml",          sku: "BEV-COLA-330", expected: 80,  counted: 82,  variance: +2 },
      { productId: "p-007", productName: "Basmati Rice 1kg",    sku: "FOOD-RIC-1K",  expected: 55,  counted: 52,  variance: -3 },
      { productId: "p-008", productName: "Olive Oil 500ml",     sku: "FOOD-OO-500",  expected: 18,  counted: 17,  variance: -1 },
      { productId: "p-009", productName: "Pasta 500g",          sku: "FOOD-PAS-500", expected: 40,  counted: 40,  variance:  0 },
      { productId: "p-014", productName: "Grilled Chips 50g",   sku: "SNK-CHIP-50",  expected: 200, counted: 195, variance: -5 },
      { productId: "p-015", productName: "Milk Chocolate 100g", sku: "SNK-CHO-100",  expected: 65,  counted: 65,  variance:  0 },
      { productId: "p-019", productName: "Full-Fat Milk 1L",    sku: "DAI-MLK-1L",   expected: 60,  counted: 56,  variance: -4 },
      { productId: "p-020", productName: "White Cheese 500g",   sku: "DAI-CHE-500",  expected: 25,  counted: 22,  variance: -3 },
      { productId: "p-021", productName: "Yogurt 400g",         sku: "DAI-YOG-400",  expected: 50,  counted: 52,  variance: +2 },
      { productId: "p-022", productName: "Butter 200g",         sku: "DAI-BUT-200",  expected: 22,  counted: 20,  variance: -2 },
    ],
  },
  {
    id: "CNT-002", date: "2026-05-07", location: "Beverages Aisle", status: "completed", itemsCount: 10, varianceValue: 0, countedBy: "Ahmad Qasim",
    items: [
      { productId: "p-001", productName: "Mineral Water 500ml", sku: "BEV-H2O-500",  expected: 100, counted: 100, variance: 0 },
      { productId: "p-002", productName: "Orange Juice 1L",     sku: "BEV-OJ-1L",    expected: 44,  counted: 44,  variance: 0 },
      { productId: "p-003", productName: "Cola 330ml",          sku: "BEV-COLA-330", expected: 80,  counted: 80,  variance: 0 },
      { productId: "p-004", productName: "Green Tea Box",       sku: "BEV-GT-BOX",   expected: 30,  counted: 30,  variance: 0 },
      { productId: "p-005", productName: "Instant Coffee 200g", sku: "BEV-CF-200",   expected: 22,  counted: 22,  variance: 0 },
      { productId: "p-006", productName: "Sparkling Water 750ml", sku: "BEV-SPK-750", expected: 15, counted: 15,  variance: 0 },
      { productId: "p-007", productName: "Basmati Rice 1kg",    sku: "FOOD-RIC-1K",  expected: 55,  counted: 55,  variance: 0 },
      { productId: "p-008", productName: "Olive Oil 500ml",     sku: "FOOD-OO-500",  expected: 18,  counted: 18,  variance: 0 },
      { productId: "p-009", productName: "Pasta 500g",          sku: "FOOD-PAS-500", expected: 40,  counted: 40,  variance: 0 },
      { productId: "p-010", productName: "White Sugar 1kg",     sku: "FOOD-SUG-1K",  expected: 90,  counted: 90,  variance: 0 },
    ],
  },
  {
    id: "CNT-001", date: "2026-04-28", location: "Main Floor", status: "cancelled", itemsCount: 0, varianceValue: 0, countedBy: "Karim Nasser",
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

// ─── Loyalty Coins Reports ─────────────────────────────────────────────────────

export interface CoinsMonthlyPoint {
  month: string;
  issued: number;
  redeemed: number;
}

export const POS_COINS_MONTHLY: CoinsMonthlyPoint[] = [
  { month: "Dec", issued: 38200, redeemed: 14800 },
  { month: "Jan", issued: 41500, redeemed: 16200 },
  { month: "Feb", issued: 39800, redeemed: 15600 },
  { month: "Mar", issued: 44200, redeemed: 18900 },
  { month: "Apr", issued: 46800, redeemed: 19100 },
  { month: "May", issued: 48320, redeemed: 19750 },
];

export interface CoinsTopCustomer {
  name: string;
  code: string;
  balance: number;
}

export const POS_COINS_TOP_BALANCES: CoinsTopCustomer[] = [
  { name: "Mohammed Al-Omari", code: "LYL-00042", balance: 12400 },
  { name: "Sara Abu Hamad",    code: "LYL-00089", balance: 9250  },
  { name: "Khaled Al-Sharif", code: "LYL-00213", balance: 8100  },
  { name: "Nour Al-Din Rida", code: "LYL-00310", balance: 6000  },
  { name: "Reem Hussein",     code: "LYL-00156", balance: 5800  },
  { name: "Tariq Mansour",    code: "LYL-00078", balance: 5200  },
  { name: "Lina Barakat",     code: "LYL-00390", balance: 4900  },
  { name: "Hassan Khalil",    code: "LYL-00445", balance: 4100  },
  { name: "Dina Qasim",       code: "LYL-00512", balance: 3800  },
  { name: "Faris Nasser",     code: "LYL-00667", balance: 3200  },
];

// ─── Loyalty Settings ─────────────────────────────────────────────────────────

export interface LoyaltyTier {
  id: string;
  name: string;
  nameAr: string;
  minCoins: number;
  multiplier: number;
}

export interface LoyaltySettings {
  programName: string;
  coinsCurrencyName: string;
  coinsPerUnit: number;
  unitAmount: number;
  minPurchaseToEarn: number;
  minCoinsToRedeem: number;
  coinsPerCurrencyUnit: number;
  maxRedemptionPct: number;
  expiryEnabled: boolean;
  expiryMonths: number;
  expiryWarningDays: number;
  tiersEnabled: boolean;
  tiers: LoyaltyTier[];
}

export const LOYALTY_SETTINGS_DEFAULT: LoyaltySettings = {
  programName: "Atlas Coins",
  coinsCurrencyName: "Coins",
  coinsPerUnit: 1,
  unitAmount: 10,
  minPurchaseToEarn: 20,
  minCoinsToRedeem: 100,
  coinsPerCurrencyUnit: 100,
  maxRedemptionPct: 30,
  expiryEnabled: true,
  expiryMonths: 12,
  expiryWarningDays: 14,
  tiersEnabled: true,
  tiers: [
    { id: "t1", name: "Bronze", nameAr: "برونز", minCoins: 0,     multiplier: 1   },
    { id: "t2", name: "Silver", nameAr: "فضة",   minCoins: 5000,  multiplier: 1.5 },
    { id: "t3", name: "Gold",   nameAr: "ذهب",   minCoins: 15000, multiplier: 2   },
  ],
};

// ─── Loyalty Member Profile ────────────────────────────────────────────────────

export type LoyaltyProfileAction = "earned" | "redeemed" | "expired" | "adjusted";

export interface LoyaltyProfileTransaction {
  id: string;
  date: string;
  action: LoyaltyProfileAction;
  coins: number;
  trigger: string;
  balanceAfter: number;
}

export interface LoyaltyMemberProfile {
  customerId: string;
  customerName: string;
  customerCode: string;
  tier: "Bronze" | "Silver" | "Gold";
  coinsBalance: number;
  memberSince: string;
  totalEarned: number;
  totalRedeemed: number;
  totalExpired: number;
  transactions: LoyaltyProfileTransaction[];
}

export const LOYALTY_PROFILES: LoyaltyMemberProfile[] = [
  {
    customerId: "lc-001",
    customerName: "Mohammed Al-Omari",
    customerCode: "LYL-00042",
    tier: "Gold",
    coinsBalance: 12400,
    memberSince: "2024-11-15",
    totalEarned: 38200,
    totalRedeemed: 25800,
    totalExpired: 0,
    transactions: [
      { id: "lt-001", date: "2026-05-26", action: "earned",   coins:   350, trigger: "Purchase POS-9821",         balanceAfter: 12400 },
      { id: "lt-002", date: "2026-05-18", action: "redeemed", coins:  -500, trigger: "Redemption POS-9808",       balanceAfter: 12050 },
      { id: "lt-003", date: "2026-05-10", action: "earned",   coins:   280, trigger: "Purchase POS-9795",         balanceAfter: 12550 },
      { id: "lt-004", date: "2026-04-28", action: "earned",   coins:   420, trigger: "Purchase POS-9762",         balanceAfter: 12270 },
      { id: "lt-005", date: "2026-04-15", action: "redeemed", coins: -1000, trigger: "Redemption POS-9748",       balanceAfter: 11850 },
      { id: "lt-006", date: "2026-04-02", action: "earned",   coins:   600, trigger: "Purchase POS-9720",         balanceAfter: 12850 },
      { id: "lt-007", date: "2026-03-20", action: "adjusted", coins:   200, trigger: "Manual bonus — Ramadan promo", balanceAfter: 12250 },
      { id: "lt-008", date: "2026-03-08", action: "earned",   coins:   380, trigger: "Purchase POS-9688",         balanceAfter: 12050 },
      { id: "lt-009", date: "2026-02-22", action: "redeemed", coins:  -800, trigger: "Redemption POS-9655",       balanceAfter: 11670 },
      { id: "lt-010", date: "2026-02-14", action: "earned",   coins:   520, trigger: "Purchase POS-9630",         balanceAfter: 12470 },
      { id: "lt-011", date: "2026-01-30", action: "earned",   coins:   290, trigger: "Purchase POS-9601",         balanceAfter: 11950 },
      { id: "lt-012", date: "2026-01-15", action: "redeemed", coins:  -500, trigger: "Redemption POS-9578",       balanceAfter: 11660 },
      { id: "lt-013", date: "2025-12-25", action: "earned",   coins:   750, trigger: "Purchase POS-9530",         balanceAfter: 12160 },
      { id: "lt-014", date: "2025-11-11", action: "earned",   coins:   440, trigger: "Purchase POS-9480",         balanceAfter: 11410 },
      { id: "lt-015", date: "2025-09-05", action: "redeemed", coins: -2000, trigger: "Redemption POS-9350",       balanceAfter: 10970 },
      { id: "lt-016", date: "2025-06-20", action: "earned",   coins:  1200, trigger: "Purchase POS-9210",         balanceAfter: 12970 },
      { id: "lt-017", date: "2025-03-14", action: "earned",   coins:   900, trigger: "Purchase POS-9050",         balanceAfter: 11770 },
      { id: "lt-018", date: "2024-11-15", action: "earned",   coins:   500, trigger: "Welcome bonus",             balanceAfter:    500 },
    ],
  },
];

// ─── Sales History ────────────────────────────────────────────────────────────

export type SaleStatus = "completed" | "refunded" | "voided";

export interface SaleLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface SaleTransaction {
  id: string;
  date: string;
  time: string;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "wallet" | "split";
  status: SaleStatus;
  receiptId: string;
}

export const POS_SALES_HISTORY: SaleTransaction[] = [
  { id: "TXN-03000", date: "2026-05-27", time: "08:14", cashierId: "CSH-01", cashierName: "Ahmad Qasim",   customerName: "محمد العمري",  lines: [{ productId: "p-003", name: "كولا 330مل",         qty: 2, unitPrice: 4.50, total: 9.00 }, { productId: "p-014", name: "شيبس مشوي 50جم", qty: 1, unitPrice: 3.00, total: 3.00 }], subtotal: 12.00, discount: 0,    tax: 1.08, total: 13.08, paymentMethod: "cash",   status: "completed", receiptId: "RCP-9001" },
  { id: "TXN-03001", date: "2026-05-27", time: "08:45", cashierId: "CSH-02", cashierName: "Mona Ibrahim",                                lines: [{ productId: "p-007", name: "أرز بسمتي 1كجم",      qty: 2, unitPrice: 9.75, total: 19.50 }], subtotal: 19.50, discount: 0,    tax: 1.76, total: 21.26, paymentMethod: "card",   status: "completed", receiptId: "RCP-9002" },
  { id: "TXN-03002", date: "2026-05-27", time: "09:02", cashierId: "CSH-01", cashierName: "Ahmad Qasim",   customerName: "سارة أبو حمد", lines: [{ productId: "p-015", name: "شوكولاتة حليب 100جم", qty: 1, unitPrice: 7.50, total: 7.50 }, { productId: "p-019", name: "حليب كامل الدسم 1ل", qty: 2, unitPrice: 5.50, total: 11.00 }], subtotal: 18.50, discount: 0.93, tax: 1.58, total: 19.15, paymentMethod: "wallet", status: "refunded",  receiptId: "RCP-9003" },
  { id: "TXN-03003", date: "2026-05-27", time: "09:30", cashierId: "CSH-03", cashierName: "Laila Mansour",                               lines: [{ productId: "p-009", name: "معكرونة 500جم",        qty: 3, unitPrice: 5.50, total: 16.50 }], subtotal: 16.50, discount: 0,    tax: 1.49, total: 17.99, paymentMethod: "cash",   status: "completed", receiptId: "RCP-9004" },
  { id: "TXN-03004", date: "2026-05-27", time: "10:15", cashierId: "CSH-04", cashierName: "Karim Nasser",  customerName: "خالد الشريف",  lines: [{ productId: "p-008", name: "زيت زيتون 500مل",     qty: 1, unitPrice: 22.00, total: 22.00 }], subtotal: 22.00, discount: 0,    tax: 1.98, total: 23.98, paymentMethod: "card",   status: "completed", receiptId: "RCP-9005" },
  { id: "TXN-03005", date: "2026-05-27", time: "11:00", cashierId: "CSH-05", cashierName: "Hana Saeed",                                  lines: [{ productId: "p-020", name: "جبنة بيضاء 500جم",    qty: 2, unitPrice: 13.00, total: 26.00 }, { productId: "p-021", name: "لبن زبادي 400جم", qty: 1, unitPrice: 4.75, total: 4.75 }], subtotal: 30.75, discount: 0, tax: 2.77, total: 33.52, paymentMethod: "split",  status: "completed", receiptId: "RCP-9006" },
  { id: "TXN-03006", date: "2026-05-27", time: "11:40", cashierId: "CSH-01", cashierName: "Ahmad Qasim",                                 lines: [{ productId: "p-001", name: "مياه معدنية 500مل",   qty: 6, unitPrice: 2.50, total: 15.00 }], subtotal: 15.00, discount: 0,    tax: 1.35, total: 16.35, paymentMethod: "cash",   status: "voided",    receiptId: "RCP-9007" },
  { id: "TXN-03007", date: "2026-05-27", time: "12:05", cashierId: "CSH-02", cashierName: "Mona Ibrahim",  customerName: "نور الدين رضا", lines: [{ productId: "p-017", name: "مكسرات مشكلة 250جم", qty: 2, unitPrice: 14.00, total: 28.00 }], subtotal: 28.00, discount: 1.40, tax: 2.39, total: 28.99, paymentMethod: "card",   status: "completed", receiptId: "RCP-9008" },
  { id: "TXN-03008", date: "2026-05-26", time: "08:30", cashierId: "CSH-03", cashierName: "Laila Mansour",                               lines: [{ productId: "p-010", name: "سكر أبيض 1كجم",        qty: 2, unitPrice: 4.00, total: 8.00 }, { productId: "p-011", name: "طحين 2كجم", qty: 1, unitPrice: 7.25, total: 7.25 }], subtotal: 15.25, discount: 0, tax: 1.37, total: 16.62, paymentMethod: "cash", status: "completed", receiptId: "RCP-9009" },
  { id: "TXN-03009", date: "2026-05-26", time: "09:15", cashierId: "CSH-04", cashierName: "Karim Nasser",  customerName: "ريم حسين",     lines: [{ productId: "p-005", name: "قهوة سريعة 200جم",    qty: 1, unitPrice: 18.50, total: 18.50 }, { productId: "p-004", name: "شاي أخضر علبة", qty: 1, unitPrice: 12.00, total: 12.00 }], subtotal: 30.50, discount: 0, tax: 2.75, total: 33.25, paymentMethod: "wallet", status: "completed", receiptId: "RCP-9010" },
  { id: "TXN-03010", date: "2026-05-26", time: "10:00", cashierId: "CSH-05", cashierName: "Hana Saeed",    customerName: "محمد العمري",  lines: [{ productId: "p-013", name: "تونا معلبة",           qty: 3, unitPrice: 8.50, total: 25.50 }], subtotal: 25.50, discount: 0,    tax: 2.30, total: 27.80, paymentMethod: "cash",   status: "refunded",  receiptId: "RCP-9011" },
  { id: "TXN-03011", date: "2026-05-26", time: "10:45", cashierId: "CSH-01", cashierName: "Ahmad Qasim",                                 lines: [{ productId: "p-016", name: "بسكويت شاي 200جم",     qty: 4, unitPrice: 4.50, total: 18.00 }], subtotal: 18.00, discount: 0,    tax: 1.62, total: 19.62, paymentMethod: "card",   status: "completed", receiptId: "RCP-9012" },
  { id: "TXN-03012", date: "2026-05-26", time: "11:30", cashierId: "CSH-02", cashierName: "Mona Ibrahim",  customerName: "سارة أبو حمد", lines: [{ productId: "p-022", name: "زبدة 200جم",           qty: 1, unitPrice: 8.00, total: 8.00 }, { productId: "p-023", name: "صابون يدين سائل 500مل", qty: 1, unitPrice: 7.00, total: 7.00 }], subtotal: 15.00, discount: 0, tax: 1.35, total: 16.35, paymentMethod: "split", status: "completed", receiptId: "RCP-9013" },
  { id: "TXN-03013", date: "2026-05-26", time: "12:20", cashierId: "CSH-03", cashierName: "Laila Mansour",                               lines: [{ productId: "p-002", name: "عصير برتقال 1ل",        qty: 3, unitPrice: 6.00, total: 18.00 }], subtotal: 18.00, discount: 0,    tax: 1.62, total: 19.62, paymentMethod: "cash",   status: "completed", receiptId: "RCP-9014" },
  { id: "TXN-03014", date: "2026-05-25", time: "09:00", cashierId: "CSH-04", cashierName: "Karim Nasser",  customerName: "خالد الشريف",  lines: [{ productId: "p-007", name: "أرز بسمتي 1كجم",      qty: 3, unitPrice: 9.75, total: 29.25 }, { productId: "p-012", name: "صلصة طماطم 400جم", qty: 2, unitPrice: 6.00, total: 12.00 }], subtotal: 41.25, discount: 2.06, tax: 3.53, total: 42.72, paymentMethod: "card", status: "completed", receiptId: "RCP-9015" },
  { id: "TXN-03015", date: "2026-05-25", time: "09:50", cashierId: "CSH-05", cashierName: "Hana Saeed",                                  lines: [{ productId: "p-019", name: "حليب كامل الدسم 1ل",  qty: 4, unitPrice: 5.50, total: 22.00 }], subtotal: 22.00, discount: 0,    tax: 1.98, total: 23.98, paymentMethod: "cash",   status: "completed", receiptId: "RCP-9016" },
  { id: "TXN-03016", date: "2026-05-25", time: "10:30", cashierId: "CSH-01", cashierName: "Ahmad Qasim",   customerName: "نور الدين رضا", lines: [{ productId: "p-008", name: "زيت زيتون 500مل",     qty: 2, unitPrice: 22.00, total: 44.00 }], subtotal: 44.00, discount: 0, tax: 3.96, total: 47.96, paymentMethod: "wallet", status: "completed", receiptId: "RCP-9017" },
  { id: "TXN-03017", date: "2026-05-25", time: "11:15", cashierId: "CSH-02", cashierName: "Mona Ibrahim",  customerName: "ريم حسين",     lines: [{ productId: "p-015", name: "شوكولاتة حليب 100جم", qty: 3, unitPrice: 7.50, total: 22.50 }, { productId: "p-016", name: "بسكويت شاي 200جم", qty: 2, unitPrice: 4.50, total: 9.00 }], subtotal: 31.50, discount: 0, tax: 2.84, total: 34.34, paymentMethod: "card", status: "completed", receiptId: "RCP-9018" },
  { id: "TXN-03018", date: "2026-05-24", time: "08:00", cashierId: "CSH-03", cashierName: "Laila Mansour", customerName: "محمد العمري",  lines: [{ productId: "p-014", name: "شيبس مشوي 50جم",       qty: 5, unitPrice: 3.00, total: 15.00 }, { productId: "p-003", name: "كولا 330مل", qty: 3, unitPrice: 4.50, total: 13.50 }], subtotal: 28.50, discount: 0, tax: 2.57, total: 31.07, paymentMethod: "cash", status: "completed", receiptId: "RCP-9019" },
  { id: "TXN-03019", date: "2026-05-24", time: "09:40", cashierId: "CSH-04", cashierName: "Karim Nasser",                                lines: [{ productId: "p-020", name: "جبنة بيضاء 500جم",    qty: 1, unitPrice: 13.00, total: 13.00 }, { productId: "p-021", name: "لبن زبادي 400جم", qty: 2, unitPrice: 4.75, total: 9.50 }], subtotal: 22.50, discount: 0, tax: 2.03, total: 24.53, paymentMethod: "card", status: "completed", receiptId: "RCP-9020" },
  { id: "TXN-03020", date: "2026-05-24", time: "10:20", cashierId: "CSH-05", cashierName: "Hana Saeed",    customerName: "سارة أبو حمد", lines: [{ productId: "p-001", name: "مياه معدنية 500مل",   qty: 12, unitPrice: 2.50, total: 30.00 }], subtotal: 30.00, discount: 1.50, tax: 2.57, total: 31.07, paymentMethod: "wallet", status: "completed", receiptId: "RCP-9021" },
];

// ─── Sales Refunds ────────────────────────────────────────────────────────────

export type RefundStatus = "pending" | "approved" | "completed" | "rejected";
export type RefundReason = "defective" | "wrong_item" | "customer_change" | "overcharge" | "other";

export interface SaleRefund {
  id: string;
  originalTxId: string;
  date: string;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  refundAmount: number;
  reason: RefundReason;
  status: RefundStatus;
  rejectionNote?: string;
  lines: SaleLine[];
}

export const POS_REFUNDS: SaleRefund[] = [
  { id: "RFD-001", originalTxId: "TXN-03000", date: "2026-05-27", cashierId: "CSH-01", cashierName: "Ahmad Qasim",   customerName: "محمد العمري",  refundAmount: 12.50, reason: "defective",      status: "pending",   lines: [{ productId: "p-003", name: "كولا 330مل",          qty: 1, unitPrice: 4.50, total: 4.50  }] },
  { id: "RFD-002", originalTxId: "TXN-03002", date: "2026-05-27", cashierId: "CSH-02", cashierName: "Mona Ibrahim",  customerName: "سارة أبو حمد", refundAmount: 7.50,  reason: "wrong_item",     status: "approved",  lines: [{ productId: "p-015", name: "شوكولاتة حليب 100جم", qty: 1, unitPrice: 7.50, total: 7.50  }] },
  { id: "RFD-003", originalTxId: "TXN-03004", date: "2026-05-26", cashierId: "CSH-03", cashierName: "Laila Mansour",                               refundAmount: 22.00, reason: "customer_change", status: "completed", lines: [{ productId: "p-008", name: "زيت زيتون 500مل",      qty: 1, unitPrice: 22.00, total: 22.00 }] },
  { id: "RFD-004", originalTxId: "TXN-03006", date: "2026-05-26", cashierId: "CSH-04", cashierName: "Karim Nasser",  customerName: "خالد الشريف",  refundAmount: 9.75,  reason: "overcharge",      status: "rejected",  rejectionNote: "No receipt provided.", lines: [] },
  { id: "RFD-005", originalTxId: "TXN-03008", date: "2026-05-25", cashierId: "CSH-05", cashierName: "Hana Saeed",                                  refundAmount: 5.50,  reason: "defective",       status: "pending",   lines: [{ productId: "p-019", name: "حليب كامل الدسم 1ل",  qty: 1, unitPrice: 5.50, total: 5.50  }] },
  { id: "RFD-006", originalTxId: "TXN-03010", date: "2026-05-25", cashierId: "CSH-01", cashierName: "Ahmad Qasim",   customerName: "محمد العمري",  refundAmount: 13.00, reason: "wrong_item",      status: "completed", lines: [{ productId: "p-020", name: "جبنة بيضاء 500جم",    qty: 1, unitPrice: 13.00, total: 13.00 }] },
  { id: "RFD-007", originalTxId: "TXN-03012", date: "2026-05-24", cashierId: "CSH-02", cashierName: "Mona Ibrahim",                                refundAmount: 4.50,  reason: "other",           status: "approved",  lines: [] },
  { id: "RFD-008", originalTxId: "TXN-03014", date: "2026-05-24", cashierId: "CSH-03", cashierName: "Laila Mansour", customerName: "سارة أبو حمد", refundAmount: 9.00,  reason: "defective",       status: "pending",   lines: [{ productId: "p-003", name: "كولا 330مل",          qty: 2, unitPrice: 4.50, total: 9.00  }] },
  { id: "RFD-009", originalTxId: "TXN-03016", date: "2026-05-23", cashierId: "CSH-04", cashierName: "Karim Nasser",  customerName: "خالد الشريف",  refundAmount: 18.50, reason: "overcharge",      status: "completed", lines: [{ productId: "p-005", name: "قهوة سريعة 200جم",    qty: 1, unitPrice: 18.50, total: 18.50 }] },
  { id: "RFD-010", originalTxId: "TXN-03018", date: "2026-05-23", cashierId: "CSH-05", cashierName: "Hana Saeed",                                  refundAmount: 6.00,  reason: "customer_change", status: "rejected",  rejectionNote: "Past 7-day return window.", lines: [] },
  { id: "RFD-011", originalTxId: "TXN-03020", date: "2026-05-22", cashierId: "CSH-01", cashierName: "Ahmad Qasim",   customerName: "نور الدين رضا", refundAmount: 3.00, reason: "defective",       status: "approved",  lines: [{ productId: "p-014", name: "شيبس مشوي 50جم",     qty: 1, unitPrice: 3.00, total: 3.00  }] },
  { id: "RFD-012", originalTxId: "TXN-03001", date: "2026-05-22", cashierId: "CSH-02", cashierName: "Mona Ibrahim",  customerName: "ريم حسين",     refundAmount: 14.00, reason: "wrong_item",      status: "completed", lines: [{ productId: "p-017", name: "مكسرات مشكلة 250جم",  qty: 1, unitPrice: 14.00, total: 14.00 }] },
  { id: "RFD-013", originalTxId: "TXN-03003", date: "2026-05-21", cashierId: "CSH-03", cashierName: "Laila Mansour",                               refundAmount: 5.50,  reason: "other",           status: "pending",   lines: [] },
  { id: "RFD-014", originalTxId: "TXN-03005", date: "2026-05-21", cashierId: "CSH-04", cashierName: "Karim Nasser",  customerName: "محمد العمري",  refundAmount: 8.50,  reason: "defective",       status: "completed", lines: [{ productId: "p-013", name: "تونا معلبة",           qty: 1, unitPrice: 8.50, total: 8.50  }] },
  { id: "RFD-015", originalTxId: "TXN-03007", date: "2026-05-20", cashierId: "CSH-05", cashierName: "Hana Saeed",    customerName: "سارة أبو حمد", refundAmount: 7.25,  reason: "overcharge",      status: "approved",  lines: [{ productId: "p-011", name: "طحين 2كجم",             qty: 1, unitPrice: 7.25, total: 7.25  }] },
];