import { useEffect, useMemo, useState } from "react";
import "./Employees.css";
import {
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  Send,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { getEmployees, saveEmployees } from "../data/storage";
import type {
  Employee,
  EmployeeAdvance,
  SalaryType,
  DailyAttendanceEntry,
  DailyAttendanceStatus,
} from "../data/types";

type EmployeeForm = {
  name: string;
  phone: string;
  workStart: string;
  workEnd: string;
  salaryType: SalaryType;
  hourlyRate: string;
  fixedSalary: string;
  notes: string;
};

type EmployeeFormErrors = {
  name?: string;
  phone?: string;
  workStart?: string;
  workEnd?: string;
  hourlyRate?: string;
  fixedSalary?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "warning" | "info";
} | null;

type DeleteDialogState =
  | {
      employeeId: string;
      employeeName: string;
      confirmText: string;
    }
  | null;

type MainTab = "today" | "monthly" | "reports" | "employees";
type AttendanceRange = "today" | "week" | "month";
type MonthlyViewMode = "week" | "month";

type ReportSortKey =
  | "name"
  | "present"
  | "late"
  | "absent"
  | "halfDay"
  | "leave"
  | "totalHours"
  | "gross"
  | "advance"
  | "net";

type ReportSortDirection = "asc" | "desc";

type MonthlyEditorState =
  | {
      employeeId: string;
      employeeName: string;
      date: string;
      status: DailyAttendanceStatus;
      workedHours: string;
      advanceAmount: string;
      notes: string;
    }
  | null;

const EMPTY_FORM: EmployeeForm = {
  name: "",
  phone: "",
  workStart: "08:00",
  workEnd: "17:00",
  salaryType: "hourly",
  hourlyRate: "10",
  fixedSalary: "0",
  notes: "",
};

const DELETE_CONFIRMATION_CODE = "123";

const DAILY_STATUS_OPTIONS: Array<{
  value: DailyAttendanceStatus;
  label: string;
}> = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "half-day", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

const DAILY_STATUS_SHORT_LABELS: Record<DailyAttendanceStatus, string> = {
  present: "P",
  late: "L",
  absent: "A",
  "half-day": "H",
  leave: "V",
};

const DAILY_STATUS_CLASS_MAP: Record<DailyAttendanceStatus, string> = {
  present: "is-present",
  late: "is-late",
  absent: "is-absent",
  "half-day": "is-half-day",
  leave: "is-leave",
};

const EMP_AVATAR_COLORS = [
  "#2563eb", "#7c3aed", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#db2777", "#65a30d",
];

function getEmpAvatarBg(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return EMP_AVATAR_COLORS[h % EMP_AVATAR_COLORS.length];
}

function getEmpInitials(name: string) {
  return (
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?"
  );
}

function getShiftLabel(workStart: string): "Morning" | "Evening" | "Night" {
  const [h] = workStart.split(":").map(Number);
  if (h >= 6 && h < 14) return "Morning";
  if (h >= 14 && h < 22) return "Evening";
  return "Night";
}

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const calculateShiftHours = (start: string, end: string) => {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.max(diff / 60, 0);
};

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function shiftMonth(dateStr: string, delta: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + delta);
  return d.toISOString().slice(0, 10);
}

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isDateInRange(dateStr: string, range: AttendanceRange) {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (range === "today") return dateStr === getTodayDate();
  if (range === "week") return target >= getStartOfWeek() && target <= today;
  return target >= getStartOfMonth() && target <= today;
}

function getRangeTitle(range: AttendanceRange) {
  if (range === "today") return "Today";
  if (range === "week") return "This Week";
  return "This Month";
}

function getAttendanceRangeLabel(range: AttendanceRange) {
  if (range === "today") return "today";
  if (range === "week") return "this-week";
  return "this-month";
}

function getMonthDays(baseDate: string) {
  const ref = new Date(`${baseDate}T00:00:00`);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month, day).toISOString().slice(0, 10);
    const dow = new Date(year, month, day).getDay();
    return { day, date, dow };
  });

  return {
    monthLabel: ref.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    days,
  };
}

function groupDaysIntoWeeks(days: Array<{ day: number; date: string; dow: number }>) {
  const weeks: Array<Array<{ day: number; date: string; dow: number }>> = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function downloadTextFile(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toCsvValue(value: string | number) {
  const stringValue = String(value ?? "");
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function validateEmployeeForm(values: EmployeeForm): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};
  if (!values.name.trim()) errors.name = "Employee name is required.";
  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!(values.phone.startsWith("059") || values.phone.startsWith("056"))) {
    errors.phone = "Phone number must start with 059 or 056.";
  } else if (values.phone.length !== 10) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }
  if (!values.workStart) errors.workStart = "Work start time is required.";
  if (!values.workEnd) {
    errors.workEnd = "Work end time is required.";
  } else if (values.workStart && timeToMinutes(values.workEnd) <= timeToMinutes(values.workStart)) {
    errors.workEnd = "Work end time must be later than work start time.";
  }
  if (values.salaryType === "hourly") {
    if (values.hourlyRate === "") {
      errors.hourlyRate = "Hourly rate is required.";
    } else if (Number.isNaN(Number(values.hourlyRate)) || Number(values.hourlyRate) < 0) {
      errors.hourlyRate = "Hourly rate must be a valid positive number.";
    }
  }
  if (values.salaryType === "fixed") {
    if (values.fixedSalary === "") {
      errors.fixedSalary = "Fixed salary is required.";
    } else if (Number.isNaN(Number(values.fixedSalary)) || Number(values.fixedSalary) < 0) {
      errors.fixedSalary = "Fixed salary must be a valid positive number.";
    }
  }
  return errors;
}

function getEmployeeAdvances(employee: Employee): EmployeeAdvance[] {
  return Array.isArray(employee.advances) ? employee.advances : [];
}

function getDailyAttendanceEntries(employee: Employee): DailyAttendanceEntry[] {
  return Array.isArray(employee.dailyAttendance) ? employee.dailyAttendance : [];
}

function getDailyAttendanceEntryByDate(employee: Employee, date: string) {
  return getDailyAttendanceEntries(employee).find((item) => item.date === date);
}

function getDefaultWorkedHours(employee: Employee, status: DailyAttendanceStatus) {
  const fullShift = calculateShiftHours(employee.workStart, employee.workEnd);
  if (status === "absent" || status === "leave") return 0;
  if (status === "half-day") return Number((fullShift / 2).toFixed(2));
  return Number(fullShift.toFixed(2));
}

function getStatusLabel(status: DailyAttendanceStatus) {
  return DAILY_STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

function upsertDailyAttendance(employee: Employee, entry: DailyAttendanceEntry): Employee {
  const currentEntries = getDailyAttendanceEntries(employee);
  const existingIndex = currentEntries.findIndex((item) => item.date === entry.date);
  const nextEntries =
    existingIndex >= 0
      ? currentEntries.map((item, index) => (index === existingIndex ? entry : item))
      : [entry, ...currentEntries];
  return { ...employee, dailyAttendance: nextEntries };
}

function getDailyAttendanceSummaryForRange(employee: Employee, range: AttendanceRange) {
  const entries = getDailyAttendanceEntries(employee).filter((item) =>
    isDateInRange(item.date, range)
  );
  return entries.reduce(
    (acc, item) => {
      if (item.status === "present") acc.present += 1;
      if (item.status === "late") acc.late += 1;
      if (item.status === "absent") acc.absent += 1;
      if (item.status === "half-day") acc.halfDay += 1;
      if (item.status === "leave") acc.leave += 1;
      acc.totalHours += Number(item.workedHours || 0);
      acc.advance += Number(item.advanceAmount || 0);
      return acc;
    },
    { present: 0, late: 0, absent: 0, halfDay: 0, leave: 0, totalHours: 0, advance: 0 }
  );
}

function getEmployeePayrollForRange(employee: Employee, range: AttendanceRange) {
  const summary = getDailyAttendanceSummaryForRange(employee, range);
  const gross =
    employee.salaryType === "hourly"
      ? summary.totalHours * Number(employee.hourlyRate || 0)
      : Number(employee.fixedSalary || 0);
  const net = gross - summary.advance;
  return { totalHours: summary.totalHours, gross, advance: summary.advance, net };
}

function getEmployeeReportRow(employee: Employee, range: AttendanceRange) {
  const summary = getDailyAttendanceSummaryForRange(employee, range);
  const payroll = getEmployeePayrollForRange(employee, range);
  return {
    id: employee.id,
    name: employee.name,
    phone: employee.phone,
    present: summary.present,
    late: summary.late,
    absent: summary.absent,
    halfDay: summary.halfDay,
    leave: summary.leave,
    totalHours: summary.totalHours,
    gross: payroll.gross,
    advance: payroll.advance,
    net: payroll.net,
  };
}

// ─── Modals (unchanged) ───────────────────────────────────────────────────────

function EmployeeFormModal({
  title, description, values, errors, onChange, onClose, onSubmit, submitLabel,
}: {
  title: string;
  description: string;
  values: EmployeeForm;
  errors: EmployeeFormErrors;
  onChange: (field: keyof EmployeeForm, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card employees-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <Button variant="icon" size="md" aria-label="Close" onClick={onClose}>×</Button>
        </div>
        <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div className="employees-form-grid">
            <div>
              <label className="modal-label">Employee Name</label>
              <input className="modal-input" type="text" value={values.name} onChange={(e) => onChange("name", e.target.value)} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div>
              <label className="modal-label">Phone</label>
              <input className="modal-input" type="text" value={values.phone} onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>
            <div>
              <label className="modal-label">Work Start</label>
              <input className="modal-input" type="time" value={values.workStart} onChange={(e) => onChange("workStart", e.target.value)} />
              {errors.workStart && <p className="form-error">{errors.workStart}</p>}
            </div>
            <div>
              <label className="modal-label">Work End</label>
              <input className="modal-input" type="time" value={values.workEnd} onChange={(e) => onChange("workEnd", e.target.value)} />
              {errors.workEnd && <p className="form-error">{errors.workEnd}</p>}
            </div>
            <div>
              <label className="modal-label">Salary Type</label>
              <select className="modal-input" value={values.salaryType} onChange={(e) => onChange("salaryType", e.target.value as SalaryType)}>
                <option value="hourly">Hourly Salary</option>
                <option value="fixed">Fixed Salary</option>
              </select>
            </div>
            {values.salaryType === "hourly" ? (
              <div>
                <label className="modal-label">Hourly Rate</label>
                <input className="modal-input" type="number" min="0" step="1" value={values.hourlyRate} onChange={(e) => onChange("hourlyRate", e.target.value)} />
                {errors.hourlyRate && <p className="form-error">{errors.hourlyRate}</p>}
              </div>
            ) : (
              <div>
                <label className="modal-label">Fixed Salary</label>
                <input className="modal-input" type="number" min="0" step="1" value={values.fixedSalary} onChange={(e) => onChange("fixedSalary", e.target.value)} />
                {errors.fixedSalary && <p className="form-error">{errors.fixedSalary}</p>}
              </div>
            )}
            <div className="employees-form-grid-full">
              <label className="modal-label">Notes</label>
              <textarea className="modal-input" rows={4} value={values.notes} onChange={(e) => onChange("notes", e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="md" type="submit">{submitLabel}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  state, onChange, onClose, onConfirm,
}: {
  state: NonNullable<DeleteDialogState>;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isValid = state.confirmText === DELETE_CONFIRMATION_CODE;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card confirm-dialog-card employees-danger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Delete Employee</h2>
            <p>Danger zone</p>
          </div>
          <Button variant="icon" size="md" aria-label="Close" onClick={onClose}>×</Button>
        </div>
        <div className="employees-confirm-body">
          <p className="employees-danger-text">
            You are about to permanently delete <strong>{state.employeeName}</strong>.
          </p>
          <label className="modal-label">Type <strong>{DELETE_CONFIRMATION_CODE}</strong> to confirm</label>
          <input className="modal-input" type="text" value={state.confirmText} onChange={(e) => onChange(e.target.value)} />
        </div>
        <div className="modal-actions">
          <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="danger" size="md" disabled={!isValid} onClick={onConfirm} style={{ opacity: isValid ? 1 : 0.5, cursor: isValid ? "pointer" : "not-allowed" }}>
            Delete Employee
          </Button>
        </div>
      </div>
    </div>
  );
}

function MonthlyAttendanceEditorModal({
  state, employee, onClose, onSave,
}: {
  state: NonNullable<MonthlyEditorState>;
  employee: Employee;
  onClose: () => void;
  onSave: (payload: { employeeId: string; date: string; status: DailyAttendanceStatus; workedHours: number; advanceAmount: number; notes?: string }) => void;
}) {
  const [status, setStatus] = useState<DailyAttendanceStatus>(state.status);
  const [workedHours, setWorkedHours] = useState(state.workedHours);
  const [advanceAmount, setAdvanceAmount] = useState(state.advanceAmount);
  const [notes, setNotes] = useState(state.notes);

  useEffect(() => {
    setStatus(state.status);
    setWorkedHours(state.workedHours);
    setAdvanceAmount(state.advanceAmount);
    setNotes(state.notes);
  }, [state]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{state.employeeName}</h2>
            <p>{state.date}</p>
          </div>
          <Button variant="icon" size="md" aria-label="Close" onClick={onClose}>×</Button>
        </div>
        <div className="modal-form">
          <div>
            <label className="modal-label">Status</label>
            <select className="modal-input" value={status} onChange={(e) => { const s = e.target.value as DailyAttendanceStatus; setStatus(s); setWorkedHours(String(getDefaultWorkedHours(employee, s))); }}>
              {DAILY_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="modal-label">Worked Hours</label>
            <input className="modal-input" type="number" min="0" step="0.25" value={workedHours} onChange={(e) => setWorkedHours(e.target.value)} />
          </div>
          <div>
            <label className="modal-label">Advance</label>
            <input className="modal-input" type="number" min="0" step="1" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
          </div>
          <div>
            <label className="modal-label">Notes</label>
            <textarea className="modal-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="modal-actions">
            <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="md" onClick={() => onSave({ employeeId: state.employeeId, date: state.date, status, workedHours: Number(workedHours || 0), advanceAmount: Number(advanceAmount || 0), notes: notes.trim() || undefined })}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Donut chart helper ───────────────────────────────────────────────────────

function DonutChart({ present, late, absent, total }: { present: number; late: number; absent: number; total: number }) {
  if (total === 0) {
    return (
      <div className="emp-donut-empty">
        <svg viewBox="0 0 100 100" width="130" height="130">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="14" />
        </svg>
      </div>
    );
  }
  const r = 38;
  const circ = 2 * Math.PI * r;
  const presentArc = (present / total) * circ;
  const lateArc = (late / total) * circ;
  const absentArc = (absent / total) * circ;
  const restArc = circ - presentArc - lateArc - absentArc;
  const presentOffset = circ * 0.25;
  const lateOffset = presentOffset - presentArc;
  const absentOffset = lateOffset - lateArc;
  const restOffset = absentOffset - absentArc;
  return (
    <svg viewBox="0 0 100 100" width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {presentArc > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#16a34a" strokeWidth="14"
          strokeDasharray={`${presentArc} ${circ}`} strokeDashoffset={presentOffset} />
      )}
      {lateArc > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f59e0b" strokeWidth="14"
          strokeDasharray={`${lateArc} ${circ}`} strokeDashoffset={lateOffset} />
      )}
      {absentArc > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="14"
          strokeDasharray={`${absentArc} ${circ}`} strokeDashoffset={absentOffset} />
      )}
      {restArc > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14"
          strokeDasharray={`${restArc} ${circ}`} strokeDashoffset={restOffset} />
      )}
    </svg>
  );
}

function getMiniCalWeeks(dateStr: string) {
  const ref = new Date(`${dateStr.slice(0, 7)}-01T00:00:00`);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? -6 : 1 - firstDow;
  const start = new Date(year, month, 1 + offset);
  const weeks: Array<Array<{ date: string; dayNum: number; isCurrentMonth: boolean; dow: number }>> = [];
  const cur = new Date(start);
  while (weeks.length < 6) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: cur.toISOString().slice(0, 10),
        dayNum: cur.getDate(),
        isCurrentMonth: cur.getMonth() === month,
        dow: cur.getDay(),
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur.getMonth() > month && weeks.length >= 4) break;
  }
  return weeks;
}

// ─── Today Attendance ─────────────────────────────────────────────────────────

function TodayAttendanceSection({
  employees, selectedDate, onChangeDate, onApplyPresentToAll, onUpdateEmployeeDay, onSaveSheet,
}: {
  employees: Employee[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onApplyPresentToAll: () => void;
  onUpdateEmployeeDay: (employeeId: string, payload: { status: DailyAttendanceStatus; workedHours: number; advanceAmount: number; notes?: string }) => void;
  onSaveSheet: () => void;
}) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sheetSearch, setSheetSearch] = useState("");

  const todaySummary = useMemo(() => {
    return employees.reduce(
      (acc, emp) => {
        const entry = getDailyAttendanceEntryByDate(emp, selectedDate);
        if (!entry) return acc;
        if (entry.status === "present") acc.present++;
        if (entry.status === "late") acc.late++;
        if (entry.status === "absent") acc.absent++;
        acc.advance += Number(entry.advanceAmount || 0);
        return acc;
      },
      { present: 0, late: 0, absent: 0, advance: 0 }
    );
  }, [employees, selectedDate]);

  const filtered = useMemo(() => {
    if (!sheetSearch.trim()) return employees;
    const q = sheetSearch.toLowerCase();
    return employees.filter((e) => [e.name, e.id].join(" ").toLowerCase().includes(q));
  }, [employees, sheetSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const total = employees.length;
  const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

  const dateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const miniCalWeeks = useMemo(() => getMiniCalWeeks(selectedDate), [selectedDate]);

  const STATUS_BADGE_STYLE: Record<DailyAttendanceStatus, { bg: string; color: string }> = {
    present:    { bg: "#dcfce7", color: "#15803d" },
    late:       { bg: "#fef3c7", color: "#b45309" },
    absent:     { bg: "#fee2e2", color: "#b91c1c" },
    "half-day": { bg: "#ede9fe", color: "#6d28d9" },
    leave:      { bg: "#f1f5f9", color: "#475569" },
  };

  return (
    <div className="emp-today-layout">
      {/* ── LEFT MAIN ── */}
      <div className="emp-today-main">
        {/* KPI row */}
        <div className="emp-today-kpi-grid">
          <div className="emp-kpi-card emp-kpi-present">
            <div className="emp-kpi-icon-wrap" style={{ background: "#dcfce7" }}>
              <UserCheck size={20} color="#16a34a" />
            </div>
            <div>
              <span>Present</span>
              <strong>{todaySummary.present}</strong>
              <small className="emp-kpi-pct">{pct(todaySummary.present)} of total <TrendingUp size={11} /></small>
            </div>
          </div>
          <div className="emp-kpi-card emp-kpi-late">
            <div className="emp-kpi-icon-wrap" style={{ background: "#fef3c7" }}>
              <UserX size={20} color="#d97706" />
            </div>
            <div>
              <span>Late</span>
              <strong>{todaySummary.late}</strong>
              <small className="emp-kpi-pct">{pct(todaySummary.late)} of total <TrendingUp size={11} /></small>
            </div>
          </div>
          <div className="emp-kpi-card emp-kpi-absent">
            <div className="emp-kpi-icon-wrap" style={{ background: "#fee2e2" }}>
              <UserX size={20} color="#dc2626" />
            </div>
            <div>
              <span>Absent</span>
              <strong>{todaySummary.absent}</strong>
              <small className="emp-kpi-pct">{pct(todaySummary.absent)} of total <TrendingUp size={11} /></small>
            </div>
          </div>
          <div className="emp-kpi-card emp-kpi-advance">
            <div className="emp-kpi-icon-wrap" style={{ background: "#ede9fe" }}>
              <Wallet size={20} color="#7c3aed" />
            </div>
            <div>
              <span>Advances Today</span>
              <strong>${todaySummary.advance.toFixed(2)}</strong>
              <small>Total advances</small>
            </div>
          </div>
        </div>

        {/* Daily Sheet */}
        <div className="emp-sheet-card">
          <div className="emp-sheet-head">
            <div>
              <h3 className="emp-section-title">Daily Sheet</h3>
              <p className="emp-section-sub">Edit only employees who differ from the default attendance.</p>
            </div>
          </div>

          {/* Sheet toolbar */}
          <div className="emp-sheet-subtoolbar">
            <div className="emp-sheet-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search employee..."
                value={sheetSearch}
                onChange={(e) => { setSheetSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="emp-dept-select">
              <option>All Departments</option>
            </select>
          </div>

          {filtered.length > 0 ? (
            <>
              <div className="emp-table-wrap">
                <table className="emp-sheet-table app-data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Shift</th>
                      <th>Status</th>
                      <th>Hours</th>
                      <th>Advance</th>
                      <th>Note</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((emp) => {
                      const current = getDailyAttendanceEntryByDate(emp, selectedDate) || {
                        date: selectedDate,
                        status: "present" as DailyAttendanceStatus,
                        workedHours: getDefaultWorkedHours(emp, "present"),
                        advanceAmount: 0,
                        notes: "",
                      };
                      const badge = STATUS_BADGE_STYLE[current.status] || STATUS_BADGE_STYLE.leave;
                      const isAbsent = current.status === "absent";

                      return (
                        <tr key={emp.id}>
                          <td>
                            <div className="emp-row-user">
                              <div className="emp-row-avatar" style={{ background: getEmpAvatarBg(emp.name) }}>
                                {getEmpInitials(emp.name)}
                              </div>
                              <div>
                                <strong>{emp.name}</strong>
                                <span>{emp.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="emp-shift-cell">{emp.workStart} - {emp.workEnd}</td>
                          <td>
                            <select
                              className="emp-badge-select"
                              style={{ background: badge.bg, color: badge.color }}
                              value={current.status}
                              onChange={(e) => {
                                const ns = e.target.value as DailyAttendanceStatus;
                                onUpdateEmployeeDay(emp.id, {
                                  status: ns,
                                  workedHours: getDefaultWorkedHours(emp, ns),
                                  advanceAmount: current.advanceAmount,
                                  notes: current.notes,
                                });
                              }}
                            >
                              {DAILY_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {isAbsent ? (
                              <span className="emp-absent-dash">–</span>
                            ) : (
                              <div className="emp-hours-input-wrap">
                                <input
                                  className="emp-num-input"
                                  type="number"
                                  min="0"
                                  step="0.25"
                                  value={current.workedHours}
                                  onChange={(e) =>
                                    onUpdateEmployeeDay(emp.id, {
                                      status: current.status,
                                      workedHours: Number(e.target.value || 0),
                                      advanceAmount: current.advanceAmount,
                                      notes: current.notes,
                                    })
                                  }
                                />
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              className="emp-num-input"
                              type="number"
                              min="0"
                              step="1"
                              value={current.advanceAmount}
                              onChange={(e) =>
                                onUpdateEmployeeDay(emp.id, {
                                  status: current.status,
                                  workedHours: current.workedHours,
                                  advanceAmount: Number(e.target.value || 0),
                                  notes: current.notes,
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="emp-note-input"
                              type="text"
                              value={current.notes || ""}
                              placeholder={isAbsent ? "Absent" : "Optional note"}
                              onChange={(e) =>
                                onUpdateEmployeeDay(emp.id, {
                                  status: current.status,
                                  workedHours: current.workedHours,
                                  advanceAmount: current.advanceAmount,
                                  notes: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td>
                            <div className="emp-row-actions">
                              <Button variant="icon" size="sm" aria-label="Save record" title="Save record" onClick={onSaveSheet}>
                                <FileText size={14} />
                              </Button>
                              <Button variant="icon" size="sm" aria-label="Reset to default" title="Reset to default"
                                onClick={() => onUpdateEmployeeDay(emp.id, {
                                  status: "present",
                                  workedHours: getDefaultWorkedHours(emp, "present"),
                                  advanceAmount: 0,
                                  notes: "",
                                })}>
                                <RotateCcw size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="emp-pg-footer">
                <span className="emp-pg-meta">
                  Showing {filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(safePage * rowsPerPage, filtered.length)} of {filtered.length} employees
                </span>
                <div className="emp-pg-controls">
                  <Button variant="icon" size="sm" aria-label="Previous page" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft size={14} />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "…" ? (
                        <span key={`e${idx}`} className="emp-pg-ellipsis">…</span>
                      ) : (
                        <Button key={p} variant="icon" size="sm" className={safePage === p ? "active" : ""} aria-label={`Page ${p}`} onClick={() => setPage(p as number)}>
                          {p}
                        </Button>
                      )
                    )}
                  <Button variant="icon" size="sm" aria-label="Next page" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
                <select
                  className="emp-rpp-select"
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                >
                  {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </>
          ) : (
            <div className="emp-empty-state">
              <Users size={40} color="#cbd5e1" />
              <strong>No employees found.</strong>
              <span>Add your first employee to start managing attendance.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className="emp-today-sidebar">
        {/* Date + action buttons */}
        <div className="emp-sidebar-date-card">
          <div className="emp-sidebar-date-row">
            <Calendar size={15} color="#64748b" />
            <input
              type="date"
              className="emp-sidebar-date-input"
              value={selectedDate}
              onChange={(e) => onChangeDate(e.target.value)}
            />
            <span>{dateLabel}</span>
            <ChevronRight size={14} color="#94a3b8" />
          </div>
          <div className="emp-sidebar-date-actions">
            <Button variant="secondary" size="sm" style={{ flex: 1 }} onClick={onApplyPresentToAll}>
              Prepare Day
            </Button>
            <Button variant="primary" size="sm" style={{ flex: 1 }} onClick={onSaveSheet}>
              Save Day
            </Button>
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="emp-sidebar-card">
          <div className="emp-sidebar-card-head">
            <div className="emp-sidebar-card-title">
              <Calendar size={15} color="#2563eb" />
              <span>Monthly Overview</span>
            </div>
            <select className="emp-sidebar-period-select">
              <option>This Month</option>
            </select>
          </div>
          <div className="emp-mini-cal-month">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div className="emp-mini-cal">
            <div className="emp-mini-cal-header">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            {miniCalWeeks.map((week, wi) => (
              <div key={wi} className="emp-mini-cal-week">
                {week.map((day) => {
                  const isToday = day.date === getTodayDate();
                  const presentCount = employees.filter(
                    (e) => getDailyAttendanceEntryByDate(e, day.date)?.status === "present"
                  ).length;
                  const hasSomePresent = presentCount > 0 && day.isCurrentMonth;
                  const isWeekend = day.dow === 5 || day.dow === 6;
                  return (
                    <span
                      key={day.date}
                      className={[
                        "emp-mini-cal-day",
                        !day.isCurrentMonth ? "emp-cal-other-month" : "",
                        isToday ? "emp-cal-today" : "",
                        hasSomePresent && !isToday ? "emp-cal-has-present" : "",
                        isWeekend && !isToday ? "emp-cal-weekend" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {day.dayNum}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="emp-cal-legend">
            <span><span className="emp-cal-dot" style={{ background: "#16a34a" }} />Present</span>
            <span><span className="emp-cal-dot" style={{ background: "#f59e0b" }} />Late</span>
            <span><span className="emp-cal-dot" style={{ background: "#ef4444" }} />Absent</span>
            <span><span className="emp-cal-dot" style={{ background: "#cbd5e1" }} />Weekend</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="emp-sidebar-card">
          <div className="emp-sidebar-card-head">
            <div className="emp-sidebar-card-title">
              <Calendar size={15} color="#2563eb" />
              <span>Quick Actions</span>
            </div>
          </div>
          <div className="emp-quick-actions-grid">
            <Button variant="secondary" size="sm">
              <Upload size={18} />
              <span>Import Attendance</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => {}}>
              <Download size={18} />
              <span>Export Report</span>
            </Button>
            <Button variant="secondary" size="sm">
              <DollarSign size={18} />
              <span>Bulk Advance</span>
            </Button>
            <Button variant="secondary" size="sm">
              <Send size={18} />
              <span>Send Notice</span>
            </Button>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="emp-sidebar-card">
          <div className="emp-sidebar-card-head">
            <div className="emp-sidebar-card-title">
              <span>Today's Summary</span>
            </div>
          </div>
          <div className="emp-summary-donut-wrap">
            <DonutChart
              present={todaySummary.present}
              late={todaySummary.late}
              absent={todaySummary.absent}
              total={total}
            />
          </div>
          <div className="emp-summary-legend">
            <div>
              <span className="emp-cal-dot" style={{ background: "#16a34a" }} />
              <span>Present</span>
              <strong>{todaySummary.present} ({pct(todaySummary.present)})</strong>
            </div>
            <div>
              <span className="emp-cal-dot" style={{ background: "#f59e0b" }} />
              <span>Late</span>
              <strong>{todaySummary.late} ({pct(todaySummary.late)})</strong>
            </div>
            <div>
              <span className="emp-cal-dot" style={{ background: "#ef4444" }} />
              <span>Absent</span>
              <strong>{todaySummary.absent} ({pct(todaySummary.absent)})</strong>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Monthly Attendance ───────────────────────────────────────────────────────

function MonthlyAttendanceSection({
  employees, monthDate, viewMode, weekIndex,
  onChangeMonthDate, onChangeViewMode, onChangeWeekIndex, onOpenEditor,
}: {
  employees: Employee[];
  monthDate: string;
  viewMode: MonthlyViewMode;
  weekIndex: number;
  onChangeMonthDate: (date: string) => void;
  onChangeViewMode: (mode: MonthlyViewMode) => void;
  onChangeWeekIndex: (index: number) => void;
  onOpenEditor: (employee: Employee, date: string) => void;
}) {
  const { monthLabel, days } = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const weeks = useMemo(() => groupDaysIntoWeeks(days), [days]);
  const safeWeekIndex = Math.min(Math.max(weekIndex, 0), Math.max(weeks.length - 1, 0));
  const visibleDays = viewMode === "month" ? days : (weeks[safeWeekIndex] || []);

  const todayStats = useMemo(() => {
    const today = getTodayDate();
    return employees.reduce(
      (acc, emp) => {
        const entry = getDailyAttendanceEntryByDate(emp, today);
        if (entry?.status === "present") acc.present++;
        else if (entry?.status === "late") acc.late++;
        else if (entry?.status === "absent") acc.absent++;
        else if (entry?.status === "half-day") acc.halfDay++;
        return acc;
      },
      { present: 0, late: 0, absent: 0, halfDay: 0 }
    );
  }, [employees]);

  const total = employees.length;
  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";
  const attendancePct = total > 0
    ? `${(((todayStats.present + todayStats.late) / total) * 100).toFixed(1)}%`
    : "0%";

  const weekLabel = (() => {
    if (!visibleDays.length) return "";
    const first = visibleDays[0].date;
    const last = visibleDays[visibleDays.length - 1].date;
    const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `Week ${safeWeekIndex + 1} (${fmt(first)} – ${fmt(last)})`;
  })();

  return (
    <>
      {/* Toolbar */}
      <div className="emp-monthly-toolbar">
        <div className="emp-monthly-toolbar-left">
          <div className="emp-month-picker">
            <Calendar size={14} />
            <select
              value={monthDate.slice(0, 7)}
              onChange={(e) => onChangeMonthDate(`${e.target.value}-01`)}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date(`${monthDate.slice(0, 4)}-01-01`);
                d.setMonth(i);
                return d.toISOString().slice(0, 7);
              }).map((ym) => (
                <option key={ym} value={ym}>
                  {new Date(`${ym}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </option>
              ))}
            </select>
          </div>

          <div className="emp-view-toggle-group">
            <button type="button" className={`emp-view-toggle-btn ${viewMode === "week" ? "active" : ""}`} onClick={() => onChangeViewMode("week")}>
              Week
            </button>
            <button type="button" className={`emp-view-toggle-btn ${viewMode === "month" ? "active" : ""}`} onClick={() => onChangeViewMode("month")}>
              Month
            </button>
          </div>

          {viewMode === "week" && (
            <>
              <Button variant="secondary" size="sm" onClick={() => { onChangeWeekIndex(Math.max(safeWeekIndex - 1, 0)); }} disabled={safeWeekIndex === 0}>
                <ChevronLeft size={14} /> Previous
              </Button>
              <span className="emp-week-label">{weekLabel}</span>
              <Button variant="secondary" size="sm" onClick={() => { onChangeWeekIndex(Math.min(safeWeekIndex + 1, weeks.length - 1)); }} disabled={safeWeekIndex === weeks.length - 1}>
                Next <ChevronRight size={14} />
              </Button>
            </>
          )}
        </div>

        <div className="emp-monthly-toolbar-right">
          <Button variant="secondary" size="sm">
            <Filter size={14} /> Filters
          </Button>
          <span className="emp-filter-chip">All Departments <span onClick={() => {}}>×</span></span>
          <span className="emp-filter-chip">All Shifts <span onClick={() => {}}>×</span></span>
          <Button variant="ghost" size="sm">Clear</Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="emp-monthly-stats-row">
        <div className="emp-monthly-stat">
          <span>Total Employees</span>
          <strong>{total}</strong>
        </div>
        <div className="emp-monthly-stat emp-stat-present">
          <span><span className="emp-stat-dot" style={{ background: "#16a34a" }} />Present</span>
          <strong>{todayStats.present} <small>({pct(todayStats.present)})</small></strong>
        </div>
        <div className="emp-monthly-stat emp-stat-late">
          <span><span className="emp-stat-dot" style={{ background: "#d97706" }} />Late</span>
          <strong>{todayStats.late} <small>({pct(todayStats.late)})</small></strong>
        </div>
        <div className="emp-monthly-stat emp-stat-absent">
          <span><span className="emp-stat-dot" style={{ background: "#dc2626" }} />Absent</span>
          <strong>{todayStats.absent} <small>({pct(todayStats.absent)})</small></strong>
        </div>
        <div className="emp-monthly-stat">
          <span><span className="emp-stat-dot" style={{ background: "#7c3aed" }} />Half Day</span>
          <strong>{todayStats.halfDay} <small>({pct(todayStats.halfDay)})</small></strong>
        </div>
        <div className="emp-monthly-stat emp-stat-pct">
          <span>Attendance %</span>
          <strong style={{ color: "#16a34a" }}>{attendancePct}</strong>
        </div>
      </div>

      {/* Grid */}
      {employees.length > 0 ? (
        <div className="emp-monthly-grid-wrap app-table-wrap">
          <table className="emp-monthly-grid app-data-table">
            <thead>
              <tr>
                <th className="emp-monthly-name-th">Employee</th>
                {visibleDays.map((day) => (
                  <th key={day.date} className={`emp-monthly-day-th ${day.dow === 0 ? "emp-day-sunday" : ""}`}>
                    <span className="emp-day-dow">
                      {new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="emp-day-num">{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </th>
                ))}
                <th className="emp-monthly-pct-th">%</th>
                <th className="emp-monthly-more-th" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const visibleEntries = visibleDays.map((day) => getDailyAttendanceEntryByDate(emp, day.date)).filter(Boolean);
                const attDays = visibleEntries.filter((e) => e!.status === "present" || e!.status === "late").length;
                const attPct = visibleDays.length > 0 ? Math.round((attDays / visibleDays.length) * 100) : 0;

                return (
                  <tr key={emp.id}>
                    <td className="emp-monthly-name-td">
                      <div className="emp-row-user">
                        <div className="emp-row-avatar" style={{ background: getEmpAvatarBg(emp.name) }}>
                          {getEmpInitials(emp.name)}
                        </div>
                        <div>
                          <strong>{emp.name}</strong>
                          <span>{emp.id} · {emp.workStart}–{emp.workEnd}</span>
                        </div>
                      </div>
                    </td>
                    {visibleDays.map((day) => {
                      const entry = getDailyAttendanceEntryByDate(emp, day.date);
                      const dotColor = entry
                        ? ({ present: "#16a34a", late: "#d97706", absent: "#dc2626", "half-day": "#7c3aed", leave: "#94a3b8" }[entry.status] || "#94a3b8")
                        : undefined;
                      const hoursStr = entry ? `${Math.floor(Number(entry.workedHours))}h ${String(Math.round((Number(entry.workedHours) % 1) * 60)).padStart(2, "0")}m` : "";
                      return (
                        <td key={day.date} className={day.dow === 0 ? "emp-day-sunday" : ""}>
                          <button
                            type="button"
                            className={`emp-monthly-day-btn ${entry ? DAILY_STATUS_CLASS_MAP[entry.status] : "is-empty"}`}
                            onClick={() => onOpenEditor(emp, day.date)}
                            title={entry ? `${getStatusLabel(entry.status)} – ${day.date}` : day.date}
                          >
                            {entry && dotColor && (
                              <span className="emp-day-dot" style={{ background: dotColor }} />
                            )}
                            <span className="emp-day-short">
                              {entry ? DAILY_STATUS_SHORT_LABELS[entry.status] : "-"}
                            </span>
                            {hoursStr && <span className="emp-day-hours">{hoursStr}</span>}
                          </button>
                        </td>
                      );
                    })}
                    <td className="emp-monthly-pct-td">
                      <span className={`emp-att-pct ${attPct >= 80 ? "good" : attPct >= 60 ? "warn" : "bad"}`}>
                        {attPct}%
                      </span>
                    </td>
                    <td>
                      <Button variant="icon" size="sm" aria-label="More options">
                        <MoreVertical size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="emp-empty-state">
          <Users size={40} color="#cbd5e1" />
          <strong>No employees found.</strong>
          <span>Add your first employee to start managing the monthly schedule.</span>
        </div>
      )}

      <div className="emp-pg-footer">
        <span className="emp-pg-meta">Showing 1 to {employees.length} of {employees.length} employees</span>
        <select className="emp-rpp-select" defaultValue={10}>
          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>Rows per page {n}</option>)}
        </select>
      </div>
    </>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────

function ReportsSection({
  attendanceRange, onChangeRange, attendanceReportRows, payrollSummary,
  getReportSortIndicator, toggleReportSort, handleExportReportCsv,
}: {
  attendanceRange: AttendanceRange;
  onChangeRange: (range: AttendanceRange) => void;
  attendanceReportRows: Array<{
    id: string; name: string; phone: string;
    present: number; late: number; absent: number; halfDay: number; leave: number;
    totalHours: number; gross: number; advance: number; net: number;
  }>;
  payrollSummary: { gross: number; advance: number; net: number };
  getReportSortIndicator: (key: ReportSortKey) => string;
  toggleReportSort: (key: ReportSortKey) => void;
  handleExportReportCsv: () => void;
}) {
  return (
    <>
      {/* Range tabs + export */}
      <div className="emp-reports-topbar">
        <div className="emp-range-tabs">
          {(["today", "week", "month"] as AttendanceRange[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`emp-range-tab ${attendanceRange === r ? "active" : ""}`}
              onClick={() => onChangeRange(r)}
            >
              {getRangeTitle(r)}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="md" onClick={handleExportReportCsv}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="emp-reports-kpi-row">
        <div className="emp-rep-kpi-card">
          <div className="emp-rep-kpi-icon" style={{ background: "#dcfce7" }}>
            <BarChart2 size={20} color="#16a34a" />
          </div>
          <div>
            <span>Gross</span>
            <strong>${payrollSummary.gross.toFixed(2)}</strong>
            <small>Total earnings</small>
          </div>
        </div>
        <div className="emp-rep-kpi-card">
          <div className="emp-rep-kpi-icon" style={{ background: "#fff7ed" }}>
            <CreditCard size={20} color="#ea580c" />
          </div>
          <div>
            <span>Advance</span>
            <strong>${payrollSummary.advance.toFixed(2)}</strong>
            <small>Total advances</small>
          </div>
        </div>
        <div className="emp-rep-kpi-card">
          <div className="emp-rep-kpi-icon" style={{ background: "#eff6ff" }}>
            <Wallet size={20} color="#2563eb" />
          </div>
          <div>
            <span>Net</span>
            <strong>${payrollSummary.net.toFixed(2)}</strong>
            <small>Net payable</small>
          </div>
        </div>
        <div className="emp-rep-kpi-card">
          <div className="emp-rep-kpi-icon" style={{ background: "#f5f3ff" }}>
            <Calendar size={20} color="#7c3aed" />
          </div>
          <div>
            <span>Range</span>
            <strong>{getRangeTitle(attendanceRange)}</strong>
            <small>Selected period</small>
          </div>
        </div>
      </div>

      {/* Report table */}
      <div className="emp-sheet-card">
        <div className="emp-sheet-head">
          <div>
            <h3 className="emp-section-title">Attendance &amp; Payroll Report</h3>
            <p className="emp-section-sub">
              Summary for <strong>{getRangeTitle(attendanceRange)}</strong>
            </p>
          </div>
        </div>

        {attendanceReportRows.length > 0 ? (
          <div className="emp-table-wrap">
            <table className="emp-table app-data-table">
              <thead>
                <tr>
                  {(["name", "present", "late", "absent", "halfDay", "leave", "totalHours", "gross", "advance", "net"] as ReportSortKey[]).map((k) => (
                    <th key={k} className="emp-sortable" onClick={() => toggleReportSort(k)}>
                      {{ name: "Employee", present: "Present", late: "Late", absent: "Absent", halfDay: "Half Day", leave: "Leave", totalHours: "Hours", gross: "Gross", advance: "Advance", net: "Net" }[k]}
                      {" "}{getReportSortIndicator(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceReportRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.present}</td>
                    <td>{row.late}</td>
                    <td>{row.absent}</td>
                    <td>{row.halfDay}</td>
                    <td>{row.leave}</td>
                    <td>{row.totalHours.toFixed(2)} h</td>
                    <td>${row.gross.toFixed(2)}</td>
                    <td>${row.advance.toFixed(2)}</td>
                    <td>${row.net.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emp-empty-state emp-empty-report">
            <div className="emp-empty-illustration">
              <BarChart2 size={52} color="#cbd5e1" />
            </div>
            <strong>No report data found</strong>
            <span>
              No daily attendance records are available for the selected period.
              <br />Once attendance is recorded, your reports will appear here.
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Employees List ───────────────────────────────────────────────────────────

function EmployeesSection({
  employees, onEdit, onDelete,
}: {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<"name" | "id" | "phone">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = [...employees];
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter((e) => [e.name, e.id, e.phone].join(" ").toLowerCase().includes(q));
    }
    if (statusFilter === "active") result = result.filter((e) => !e.isDeleted);
    if (statusFilter === "inactive") result = result.filter((e) => e.isDeleted);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "id") cmp = a.id.localeCompare(b.id);
      else if (sortKey === "phone") cmp = a.phone.localeCompare(b.phone);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [employees, localSearch, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div className="emp-list-card">
      {/* Toolbar */}
      <div className="emp-list-toolbar">
        <div className="emp-list-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by name, code, or phone..."
            value={localSearch}
            onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Button variant="secondary" size="sm">
          <Filter size={14} /> Filters
        </Button>
        {statusFilter !== "all" && (
          <span className="emp-active-chip">
            {statusFilter === "active" ? "Active" : "Inactive"}
            <button type="button" onClick={() => setStatusFilter("all")}>×</button>
          </span>
        )}
        <div className="emp-list-toolbar-right">
          <span className="emp-total-count">
            Total Employees <strong>{filtered.length}</strong>
          </span>
          <Button variant="icon" size="sm" aria-label="Download">
            <Download size={15} />
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <>
          <div className="emp-table-wrap">
            <table className="emp-table app-data-table">
              <colgroup>
                <col style={{ width: "26%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="emp-sortable" onClick={() => toggleSort("name")}>
                    EMPLOYEE {sortKey === "name" ? (sortDir === "asc" ? "↑" : "↓") : <span className="emp-sort-icon"><ChevronLeft size={10} style={{ transform: "rotate(-90deg)" }} /></span>}
                  </th>
                  <th className="emp-sortable" onClick={() => toggleSort("id")}>
                    EMP CODE {sortKey === "id" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="emp-sortable" onClick={() => toggleSort("phone")}>
                    PHONE {sortKey === "phone" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th>SHIFT</th>
                  <th>DEFAULT HOURS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((emp) => {
                  const shift = getShiftLabel(emp.workStart);
                  const shiftColors = {
                    Morning: { bg: "#eff6ff", color: "#1d4ed8" },
                    Evening: { bg: "#fefce8", color: "#a16207" },
                    Night: { bg: "#f5f3ff", color: "#6d28d9" },
                  }[shift];
                  const isActive = !emp.isDeleted;

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="emp-row-user">
                          <div
                            className="emp-row-avatar"
                            style={{ background: getEmpAvatarBg(emp.name) }}
                          >
                            {getEmpInitials(emp.name)}
                          </div>
                          <div>
                            <strong>{emp.name}</strong>
                            <span>Employee</span>
                          </div>
                        </div>
                      </td>
                      <td className="emp-code-cell">{emp.id}</td>
                      <td>{emp.phone}</td>
                      <td>
                        <span
                          className="emp-shift-badge"
                          style={{ background: shiftColors.bg, color: shiftColors.color }}
                        >
                          {shift}
                        </span>
                      </td>
                      <td className="emp-hours-cell">
                        {emp.workStart} – {emp.workEnd}
                      </td>
                      <td>
                        <span className={`emp-status-badge ${isActive ? "active" : "inactive"}`}>
                          <span className="emp-status-dot" />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="emp-row-actions">
                          <Button variant="icon" size="sm" aria-label="View" title="View">
                            <Eye size={14} />
                          </Button>
                          <Button variant="icon" size="sm" aria-label="Edit" title="Edit" onClick={() => onEdit(emp)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="icon" size="sm" aria-label="Delete" title="Delete" onClick={() => onDelete(emp)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="emp-pg-footer">
            <span className="emp-pg-meta">
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(safePage * rowsPerPage, filtered.length)} of {filtered.length} employees
            </span>
            <div className="emp-pg-controls">
              <Button variant="icon" size="sm" aria-label="Previous page" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={14} />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span key={`e${idx}`} className="emp-pg-ellipsis">…</span>
                  ) : (
                    <Button key={p} variant="icon" size="sm" className={safePage === p ? "active" : ""} aria-label={`Page ${p}`} onClick={() => setPage(p as number)}>
                      {p}
                    </Button>
                  )
                )}
              <Button variant="icon" size="sm" aria-label="Next page" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight size={14} />
              </Button>
            </div>
            <select
              className="emp-rpp-select"
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>Rows per page {n}</option>)}
            </select>
          </div>
        </>
      ) : (
        <div className="emp-empty-state">
          <Users size={40} color="#cbd5e1" />
          <strong>No employees found.</strong>
          <span>Add your first employee to get started.</span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<MainTab>("today");
  const [attendanceRange, setAttendanceRange] = useState<AttendanceRange>("today");
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(getTodayDate());
  const [selectedMonthDate, setSelectedMonthDate] = useState(getTodayDate());
  const [monthlyViewMode, setMonthlyViewMode] = useState<MonthlyViewMode>("week");
  const [selectedMonthWeekIndex, setSelectedMonthWeekIndex] = useState(0);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});
  const [toast, setToast] = useState<ToastState>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);
  const [monthlyEditor, setMonthlyEditor] = useState<MonthlyEditorState>(null);
  const [reportSortKey, setReportSortKey] = useState<ReportSortKey>("name");
  const [reportSortDirection, setReportSortDirection] = useState<ReportSortDirection>("asc");

  useEffect(() => { saveEmployees(employees); }, [employees]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredEmployees = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return employees;
    return employees.filter((emp) =>
      [emp.id, emp.name, emp.phone, emp.notes || ""].join(" ").toLowerCase().includes(value)
    );
  }, [employees, searchTerm]);

  const payrollSummary = useMemo(() => {
    return employees.reduce(
      (acc, emp) => {
        const p = getEmployeePayrollForRange(emp, attendanceRange);
        acc.gross += p.gross;
        acc.advance += p.advance;
        acc.net += p.net;
        return acc;
      },
      { gross: 0, advance: 0, net: 0 }
    );
  }, [employees, attendanceRange]);

  const attendanceReportRows = useMemo(() => {
    const rows = employees
      .map((emp) => getEmployeeReportRow(emp, attendanceRange))
      .filter((r) => r.present > 0 || r.late > 0 || r.absent > 0 || r.halfDay > 0 || r.leave > 0 || r.totalHours > 0);
    return [...rows].sort((a, b) => {
      if (reportSortKey === "name") {
        const res = a.name.localeCompare(b.name);
        return reportSortDirection === "asc" ? res : -res;
      }
      const res = Number(a[reportSortKey] as number) - Number(b[reportSortKey] as number);
      return reportSortDirection === "asc" ? res : -res;
    });
  }, [employees, attendanceRange, reportSortKey, reportSortDirection]);

  const currentMonthlyEditorEmployee = monthlyEditor
    ? employees.find((emp) => emp.id === monthlyEditor.employeeId) || null
    : null;

  const handleMonthDateChange = (date: string) => { setSelectedMonthDate(date); setSelectedMonthWeekIndex(0); };
  const handleMonthViewChange = (mode: MonthlyViewMode) => { setMonthlyViewMode(mode); setSelectedMonthWeekIndex(0); };

  const getReportSortIndicator = (key: ReportSortKey) => {
    if (reportSortKey !== key) return "";
    return reportSortDirection === "asc" ? "↑" : "↓";
  };

  const toggleReportSort = (key: ReportSortKey) => {
    if (reportSortKey === key) { setReportSortDirection((p) => (p === "asc" ? "desc" : "asc")); return; }
    setReportSortKey(key);
    setReportSortDirection(key === "name" ? "asc" : "desc");
  };

  const setField = (field: keyof EmployeeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetFormState = () => { setShowEmployeeModal(false); setEditingEmployee(null); setForm(EMPTY_FORM); setFormErrors({}); };
  const openAddModal = () => { setEditingEmployee(null); setForm(EMPTY_FORM); setFormErrors({}); setShowEmployeeModal(true); };
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({ name: emp.name, phone: emp.phone, workStart: emp.workStart, workEnd: emp.workEnd, salaryType: emp.salaryType, hourlyRate: String(emp.hourlyRate ?? 0), fixedSalary: String(emp.fixedSalary ?? 0), notes: emp.notes ?? "" });
    setFormErrors({});
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = () => {
    const errors = validateEmployeeForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id
            ? { ...emp, name: form.name.trim(), phone: form.phone.trim(), workStart: form.workStart, workEnd: form.workEnd, salaryType: form.salaryType, hourlyRate: form.salaryType === "hourly" ? Number(form.hourlyRate) : undefined, fixedSalary: form.salaryType === "fixed" ? Number(form.fixedSalary) : undefined, notes: form.notes.trim() }
            : emp
        )
      );
      resetFormState();
      setToast({ type: "success", message: "Employee updated successfully." });
      return;
    }

    const newEmployee: Employee = {
      id: `EMP-${1000 + employees.length + 1}`,
      name: form.name.trim(),
      phone: form.phone.trim(),
      workStart: form.workStart,
      workEnd: form.workEnd,
      salaryType: form.salaryType,
      hourlyRate: form.salaryType === "hourly" ? Number(form.hourlyRate) : undefined,
      fixedSalary: form.salaryType === "fixed" ? Number(form.fixedSalary) : undefined,
      advance: 0,
      advances: [],
      notes: form.notes.trim(),
      attendanceRecords: [],
      dailyAttendance: [],
      isDeleted: false,
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    resetFormState();
    setToast({ type: "success", message: "Employee added successfully." });
  };

  const handleApplyPresentToAll = () => {
    setEmployees((prev) =>
      prev.map((emp) =>
        upsertDailyAttendance(emp, {
          date: selectedAttendanceDate,
          status: "present",
          workedHours: getDefaultWorkedHours(emp, "present"),
          advanceAmount: 0,
          notes: "",
        })
      )
    );
    setToast({ type: "success", message: "Default present attendance applied to all employees." });
  };

  const handleUpdateEmployeeDayByDate = (
    employeeId: string,
    date: string,
    payload: { status: DailyAttendanceStatus; workedHours: number; advanceAmount: number; notes?: string }
  ) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const updated = upsertDailyAttendance(emp, { date, status: payload.status, workedHours: payload.workedHours, advanceAmount: payload.advanceAmount, notes: payload.notes?.trim() || undefined });
        const nextAdvances = getEmployeeAdvances(updated).filter((item) => item.date !== date);
        if (payload.advanceAmount > 0) {
          nextAdvances.unshift({ id: `ADV-${employeeId}-${date}`, amount: payload.advanceAmount, date, notes: payload.notes?.trim() || "Daily attendance advance" });
        }
        return { ...updated, advances: nextAdvances, advance: nextAdvances.reduce((sum, item) => sum + Number(item.amount || 0), 0) };
      })
    );
  };

  const handleUpdateEmployeeDay = (
    employeeId: string,
    payload: { status: DailyAttendanceStatus; workedHours: number; advanceAmount: number; notes?: string }
  ) => { handleUpdateEmployeeDayByDate(employeeId, selectedAttendanceDate, payload); };

  const handleSaveDailyRegister = () => {
    setToast({ type: "success", message: `Daily register for ${selectedAttendanceDate} saved successfully.` });
  };

  const handleExportReportCsv = () => {
    if (attendanceReportRows.length === 0) {
      setToast({ type: "warning", message: "No report data available to export." });
      return;
    }
    const headers = ["Employee", "Employee ID", "Phone", "Present", "Late", "Absent", "Half Day", "Leave", "Total Hours", "Gross Payroll", "Advance", "Net Payroll"];
    const rows = attendanceReportRows.map((row) => [row.name, row.id, row.phone, row.present, row.late, row.absent, row.halfDay, row.leave, row.totalHours.toFixed(2), row.gross.toFixed(2), row.advance.toFixed(2), row.net.toFixed(2)]);
    const csvContent = [headers.map(toCsvValue).join(","), ...rows.map((r) => r.map(toCsvValue).join(","))].join("\n");
    downloadTextFile(`daily-attendance-report-${getAttendanceRangeLabel(attendanceRange)}.csv`, csvContent, "text/csv;charset=utf-8;");
    setToast({ type: "success", message: "Attendance report exported successfully." });
  };

  const openMonthlyEditor = (emp: Employee, date: string) => {
    const entry = getDailyAttendanceEntryByDate(emp, date);
    setMonthlyEditor({
      employeeId: emp.id,
      employeeName: emp.name,
      date,
      status: entry?.status || "present",
      workedHours: String(entry?.workedHours ?? getDefaultWorkedHours(emp, "present")),
      advanceAmount: String(entry?.advanceAmount ?? 0),
      notes: entry?.notes || "",
    });
  };

  return (
    <>
      <div className="employees-page employees-lux-page">
        {/* Header */}
        <div className="employees-header employees-lux-header">
          <div>
            <p className="dashboard-badge">Employee Management</p>
            <h1 className="dashboard-title">Employees</h1>
            <p className="dashboard-subtitle employees-hero-text">
              Manage attendance, monthly records, reports, and employee information
            </p>
          </div>
          <div className="employees-header-actions">
            <div className="emp-header-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="primary" size="lg" onClick={openAddModal}>
              + Add Employee
            </Button>
          </div>
        </div>

        {/* Main card */}
        <div className="dashboard-card employees-main-card">
          {/* Tabs */}
          <div className="emp-main-tabs">
            {([
              ["today", "Today Attendance"],
              ["monthly", "Monthly Attendance"],
              ["reports", "Reports"],
              ["employees", "Employees"],
            ] as [MainTab, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`emp-main-tab ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {key === "today" && <Calendar size={14} />}
                {key === "monthly" && <Calendar size={14} />}
                {key === "reports" && <BarChart2 size={14} />}
                {key === "employees" && <Users size={14} />}
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="emp-tab-content">
            {activeTab === "today" && (
              <TodayAttendanceSection
                employees={filteredEmployees}
                selectedDate={selectedAttendanceDate}
                onChangeDate={setSelectedAttendanceDate}
                onApplyPresentToAll={handleApplyPresentToAll}
                onUpdateEmployeeDay={handleUpdateEmployeeDay}
                onSaveSheet={handleSaveDailyRegister}
              />
            )}
            {activeTab === "monthly" && (
              <MonthlyAttendanceSection
                employees={filteredEmployees}
                monthDate={selectedMonthDate}
                viewMode={monthlyViewMode}
                weekIndex={selectedMonthWeekIndex}
                onChangeMonthDate={handleMonthDateChange}
                onChangeViewMode={handleMonthViewChange}
                onChangeWeekIndex={setSelectedMonthWeekIndex}
                onOpenEditor={openMonthlyEditor}
              />
            )}
            {activeTab === "reports" && (
              <ReportsSection
                attendanceRange={attendanceRange}
                onChangeRange={setAttendanceRange}
                attendanceReportRows={attendanceReportRows}
                payrollSummary={payrollSummary}
                getReportSortIndicator={getReportSortIndicator}
                toggleReportSort={toggleReportSort}
                handleExportReportCsv={handleExportReportCsv}
              />
            )}
            {activeTab === "employees" && (
              <EmployeesSection
                employees={employees}
                onEdit={openEditModal}
                onDelete={(emp) =>
                  setDeleteDialog({ employeeId: emp.id, employeeName: emp.name, confirmText: "" })
                }
              />
            )}
          </div>
        </div>
      </div>

      {showEmployeeModal && (
        <EmployeeFormModal
          title={editingEmployee ? "Edit Employee" : "Add Employee"}
          description={editingEmployee ? "Update the selected employee information." : "Enter the new employee information."}
          values={form}
          errors={formErrors}
          onChange={setField}
          onClose={resetFormState}
          onSubmit={handleSaveEmployee}
          submitLabel={editingEmployee ? "Save Changes" : "Save Employee"}
        />
      )}

      {deleteDialog && (
        <DeleteConfirmModal
          state={deleteDialog}
          onChange={(value) => setDeleteDialog((prev) => prev ? { ...prev, confirmText: value } : prev)}
          onClose={() => setDeleteDialog(null)}
          onConfirm={() => {
            if (!deleteDialog || deleteDialog.confirmText !== DELETE_CONFIRMATION_CODE) return;
            setEmployees((prev) => prev.filter((emp) => emp.id !== deleteDialog.employeeId));
            setDeleteDialog(null);
            setToast({ type: "success", message: "Employee deleted successfully." });
          }}
        />
      )}

      {monthlyEditor && currentMonthlyEditorEmployee && (
        <MonthlyAttendanceEditorModal
          state={monthlyEditor}
          employee={currentMonthlyEditorEmployee}
          onClose={() => setMonthlyEditor(null)}
          onSave={(payload) => {
            handleUpdateEmployeeDayByDate(payload.employeeId, payload.date, {
              status: payload.status,
              workedHours: payload.workedHours,
              advanceAmount: payload.advanceAmount,
              notes: payload.notes,
            });
            setMonthlyEditor(null);
            setToast({ type: "success", message: "Day entry updated successfully." });
          }}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </>
  );
}
