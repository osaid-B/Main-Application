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