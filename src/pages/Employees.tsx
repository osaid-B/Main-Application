import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { numericInputProps } from "../lib/inputUtils";
import { BaseModal } from "../components/ui/BaseModal";
import "./Employees.css";
import { useSettings } from "../context/SettingsContext";
import {
  Clock,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { TableActions } from "../components/ui/TableActions";
import { DeleteConfirmDialog } from "../components/ui/DeleteConfirmDialog";
import { useData } from "../context/DataContext";
import type {
  DailyAttendanceEntry,
  DailyAttendanceStatus,
  ContractType,
  Employee,
  EmployeeAdvance,
  EmployeeGender,
} from "../data/types";
import { formatCurrencyValue } from "../utils/displayFormatters";
import { PALESTINIAN_GOVERNORATES } from "../config/palestineConfig";

// ─── Types ───────────────────────────────────────────────────────────────────

type EmployeeForm = {
  name: string; phone: string; nationalId: string; birthDate: string;
  gender: EmployeeGender; city: string; jobTitle: string; departmentId: string;
  hireDate: string; contractType: ContractType; fixedSalary: string;
  workStart: string; workEnd: string; annualLeave: string;
  transportation: string; housing: string; notes: string;
};

type EmployeeFormErrors = {
  name?: string; phone?: string; nationalId?: string;
  jobTitle?: string; departmentId?: string; fixedSalary?: string;
};

type ToastState = { message: string; type: "success" | "error" | "warning" | "info" } | null;
type StatusFilter = DailyAttendanceStatus | "all";
type ModalState = { type: "add" | "edit" | "view" | null; employeeId?: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: EmployeeForm = {
  name: "", phone: "", nationalId: "", birthDate: "", gender: "male", city: "",
  jobTitle: "", departmentId: "", hireDate: new Date().toISOString().slice(0, 10),
  contractType: "full-time", fixedSalary: "0", workStart: "08:00", workEnd: "17:00",
  annualLeave: "14", transportation: "0", housing: "0", notes: "",
};

const AVATAR_THEMES = [
  { bg: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)", ring: "rgba(191,219,254,0.9)" },
  { bg: "linear-gradient(135deg, #4ADE80 0%, #059669 100%)", ring: "rgba(187,247,208,0.9)" },
  { bg: "linear-gradient(135deg, #FBBF24 0%, #F97316 100%)", ring: "rgba(253,230,138,0.9)" },
  { bg: "linear-gradient(135deg, #C084FC 0%, #7C3AED 100%)", ring: "rgba(233,213,255,0.9)" },
  { bg: "linear-gradient(135deg, #FB7185 0%, #DB2777 100%)", ring: "rgba(254,205,211,0.9)" },
];

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  present:      { bg: "#dcfce7", color: "#15803d", label: "حاضر" },
  late:         { bg: "#fef3c7", color: "#b45309", label: "متأخر" },
  absent:       { bg: "#fee2e2", color: "#b91c1c", label: "غائب" },
  leave:        { bg: "#dbeafe", color: "#1d4ed8", label: "إجازة" },
  leave_pending:{ bg: "#fef9c3", color: "#a16207", label: "قيد الإجازة" },
  "half-day":   { bg: "#f3e8ff", color: "#6d28d9", label: "نصف يوم" },
};

const MINI_BAR_WEIGHTS = [0.55, 0.70, 0.60, 0.85, 0.72, 0.90, 1.0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const getAvatarTheme = (name: string) => AVATAR_THEMES[(name[0]?.charCodeAt(0) ?? 0) % 5];
const getEmpInitials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

function getDailyAttendanceEntries(emp: Employee): DailyAttendanceEntry[] {
  return Array.isArray(emp.dailyAttendance) ? emp.dailyAttendance : [];
}
function getDailyAttendanceEntryByDate(emp: Employee, date: string) {
  return getDailyAttendanceEntries(emp).find((e) => e.date === date);
}
function getEmployeeAdvances(emp: Employee): EmployeeAdvance[] {
  return Array.isArray(emp.advances) ? emp.advances : [];
}
function getUnpaidAdvancesTotal(emp: Employee): number {
  return getEmployeeAdvances(emp).reduce((s, a) => s + Number(a.amount || 0), 0);
}
function getLeaveBalance(emp: Employee): number {
  const used = getDailyAttendanceEntries(emp).filter((e) => e.status === "leave").length;
  return Math.max(0, 14 - used);
}
function getDailyWage(emp: Employee): number { return (emp.fixedSalary ?? 0) / 22; }
function getTodayStatus(emp: Employee): DailyAttendanceStatus | "none" {
  return getDailyAttendanceEntryByDate(emp, getTodayDate())?.status || "none";
}

const DEPT_COLORS = [
  { bg: "#E0F2FE", text: "#0369A1" }, { bg: "#FCE7F3", text: "#BE185D" },
  { bg: "#D1FAE5", text: "#047857" }, { bg: "#FEF3C7", text: "#B45309" },
  { bg: "#EDE9FE", text: "#6D28D9" }, { bg: "#FEE2E2", text: "#B91C1C" },
  { bg: "#DBEAFE", text: "#1D4ED8" }, { bg: "#F5F5F4", text: "#44403C" },
];
// ─── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [reduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [display, setDisplay] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) return;
    let start: number | null = null;
    function tick(now: number) {
      if (!start) start = now;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, reduced]);
  return display;
}

// ─── EmployeeModal (portal wrapper) ──────────────────────────────────────────

function EmployeeModal({
  isOpen, onClose, title, children, footer, width = "600px",
}: {
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "white", borderRadius: 20,
          width, maxWidth: "92vw", maxHeight: "88vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
          animation: "empModalIn 220ms cubic-bezier(0.16,1,0.3,1) forwards",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0, direction: "rtl",
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", fontSize: 18,
              color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
          >✕</button>
        </div>
        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }} dir="rtl">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div style={{
            padding: "16px 24px", borderTop: "1px solid #F1F5F9",
            flexShrink: 0, direction: "rtl",
          }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes empModalIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

// ─── StatCards ────────────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: { total: number; present: number; late: number; absent: number } }) {
  const totalDisplay   = useCountUp(stats.total);
  const presentDisplay = useCountUp(stats.present);
  const lateDisplay    = useCountUp(stats.late);
  const absentDisplay  = useCountUp(stats.absent);
  const safeTotal = stats.total || 1;

  return (
    <div className="emp-stat-grid">
      <div className="emp-stat-card emp-stat-card--ring" style={{ animationDelay: "240ms" }}>
        <div className="emp-stat-body">
          <span className="emp-stat-label">غائب</span>
          <strong className="emp-stat-value" style={{ color: "#DC2626" }}>{absentDisplay.toLocaleString()}</strong>
          <span className="emp-stat-sublabel">من {stats.total} موظف</span>
        </div>
        <svg viewBox="0 0 120 120" width="90" height="90" style={{ flexShrink: 0 }}>
          <circle cx="60" cy="60" r="45" fill="none" stroke="#FEE2E2" strokeWidth="12" />
          <circle cx="60" cy="60" r="45" fill="none" stroke="#DC2626" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(stats.absent / safeTotal) * 283} 283`} transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dasharray 800ms ease-out" }} />
          <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#DC2626">{stats.absent}</text>
        </svg>
      </div>

      <div className="emp-stat-card emp-stat-card--hex" style={{ animationDelay: "160ms" }}>
        <div className="emp-stat-body">
          <span className="emp-stat-label">متأخر</span>
          <strong className="emp-stat-value" style={{ color: "#D97706" }}>{lateDisplay.toLocaleString()}</strong>
          <span className="emp-stat-sublabel">هذا اليوم</span>
        </div>
        <div className="emp-hex-icon"><Clock size={18} color="#fff" /></div>
      </div>

      <div className="emp-stat-card emp-stat-card--ring" style={{ animationDelay: "80ms" }}>
        <div className="emp-stat-body">
          <span className="emp-stat-label">حاضر اليوم</span>
          <strong className="emp-stat-value" style={{ color: "#16A34A" }}>{presentDisplay.toLocaleString()}</strong>
          <span className="emp-stat-sublabel">من {stats.total} موظف</span>
        </div>
        <svg viewBox="0 0 120 120" width="90" height="90" style={{ flexShrink: 0 }}>
          <circle cx="60" cy="60" r="45" fill="none" stroke="#DCFCE7" strokeWidth="12" />
          <circle cx="60" cy="60" r="45" fill="none" stroke="#16A34A" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(stats.present / safeTotal) * 283} 283`} transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dasharray 800ms ease-out" }} />
          <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="#16A34A">{stats.present}</text>
        </svg>
      </div>

      <div className="emp-stat-card emp-stat-card--total" style={{ animationDelay: "0ms" }}>
        <div className="emp-stat-card-top">
          <div className="emp-stat-icon" style={{ background: "#EFF6FF" }}><Users size={18} color="#2563EB" /></div>
          <span className="emp-stat-label">إجمالي الموظفين</span>
        </div>
        <strong className="emp-stat-value" style={{ color: "#2563EB" }}>{totalDisplay.toLocaleString()}</strong>
        <div className="emp-stat-chart">
          <svg width="100%" height="28" viewBox="0 0 91 28" preserveAspectRatio="none">
            {MINI_BAR_WEIGHTS.map((w, i) => {
              const barH = Math.max(4, Math.round(w * 26));
              return <rect key={i} x={i * 13} y={28 - barH} width="9" height={barH} rx="2.5" fill={i === 6 ? "#2563EB" : "#BFDBFE"} />;
            })}
          </svg>
          </div>
        </div>
      </div>
  );
}

// ─── EmployeeFormModal ────────────────────────────────────────────────────────

function EmployeeFormModal({
  isOpen, title, values, errors, onChange, onClose, onSubmit, onSaveDraft, submitLabel,
}: {
  isOpen: boolean; title: string; values: EmployeeForm; errors: EmployeeFormErrors;
  onChange: (field: keyof EmployeeForm, value: string) => void;
  onClose: () => void; onSubmit: () => void; onSaveDraft?: () => void; submitLabel: string;
}) {
  const { isArabic } = useSettings();
  const { departments } = useData();

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, direction: "rtl" }}>
      <Button variant="primary" size="md" type="button" onClick={onSubmit}>{submitLabel}</Button>
      <Button variant="secondary" size="md" type="button" onClick={onSaveDraft ?? onClose}>حفظ كمسودة</Button>
      <Button variant="secondary" size="md" type="button" onClick={onClose}>إلغاء</Button>
    </div>
  );

  return (
    <EmployeeModal isOpen={isOpen} onClose={onClose} title={title} width="560px" footer={footer}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 className="emp-form-section-title">البيانات الشخصية</h3>
        <div className="emp-form-grid">
          <div className="emp-form-field">
            <label className="emp-form-label">الاسم الكامل <span className="emp-req">*</span></label>
            <input className="emp-form-input" type="text" value={values.name} onChange={(e) => onChange("name", e.target.value)} placeholder="اسم الموظف" />
            {errors.name && <p className="emp-form-error">{errors.name}</p>}
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">رقم الهاتف</label>
            <input
              className="emp-form-input"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) return;
                const allowed = ["Backspace","Delete","Tab","Enter","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"];
                if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
                onChange("phone", (values.phone + pasted).slice(0, 10));
              }}
              placeholder="059XXXXXXX"
              style={{ direction: "ltr", textAlign: "left", fontFamily: "monospace" }}
            />
            {errors.phone && <p className="emp-form-error">{errors.phone}</p>}
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">رقم الهوية</label>
            <input className="emp-form-input" type="text" value={values.nationalId} onChange={(e) => onChange("nationalId", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="9 أرقام" />
            {errors.nationalId && <p className="emp-form-error">{errors.nationalId}</p>}
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">تاريخ الميلاد</label>
            <input className="emp-form-input" type="date" value={values.birthDate} onChange={(e) => onChange("birthDate", e.target.value)} />
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">الجنس</label>
            <div className="emp-form-radio-group">
              <label className="emp-form-radio"><input type="radio" name="gender" value="male" checked={values.gender === "male"} onChange={() => onChange("gender", "male")} /> ذكر</label>
              <label className="emp-form-radio"><input type="radio" name="gender" value="female" checked={values.gender === "female"} onChange={() => onChange("gender", "female")} /> أنثى</label>
            </div>
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">المدينة / المحافظة</label>
            <select className="emp-form-input" value={values.city} onChange={(e) => onChange("city", e.target.value)}>
              <option value="">اختر المدينة</option>
              {PALESTINIAN_GOVERNORATES.map((g) => <option key={g.nameAr} value={g.nameAr}>{g.nameAr}</option>)}
            </select>
          </div>
        </div>

        <h3 className="emp-form-section-title">بيانات التوظيف</h3>
        <div className="emp-form-grid">
          <div className="emp-form-field">
            <label className="emp-form-label">المسمى الوظيفي <span className="emp-req">*</span></label>
            <input className="emp-form-input" type="text" value={values.jobTitle} onChange={(e) => onChange("jobTitle", e.target.value)} placeholder="مثال: محاسب" />
            {errors.jobTitle && <p className="emp-form-error">{errors.jobTitle}</p>}
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">القسم <span className="emp-req">*</span></label>
            <select className="emp-form-input" value={values.departmentId} onChange={(e) => onChange("departmentId", e.target.value)}>
              <option value="">اختر القسم</option>
              {departments.filter((d) => d.status === "active").map((d) => (
                <option key={d.id} value={d.id}>{isArabic ? d.nameAr || d.name : d.name}</option>
              ))}
            </select>
            {errors.departmentId && <p className="emp-form-error">{errors.departmentId}</p>}
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">تاريخ التوظيف <span className="emp-req">*</span></label>
            <input className="emp-form-input" type="date" value={values.hireDate} onChange={(e) => onChange("hireDate", e.target.value)} />
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">نوع العقد</label>
            <div className="emp-form-radio-group">
              <label className="emp-form-radio"><input type="radio" name="contractType" value="full-time" checked={values.contractType === "full-time"} onChange={() => onChange("contractType", "full-time")} /> دوام كامل</label>
              <label className="emp-form-radio"><input type="radio" name="contractType" value="part-time" checked={values.contractType === "part-time"} onChange={() => onChange("contractType", "part-time")} /> جزئي</label>
              <label className="emp-form-radio"><input type="radio" name="contractType" value="temporary" checked={values.contractType === "temporary"} onChange={() => onChange("contractType", "temporary")} /> مؤقت</label>
            </div>
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">الراتب الشهري (₪) <span className="emp-req">*</span></label>
            <input className="emp-form-input" type="text" {...numericInputProps} value={values.fixedSalary} onChange={(e) => onChange("fixedSalary", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" />
            {errors.fixedSalary && <p className="emp-form-error">{errors.fixedSalary}</p>}
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">وقت الدوام</label>
            <div className="emp-form-time-range">
              <label className="emp-form-label-sm">من</label>
              <input className="emp-form-input" type="time" value={values.workStart} onChange={(e) => onChange("workStart", e.target.value)} />
              <label className="emp-form-label-sm">إلى</label>
              <input className="emp-form-input" type="time" value={values.workEnd} onChange={(e) => onChange("workEnd", e.target.value)} />
            </div>
          </div>
        </div>

        <h3 className="emp-form-section-title">الاستحقاقات والمزايا</h3>
        <div className="emp-form-grid">
          <div className="emp-form-field">
            <label className="emp-form-label">رصيد الإجازة السنوية (أيام)</label>
            <input className="emp-form-input" type="number" min="0" value={values.annualLeave} onChange={(e) => onChange("annualLeave", e.target.value)} />
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">السلف المسموح بها</label>
            <input className="emp-form-input" type="text" value={`₪ ${Number(values.fixedSalary || 0).toFixed(2)}`} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">بدل المواصلات (₪)</label>
            <input className="emp-form-input" type="text" {...numericInputProps} value={values.transportation} onChange={(e) => onChange("transportation", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
          </div>
          <div className="emp-form-field">
            <label className="emp-form-label">بدل السكن (₪)</label>
            <input className="emp-form-input" type="text" {...numericInputProps} value={values.housing} onChange={(e) => onChange("housing", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
          </div>
        </div>
        <div className="emp-form-field" style={{ marginTop: 8 }}>
          <label className="emp-form-checkbox">
            <input type="checkbox" defaultChecked /> تطبيق العطل الرسمية الفلسطينية
          </label>
        </div>
      </form>
    </EmployeeModal>
  );
}

// ─── EmployeeViewModal ────────────────────────────────────────────────────────

function EmployeeViewModal({
  isOpen, emp, onClose, onEdit, isArabic: arabicMode,
}: {
  isOpen: boolean; emp: Employee | null; onClose: () => void;
  onEdit: () => void; isArabic: boolean;
}) {
  const { departments } = useData();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["البيانات الشخصية", "بيانات التوظيف", "الاستحقاقات"];

  if (!emp) return null;

  const dept = departments.find((d) => d.id === emp.departmentId);
  const theme = getAvatarTheme(emp.name);
  const unpaidAdvances = getUnpaidAdvancesTotal(emp);
  const leaveBalance = getLeaveBalance(emp);
  const dailyWage = getDailyWage(emp);
  const todayStatus = getTodayStatus(emp);
  const statusConf = todayStatus !== "none" ? STATUS_CONFIG[todayStatus] : null;
  const contractLabels: Record<string, string> = {
    "full-time": "دوام كامل", "part-time": "دوام جزئي",
    "daily": "يومي", "temporary": "مؤقت",
  };
  const genderLabel = emp.gender === "female" ? "أنثى" : "ذكر";

  const footer = (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={onEdit}
        style={{
          padding: "8px 18px", borderRadius: 9, border: "none",
          background: "#2563EB", color: "#fff", fontFamily: "inherit",
          fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          transition: "background 150ms ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#1D4ED8"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#2563EB"; }}
      >
        ✏ تعديل
      </button>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: "8px 16px", borderRadius: 9, border: "none",
          background: "transparent", color: "#64748B", fontFamily: "inherit",
          fontSize: 13.5, fontWeight: 500, cursor: "pointer",
          transition: "color 150ms ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#0F172A"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
      >
        إغلاق
      </button>
    </div>
  );

  return (
    <EmployeeModal isOpen={isOpen} onClose={onClose} title="ملف الموظف" width="580px" footer={footer}>
      {/* Employee header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #F1F5F9" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: theme.bg,
          boxShadow: `0 0 0 3px #fff, 0 0 0 5px ${theme.ring}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0,
        }}>
          {getEmpInitials(emp.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#0F172A" }}>{emp.name}</h3>
          <code style={{ fontSize: 13, color: "#94A3B8", display: "block", marginBottom: 6 }}>{emp.id}</code>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {statusConf && (
              <span style={{ background: statusConf.bg, color: statusConf.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                {statusConf.label}
              </span>
            )}
            {dept && (
              <span style={{ background: "#F1F5F9", color: "#475569", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                {arabicMode ? (dept.nameAr || dept.name) : dept.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="emp-view-tabs">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`emp-view-tab ${activeTab === i ? "active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1 — البيانات الشخصية */}
      {activeTab === 0 && (
        <div className="emp-view-grid">
          {[
            ["الاسم الكامل", emp.name],
            ["رقم الهوية", emp.nationalId || "—"],
            ["تاريخ الميلاد", "—"],
            ["رقم الهاتف", emp.phone || "—"],
            ["الجنس", genderLabel],
            ["المدينة / المحافظة", emp.city || "—"],
          ].map(([k, v]) => (
            <div key={k} className="emp-view-kv">
              <span className="emp-view-key">{k}</span>
              <span className="emp-view-val">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2 — بيانات التوظيف */}
      {activeTab === 1 && (
        <div className="emp-view-grid">
          {[
            ["المسمى الوظيفي", emp.jobTitle || "—"],
            ["القسم", dept ? (arabicMode ? dept.nameAr || dept.name : dept.name) : "—"],
            ["تاريخ التوظيف", emp.hireDate || "—"],
            ["نوع العقد", contractLabels[emp.contractType ?? ""] || "—"],
            ["الأجر الشهري", `₪ ${(emp.fixedSalary ?? 0).toLocaleString()}`],
            ["الأجر اليومي (÷22)", `₪ ${dailyWage.toFixed(2)}`],
            ["وقت الدوام", `${emp.workStart} – ${emp.workEnd}`],
          ].map(([k, v]) => (
            <div key={k} className="emp-view-kv">
              <span className="emp-view-key">{k}</span>
              <span className="emp-view-val">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3 — الاستحقاقات */}
      {activeTab === 2 && (
        <div className="emp-view-grid">
          <div className="emp-view-kv">
            <span className="emp-view-key">رصيد الإجازة السنوية</span>
            <span className="emp-view-val">{leaveBalance} يوم</span>
          </div>
          <div className="emp-view-kv">
            <span className="emp-view-key">السلف المتبقية</span>
            <span className="emp-view-val" style={{ color: unpaidAdvances > 0 ? "#DC2626" : "#16A34A", fontWeight: 700 }}>
              {unpaidAdvances > 0 ? `₪ ${unpaidAdvances.toLocaleString()}` : "لا يوجد"}
            </span>
          </div>
          <div className="emp-view-kv">
            <span className="emp-view-key">بدل مواصلات</span>
            <span className="emp-view-val">—</span>
          </div>
          <div className="emp-view-kv">
            <span className="emp-view-key">بدل سكن</span>
            <span className="emp-view-val">—</span>
          </div>
        </div>
      )}
    </EmployeeModal>
  );
}

// ─── Employee Advance Modal ───────────────────────────────────────────────────

function EmployeeAdvanceModal({
  employee,
  isOpen,
  onClose,
  onSave,
}: {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: Employee, amount: number, month: string, reason: string) => void;
}) {
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [amount, setAmount] = useState("");
  const [month, setMonth]   = useState(defaultMonth);
  const [reason, setReason] = useState("");
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setAmount(""); setMonth(defaultMonth); setReason(""); setError(null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const salary    = employee?.fixedSalary ?? 0;
  const maxAmount = salary * 0.5;
  const amountNum = parseFloat(amount) || 0;
  const isValid   = amountNum > 0 && amountNum <= maxAmount;

  const monthLabel = (() => {
    const [y, m] = month.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("ar-SA", { month: "long", year: "numeric" });
  })();

  const handleSubmit = () => {
    if (!employee) return;
    if (amountNum <= 0) { setError("أدخل مبلغاً صحيحاً"); return; }
    if (amountNum > maxAmount) { setError(`الحد الأقصى للسلفة هو ₪${maxAmount.toLocaleString()} (50% من الراتب)`); return; }
    onSave(employee, amountNum, month, reason);
    onClose();
  };

  const footer = (
    <div style={{ display: "flex", gap: 8, direction: "rtl" }}>
      <button
        type="button"
        onClick={handleSubmit}
        style={{
          flex: 1, height: 40, border: "none", borderRadius: 10,
          backgroundColor: isValid ? "#2563EB" : "#CBD5E1",
          color: "white", fontSize: 14, fontWeight: 600,
          cursor: isValid ? "pointer" : "not-allowed",
          transition: "background-color 150ms",
        }}
        onMouseEnter={(e) => { if (isValid) e.currentTarget.style.backgroundColor = "#1D4ED8"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isValid ? "#2563EB" : "#CBD5E1"; }}
      >
        تسجيل السلفة
      </button>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: "0 20px", height: 40,
          border: "1px solid #E2E8F0", backgroundColor: "white", color: "#64748B",
          borderRadius: 10, fontSize: 14, cursor: "pointer", transition: "all 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
      >
        إلغاء
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen && employee !== null}
      onClose={onClose}
      title="سلفة موظف"
      subtitle={employee?.name}
      width={440}
      footer={footer}
    >
      {/* Salary info card */}
      <div style={{
        backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0",
        borderRadius: 10, padding: "12px 14px", marginBottom: 16,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>الراتب الشهري</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>₪ {salary.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>الحد الأقصى للسلفة (50%)</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#D97706" }}>₪ {maxAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Form fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Amount */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            مبلغ السلفة (₪) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, "")); setError(null); }}
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey) return;
              const allowed = ["Backspace","Delete","Tab","Enter","Escape","ArrowLeft","ArrowRight","Home","End","."];
              if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
            }}
            placeholder="0.00"
            style={{
              width: "100%", height: 44, boxSizing: "border-box",
              border: `1.5px solid ${!amount ? "#E2E8F0" : isValid ? "#BBF7D0" : "#FECACA"}`,
              borderRadius: 10, padding: "0 14px",
              fontSize: 18, fontWeight: 700, color: "#0F172A",
              backgroundColor: !amount ? "white" : isValid ? "#F0FDF4" : "#FEF2F2",
              outline: "none", direction: "ltr", textAlign: "left",
              fontVariantNumeric: "tabular-nums", transition: "all 150ms",
            } as React.CSSProperties}
          />
          {/* Progress bar */}
          {amountNum > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, borderRadius: 99, backgroundColor: "#F1F5F9", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  backgroundColor: amountNum > maxAmount ? "#DC2626" : amountNum > maxAmount * 0.75 ? "#D97706" : "#16A34A",
                  width: `${Math.min((amountNum / (maxAmount || 1)) * 100, 100)}%`,
                  transition: "width 300ms ease, background-color 300ms ease",
                }} />
              </div>
              <p style={{ fontSize: 11, margin: "3px 0 0", color: amountNum > maxAmount ? "#DC2626" : "#64748B", textAlign: "left" }}>
                {amountNum > maxAmount
                  ? `⚠ يتجاوز الحد بـ ₪${(amountNum - maxAmount).toLocaleString()}`
                  : `${((amountNum / (salary || 1)) * 100).toFixed(0)}% من الراتب`}
              </p>
            </div>
          )}
          {error && (
            <div style={{ marginTop: 6, padding: "8px 12px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}
        </div>

        {/* Month */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            شهر الخصم
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              width: "100%", height: 40, boxSizing: "border-box",
              border: "1px solid #E2E8F0", borderRadius: 10, padding: "0 14px",
              fontSize: 14, color: "#0F172A", backgroundColor: "white",
              outline: "none", cursor: "pointer", transition: "border-color 150ms",
            } as React.CSSProperties}
          />
          <p style={{ fontSize: 11, color: "#94A3B8", margin: "4px 0 0" }}>سيتم خصم السلفة من راتب هذا الشهر</p>
        </div>

        {/* Reason */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            السبب <span style={{ color: "#94A3B8", fontWeight: 400 }}>(اختياري)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سبب طلب السلفة..."
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "#0F172A", resize: "vertical",
              outline: "none", direction: "rtl", lineHeight: 1.6,
              transition: "border-color 150ms", fontFamily: "inherit",
            } as React.CSSProperties}
          />
        </div>

        {/* Deduction notice */}
        {isValid && (
          <div style={{
            backgroundColor: "#FEF3C7", border: "1px solid #FDE68A",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 13, color: "#92400E", lineHeight: 1.6,
          }}>
            <strong>تنبيه:</strong> سيتم خصم <strong>₪ {amountNum.toLocaleString()}</strong> تلقائياً من راتب <strong>{monthLabel}</strong>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Employees() {
  const { t, isArabic } = useSettings();
  const { employees, departments, addEmployee, updateEmployee, deleteEmployee: deleteEmployeeCtx } = useData();

  // ── Core state ────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput]     = useState("");
  const [searchTerm, setSearchTerm]       = useState("");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showDeptMenu, setShowDeptMenu]    = useState(false);

  const [modalState, setModalState]       = useState<ModalState>({ type: null });
  const [form, setForm]                   = useState<EmployeeForm>(EMPTY_FORM);
  const [formErrors, setFormErrors]       = useState<EmployeeFormErrors>({});
  const [toast, setToast]                 = useState<ToastState>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ itemName: string; onConfirm: () => void } | null>(null);
  const [advanceModalEmployee, setAdvanceModalEmployee] = useState<Employee | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const deptMenuRef = useRef<HTMLDivElement>(null);

  // ── Derived state ─────────────────────────────────────────────────────────
  const today = getTodayDate();
  const editingEmployee = modalState.type === "edit" && modalState.employeeId
    ? employees.find((e) => e.id === modalState.employeeId) ?? null
    : null;
  const viewingEmployee = modalState.type === "view" && modalState.employeeId
    ? employees.find((e) => e.id === modalState.employeeId) ?? null
    : null;

  const activeEmployees = useMemo(() => employees.filter((e) => !e.isDeleted), [employees]);

  const stats = useMemo(() => {
    let present = 0, late = 0, absent = 0;
    activeEmployees.forEach((emp) => {
      const s = getDailyAttendanceEntryByDate(emp, today)?.status;
      if (s === "present") present++;
      else if (s === "late") late++;
      else if (s === "absent") absent++;
    });
    return { total: activeEmployees.length, present, late, absent };
  }, [activeEmployees, today]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ── Close dept menu on outside click ─────────
  useEffect(() => {
    if (!showDeptMenu) return;
    const handler = (e: MouseEvent) => {
      if (deptMenuRef.current && !deptMenuRef.current.contains(e.target as Node)) {
        setShowDeptMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDeptMenu]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchTerm(value), 150);
  };

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return activeEmployees.filter((emp) => {
      if (query) {
        const dept = departments.find((d) => d.id === emp.departmentId);
        const statusLabel = STATUS_CONFIG[getTodayStatus(emp)]?.label || "";
        const haystack = [emp.name, emp.id, emp.jobTitle || "", dept?.name || "", dept?.nameAr || "", emp.phone, statusLabel].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (departmentFilter !== "all" && emp.departmentId !== departmentFilter) return false;
      if (statusFilter !== "all") {
        if (getTodayStatus(emp) !== statusFilter) return false;
      }
      return true;
    });
  }, [activeEmployees, searchTerm, departmentFilter, statusFilter, departments]);

  const handleSaveAdvance = (emp: Employee, amount: number, month: string, reason: string) => {
    const newAdvance: EmployeeAdvance = {
      id: `adv-${Date.now()}`,
      amount,
      date: `${month}-01`,
      notes: reason || undefined,
    };
    updateEmployee({ ...emp, advances: [...(emp.advances ?? []), newAdvance] });
    setToast({ type: "success", message: `تم تسجيل سلفة ₪${amount.toLocaleString()} لـ ${emp.name}` });
  };

  const resetFormState = () => {
    setModalState({ type: null });
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const openEdit = (emp: Employee) => {
    setForm({
      name: emp.name, phone: emp.phone, nationalId: emp.nationalId ?? "",
      birthDate: "", gender: emp.gender ?? "male", city: emp.city ?? "",
      jobTitle: emp.jobTitle ?? "", departmentId: emp.departmentId ?? "",
      hireDate: emp.hireDate ?? today, contractType: emp.contractType ?? "full-time",
      fixedSalary: String(emp.fixedSalary ?? 0), workStart: emp.workStart,
      workEnd: emp.workEnd, annualLeave: "14", transportation: "0", housing: "0",
      notes: emp.notes ?? "",
    });
    setFormErrors({});
    setModalState({ type: "edit", employeeId: emp.id });
  };

  const openView = (emp: Employee) => setModalState({ type: "view", employeeId: emp.id });

  const setField = (field: keyof EmployeeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const errs: EmployeeFormErrors = {};
    if (!form.name.trim())     errs.name = "الاسم مطلوب";
    if (!form.jobTitle.trim()) errs.jobTitle = "المسمى الوظيفي مطلوب";
    if (!form.departmentId)    errs.departmentId = "القسم مطلوب";
    if (!form.fixedSalary || Number(form.fixedSalary) < 0) errs.fixedSalary = "أدخل راتباً صحيحاً";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveEmployee = () => {
    if (!validateForm()) return;
    if (editingEmployee) {
      updateEmployee({
        ...editingEmployee,
        name: form.name.trim(), phone: form.phone.trim(),
        nationalId: form.nationalId.trim() || undefined,
        gender: form.gender, city: form.city || undefined,
        jobTitle: form.jobTitle.trim(), departmentId: form.departmentId || undefined,
        hireDate: form.hireDate || undefined, contractType: form.contractType,
        fixedSalary: Number(form.fixedSalary), workStart: form.workStart, workEnd: form.workEnd,
        notes: form.notes.trim() || undefined,
      });
      resetFormState();
      setToast({ type: "success", message: t.employees.toast.updated });
      return;
    }
    const newEmployee: Employee = {
      id: `EMP-${1000 + employees.length + 1}`,
      name: form.name.trim(), phone: form.phone.trim(),
      workStart: form.workStart, workEnd: form.workEnd,
      salaryType: "fixed", fixedSalary: Number(form.fixedSalary),
      advance: 0, advances: [], notes: form.notes.trim() || undefined,
      departmentId: form.departmentId || undefined, attendanceRecords: [], dailyAttendance: [],
      isDeleted: false, nationalId: form.nationalId.trim() || undefined,
      gender: form.gender, city: form.city || undefined,
      jobTitle: form.jobTitle.trim(), hireDate: form.hireDate || undefined,
      contractType: form.contractType,
    };
    addEmployee(newEmployee);
    resetFormState();
    setToast({ type: "success", message: t.employees.toast.created });
  };

  const handleSaveDraft = () => {
    if (!form.name.trim()) {
      setFormErrors({ name: "الاسم مطلوب للحفظ كمسودة" });
      return;
    }
    const draftId = editingEmployee?.id ?? `EMP-${1000 + employees.length + 1}`;
    const draft: Employee = {
      id: draftId,
      name: form.name.trim(), phone: form.phone.trim(),
      workStart: form.workStart, workEnd: form.workEnd,
      salaryType: "fixed", fixedSalary: form.fixedSalary ? Number(form.fixedSalary) : undefined,
      advance: 0, advances: [], notes: form.notes.trim() || undefined,
      departmentId: form.departmentId || undefined, attendanceRecords: [], dailyAttendance: [],
      isDeleted: false, nationalId: form.nationalId.trim() || undefined,
      gender: form.gender, city: form.city || undefined,
      jobTitle: form.jobTitle.trim() || undefined, hireDate: form.hireDate || undefined,
      contractType: form.contractType,
    };
    if (editingEmployee) {
      updateEmployee(draft);
    } else {
      addEmployee(draft);
    }
    resetFormState();
    setToast({ type: "success", message: editingEmployee ? t.employees.toast.updated : t.employees.toast.created });
  };

  // ── Dept pills ────────────────────────────────────────────────────────────
  const DEPT_PILLS = useMemo(() => [
    { id: "all", label: "كل الأقسام" },
    ...departments.filter((d) => d.status === "active").map((d) => ({
      id: d.id, label: isArabic ? (d.nameAr || d.name) : d.name,
    })),
  ], [departments, isArabic]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="emp-page">
        {/* Top Bar */}
        <div className="emp-topbar">
          <div className="emp-topbar-left">
            <h1 className="emp-page-title">الموظفون</h1>
            <p className="emp-page-subtitle">سجلات الموظفين وشؤون الموارد البشرية</p>
          </div>
          <div className="emp-topbar-right">
            <button type="button" className="emp-add-btn" onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setModalState({ type: "add" }); }}>
              <Plus size={16} /> إضافة موظف
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <StatCards stats={stats} />

        {/* ─── Employee Table ──────────────────────────────────────────────── */}
        <div className="emp-search-wrap">
              <Search size={18} color="#94A3B8" />
              <input
                className="emp-search-input" type="text"
                placeholder="ابحث بالاسم أو الكود أو القسم أو المسمى الوظيفي..."
                value={searchInput} onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchInput && (
                <button type="button" className="emp-search-clear" onClick={() => { setSearchInput(""); setSearchTerm(""); }}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="emp-dept-dropdown" ref={deptMenuRef}>
              <button type="button" className="emp-dept-trigger" onClick={() => setShowDeptMenu((p) => !p)}>
                {DEPT_PILLS.find((p) => p.id === departmentFilter)?.label ?? "كل الأقسام"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {showDeptMenu && (
                <div className="emp-dept-menu">
                  {DEPT_PILLS.map((pill) => (
                    <button key={pill.id} type="button"
                      className={`emp-dept-item ${departmentFilter === pill.id ? "active" : ""}`}
                      onClick={() => { setDepartmentFilter(pill.id); setShowDeptMenu(false); }}>
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="emp-table-card">
              <div className="emp-table-header">
                <span className="emp-table-count">
                  عرض جميع الموظفين — <strong>{filteredEmployees.length}</strong> موظف
                </span>
                <div className="emp-status-chips">
                  {([
                    { value: "all", label: "الكل" }, { value: "present", label: "حاضر" },
                    { value: "late", label: "متأخر" }, { value: "absent", label: "غائب" },
                    { value: "leave", label: "إجازة" },
                  ] as const).map((s) => (
                    <button key={s.value} type="button"
                      className={`emp-status-chip ${statusFilter === s.value ? "active" : ""}`}
                      onClick={() => setStatusFilter(s.value)}>
                      <span className="emp-chip-dot" style={{
                        background: s.value === "all" ? "#94A3B8" : s.value === "present" ? "#16A34A" : s.value === "late" ? "#D97706" : s.value === "absent" ? "#DC2626" : "#2563EB"
                      }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {filteredEmployees.length > 0 ? (
                <div className="emp-table-wrap">
                  <table className="emp-table atlas-table">
                    <colgroup>
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="col-entity" style={{ textAlign: "right" }}>الاسم الكامل</th>
                        <th className="col-flex">ساعات الدوام</th>
                        <th className="col-code">رقم الهاتف</th>
                        <th className="col-badge">القسم</th>
                        <th className="col-currency">الراتب</th>
                        <th className="col-num">الإجازات</th>
                        <th className="col-currency">السلف</th>
                        <th className="col-actions">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((emp) => {
                        const unpaidAdv    = getUnpaidAdvancesTotal(emp);
                        const leaveBalance = getLeaveBalance(emp);
                        const dept         = departments.find((d) => d.id === emp.departmentId);
                        const deptColor    = dept ? DEPT_COLORS[parseInt(dept.id.replace(/\D/g, "") || "0", 10) % DEPT_COLORS.length] : null;
                        const theme        = getAvatarTheme(emp.name);
                        return (
                          <tr key={emp.id}>
                            <td>
                              <div className="emp-row-user">
                                <div className="emp-row-avatar"
                                  style={{ background: theme.bg, boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${theme.ring}` }}>
                                  {getEmpInitials(emp.name)}
                                </div>
                                <div>
                                  <strong>{emp.name}</strong>
                                  <span className="emp-row-code">{emp.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="emp-cell-text" style={{ fontVariantNumeric: "tabular-nums", direction: "ltr" }}>
                              {emp.workStart} – {emp.workEnd}
                            </td>
                            <td className="emp-cell-text" style={{ direction: "ltr", fontVariantNumeric: "tabular-nums" }}>
                              {emp.phone || <span style={{ color: "#CBD5E1" }}>—</span>}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {dept ? (
                                <button type="button" className="emp-dept-pill-inline emp-row-dept-badge--clickable"
                                  style={{ background: deptColor?.bg || "#F1F5F9", color: deptColor?.text || "#475569" }}
                                  onClick={() => setDepartmentFilter(dept.id)}>
                                  {isArabic ? (dept.nameAr || dept.name) : dept.name}
                                </button>
                              ) : (
                                <span style={{ color: "#CBD5E1", fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <strong className="emp-salary-amount">{formatCurrencyValue(emp.fixedSalary ?? 0, "ILS")}</strong>
                            </td>
                            <td className={`emp-cell-num ${leaveBalance < 5 ? "emp-leave-warn" : "emp-leave-ok"}`}>
                              {leaveBalance} يوم
                            </td>
                            <td className="emp-cell-num">
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                <span style={{ color: unpaidAdv > 0 ? "#DC2626" : "#16A34A" }}>
                                  {unpaidAdv > 0 ? formatCurrencyValue(unpaidAdv, "ILS") : "لا يوجد"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setAdvanceModalEmployee(emp)}
                                  title="إضافة سلفة"
                                  style={{
                                    background: "var(--app-surface-2)", border: "1px solid var(--app-border)",
                                    borderRadius: "var(--app-radius-sm)", cursor: "pointer",
                                    padding: "2px 7px", fontSize: 11, fontWeight: 700,
                                    color: "var(--app-text-secondary)", lineHeight: 1.4,
                                  }}
                                >
                                  + سلفة
                                </button>
                              </div>
                            </td>
                            <td>
                              <TableActions
                                onView={() => openView(emp)}
                                onEdit={() => openEdit(emp)}
                                onDelete={() => setDeleteConfirmItem({ itemName: emp.name, onConfirm: () => { deleteEmployeeCtx(emp.id); setToast({ type: "success", message: t.employees.toast.deleted }); } })}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="emp-empty-state">
                  <div className="emp-empty-icon"><Search size={32} /></div>
                  <p className="emp-empty-text">لا توجد نتائج{searchTerm ? ` لـ «${searchTerm}»` : ""}</p>
                </div>
              )}
            </div>
          </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <EmployeeFormModal
        isOpen={modalState.type === "add" || modalState.type === "edit"}
        title={editingEmployee ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
        values={form} errors={formErrors} onChange={setField}
        onClose={resetFormState} onSubmit={handleSaveEmployee}
        onSaveDraft={handleSaveDraft}
        submitLabel={editingEmployee ? "حفظ التغييرات" : "حفظ الموظف"}
      />

      <EmployeeViewModal
        isOpen={modalState.type === "view"}
        emp={viewingEmployee}
        isArabic={isArabic}
        onClose={() => setModalState({ type: null })}
        onEdit={() => {
          if (viewingEmployee) {
            openEdit(viewingEmployee);
          }
        }}
      />

      <DeleteConfirmDialog
        isOpen={deleteConfirmItem !== null}
        itemName={deleteConfirmItem?.itemName ?? ""}
        onConfirm={() => { deleteConfirmItem?.onConfirm(); setDeleteConfirmItem(null); }}
        onCancel={() => setDeleteConfirmItem(null)}
      />

      <EmployeeAdvanceModal
        employee={advanceModalEmployee}
        isOpen={advanceModalEmployee !== null}
        onClose={() => setAdvanceModalEmployee(null)}
        onSave={handleSaveAdvance}
      />

      {toast && <div className={`emp-toast emp-toast-${toast.type}`}>{toast.message}</div>}
    </>
  );
}
