import { useEffect, useMemo, useState } from "react";
import "./Employees.css";
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
    return {
      day,
      date,
    };
  });

  return {
    monthLabel: ref.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    days,
  };
}

function downloadTextFile(
  filename: string,
  content: string,
  type = "text/plain"
) {
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
  } else if (
    !(values.phone.startsWith("059") || values.phone.startsWith("056"))
  ) {
    errors.phone = "Phone number must start with 059 or 056.";
  } else if (values.phone.length !== 10) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!values.workStart) errors.workStart = "Work start time is required.";

  if (!values.workEnd) {
    errors.workEnd = "Work end time is required.";
  } else if (
    values.workStart &&
    timeToMinutes(values.workEnd) <= timeToMinutes(values.workStart)
  ) {
    errors.workEnd = "Work end time must be later than work start time.";
  }

  if (values.salaryType === "hourly") {
    if (values.hourlyRate === "") {
      errors.hourlyRate = "Hourly rate is required.";
    } else if (
      Number.isNaN(Number(values.hourlyRate)) ||
      Number(values.hourlyRate) < 0
    ) {
      errors.hourlyRate = "Hourly rate must be a valid positive number.";
    }
  }

  if (values.salaryType === "fixed") {
    if (values.fixedSalary === "") {
      errors.fixedSalary = "Fixed salary is required.";
    } else if (
      Number.isNaN(Number(values.fixedSalary)) ||
      Number(values.fixedSalary) < 0
    ) {
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

function getDefaultWorkedHours(
  employee: Employee,
  status: DailyAttendanceStatus
) {
  const fullShift = calculateShiftHours(employee.workStart, employee.workEnd);

  if (status === "absent" || status === "leave") return 0;
  if (status === "half-day") return Number((fullShift / 2).toFixed(2));
  return Number(fullShift.toFixed(2));
}

function getStatusLabel(status: DailyAttendanceStatus) {
  return DAILY_STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

function upsertDailyAttendance(
  employee: Employee,
  entry: DailyAttendanceEntry
): Employee {
  const currentEntries = getDailyAttendanceEntries(employee);
  const existingIndex = currentEntries.findIndex((item) => item.date === entry.date);

  const nextEntries =
    existingIndex >= 0
      ? currentEntries.map((item, index) => (index === existingIndex ? entry : item))
      : [entry, ...currentEntries];

  return {
    ...employee,
    dailyAttendance: nextEntries,
  };
}

function getDailyAttendanceSummaryForRange(
  employee: Employee,
  range: AttendanceRange
) {
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
    {
      present: 0,
      late: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      totalHours: 0,
      advance: 0,
    }
  );
}

function getEmployeePayrollForRange(employee: Employee, range: AttendanceRange) {
  const summary = getDailyAttendanceSummaryForRange(employee, range);

  const gross =
    employee.salaryType === "hourly"
      ? summary.totalHours * Number(employee.hourlyRate || 0)
      : Number(employee.fixedSalary || 0);

  const net = gross - summary.advance;

  return {
    totalHours: summary.totalHours,
    gross,
    advance: summary.advance,
    net,
  };
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

function EmployeeFormModal({
  title,
  description,
  values,
  errors,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
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
      <div
        className="modal-card employees-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="employees-form-grid">
            <div>
              <label className="modal-label">Employee Name</label>
              <input
                className="modal-input"
                type="text"
                value={values.name}
                onChange={(e) => onChange("name", e.target.value)}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div>
              <label className="modal-label">Phone</label>
              <input
                className="modal-input"
                type="text"
                value={values.phone}
                onChange={(e) =>
                  onChange(
                    "phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
              />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            <div>
              <label className="modal-label">Work Start</label>
              <input
                className="modal-input"
                type="time"
                value={values.workStart}
                onChange={(e) => onChange("workStart", e.target.value)}
              />
              {errors.workStart && (
                <p className="form-error">{errors.workStart}</p>
              )}
            </div>

            <div>
              <label className="modal-label">Work End</label>
              <input
                className="modal-input"
                type="time"
                value={values.workEnd}
                onChange={(e) => onChange("workEnd", e.target.value)}
              />
              {errors.workEnd && <p className="form-error">{errors.workEnd}</p>}
            </div>

            <div>
              <label className="modal-label">Salary Type</label>
              <select
                className="modal-input"
                value={values.salaryType}
                onChange={(e) =>
                  onChange("salaryType", e.target.value as SalaryType)
                }
              >
                <option value="hourly">Hourly Salary</option>
                <option value="fixed">Fixed Salary</option>
              </select>
            </div>

            {values.salaryType === "hourly" ? (
              <div>
                <label className="modal-label">Hourly Rate</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="1"
                  value={values.hourlyRate}
                  onChange={(e) => onChange("hourlyRate", e.target.value)}
                />
                {errors.hourlyRate && (
                  <p className="form-error">{errors.hourlyRate}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="modal-label">Fixed Salary</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="1"
                  value={values.fixedSalary}
                  onChange={(e) => onChange("fixedSalary", e.target.value)}
                />
                {errors.fixedSalary && (
                  <p className="form-error">{errors.fixedSalary}</p>
                )}
              </div>
            )}

            <div className="employees-form-grid-full">
              <label className="modal-label">Notes</label>
              <textarea
                className="modal-input"
                rows={4}
                value={values.notes}
                onChange={(e) => onChange("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-primary-btn">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  state,
  onChange,
  onClose,
  onConfirm,
}: {
  state: NonNullable<DeleteDialogState>;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isValid = state.confirmText === DELETE_CONFIRMATION_CODE;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card confirm-dialog-card employees-danger-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Delete Employee</h2>
            <p>Danger zone</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="employees-confirm-body">
          <p className="employees-danger-text">
            You are about to permanently delete <strong>{state.employeeName}</strong>.
          </p>

          <label className="modal-label">
            Type <strong>{DELETE_CONFIRMATION_CODE}</strong> to confirm
          </label>
          <input
            className="modal-input"
            type="text"
            value={state.confirmText}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="quick-action-btn delete-btn"
            disabled={!isValid}
            onClick={onConfirm}
            style={{
              opacity: isValid ? 1 : 0.5,
              cursor: isValid ? "pointer" : "not-allowed",
            }}
          >
            Delete Employee
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthlyAttendanceEditorModal({
  state,
  employee,
  onClose,
  onSave,
}: {
  state: NonNullable<MonthlyEditorState>;
  employee: Employee;
  onClose: () => void;
  onSave: (payload: {
    employeeId: string;
    date: string;
    status: DailyAttendanceStatus;
    workedHours: number;
    advanceAmount: number;
    notes?: string;
  }) => void;
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
      <div
        className="modal-card confirm-dialog-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{state.employeeName}</h2>
            <p>{state.date}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-form">
          <div>
            <label className="modal-label">Status</label>
            <select
              className="modal-input"
              value={status}
              onChange={(e) => {
                const nextStatus = e.target.value as DailyAttendanceStatus;
                setStatus(nextStatus);
                setWorkedHours(
                  String(getDefaultWorkedHours(employee, nextStatus))
                );
              }}
            >
              {DAILY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="modal-label">Worked Hours</label>
            <input
              className="modal-input"
              type="number"
              min="0"
              step="0.25"
              value={workedHours}
              onChange={(e) => setWorkedHours(e.target.value)}
            />
          </div>

          <div>
            <label className="modal-label">Advance</label>
            <input
              className="modal-input"
              type="number"
              min="0"
              step="1"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="modal-label">Notes</label>
            <textarea
              className="modal-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="modal-primary-btn"
              onClick={() => {
                onSave({
                  employeeId: state.employeeId,
                  date: state.date,
                  status,
                  workedHours: Number(workedHours || 0),
                  advanceAmount: Number(advanceAmount || 0),
                  notes: notes.trim() || undefined,
                });
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeeCard({
  employee,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fullShift = calculateShiftHours(employee.workStart, employee.workEnd);

  return (
    <article className="employees-staff-card employees-staff-card-minimal">
      <div className="employees-minimal-top">
        <div className="employees-minimal-user">
          <div className="employees-minimal-avatar">
            {employee.name.charAt(0).toUpperCase()}
          </div>

          <div className="employees-minimal-meta">
            <h3>{employee.name}</h3>
            <span>{employee.id}</span>
            <span>{employee.phone}</span>
          </div>
        </div>
      </div>

      <div className="employees-minimal-grid">
        <div className="employees-minimal-box">
          <span>Shift</span>
          <strong>
            {employee.workStart} - {employee.workEnd}
          </strong>
        </div>

        <div className="employees-minimal-box">
          <span>Default Hours</span>
          <strong>{fullShift.toFixed(2)} h</strong>
        </div>
      </div>

      <div className="employees-minimal-actions">
        <button
          type="button"
          className="quick-action-btn secondary"
          onClick={onEdit}
        >
          Edit
        </button>

        <button
          type="button"
          className="quick-action-btn delete-btn"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function TodayAttendanceSection({
  employees,
  selectedDate,
  onChangeDate,
  onApplyPresentToAll,
  onUpdateEmployeeDay,
  onSaveSheet,
}: {
  employees: Employee[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onApplyPresentToAll: () => void;
  onUpdateEmployeeDay: (
    employeeId: string,
    payload: {
      status: DailyAttendanceStatus;
      workedHours: number;
      advanceAmount: number;
      notes?: string;
    }
  ) => void;
  onSaveSheet: () => void;
}) {
  const todaySummary = useMemo(() => {
    return employees.reduce(
      (acc, employee) => {
        const current =
          getDailyAttendanceEntryByDate(employee, selectedDate) || null;

        if (!current) return acc;

        if (current.status === "present") acc.present += 1;
        if (current.status === "late") acc.late += 1;
        if (current.status === "absent") acc.absent += 1;
        if (current.status === "half-day") acc.halfDay += 1;
        if (current.status === "leave") acc.leave += 1;

        acc.advance += Number(current.advanceAmount || 0);
        return acc;
      },
      {
        present: 0,
        late: 0,
        absent: 0,
        halfDay: 0,
        leave: 0,
        advance: 0,
      }
    );
  }, [employees, selectedDate]);

  return (
    <>
      <div className="employees-attendance-simple-card">
        <div className="employees-attendance-simple-toolbar employees-attendance-simple-toolbar-clean">
          <div className="employees-attendance-simple-search-info">
            <h3>Today Attendance</h3>
            <p>Choose the date, prepare the day, then edit only the exceptions.</p>
          </div>

          <div className="employees-attendance-simple-controls">
            <input
              className="modal-input employees-attendance-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => onChangeDate(e.target.value)}
            />

            <button
              type="button"
              className="quick-action-btn secondary"
              onClick={onApplyPresentToAll}
            >
              Prepare Day
            </button>

            <button
              type="button"
              className="quick-action-btn"
              onClick={onSaveSheet}
            >
              Save Day
            </button>
          </div>
        </div>

        <div className="employees-mini-stats">
          <div className="employees-mini-stat">
            <span>Present</span>
            <strong>{todaySummary.present}</strong>
          </div>
          <div className="employees-mini-stat">
            <span>Late</span>
            <strong>{todaySummary.late}</strong>
          </div>
          <div className="employees-mini-stat">
            <span>Absent</span>
            <strong>{todaySummary.absent}</strong>
          </div>
          <div className="employees-mini-stat">
            <span>Advances Today</span>
            <strong>${todaySummary.advance.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className="employees-attendance-simple-card">
        <div className="employees-attendance-simple-search-info" style={{ marginBottom: 16 }}>
          <h3>Daily Sheet</h3>
          <p>Edit only employees who differ from the default attendance.</p>
        </div>

        {employees.length > 0 ? (
          <div className="employees-attendance-table-wrap">
            <table className="employees-attendance-table employees-daily-sheet-table employees-simple-sheet-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Hours</th>
                  <th>Advance</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => {
                  const current =
                    getDailyAttendanceEntryByDate(employee, selectedDate) || {
                      date: selectedDate,
                      status: "present" as DailyAttendanceStatus,
                      workedHours: getDefaultWorkedHours(employee, "present"),
                      advanceAmount: 0,
                      notes: "",
                    };

                  return (
                    <tr key={employee.id}>
                      <td>
                        <div className="employees-attendance-user">
                          <div className="employees-attendance-avatar">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{employee.name}</strong>
                            <span>
                              {employee.workStart} - {employee.workEnd}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <select
                          className="modal-input"
                          value={current.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as DailyAttendanceStatus;
                            onUpdateEmployeeDay(employee.id, {
                              status: nextStatus,
                              workedHours: getDefaultWorkedHours(employee, nextStatus),
                              advanceAmount: current.advanceAmount,
                              notes: current.notes,
                            });
                          }}
                        >
                          {DAILY_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <input
                          className="modal-input"
                          type="number"
                          min="0"
                          step="0.25"
                          value={current.workedHours}
                          onChange={(e) =>
                            onUpdateEmployeeDay(employee.id, {
                              status: current.status,
                              workedHours: Number(e.target.value || 0),
                              advanceAmount: current.advanceAmount,
                              notes: current.notes,
                            })
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="modal-input"
                          type="number"
                          min="0"
                          step="1"
                          value={current.advanceAmount}
                          onChange={(e) =>
                            onUpdateEmployeeDay(employee.id, {
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
                          className="modal-input"
                          type="text"
                          value={current.notes || ""}
                          placeholder="Optional note"
                          onChange={(e) =>
                            onUpdateEmployeeDay(employee.id, {
                              status: current.status,
                              workedHours: current.workedHours,
                              advanceAmount: current.advanceAmount,
                              notes: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="employees-empty-state employees-cards-empty-state">
            <strong>No employees found yet.</strong>
            <span>Add your first employee to start managing attendance.</span>
          </div>
        )}
      </div>
    </>
  );
}

function MonthlyAttendanceSection({
  employees,
  monthDate,
  onChangeMonthDate,
  onOpenEditor,
}: {
  employees: Employee[];
  monthDate: string;
  onChangeMonthDate: (date: string) => void;
  onOpenEditor: (employee: Employee, date: string) => void;
}) {
  const { monthLabel, days } = useMemo(() => getMonthDays(monthDate), [monthDate]);

  return (
    <>
      <div className="employees-attendance-simple-card">
        <div className="employees-attendance-simple-toolbar employees-attendance-simple-toolbar-clean">
          <div className="employees-attendance-simple-search-info">
            <h3>Monthly Attendance</h3>
            <p>Click any day for any employee to edit status, hours, advance, and notes.</p>
          </div>

          <div className="employees-attendance-simple-controls">
            <button
              type="button"
              className="quick-action-btn secondary"
              onClick={() => onChangeMonthDate(shiftMonth(monthDate, -1))}
            >
              Previous Month
            </button>

            <div className="employees-month-label-chip">{monthLabel}</div>

            <button
              type="button"
              className="quick-action-btn secondary"
              onClick={() => onChangeMonthDate(shiftMonth(monthDate, 1))}
            >
              Next Month
            </button>
          </div>
        </div>
      </div>

      <div className="employees-attendance-simple-card">
        {employees.length > 0 ? (
          <div className="employees-monthly-grid-wrap">
            <table className="employees-monthly-grid-table">
              <thead>
                <tr>
                  <th className="employees-monthly-name-col">Employee</th>
                  {days.map((day) => (
                    <th key={day.date}>{day.day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="employees-monthly-name-cell">
                      <div className="employees-attendance-user">
                        <div className="employees-attendance-avatar">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{employee.name}</strong>
                          <span>
                            {employee.workStart} - {employee.workEnd}
                          </span>
                        </div>
                      </div>
                    </td>

                    {days.map((day) => {
                      const entry = getDailyAttendanceEntryByDate(employee, day.date);

                      return (
                        <td key={day.date}>
                          <button
                            type="button"
                            className={`employees-monthly-day-btn ${
                              entry
                                ? DAILY_STATUS_CLASS_MAP[entry.status]
                                : "is-empty"
                            }`}
                            onClick={() => onOpenEditor(employee, day.date)}
                            title={
                              entry
                                ? `${getStatusLabel(entry.status)} - ${day.date}`
                                : `${day.date}`
                            }
                          >
                            <span className="employees-monthly-day-number">
                              {day.day}
                            </span>
                            <strong className="employees-monthly-day-status">
                              {entry
                                ? DAILY_STATUS_SHORT_LABELS[entry.status]
                                : "-"}
                            </strong>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="employees-empty-state employees-cards-empty-state">
            <strong>No employees found yet.</strong>
            <span>Add your first employee to start managing the monthly schedule.</span>
          </div>
        )}
      </div>
    </>
  );
}

function ReportsSection({
  attendanceRange,
  onChangeRange,
  attendanceReportRows,
  payrollSummary,
  getReportSortIndicator,
  toggleReportSort,
  handleExportReportCsv,
}: {
  attendanceRange: AttendanceRange;
  onChangeRange: (range: AttendanceRange) => void;
  attendanceReportRows: Array<{
    id: string;
    name: string;
    phone: string;
    present: number;
    late: number;
    absent: number;
    halfDay: number;
    leave: number;
    totalHours: number;
    gross: number;
    advance: number;
    net: number;
  }>;
  payrollSummary: {
    gross: number;
    advance: number;
    net: number;
  };
  getReportSortIndicator: (key: ReportSortKey) => string;
  toggleReportSort: (key: ReportSortKey) => void;
  handleExportReportCsv: () => void;
}) {
  return (
    <>
      <div className="employees-attendance-simple-card">
        <div className="employees-attendance-simple-toolbar employees-attendance-simple-toolbar-clean">
          <div className="employees-attendance-simple-search-info">
            <h3>Reports</h3>
            <p>Review attendance and payroll without affecting daily entry.</p>
          </div>

          <div className="employees-report-actions">
            <div className="employees-range-switch employees-range-switch-compact">
              <button
                type="button"
                className={`employees-range-chip ${
                  attendanceRange === "today" ? "active" : ""
                }`}
                onClick={() => onChangeRange("today")}
              >
                Today
              </button>
              <button
                type="button"
                className={`employees-range-chip ${
                  attendanceRange === "week" ? "active" : ""
                }`}
                onClick={() => onChangeRange("week")}
              >
                This Week
              </button>
              <button
                type="button"
                className={`employees-range-chip ${
                  attendanceRange === "month" ? "active" : ""
                }`}
                onClick={() => onChangeRange("month")}
              >
                This Month
              </button>
            </div>

            <button
              type="button"
              className="quick-action-btn secondary"
              onClick={handleExportReportCsv}
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="employees-mini-stats">
          <div className="employees-mini-stat">
            <span>Gross</span>
            <strong>${payrollSummary.gross.toFixed(2)}</strong>
          </div>
          <div className="employees-mini-stat">
            <span>Advance</span>
            <strong>${payrollSummary.advance.toFixed(2)}</strong>
          </div>
          <div className="employees-mini-stat">
            <span>Net</span>
            <strong>${payrollSummary.net.toFixed(2)}</strong>
          </div>
          <div className="employees-mini-stat">
            <span>Range</span>
            <strong>{getRangeTitle(attendanceRange)}</strong>
          </div>
        </div>
      </div>

      <div className="employees-report-card employees-report-card-compact">
        <div className="employees-report-head">
          <div>
            <h3>Attendance & Payroll Report</h3>
            <p>
              Summary for <strong>{getRangeTitle(attendanceRange)}</strong>
            </p>
          </div>
        </div>

        {attendanceReportRows.length > 0 ? (
          <div className="employees-report-table-wrap">
            <table className="employees-report-table">
              <thead>
                <tr>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("name")}
                  >
                    Employee {getReportSortIndicator("name")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("present")}
                  >
                    Present {getReportSortIndicator("present")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("late")}
                  >
                    Late {getReportSortIndicator("late")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("absent")}
                  >
                    Absent {getReportSortIndicator("absent")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("halfDay")}
                  >
                    Half Day {getReportSortIndicator("halfDay")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("leave")}
                  >
                    Leave {getReportSortIndicator("leave")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("totalHours")}
                  >
                    Hours {getReportSortIndicator("totalHours")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("gross")}
                  >
                    Gross {getReportSortIndicator("gross")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("advance")}
                  >
                    Advance {getReportSortIndicator("advance")}
                  </th>
                  <th
                    className="employees-sortable"
                    onClick={() => toggleReportSort("net")}
                  >
                    Net {getReportSortIndicator("net")}
                  </th>
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
          <div className="employees-empty-state employees-cards-empty-state">
            <strong>No report data found.</strong>
            <span>No daily attendance records are available for the selected period.</span>
          </div>
        )}
      </div>
    </>
  );
}

function EmployeesSection({
  employees,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}) {
  return (
    <>
      <div className="employees-attendance-simple-card">
        <div className="employees-attendance-simple-toolbar employees-attendance-simple-toolbar-clean">
          <div className="employees-attendance-simple-search-info">
            <h3>Employees</h3>
            <p>Manage employee data separately from attendance and reports.</p>
          </div>
        </div>
      </div>

      {employees.length > 0 ? (
        <div className="employees-cards-grid employees-cards-grid-lite">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={() => onEdit(emp)}
              onDelete={() => onDelete(emp)}
            />
          ))}
        </div>
      ) : (
        <div className="employees-empty-state employees-cards-empty-state">
          <strong>No employees found yet.</strong>
          <span>Add your first employee to start managing records.</span>
        </div>
      )}
    </>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<MainTab>("today");
  const [attendanceRange, setAttendanceRange] =
    useState<AttendanceRange>("today");
  const [selectedAttendanceDate, setSelectedAttendanceDate] =
    useState(getTodayDate());
  const [selectedMonthDate, setSelectedMonthDate] =
    useState(getTodayDate());

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});

  const [toast, setToast] = useState<ToastState>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);
  const [monthlyEditor, setMonthlyEditor] = useState<MonthlyEditorState>(null);

  const [reportSortKey, setReportSortKey] = useState<ReportSortKey>("name");
  const [reportSortDirection, setReportSortDirection] =
    useState<ReportSortDirection>("asc");

  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredEmployees = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return employees;

    return employees.filter((emp) =>
      [emp.id, emp.name, emp.phone, emp.notes || ""]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [employees, searchTerm]);

  const payrollSummary = useMemo(() => {
    return employees.reduce(
      (acc, employee) => {
        const payroll = getEmployeePayrollForRange(employee, attendanceRange);
        acc.gross += payroll.gross;
        acc.advance += payroll.advance;
        acc.net += payroll.net;
        return acc;
      },
      { gross: 0, advance: 0, net: 0 }
    );
  }, [employees, attendanceRange]);

  const attendanceReportRows = useMemo(() => {
    const rows = employees
      .map((employee) => getEmployeeReportRow(employee, attendanceRange))
      .filter(
        (row) =>
          row.present > 0 ||
          row.late > 0 ||
          row.absent > 0 ||
          row.halfDay > 0 ||
          row.leave > 0 ||
          row.totalHours > 0
      );

    return [...rows].sort((a, b) => {
      if (reportSortKey === "name") {
        const result = a.name.localeCompare(b.name);
        return reportSortDirection === "asc" ? result : -result;
      }

      const result =
        Number(a[reportSortKey] as number) - Number(b[reportSortKey] as number);

      return reportSortDirection === "asc" ? result : -result;
    });
  }, [employees, attendanceRange, reportSortKey, reportSortDirection]);

  const currentMonthlyEditorEmployee = monthlyEditor
    ? employees.find((emp) => emp.id === monthlyEditor.employeeId) || null
    : null;

  const getReportSortIndicator = (key: ReportSortKey) => {
    if (reportSortKey !== key) return "";
    return reportSortDirection === "asc" ? "↑" : "↓";
  };

  const toggleReportSort = (key: ReportSortKey) => {
    if (reportSortKey === key) {
      setReportSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setReportSortKey(key);
    setReportSortDirection(key === "name" ? "asc" : "desc");
  };

  const setField = (field: keyof EmployeeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetFormState = () => {
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowEmployeeModal(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      phone: employee.phone,
      workStart: employee.workStart,
      workEnd: employee.workEnd,
      salaryType: employee.salaryType,
      hourlyRate: String(employee.hourlyRate ?? 0),
      fixedSalary: String(employee.fixedSalary ?? 0),
      notes: employee.notes ?? "",
    });
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
            ? {
                ...emp,
                name: form.name.trim(),
                phone: form.phone.trim(),
                workStart: form.workStart,
                workEnd: form.workEnd,
                salaryType: form.salaryType,
                hourlyRate:
                  form.salaryType === "hourly"
                    ? Number(form.hourlyRate)
                    : undefined,
                fixedSalary:
                  form.salaryType === "fixed"
                    ? Number(form.fixedSalary)
                    : undefined,
                notes: form.notes.trim(),
              }
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
      hourlyRate:
        form.salaryType === "hourly" ? Number(form.hourlyRate) : undefined,
      fixedSalary:
        form.salaryType === "fixed" ? Number(form.fixedSalary) : undefined,
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
      prev.map((employee) =>
        upsertDailyAttendance(employee, {
          date: selectedAttendanceDate,
          status: "present",
          workedHours: getDefaultWorkedHours(employee, "present"),
          advanceAmount: 0,
          notes: "",
        })
      )
    );

    setToast({
      type: "success",
      message: "Default present attendance applied to all employees.",
    });
  };

  const handleUpdateEmployeeDayByDate = (
    employeeId: string,
    date: string,
    payload: {
      status: DailyAttendanceStatus;
      workedHours: number;
      advanceAmount: number;
      notes?: string;
    }
  ) => {
    setEmployees((prev) =>
      prev.map((employee) => {
        if (employee.id !== employeeId) return employee;

        const updatedEmployee = upsertDailyAttendance(employee, {
          date,
          status: payload.status,
          workedHours: payload.workedHours,
          advanceAmount: payload.advanceAmount,
          notes: payload.notes?.trim() || undefined,
        });

        const nextAdvances = getEmployeeAdvances(updatedEmployee).filter(
          (item) => item.date !== date
        );

        if (payload.advanceAmount > 0) {
          nextAdvances.unshift({
            id: `ADV-${employeeId}-${date}`,
            amount: payload.advanceAmount,
            date,
            notes: payload.notes?.trim() || "Daily attendance advance",
          });
        }

        return {
          ...updatedEmployee,
          advances: nextAdvances,
          advance: nextAdvances.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
          ),
        };
      })
    );
  };

  const handleUpdateEmployeeDay = (
    employeeId: string,
    payload: {
      status: DailyAttendanceStatus;
      workedHours: number;
      advanceAmount: number;
      notes?: string;
    }
  ) => {
    handleUpdateEmployeeDayByDate(employeeId, selectedAttendanceDate, payload);
  };

  const handleSaveDailyRegister = () => {
    setToast({
      type: "success",
      message: `Daily register for ${selectedAttendanceDate} saved successfully.`,
    });
  };

  const handleExportReportCsv = () => {
    if (attendanceReportRows.length === 0) {
      setToast({
        type: "warning",
        message: "No report data available to export.",
      });
      return;
    }

    const headers = [
      "Employee",
      "Employee ID",
      "Phone",
      "Present",
      "Late",
      "Absent",
      "Half Day",
      "Leave",
      "Total Hours",
      "Gross Payroll",
      "Advance",
      "Net Payroll",
    ];

    const rows = attendanceReportRows.map((row) => [
      row.name,
      row.id,
      row.phone,
      row.present,
      row.late,
      row.absent,
      row.halfDay,
      row.leave,
      row.totalHours.toFixed(2),
      row.gross.toFixed(2),
      row.advance.toFixed(2),
      row.net.toFixed(2),
    ]);

    const csvContent = [
      headers.map(toCsvValue).join(","),
      ...rows.map((row) => row.map(toCsvValue).join(",")),
    ].join("\n");

    downloadTextFile(
      `daily-attendance-report-${getAttendanceRangeLabel(attendanceRange)}.csv`,
      csvContent,
      "text/csv;charset=utf-8;"
    );

    setToast({
      type: "success",
      message: "Attendance report exported successfully.",
    });
  };

  const openMonthlyEditor = (employee: Employee, date: string) => {
    const entry = getDailyAttendanceEntryByDate(employee, date);

    setMonthlyEditor({
      employeeId: employee.id,
      employeeName: employee.name,
      date,
      status: entry?.status || "present",
      workedHours: String(
        entry?.workedHours ?? getDefaultWorkedHours(employee, "present")
      ),
      advanceAmount: String(entry?.advanceAmount ?? 0),
      notes: entry?.notes || "",
    });
  };

  return (
    <>
      <div className="employees-page employees-lux-page">
        <div className="employees-header employees-lux-header">
          <div>
            <p className="dashboard-badge">Employee Management</p>
            <h1 className="dashboard-title">Employees</h1>
            <p className="dashboard-subtitle employees-hero-text">
              A simpler layout for daily attendance, monthly attendance, reports, and employee records.
            </p>
          </div>

          <div className="employees-header-actions">
            <button
              type="button"
              className="quick-action-btn employees-add-btn"
              onClick={openAddModal}
            >
              + Add Employee
            </button>

            <div className="employees-header-search-box">
              <input
                type="text"
                className="dashboard-search-input employees-header-search-input"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="dashboard-card employees-main-card">
          <div className="employees-view-switch">
            <button
              type="button"
              className={`employees-view-toggle ${
                activeTab === "today" ? "active" : ""
              }`}
              onClick={() => setActiveTab("today")}
            >
              Today Attendance
            </button>

            <button
              type="button"
              className={`employees-view-toggle ${
                activeTab === "monthly" ? "active" : ""
              }`}
              onClick={() => setActiveTab("monthly")}
            >
              Monthly Attendance
            </button>

            <button
              type="button"
              className={`employees-view-toggle ${
                activeTab === "reports" ? "active" : ""
              }`}
              onClick={() => setActiveTab("reports")}
            >
              Reports
            </button>

            <button
              type="button"
              className={`employees-view-toggle ${
                activeTab === "employees" ? "active" : ""
              }`}
              onClick={() => setActiveTab("employees")}
            >
              Employees
            </button>
          </div>

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
              onChangeMonthDate={setSelectedMonthDate}
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
              employees={filteredEmployees}
              onEdit={openEditModal}
              onDelete={(emp) =>
                setDeleteDialog({
                  employeeId: emp.id,
                  employeeName: emp.name,
                  confirmText: "",
                })
              }
            />
          )}
        </div>
      </div>

      {showEmployeeModal && (
        <EmployeeFormModal
          title={editingEmployee ? "Edit Employee" : "Add Employee"}
          description={
            editingEmployee
              ? "Update the selected employee information."
              : "Enter the new employee information."
          }
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
          onChange={(value) =>
            setDeleteDialog((prev) =>
              prev ? { ...prev, confirmText: value } : prev
            )
          }
          onClose={() => setDeleteDialog(null)}
          onConfirm={() => {
            if (
              !deleteDialog ||
              deleteDialog.confirmText !== DELETE_CONFIRMATION_CODE
            ) {
              return;
            }

            setEmployees((prev) =>
              prev.filter((emp) => emp.id !== deleteDialog.employeeId)
            );
            setDeleteDialog(null);
            setToast({
              type: "success",
              message: "Employee deleted successfully.",
            });
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
            setToast({
              type: "success",
              message: "Day entry updated successfully.",
            });
          }}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </>
  );
}