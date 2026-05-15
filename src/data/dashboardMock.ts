/**
 * Mock data for the Atlas Operations Command dashboard.
 * Production wiring should replace these constants with derivations
 * from src/data/storage.ts + relations.ts.
 */

export type Tone = "success" | "warning" | "danger" | "default";
export type WorkspaceTone = "blue" | "green" | "purple";

export interface KPIStat {
  label: string;
  value: string;
  tone: Tone;
}

export interface WorkspaceStats {
  id: "company" | "pos" | "factory";
  name: string;
  color: WorkspaceTone;
  revenue: number;
  revenueFmt: string;
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
    name: "Company",
    color: "blue",
    revenue: 184300,
    revenueFmt: "$184,300",
    trend: 12.4,
    sparkline: buildSpark(40),
    stats: [
      { label: "OPEN INVOICES", value: "32", tone: "danger" },
      { label: "NET CASH", value: "$1,240,500", tone: "success" },
      { label: "PAYROLL DUE", value: "$86,400", tone: "default" },
    ],
  },
  {
    id: "pos",
    name: "Supermarket POS",
    color: "green",
    revenue: 48725,
    revenueFmt: "$48,725",
    trend: 8.2,
    sparkline: buildSpark(22),
    stats: [
      { label: "TX TODAY", value: "1,284", tone: "default" },
      { label: "AVG BASKET", value: "$37.92", tone: "default" },
      { label: "COINS ISSUED", value: "+18.4k", tone: "warning" },
    ],
  },
  {
    id: "factory",
    name: "Factory",
    color: "purple",
    revenue: 312500,
    revenueFmt: "$312,500",
    trend: 15.7,
    sparkline: buildSpark(58),
    stats: [
      { label: "ACTIVE ORDERS", value: "12", tone: "default" },
      { label: "QC PASS RATE", value: "97.4%", tone: "success" },
      { label: "ON HOLD", value: "2", tone: "warning" },
    ],
  },
];

export interface RevenuePoint {
  date: string;
  company: number;
  pos: number;
  factory: number;
}

export const REVENUE_CHART: RevenuePoint[] = [
  { date: "Apr 30", company: 52000, pos: 32000, factory: 48000 },
  { date: "May 1",  company: 55000, pos: 35000, factory: 51000 },
  { date: "May 2",  company: 51000, pos: 31000, factory: 54000 },
  { date: "May 3",  company: 58000, pos: 36000, factory: 57000 },
  { date: "May 4",  company: 54000, pos: 34000, factory: 62000 },
  { date: "May 5",  company: 62000, pos: 38000, factory: 65000 },
  { date: "May 6",  company: 60000, pos: 40000, factory: 69000 },
  { date: "May 7",  company: 65000, pos: 42000, factory: 74000 },
  { date: "May 8",  company: 62000, pos: 39000, factory: 78000 },
  { date: "May 9",  company: 70000, pos: 44000, factory: 82000 },
  { date: "May 10", company: 73000, pos: 47000, factory: 86000 },
  { date: "May 11", company: 68000, pos: 44000, factory: 89000 },
  { date: "May 12", company: 76000, pos: 48000, factory: 94000 },
  { date: "May 13", company: 82000, pos: 52000, factory: 99000 },
];

export type TimelineDot = "green" | "red" | "purple" | "blue" | "orange";

export interface TimelineEventData {
  id: string;
  time: string;
  dot: TimelineDot;
  title: string;
  description: string;
}

export const TIMELINE_EVENTS: TimelineEventData[] = [
  { id: "te1", time: "07:00", dot: "green",  title: "Riyadh shift open",                description: "Supermarket lanes #1-8 cashier sign-in complete." },
  { id: "te2", time: "08:30", dot: "purple", title: "Factory line 1 startup",           description: "Cooking oil 1L · target 1,400 units · run #4124." },
  { id: "te3", time: "09:14", dot: "red",    title: "QC failed on batch B-882",         description: "Olive Oil 500ml · 4.2% over moisture spec." },
  { id: "te4", time: "10:42", dot: "purple", title: "Container ICX-99182 arrived",      description: "Indonesian Vermicelli · 24,000 packs · cleared customs." },
  { id: "te5", time: "12:00", dot: "green",  title: "Lunch rush at SuperMart Central",  description: "Peak 184 tx/15min · 2 lanes added." },
  { id: "te6", time: "14:25", dot: "blue",   title: "$84k invoice paid",                description: "Halawa Bakery · INV-2289 · wire." },
  { id: "te7", time: "15:50", dot: "orange", title: "Reorder triggered",                description: "12 SKUs below threshold · transferred to procurement." },
];

export type SignalTone = "critical" | "operations" | "finance";

export interface SignalData {
  id: string;
  badge: "CRITICAL" | "OPERATIONS" | "FINANCE";
  tone: SignalTone;
  title: string;
  description: string;
  actionLabel: string;
}

export const OPERATIONAL_SIGNALS: SignalData[] = [
  {
    id: "sig1",
    badge: "CRITICAL",
    tone: "critical",
    title: "12 SKUs out of stock at SuperMart North",
    description: "Cola 1.5L, Olive Oil 1L and 10 others. Trigger replenishment from Riyadh warehouse.",
    actionLabel: "Replenish",
  },
  {
    id: "sig2",
    badge: "OPERATIONS",
    tone: "operations",
    title: "Production order PO-4124 paused · line 2",
    description: "Caustic soda not received from supplier IndoChem. Original ETA was 2 days ago.",
    actionLabel: "Open order",
  },
  {
    id: "sig3",
    badge: "FINANCE",
    tone: "finance",
    title: "3 invoices over 30 days overdue · $42,180",
    description: "Largest: Halawa Bakery — INV-2310. Suggest auto-dunning sequence #2.",
    actionLabel: "Start dunning",
  },
];

export interface PinnedAction {
  id: string;
  icon: "FileText" | "UserPlus" | "ShoppingCart" | "Hammer";
  label: string;
  color: WorkspaceTone;
  path: string;
}

export const PINNED_ACTIONS: PinnedAction[] = [
  { id: "pa1", icon: "FileText",     label: "New invoice",          color: "blue",   path: "/invoices" },
  { id: "pa2", icon: "UserPlus",     label: "Add customer",         color: "blue",   path: "/customers/new" },
  { id: "pa3", icon: "ShoppingCart", label: "Open POS",             color: "green",  path: "/payments" },
  { id: "pa4", icon: "Hammer",       label: "New production order", color: "purple", path: "/purchases" },
];
