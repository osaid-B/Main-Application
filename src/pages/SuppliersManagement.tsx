import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  BarChart3,
  Building2,
  UsersRound,
  ShieldCheck,
  ChevronDown,
  Bell,
  Moon,
  Sun,
  LayoutDashboard,
  Building,
  Wallet,
  Truck,
  Package,
  Receipt,
  Banknote,
  Users2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import "./tailwind-suppliers.css";

const DONUT_COLORS = ["#2563EB", "#16A34A", "#7C3AED", "#EA580C", "#0891B2", "#D946EF", "#F59E0B", "#64748B"];

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "لوحة التحكم" },
  { icon: Building, labelEn: "Company", labelAr: "الشركة" },
  { icon: Wallet, labelEn: "Finance", labelAr: "المالية" },
  { icon: Truck, labelEn: "Suppliers", labelAr: "الموردون", active: true },
  { icon: Package, labelEn: "Products", labelAr: "المنتجات" },
  { icon: Receipt, labelEn: "Invoices", labelAr: "الفواتير" },
  { icon: Banknote, labelEn: "Payments", labelAr: "المدفوعات" },
  { icon: Users2, labelEn: "Employees", labelAr: "الموظفون" },
  { icon: UsersRound, labelEn: "Customers", labelAr: "العملاء" },
  { icon: ShieldCheck, labelEn: "Permissions", labelAr: "الصلاحيات" },
];

const MOCK_CATEGORIES: Record<string, string> = {
  "Digital Hub": "تقنية",
  "Tech Source": "تقنية",
  "Accessories World": "إكسسوارات",
  "Global Traders": "مواد خام",
  "Logistics Pro": "لوجستيات",
};

const MOCK_CODES: Record<string, string> = {
  "Digital Hub": "SUP-1001",
  "Tech Source": "SUP-1002",
  "Accessories World": "SUP-1003",
  "Global Traders": "SUP-1004",
  "Logistics Pro": "SUP-1005",
  "Prime Supplies": "SUP-1006",
  "Alfa Materials": "SUP-1007",
  "Omega Parts": "SUP-1008",
  "Beta Logistics": "SUP-1009",
  "Sigma Distributors": "SUP-1010",
};

const MOCK_BALANCES: Record<string, number> = {
  "Digital Hub": 15200,
  "Tech Source": 8700,
  "Accessories World": 3300,
  "Global Traders": 12200,
  "Logistics Pro": 2100,
  "Prime Supplies": 6400,
  "Alfa Materials": 4500,
  "Omega Parts": 9800,
  "Beta Logistics": 7100,
  "Sigma Distributors": 2800,
};

const MOCK_PAYMENT_STATUS: Record<string, "paid" | "overdue"> = {
  "Digital Hub": "paid",
  "Tech Source": "overdue",
  "Accessories World": "paid",
  "Global Traders": "overdue",
  "Logistics Pro": "paid",
  "Prime Supplies": "paid",
  "Alpha Materials": "overdue",
  "Omega Parts": "paid",
  "Beta Logistics": "overdue",
  "Sigma Distributors": "paid",
};

const SUPPLIER_NAMES = Object.keys(MOCK_BALANCES);

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 60;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  sparklineData,
  sparklineColor,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  sparklineData: number[];
  sparklineColor: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: bgColor }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold tracking-wide text-slate-500">{label}</span>
        <strong className="text-2xl font-extrabold tracking-tight text-slate-900">{value.toLocaleString()}</strong>
      </div>
      <div className="mr-auto flex items-center">
        <Sparkline data={sparklineData} color={sparklineColor} />
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number; color: string } }>;
}

function DonutTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.payload.color }} />
        <span className="text-sm font-semibold text-white">{d.name}</span>
      </div>
      <div className="mt-1.5 text-xs text-slate-300">
        {d.value.toLocaleString()} معاملة
      </div>
      <div className="text-xs font-bold text-emerald-300">
        ₪ {d.value.toLocaleString()}
      </div>
      <div className="mt-0.5 text-xs text-slate-400">
        {d.payload.percent}% من الإجمالي
      </div>
    </div>
  );
}

type SupplierRow = {
  name: string;
  code: string;
  category: string;
  balance: number;
  paymentStatus: "paid" | "overdue";
};

export default function SuppliersManagement() {
  const { isArabic, formatCurrency } = useSettings();
  const { suppliers } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pageSize = 8;

  const enrichedSuppliers: SupplierRow[] = useMemo(() => {
    if (!suppliers?.length) {
      return SUPPLIER_NAMES.map((name) => ({
        name,
        code: MOCK_CODES[name] || "SUP-0000",
        category: MOCK_CATEGORIES[name] || "عام",
        balance: MOCK_BALANCES[name] || 0,
        paymentStatus: MOCK_PAYMENT_STATUS[name] || "paid",
      }));
    }
    return suppliers
      .filter((s) => !s.isDeleted)
      .map((s, i) => ({
        name: s.name,
        code: `SUP-${String(1001 + i).padStart(4, "0")}`,
        category: "عام",
        balance: ((s.name?.length ?? i) * 237 + 500) % 15000 + 500,
        paymentStatus: (i % 3 === 0 ? "overdue" : "paid") as "paid" | "overdue",
      }));
  }, [suppliers]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return enrichedSuppliers;
    return enrichedSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [enrichedSuppliers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageData = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalSuppliers = enrichedSuppliers.length;
  const activeCount = enrichedSuppliers.filter((s) => s.paymentStatus === "paid").length;
  const reviewCount = enrichedSuppliers.filter((s) => s.paymentStatus === "overdue").length;

  const donutData = useMemo(() => {
    const sorted = [...enrichedSuppliers].sort((a, b) => b.balance - a.balance);
    const top = sorted.slice(0, 6);
    const others = sorted.slice(6);
    const data = top.map((s, i) => ({
      name: s.name,
      value: Math.max(s.balance, 0),
      percent: 0,
      color: DONUT_COLORS[i],
    }));
    if (others.length > 0) {
      const otherVal = others.reduce((s, v) => s + Math.max(v.balance, 0), 0);
      if (otherVal > 0) {
        data.push({
          name: isArabic ? "أخرى" : "Others",
          value: otherVal,
          percent: 0,
          color: DONUT_COLORS[6],
        });
      }
    }
    const total = data.reduce((s, v) => s + v.value, 0) || 1;
    return data.map((d) => ({ ...d, percent: Math.round((d.value / total) * 100) }));
  }, [enrichedSuppliers, isArabic]);

  const dir = isArabic ? "rtl" : "ltr";

  return (
    <div dir={dir} className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Right Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 flex w-[68px] flex-col items-center gap-1 border-l border-slate-200 bg-white py-4 shadow-sm">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
          A
        </div>
        <nav className="flex flex-col items-center gap-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.labelEn}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                item.active
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              title={isArabic ? item.labelAr : item.labelEn}
            >
              <item.icon size={20} />
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-1">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <Settings size={20} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content — attached to left edge */}
      <main className="mr-[68px] flex min-h-screen w-[calc(100%-68px)] flex-col gap-5 p-6 pb-10">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>{isArabic ? "الرئيسية" : "Dashboard"}</span>
            <ChevronRight size={14} className={isArabic ? "rotate-180" : ""} />
            <span className="text-blue-600">{isArabic ? "إدارة الموردين" : "Suppliers"}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                3
              </span>
            </button>
            <button className="flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">
              <Plus size={16} />
              {isArabic ? "مورد جديد" : "+ مورد جديد"}
            </button>
          </div>
        </div>

        {/* Notification Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-700">
          <AlertTriangle size={16} />
          {isArabic ? "تنبيه: 3 فواتير بانتظار المراجعة" : "Alert: 3 invoices pending review"}
        </div>

        {/* Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {isArabic ? "إدارة الموردين" : "Suppliers Management"}
            </h1>
            <p className="text-sm text-slate-500">
              {isArabic ? "عرض وإدارة جميع الموردين في النظام" : "View and manage all suppliers in the system"}
            </p>
          </div>
        </div>

        {/* Analytical Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Donut Chart — spans 2 columns */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-800">
                {isArabic ? "توزيع المعاملات حسب الموردين" : "Transaction Distribution by Supplier"}
              </h3>
              <p className="text-xs text-slate-400">
                {isArabic ? "حجم المعاملات المالية لكل مورد" : "Transaction volume per supplier"}
              </p>
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="relative flex h-[220px] w-[220px] shrink-0 items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="#fff"
                      strokeWidth={3}
                      animationBegin={0}
                      animationDuration={900}
                      animationEasing="ease-out"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-800">₪</span>
                  <span className="text-[10px] font-semibold text-slate-400">ILS</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 self-center sm:self-start sm:pt-4">
                {donutData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: entry.color }} />
                    <span className="text-sm font-medium text-slate-600 min-w-[100px]">{entry.name}</span>
                    <strong className="text-sm font-extrabold text-slate-800">{entry.percent}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards Stack */}
          <div className="flex flex-col gap-3">
            <StatCard
              label={isArabic ? "إجمالي الموردين" : "Total Suppliers"}
              value={totalSuppliers}
              icon={Building2}
              color="#2563EB"
              bgColor="#EFF6FF"
              sparklineData={[4, 6, 8, 7, 10, 9, 12, 11, 13, 14]}
              sparklineColor="#2563EB"
            />
            <StatCard
              label={isArabic ? "الموردون النشطون" : "Active Suppliers"}
              value={activeCount}
              icon={UsersRound}
              color="#16A34A"
              bgColor="#F0FDF4"
              sparklineData={[5, 7, 6, 9, 8, 11, 10, 12, 13, 14]}
              sparklineColor="#16A34A"
            />
            <StatCard
              label={isArabic ? "الموردون تحت المراجعة" : "Under Review"}
              value={reviewCount}
              icon={ShieldCheck}
              color="#EA580C"
              bgColor="#FFF7ED"
              sparklineData={[2, 3, 2, 4, 3, 5, 4, 3, 6, 5]}
              sparklineColor="#EA580C"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          {/* Table Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-extrabold text-slate-800">
                {isArabic ? "قائمة الموردين كاملة" : "Complete Supplier List"}
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                {totalSuppliers}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder={isArabic ? "إبحث" : "Search"}
                  className="h-10 w-52 rounded-xl border border-slate-200 bg-white ps-9 pe-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen((p) => !p)}
                  className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition-colors ${
                    filterOpen
                      ? "border-blue-200 bg-blue-50 text-blue-600"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Filter size={16} />
                  {isArabic ? "تصفية" : "Filter"}
                  <ChevronDown size={14} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                </button>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                    <div
                      className={`absolute z-20 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-xl ${
                        isArabic ? "left-0" : "right-0"
                      }`}
                    >
                      <p className="mb-2 text-xs font-bold text-slate-500">
                        {isArabic ? "حالة الدفع" : "Payment Status"}
                      </p>
                      <div className="flex flex-col gap-1">
                        {["all", "paid", "overdue"].map((opt) => (
                          <button
                            key={opt}
                            className="rounded-lg px-3 py-1.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            onClick={() => setFilterOpen(false)}
                          >
                            {opt === "all"
                              ? isArabic ? "الكل" : "All"
                              : opt === "paid"
                              ? isArabic ? "مدفوع" : "Paid"
                              : isArabic ? "متأخر" : "Overdue"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {isArabic ? "المورد" : "Supplier"}
                  </th>
                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {isArabic ? "الكود" : "Code"}
                  </th>
                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {isArabic ? "التصنيف" : "Category"}
                  </th>
                  <th className="px-5 py-3.5 text-end text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {isArabic ? "الرصيد الحالي" : "Current Balance"}
                  </th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {isArabic ? "حالة الدفع" : "Payment Status"}
                  </th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    {isArabic ? "إجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => (
                  <tr
                    key={row.code}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-blue-600 uppercase">
                          {row.name.charAt(0)}
                        </div>
                        <strong className="text-sm font-bold text-slate-800">{row.name}</strong>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-500">
                      {row.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-end font-mono text-sm font-bold tabular-nums text-slate-800">
                      {formatCurrency(row.balance, "ILS")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold ${
                          row.paymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {row.paymentStatus === "paid"
                          ? isArabic ? "مدفوع" : "Paid"
                          : isArabic ? "متأخر" : "Overdue"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title={isArabic ? "عرض" : "View"}>
                          <Eye size={15} />
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title={isArabic ? "تعديل" : "Edit"}>
                          <Edit3 size={15} />
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-colors" title={isArabic ? "تقرير" : "Report"}>
                          <BarChart3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                      {isArabic ? "لا يوجد موردون متطابقون" : "No suppliers match your search"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
            <span className="text-xs font-semibold text-slate-500">
              {isArabic
                ? `${filtered.length} من إجمالي ${enrichedSuppliers.length} مورد`
                : `${filtered.length} of ${enrichedSuppliers.length} suppliers`}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className={isArabic ? "" : "rotate-180"} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    p === safePage
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className={isArabic ? "" : "rotate-180"} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
