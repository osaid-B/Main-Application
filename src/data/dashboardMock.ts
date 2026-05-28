/**
 * Mock data for the Atlas Operations Command dashboard.
 * Production wiring should replace these constants with derivations
 * from src/data/storage.ts + relations.ts.
 */

export type Tone = "success" | "warning" | "danger" | "default";
export type WorkspaceTone = "blue" | "green" | "purple";

export interface KPIStat {
  label: string;
  labelAr: string;
  value: string;
  tone: Tone;
}

export interface WorkspaceStats {
  id: "company" | "pos" | "factory";
  name: string;
  nameAr: string;
  color: WorkspaceTone;
  revenue: number;
  revenueFmt: string;
  revenueFmtAr: string;
  trend: number;
  sparkline: number[];
  stats: KPIStat[];
}

function buildSpark(seed: number, count = 30): number[] {
  const arr: number[] = [];
  let v = seed;
  for (let i = 0; i < count; i++) {
    const drift = (Math.sin(i * 0.6) + Math.cos(i * 0.3) * 0.5) * 6;
    const jitter = ((i * 9301 + 49297) % 233280) / 233280;
    v = v + drift + (jitter - 0.5) * 4;
    arr.push(Math.max(8, +v.toFixed(1)));
  }
  return arr;
}

export const WORKSPACE_STATS: WorkspaceStats[] = [
  {
    id: "company",
    name: "Main Company",
    nameAr: "الشركة الرئيسية",
    color: "blue",
    revenue: 184300,
    revenueFmt: "₪184,300",
    revenueFmtAr: "₪184,300",
    trend: 12.4,
    sparkline: buildSpark(40),
    stats: [
      { label: "OPEN INVOICES", labelAr: "فواتير مفتوحة", value: "32", tone: "danger" },
      { label: "NET CASH",      labelAr: "صافي النقد",    value: "₪1,240,500", tone: "success" },
      { label: "PAYROLL DUE",   labelAr: "رواتب مستحقة",  value: "₪86,400",    tone: "default" },
    ],
  },
  {
    id: "pos",
    name: "Supermarket POS",
    nameAr: "نقاط البيع — السوبرماركت",
    color: "green",
    revenue: 48725,
    revenueFmt: "₪48,725",
    revenueFmtAr: "₪48,725",
    trend: 8.2,
    sparkline: buildSpark(22),
    stats: [
      { label: "TX TODAY",   labelAr: "معاملات اليوم",  value: "1,284",  tone: "default" },
      { label: "AVG BASKET", labelAr: "متوسط السلة",    value: "₪37.92", tone: "default" },
      { label: "DISCOUNTS",  labelAr: "خصومات ممنوحة",  value: "+₪2.1k", tone: "warning" },
    ],
  },
  {
    id: "factory",
    name: "Factory",
    nameAr: "المصنع",
    color: "purple",
    revenue: 312500,
    revenueFmt: "₪312,500",
    revenueFmtAr: "₪312,500",
    trend: 15.7,
    sparkline: buildSpark(58),
    stats: [
      { label: "ACTIVE ORDERS", labelAr: "أوامر نشطة",     value: "12",    tone: "default" },
      { label: "QC PASS RATE",  labelAr: "معدل اجتياز الجودة", value: "97.4%", tone: "success" },
      { label: "ON HOLD",       labelAr: "معلقة",            value: "2",    tone: "warning" },
    ],
  },
];

export interface RevenuePoint {
  date: string;
  dateAr: string;
  company: number;
  pos: number;
  factory: number;
}

export const REVENUE_CHART: RevenuePoint[] = [
  { date: "Apr 30", dateAr: "30 أبر",  company: 52000, pos: 32000, factory: 48000 },
  { date: "May 1",  dateAr: "1 مايو",  company: 55000, pos: 35000, factory: 51000 },
  { date: "May 2",  dateAr: "2 مايو",  company: 51000, pos: 31000, factory: 54000 },
  { date: "May 3",  dateAr: "3 مايو",  company: 58000, pos: 36000, factory: 57000 },
  { date: "May 4",  dateAr: "4 مايو",  company: 54000, pos: 34000, factory: 62000 },
  { date: "May 5",  dateAr: "5 مايو",  company: 62000, pos: 38000, factory: 65000 },
  { date: "May 6",  dateAr: "6 مايو",  company: 60000, pos: 40000, factory: 69000 },
  { date: "May 7",  dateAr: "7 مايو",  company: 65000, pos: 42000, factory: 74000 },
  { date: "May 8",  dateAr: "8 مايو",  company: 62000, pos: 39000, factory: 78000 },
  { date: "May 9",  dateAr: "9 مايو",  company: 70000, pos: 44000, factory: 82000 },
  { date: "May 10", dateAr: "10 مايو", company: 73000, pos: 47000, factory: 86000 },
  { date: "May 11", dateAr: "11 مايو", company: 68000, pos: 44000, factory: 89000 },
  { date: "May 12", dateAr: "12 مايو", company: 76000, pos: 48000, factory: 94000 },
  { date: "May 13", dateAr: "13 مايو", company: 82000, pos: 52000, factory: 99000 },
];

export type TimelineDot = "green" | "red" | "purple" | "blue" | "orange";

export interface TimelineEventData {
  id: string;
  time: string;
  dot: TimelineDot;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
}

export const TIMELINE_EVENTS: TimelineEventData[] = [
  {
    id: "te1", time: "07:00", dot: "green",
    title: "Ram Allah shift started",
    titleAr: "بدء وردية رام الله",
    description: "Supermarket lanes #1-8 cashier sign-in complete.",
    descriptionAr: "اكتمل تسجيل دخول الكاشيرين — ممرات السوبرماركت 1-8.",
  },
  {
    id: "te2", time: "08:30", dot: "purple",
    title: "Production line 1 startup",
    titleAr: "بدء تشغيل خط الإنتاج 1",
    description: "Olive oil 1L · target 1,400 units · run #4124.",
    descriptionAr: "زيت زيتون بكر 1 لتر · الهدف 1,400 وحدة · تشغيل رقم 4124.",
  },
  {
    id: "te3", time: "09:14", dot: "red",
    title: "QC failed — batch B-882",
    titleAr: "فشل ضبط الجودة — دفعة ب-882",
    description: "Olive Oil 500ml · 4.2% over moisture spec.",
    descriptionAr: "زيت زيتون 500مل · تجاوز نسبة الرطوبة المسموح بها بنسبة 4.2%.",
  },
  {
    id: "te4", time: "10:42", dot: "purple",
    title: "Container ICX-99182 arrived",
    titleAr: "وصول الحاوية ICX-99182",
    description: "Sesame seeds 800kg · cleared Ashdod customs.",
    descriptionAr: "بذور سمسم 800 كجم · اجتازت جمارك أسدود.",
  },
  {
    id: "te5", time: "12:00", dot: "green",
    title: "Lunch rush at SuperMart Central",
    titleAr: "ذروة الظهيرة في سوبرماركت المركز",
    description: "Peak 184 tx/15min · 2 lanes added.",
    descriptionAr: "ذروة 184 معاملة/15 دقيقة · إضافة ممرين.",
  },
  {
    id: "te6", time: "14:25", dot: "blue",
    title: "₪84k invoice paid",
    titleAr: "سداد فاتورة بقيمة ₪84,000",
    description: "Palestine Trading Co · INV-2289 · wire transfer.",
    descriptionAr: "شركة فلسطين للتجارة · INV-2289 · تحويل بنكي.",
  },
  {
    id: "te7", time: "15:50", dot: "orange",
    title: "Reorder triggered",
    titleAr: "تفعيل إعادة الطلب التلقائي",
    description: "12 SKUs below threshold · transferred to procurement.",
    descriptionAr: "12 صنفاً تحت الحد الأدنى · أُحيلت إلى المشتريات.",
  },
];

export type SignalTone = "critical" | "operations" | "finance";

export interface SignalData {
  id: string;
  badge: string;
  badgeAr: string;
  tone: SignalTone;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  actionLabel: string;
  actionLabelAr: string;
}

export const OPERATIONAL_SIGNALS: SignalData[] = [
  {
    id: "sig1",
    badge: "CRITICAL",   badgeAr: "حرج",
    tone: "critical",
    title: "12 SKUs out of stock at SuperMart North",
    titleAr: "12 صنفاً نفد مخزونه في سوبرماركت الشمال",
    description: "Cola 1.5L, Olive Oil 1L and 10 others. Trigger replenishment from Nablus warehouse.",
    descriptionAr: "كولا 1.5 لتر، زيت زيتون 1 لتر و10 أصناف أخرى. يُطلب تجديد المخزون من مستودع نابلس.",
    actionLabel: "Replenish",      actionLabelAr: "تجديد المخزون",
  },
  {
    id: "sig2",
    badge: "OPERATIONS", badgeAr: "عمليات",
    tone: "operations",
    title: "Production order MO-4124 paused · line 2",
    titleAr: "أمر الإنتاج MO-4124 متوقف · خط 2",
    description: "Sesame seeds not received from supplier Sudan Seeds Co. Original ETA was 2 days ago.",
    descriptionAr: "بذور السمسم لم تصل من المورد (سودان سيدز). كان الوصول المتوقع قبل يومين.",
    actionLabel: "Open order",     actionLabelAr: "فتح الأمر",
  },
  {
    id: "sig3",
    badge: "FINANCE",    badgeAr: "مالية",
    tone: "finance",
    title: "3 invoices over 30 days overdue · ₪42,180",
    titleAr: "3 فواتير متأخرة أكثر من 30 يوماً · ₪42,180",
    description: "Largest: Palestine Trading Co — INV-2310. Suggest auto-dunning sequence #2.",
    descriptionAr: "الأكبر: شركة فلسطين للتجارة — INV-2310. يُقترح تفعيل سلسلة المتابعة التلقائية #2.",
    actionLabel: "Start dunning",  actionLabelAr: "بدء المتابعة",
  },
];

export interface PinnedAction {
  id: string;
  icon: "FileText" | "UserPlus" | "ShoppingCart" | "Hammer";
  label: string;
  labelAr: string;
  color: WorkspaceTone;
  path: string;
}

export const PINNED_ACTIONS: PinnedAction[] = [
  { id: "pa1", icon: "FileText",     label: "New invoice",          labelAr: "فاتورة جديدة",          color: "blue",   path: "/invoices" },
  { id: "pa2", icon: "UserPlus",     label: "Add customer",         labelAr: "إضافة عميل",            color: "blue",   path: "/customers/new" },
  { id: "pa3", icon: "ShoppingCart", label: "Open POS",             labelAr: "فتح نقطة البيع",        color: "green",  path: "/payments" },
  { id: "pa4", icon: "Hammer",       label: "New production order", labelAr: "أمر إنتاج جديد",        color: "purple", path: "/purchases" },
];
