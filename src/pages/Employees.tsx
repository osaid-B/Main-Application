import { useEffect, useMemo, useState } from "react";
import { getEmployees, saveEmployees } from "../data/storage";
import type {
  AttendanceRecord,
  AttendanceRecordStatus,
  Employee,
  SalaryType,
} from "../data/types";

type EmployeeForm = {
  name: string;
  phone: string;
  workStart: string;
  workEnd: string;
  salaryType: SalaryType;
  hourlyRate: string;
  fixedSalary: string;
  advance: string;
  notes: string;
};

type EmployeeFormErrors = {
  name?: string;
  phone?: string;
  workStart?: string;
  workEnd?: string;
  hourlyRate?: string;
  fixedSalary?: string;
  advance?: string;
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

type AdvanceDialogState =
  | {
      employeeId: string;
      employeeName: string;
      amount: string;
      error?: string;
    }
  | null;

type AttendanceHistoryDialogState =
  | {
      employeeId: string;
      employeeName: string;
    }
  | null;

type ViewMode = "overview" | "attendance";
type AttendanceRange = "today" | "week" | "month";

type AttendanceFilter =
  | "all"
  | "not-started"
  | "working"
  | "finished"
  | "late"
  | "absent";

type TodayAttendanceStatus =
  | "Not Started"
  | "Working"
  | "Finished"
  | "Late"
  | "Absent";

type ReportSortKey =
  | "name"
  | "finished"
  | "working"
  | "late"
  | "absent"
  | "totalHours"
  | "gross"
  | "advance"
  | "net";

type ReportSortDirection = "asc" | "desc";

const EMPTY_FORM: EmployeeForm = {
  name: "",
  phone: "",
  workStart: "08:00",
  workEnd: "17:00",
  salaryType: "hourly",
  hourlyRate: "10",
  fixedSalary: "0",
  advance: "0",
  notes: "",
};

const DELETE_CONFIRMATION_CODE = "123";

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const calculateHours = (start: string, end: string) => {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.max(diff / 60, 0);
};

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

function getLastNDates(count: number) {
  const days: { date: string; label: string; day: string }[] = [];
  const today = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    days.push({
      date: d.toISOString().slice(0, 10),
      label: String(d.getDate()).padStart(2, "0"),
      day: formatDayLabel(d),
    });
  }

  return days;
}

function getLastNDatesDetailed(count: number) {
  const days: {
    date: string;
    label: string;
    day: string;
    month: string;
  }[] = [];

  const today = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    days.push({
      date: d.toISOString().slice(0, 10),
      label: String(d.getDate()).padStart(2, "0"),
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  return days;
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

function getAttendanceRangeLabel(range: AttendanceRange) {
  if (range === "today") return "today";
  if (range === "week") return "this-week";
  return "this-month";
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

  if (!values.name.trim()) {
    errors.name = "Employee name is required.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (
    !(values.phone.startsWith("059") || values.phone.startsWith("056"))
  ) {
    errors.phone = "Phone number must start with 059 or 056.";
  } else if (values.phone.length !== 10) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!values.workStart) {
    errors.workStart = "Work start time is required.";
  }

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

  if (
    values.advance !== "" &&
    (Number.isNaN(Number(values.advance)) || Number(values.advance) < 0)
  ) {
    errors.advance = "Advance must be a valid positive number.";
  }

  return errors;
}

function getAttendanceRecords(employee: Employee): AttendanceRecord[] {
  return Array.isArray(employee.attendanceRecords)
    ? employee.attendanceRecords
    : [];
}

function getTodayAttendanceRecord(
  employee: Employee
): AttendanceRecord | undefined {
  const today = getTodayDate();
  const record = getAttendanceRecords(employee).find(
    (item) => item.date === today
  );

  if (record) return record;

  if (employee.checkIn || employee.checkOut) {
    const actualHours =
      employee.checkIn && employee.checkOut
        ? calculateHours(employee.checkIn, employee.checkOut)
        : 0;

    const legacyStatus: AttendanceRecordStatus =
      employee.checkIn && employee.checkOut
        ? "finished"
        : employee.checkIn
        ? timeToMinutes(employee.checkIn) > timeToMinutes(employee.workStart)
          ? "late"
          : "working"
        : "not-started";

    return {
      date: today,
      checkIn: employee.checkIn,
      checkOut: employee.checkOut,
      status: legacyStatus,
      actualHours,
    };
  }

  return undefined;
}

function getTodayStatus(employee: Employee): TodayAttendanceStatus {
  const record = getTodayAttendanceRecord(employee);

  if (!record || (!record.checkIn && !record.checkOut)) return "Not Started";
  if (record.status === "absent") return "Absent";
  if (record.status === "late" && !record.checkOut) return "Late";
  if (record.checkIn && !record.checkOut) return "Working";
  if (record.checkIn && record.checkOut) return "Finished";
  return "Not Started";
}

function getTodayActualHours(employee: Employee) {
  const record = getTodayAttendanceRecord(employee);

  if (!record) return 0;
  if (typeof record.actualHours === "number") return record.actualHours;
  if (record.checkIn && record.checkOut) {
    return calculateHours(record.checkIn, record.checkOut);
  }

  return 0;
}

function upsertTodayAttendance(
  employee: Employee,
  updater: (current?: AttendanceRecord) => AttendanceRecord
): Employee {
  const today = getTodayDate();
  const records = getAttendanceRecords(employee);
  const index = records.findIndex((item) => item.date === today);
  const current =
    index >= 0 ? records[index] : getTodayAttendanceRecord(employee);
  const nextRecord = updater(current);

  let nextRecords: AttendanceRecord[];

  if (index >= 0) {
    nextRecords = records.map((item, i) => (i === index ? nextRecord : item));
  } else {
    nextRecords = [...records, nextRecord];
  }

  return {
    ...employee,
    attendanceRecords: nextRecords,
    checkIn: nextRecord.checkIn,
    checkOut: nextRecord.checkOut,
  };
}

function getMiniHistoryStatus(
  employee: Employee,
  date: string
): AttendanceRecordStatus | "empty" {
  const record = getAttendanceRecords(employee).find(
    (item) => item.date === date
  );
  if (!record) return "empty";
  return record.status;
}

function getAttendanceStatusLabel(status: AttendanceRecordStatus | "empty") {
  if (status === "working") return "Working";
  if (status === "finished") return "Finished";
  if (status === "late") return "Late";
  if (status === "absent") return "Absent";
  if (status === "not-started") return "Not Started";
  return "No Record";
}

function getEmployeeAttendanceSummary(employee: Employee) {
  const records = getAttendanceRecords(employee);

  return records.reduce(
    (acc, record) => {
      if (record.status === "working") acc.working += 1;
      if (record.status === "finished") acc.finished += 1;
      if (record.status === "late") acc.late += 1;
      if (record.status === "absent") acc.absent += 1;
      return acc;
    },
    {
      working: 0,
      finished: 0,
      late: 0,
      absent: 0,
    }
  );
}

function getEmployeeRangeSummary(employee: Employee, range: AttendanceRange) {
  const records = getAttendanceRecords(employee).filter((record) =>
    isDateInRange(record.date, range)
  );

  return records.reduce(
    (acc, record) => {
      if (record.status === "working") acc.working += 1;
      if (record.status === "finished") acc.finished += 1;
      if (record.status === "late") acc.late += 1;
      if (record.status === "absent") acc.absent += 1;
      acc.totalHours += Number(record.actualHours || 0);
      return acc;
    },
    {
      working: 0,
      finished: 0,
      late: 0,
      absent: 0,
      totalHours: 0,
    }
  );
}

function getGlobalRangeSummary(employees: Employee[], range: AttendanceRange) {
  return employees.reduce(
    (acc, employee) => {
      const summary = getEmployeeRangeSummary(employee, range);
      acc.working += summary.working;
      acc.finished += summary.finished;
      acc.late += summary.late;
      acc.absent += summary.absent;
      acc.totalHours += summary.totalHours;
      return acc;
    },
    {
      working: 0,
      finished: 0,
      late: 0,
      absent: 0,
      totalHours: 0,
    }
  );
}

function getEmployeePayrollForRange(employee: Employee, range: AttendanceRange) {
  const summary = getEmployeeRangeSummary(employee, range);

  const gross =
    employee.salaryType === "hourly"
      ? summary.totalHours * Number(employee.hourlyRate || 0)
      : Number(employee.fixedSalary || 0);

  const advance = Number(employee.advance || 0);
  const net = gross - advance;

  return {
    totalHours: summary.totalHours,
    gross,
    advance,
    net,
  };
}

function getRangeTitle(range: AttendanceRange) {
  if (range === "today") return "Today Summary";
  if (range === "week") return "This Week Summary";
  return "This Month Summary";
}

function getEmployeeReportRow(employee: Employee, range: AttendanceRange) {
  const summary = getEmployeeRangeSummary(employee, range);
  const payroll = getEmployeePayrollForRange(employee, range);

  return {
    id: employee.id,
    name: employee.name,
    phone: employee.phone,
    finished: summary.finished,
    working: summary.working,
    late: summary.late,
    absent: summary.absent,
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
                placeholder="Enter employee name"
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
                placeholder="Enter phone number"
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
                  placeholder="Enter hourly rate"
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
                  placeholder="Enter fixed salary"
                  value={values.fixedSalary}
                  onChange={(e) => onChange("fixedSalary", e.target.value)}
                />
                {errors.fixedSalary && (
                  <p className="form-error">{errors.fixedSalary}</p>
                )}
              </div>
            )}

            <div>
              <label className="modal-label">Advance</label>
              <input
                className="modal-input"
                type="number"
                min="0"
                step="1"
                placeholder="Enter advance"
                value={values.advance}
                onChange={(e) => onChange("advance", e.target.value)}
              />
              {errors.advance && <p className="form-error">{errors.advance}</p>}
            </div>

            <div className="employees-form-grid-full">
              <label className="modal-label">Notes</label>
              <textarea
                className="modal-input"
                rows={4}
                placeholder="Add employee notes..."
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
            You are about to permanently delete{" "}
            <strong>{state.employeeName}</strong>. This action cannot be undone.
          </p>

          <label className="modal-label">
            Type <strong>{DELETE_CONFIRMATION_CODE}</strong> to confirm
          </label>
          <input
            className="modal-input"
            type="text"
            placeholder={`Type ${DELETE_CONFIRMATION_CODE}`}
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

function AdvanceModal({
  state,
  onChange,
  onClose,
  onConfirm,
}: {
  state: NonNullable<AdvanceDialogState>;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card confirm-dialog-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Add Advance</h2>
            <p>Record a new advance payment</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="employees-confirm-body">
          <p className="employees-muted-text">
            Add an advance for <strong>{state.employeeName}</strong>.
          </p>

          <label className="modal-label">Advance Amount</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            step="1"
            placeholder="Enter advance amount"
            value={state.amount}
            onChange={(e) => onChange(e.target.value)}
          />

          {state.error && <p className="form-error">{state.error}</p>}
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
            onClick={onConfirm}
          >
            Confirm Advance
          </button>
        </div>
      </div>
    </div>
  );
}

function AttendanceHistoryModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const days = getLastNDatesDetailed(30);
  const summary = getEmployeeAttendanceSummary(employee);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card employees-history-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Attendance History</h2>
            <p>
              Review the recent attendance pattern for{" "}
              <strong>{employee.name}</strong>.
            </p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-form">
          <div className="employees-history-summary-grid">
            <div className="employees-summary-box">
              <span>Working</span>
              <strong>{summary.working}</strong>
            </div>

            <div className="employees-summary-box">
              <span>Finished</span>
              <strong>{summary.finished}</strong>
            </div>

            <div className="employees-summary-box">
              <span>Late</span>
              <strong>{summary.late}</strong>
            </div>

            <div className="employees-summary-box">
              <span>Absent</span>
              <strong>{summary.absent}</strong>
            </div>
          </div>

          <div className="employees-history-modal-grid">
            {days.map((day) => {
              const status = getMiniHistoryStatus(employee, day.date);

              return (
                <div
                  key={`${employee.id}-${day.date}`}
                  className={`employees-history-modal-cell ${status}`}
                  title={`${day.date} - ${getAttendanceStatusLabel(status)}`}
                >
                  <small>{day.day}</small>
                  <strong>{day.label}</strong>
                  <span>{day.month}</span>
                  <em>{getAttendanceStatusLabel(status)}</em>
                </div>
              );
            })}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-primary-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilter>("all");
  const [attendanceRange, setAttendanceRange] =
    useState<AttendanceRange>("today");

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});

  const [toast, setToast] = useState<ToastState>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);
  const [advanceDialog, setAdvanceDialog] = useState<AdvanceDialogState>(null);
  const [attendanceHistoryDialog, setAttendanceHistoryDialog] =
    useState<AttendanceHistoryDialogState>(null);

  const [reportSortKey, setReportSortKey] = useState<ReportSortKey>("name");
  const [reportSortDirection, setReportSortDirection] =
    useState<ReportSortDirection>("asc");

  const recentDays = useMemo(() => getLastNDates(7), []);

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

    return employees.filter((emp) => {
      const todayRecord = getTodayAttendanceRecord(emp);

      return [
        emp.id,
        emp.name,
        emp.phone,
        emp.workStart,
        emp.workEnd,
        emp.salaryType,
        emp.notes || "",
        todayRecord?.checkIn || "",
        todayRecord?.checkOut || "",
        todayRecord?.status || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });
  }, [employees, searchTerm]);

  const attendanceEmployees = useMemo(() => {
    return filteredEmployees.filter((emp) => {
      const status = getTodayStatus(emp);

      if (attendanceFilter === "all") return true;
      if (attendanceFilter === "not-started") return status === "Not Started";
      if (attendanceFilter === "working") return status === "Working";
      if (attendanceFilter === "finished") return status === "Finished";
      if (attendanceFilter === "late") return status === "Late";
      if (attendanceFilter === "absent") return status === "Absent";

      return true;
    });
  }, [filteredEmployees, attendanceFilter]);

  const rangeSummary = useMemo(() => {
    return getGlobalRangeSummary(employees, attendanceRange);
  }, [employees, attendanceRange]);

  const payrollSummary = useMemo(() => {
    return employees.reduce(
      (acc, employee) => {
        const payroll = getEmployeePayrollForRange(employee, attendanceRange);
        acc.gross += payroll.gross;
        acc.advance += payroll.advance;
        acc.net += payroll.net;
        return acc;
      },
      {
        gross: 0,
        advance: 0,
        net: 0,
      }
    );
  }, [employees, attendanceRange]);

  const attendanceReportRows = useMemo(() => {
    const rows = employees
      .map((employee) => getEmployeeReportRow(employee, attendanceRange))
      .filter(
        (row) =>
          row.finished > 0 ||
          row.working > 0 ||
          row.late > 0 ||
          row.absent > 0 ||
          row.totalHours > 0
      );

    const sorted = [...rows].sort((a, b) => {
      if (reportSortKey === "name") {
        const result = a.name.localeCompare(b.name);
        return reportSortDirection === "asc" ? result : -result;
      }

      const aValue = a[reportSortKey];
      const bValue = b[reportSortKey];
      const result = Number(aValue) - Number(bValue);

      return reportSortDirection === "asc" ? result : -result;
    });

    return sorted;
  }, [employees, attendanceRange, reportSortKey, reportSortDirection]);

  const toggleReportSort = (key: ReportSortKey) => {
    if (reportSortKey === key) {
      setReportSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setReportSortKey(key);
    setReportSortDirection(key === "name" ? "asc" : "desc");
  };

  const getReportSortIndicator = (key: ReportSortKey) => {
    if (reportSortKey !== key) return "";
    return reportSortDirection === "asc" ? "↑" : "↓";
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
      "Finished",
      "Working",
      "Late",
      "Absent",
      "Total Hours",
      "Gross Payroll",
      "Advance",
      "Net Payroll",
    ];

    const rows = attendanceReportRows.map((row) => [
      row.name,
      row.id,
      row.phone,
      row.finished,
      row.working,
      row.late,
      row.absent,
      row.totalHours.toFixed(2),
      row.gross.toFixed(2),
      row.advance.toFixed(2),
      row.net.toFixed(2),
    ]);

    const csvContent = [
      headers.map(toCsvValue).join(","),
      ...rows.map((row) => row.map(toCsvValue).join(",")),
    ].join("\n");

    const fileName = `attendance-report-${getAttendanceRangeLabel(
      attendanceRange
    )}.csv`;

    downloadTextFile(fileName, csvContent, "text/csv;charset=utf-8;");
    setToast({
      type: "success",
      message: "Attendance report exported successfully.",
    });
  };

  const handlePrintReport = () => {
    if (attendanceReportRows.length === 0) {
      setToast({
        type: "warning",
        message: "No report data available to print.",
      });
      return;
    }

    const title = `Attendance & Payroll Report - ${getRangeTitle(
      attendanceRange
    )}`;

    const tableRows = attendanceReportRows
      .map(
        (row) => `
        <tr>
          <td>${row.name}</td>
          <td>${row.finished}</td>
          <td>${row.working}</td>
          <td>${row.late}</td>
          <td>${row.absent}</td>
          <td>${row.totalHours.toFixed(2)} h</td>
          <td>$${row.gross.toFixed(2)}</td>
          <td>$${row.advance.toFixed(2)}</td>
          <td>$${row.net.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const printHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #0f172a;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 24px;
            }
            p {
              margin: 0 0 18px;
              color: #475569;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 20px;
            }
            .summary-box {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 12px;
            }
            .summary-box span {
              display: block;
              font-size: 12px;
              color: #64748b;
              margin-bottom: 6px;
            }
            .summary-box strong {
              font-size: 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background: #f8fafc;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated from Employees Attendance Mode.</p>

          <div class="summary">
            <div class="summary-box">
              <span>Gross Payroll</span>
              <strong>$${payrollSummary.gross.toFixed(2)}</strong>
            </div>
            <div class="summary-box">
              <span>Total Advances</span>
              <strong>$${payrollSummary.advance.toFixed(2)}</strong>
            </div>
            <div class="summary-box">
              <span>Net Payroll</span>
              <strong>$${payrollSummary.net.toFixed(2)}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Finished</th>
                <th>Working</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Total Hours</th>
                <th>Gross</th>
                <th>Advance</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      setToast({
        type: "error",
        message: "Unable to open print window.",
      });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const setField = (field: keyof EmployeeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const closeEmployeeModal = () => {
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
      advance: String(employee.advance ?? 0),
      notes: employee.notes ?? "",
    });
    setFormErrors({});
    setShowEmployeeModal(true);
  };

  const calculateSalary = (emp: Employee) => {
    const payroll = getEmployeePayrollForRange(emp, attendanceRange);
    return Number.isNaN(payroll.net) ? 0 : payroll.net;
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
                advance: Number(form.advance || 0),
                notes: form.notes.trim(),
              }
            : emp
        )
      );

      closeEmployeeModal();
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
      advance: Number(form.advance || 0),
      notes: form.notes.trim(),
      attendanceRecords: [],
      isDeleted: false,
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    closeEmployeeModal();
    setToast({ type: "success", message: "Employee added successfully." });
  };

  const markCheckIn = (id: string) => {
    const now = new Date().toTimeString().slice(0, 5);

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;

        return upsertTodayAttendance(emp, (current) => {
          const isLate = timeToMinutes(now) > timeToMinutes(emp.workStart);

          return {
            date: getTodayDate(),
            checkIn: now,
            checkOut: undefined,
            status: isLate ? "late" : "working",
            actualHours: 0,
            notes: current?.notes,
          };
        });
      })
    );

    setToast({ type: "success", message: "Check-in saved successfully." });
  };

  const markCheckOut = (id: string) => {
    const now = new Date().toTimeString().slice(0, 5);

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;

        return upsertTodayAttendance(emp, (current) => {
          const checkIn = current?.checkIn || now;
          const actualHours = calculateHours(checkIn, now);

          return {
            date: getTodayDate(),
            checkIn,
            checkOut: now,
            status: "finished",
            actualHours,
            notes: current?.notes,
          };
        });
      })
    );

    setToast({ type: "success", message: "Check-out saved successfully." });
  };

  const markAbsent = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== id) return emp;

        return upsertTodayAttendance(emp, (current) => ({
          date: getTodayDate(),
          checkIn: current?.checkIn,
          checkOut: current?.checkOut,
          status: "absent",
          actualHours: 0,
          notes: current?.notes,
        }));
      })
    );

    setToast({ type: "warning", message: "Employee marked as absent." });
  };

  const openDeleteDialog = (employee: Employee) => {
    setDeleteDialog({
      employeeId: employee.id,
      employeeName: employee.name,
      confirmText: "",
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteDialog || deleteDialog.confirmText !== DELETE_CONFIRMATION_CODE) {
      return;
    }

    setEmployees((prev) =>
      prev.filter((emp) => emp.id !== deleteDialog.employeeId)
    );
    setDeleteDialog(null);
    setToast({ type: "success", message: "Employee deleted successfully." });
  };

  const openAdvanceDialog = (employee: Employee) => {
    setAdvanceDialog({
      employeeId: employee.id,
      employeeName: employee.name,
      amount: "",
    });
  };

  const handleAdvanceConfirm = () => {
    if (!advanceDialog) return;

    if (advanceDialog.amount === "") {
      setAdvanceDialog((prev) =>
        prev ? { ...prev, error: "Advance amount is required." } : prev
      );
      return;
    }

    const amount = Number(advanceDialog.amount);

    if (Number.isNaN(amount) || amount < 0) {
      setAdvanceDialog((prev) =>
        prev ? { ...prev, error: "Enter a valid positive amount." } : prev
      );
      return;
    }

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === advanceDialog.employeeId
          ? { ...emp, advance: emp.advance + amount }
          : emp
      )
    );

    setAdvanceDialog(null);
    setToast({ type: "success", message: "Advance added successfully." });
  };

  return (
    <>
      <div className="employees-page employees-lux-page">
        <div className="employees-header employees-lux-header">
          <div>
            <p className="dashboard-badge">Employee Management</p>
            <h1 className="dashboard-title">Employees</h1>
            <p className="dashboard-subtitle employees-hero-text">
              Manage attendance, schedules, salaries, advances, and payroll in a
              cleaner and simpler workspace.
            </p>
          </div>

          <button
            type="button"
            className="quick-action-btn employees-add-btn"
            onClick={openAddModal}
          >
            + Add Employee
          </button>
        </div>

        <div className="dashboard-card employees-main-card">
          <div className="employees-view-switch">
            <button
              type="button"
              className={`employees-view-toggle ${
                viewMode === "overview" ? "active" : ""
              }`}
              onClick={() => setViewMode("overview")}
            >
              Overview
            </button>

            <button
              type="button"
              className={`employees-view-toggle ${
                viewMode === "attendance" ? "active" : ""
              }`}
              onClick={() => setViewMode("attendance")}
            >
              Attendance Mode
            </button>
          </div>

          <div className="employees-toolbar">
            <div className="dashboard-search-box employees-search-box">
              <label className="dashboard-search-label">
                {viewMode === "attendance"
                  ? "Search attendance"
                  : "Search employees"}
              </label>

              <input
                type="text"
                className="dashboard-search-input"
                placeholder={
                  viewMode === "attendance"
                    ? "Search by name, phone, employee ID..."
                    : "Search by name, phone, or ID..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${
                      viewMode === "attendance"
                        ? attendanceEmployees.length
                        : filteredEmployees.length
                    } result(s)`
                  : viewMode === "attendance"
                  ? "Search attendance records"
                  : "Search all employees"}
              </span>
            </div>
          </div>

          {viewMode === "attendance" ? (
            <>
              <div className="employees-attendance-simple-card">
                <div className="employees-attendance-simple-toolbar">
                  <div className="employees-attendance-simple-search-info">
                    <h3>Attendance Mode</h3>
                    <p>
                      Daily attendance management in a simpler and faster
                      layout.
                    </p>
                  </div>

                  <div className="employees-attendance-simple-controls">
                    <select
                      className="modal-input employees-attendance-select"
                      value={attendanceFilter}
                      onChange={(e) =>
                        setAttendanceFilter(e.target.value as AttendanceFilter)
                      }
                    >
                      <option value="all">All Employees</option>
                      <option value="not-started">Not Started</option>
                      <option value="working">Working</option>
                      <option value="finished">Finished</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                    </select>

                    <div className="employees-range-switch employees-range-switch-compact">
                      <button
                        type="button"
                        className={`employees-range-chip ${
                          attendanceRange === "today" ? "active" : ""
                        }`}
                        onClick={() => setAttendanceRange("today")}
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        className={`employees-range-chip ${
                          attendanceRange === "week" ? "active" : ""
                        }`}
                        onClick={() => setAttendanceRange("week")}
                      >
                        This Week
                      </button>

                      <button
                        type="button"
                        className={`employees-range-chip ${
                          attendanceRange === "month" ? "active" : ""
                        }`}
                        onClick={() => setAttendanceRange("month")}
                      >
                        This Month
                      </button>
                    </div>
                  </div>
                </div>

                <div className="employees-attendance-mini-stats">
                  <div className="employees-mini-stat">
                    <span>Employees</span>
                    <strong>{attendanceEmployees.length}</strong>
                  </div>

                  <div className="employees-mini-stat">
                    <span>Finished</span>
                    <strong>{rangeSummary.finished}</strong>
                  </div>

                  <div className="employees-mini-stat">
                    <span>Working</span>
                    <strong>{rangeSummary.working}</strong>
                  </div>

                  <div className="employees-mini-stat">
                    <span>Late</span>
                    <strong>{rangeSummary.late}</strong>
                  </div>

                  <div className="employees-mini-stat">
                    <span>Absent</span>
                    <strong>{rangeSummary.absent}</strong>
                  </div>
                </div>

                {attendanceEmployees.length > 0 ? (
                  <div className="employees-attendance-table-wrap">
                    <table className="employees-attendance-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>ID</th>
                          <th>Shift</th>
                          <th>Status</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                          <th>Hours</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {attendanceEmployees.map((emp) => {
                          const todayRecord = getTodayAttendanceRecord(emp);
                          const status = getTodayStatus(emp);
                          const actualHours = getTodayActualHours(emp);

                          return (
                            <tr key={emp.id}>
                              <td>
                                <div className="employees-attendance-user">
                                  <div className="employees-attendance-avatar">
                                    {emp.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong>{emp.name}</strong>
                                    <span>{emp.phone}</span>
                                  </div>
                                </div>
                              </td>

                              <td>{emp.id}</td>
                              <td>
                                {emp.workStart} - {emp.workEnd}
                              </td>

                              <td>
                                <span
                                  className={`employees-attendance-status ${
                                    status === "Not Started"
                                      ? "not-started"
                                      : status === "Working"
                                      ? "working"
                                      : status === "Late"
                                      ? "late"
                                      : status === "Absent"
                                      ? "absent"
                                      : "finished"
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>

                              <td>{todayRecord?.checkIn || "--"}</td>
                              <td>{todayRecord?.checkOut || "--"}</td>
                              <td>{actualHours.toFixed(2)} h</td>

                              <td>
                                <div className="employees-attendance-actions employees-attendance-actions-compact">
                                  {(status === "Not Started" ||
                                    status === "Absent") && (
                                    <button
                                      type="button"
                                      className="quick-action-btn employees-attendance-action"
                                      onClick={() => markCheckIn(emp.id)}
                                    >
                                      Check In
                                    </button>
                                  )}

                                  {(status === "Working" ||
                                    status === "Late") && (
                                    <button
                                      type="button"
                                      className="quick-action-btn secondary employees-attendance-action"
                                      onClick={() => markCheckOut(emp.id)}
                                    >
                                      Check Out
                                    </button>
                                  )}

                                  {status === "Finished" && (
                                    <button
                                      type="button"
                                      className="quick-action-btn secondary employees-attendance-action"
                                      disabled
                                      style={{
                                        opacity: 0.6,
                                        cursor: "not-allowed",
                                      }}
                                    >
                                      Completed
                                    </button>
                                  )}

                                  {status === "Not Started" && (
                                    <button
                                      type="button"
                                      className="quick-action-btn employees-attendance-absent-btn"
                                      onClick={() => markAbsent(emp.id)}
                                    >
                                      Absent
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="quick-action-btn secondary employees-attendance-action"
                                    onClick={() =>
                                      setAttendanceHistoryDialog({
                                        employeeId: emp.id,
                                        employeeName: emp.name,
                                      })
                                    }
                                  >
                                    History
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="employees-empty-state employees-cards-empty-state">
                    <strong>No attendance records found.</strong>
                    <span>Try changing the search term or filter.</span>
                  </div>
                )}
              </div>

              <div className="employees-report-card employees-report-card-compact">
                <div className="employees-report-head">
                  <div>
                    <h3>Attendance Report</h3>
                    <p>
                      Summary for <strong>{getRangeTitle(attendanceRange)}</strong>
                    </p>
                  </div>

                  <div className="employees-report-actions">
                    <button
                      type="button"
                      className="quick-action-btn secondary"
                      onClick={handleExportReportCsv}
                    >
                      Export CSV
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={handlePrintReport}
                    >
                      Print Report
                    </button>
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
                            onClick={() => toggleReportSort("finished")}
                          >
                            Finished {getReportSortIndicator("finished")}
                          </th>
                          <th
                            className="employees-sortable"
                            onClick={() => toggleReportSort("working")}
                          >
                            Working {getReportSortIndicator("working")}
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
                            <td>{row.finished}</td>
                            <td>{row.working}</td>
                            <td>{row.late}</td>
                            <td>{row.absent}</td>
                            <td>{row.totalHours.toFixed(2)} h</td>
                            <td>${row.gross.toFixed(2)}</td>
                            <td>${row.advance.toFixed(2)}</td>
                            <td>
                              <strong
                                className={
                                  row.net >= 0
                                    ? "employees-net-positive-text"
                                    : "employees-net-negative-text"
                                }
                              >
                                ${row.net.toFixed(2)}
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="employees-empty-state employees-cards-empty-state">
                    <strong>No report data found.</strong>
                    <span>No attendance records are available for the selected period.</span>
                  </div>
                )}
              </div>
            </>
          ) : filteredEmployees.length > 0 ? (
            <div className="employees-cards-grid employees-cards-grid-lite">
              {filteredEmployees.map((emp) => {
                const todayRecord = getTodayAttendanceRecord(emp);
                const actualHours = getTodayActualHours(emp);
                const netSalary = calculateSalary(emp);
                const attendanceStatus = getTodayStatus(emp);

                return (
                  <article
                    key={emp.id}
                    className="employees-staff-card employees-staff-card-lite"
                  >
                    <div className="employees-lite-top">
                      <div className="employees-lite-user">
                        <div className="employees-lite-avatar">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="employees-lite-meta">
                          <h3>{emp.name}</h3>
                          <span>{emp.id}</span>
                          <span>{emp.phone}</span>
                        </div>
                      </div>

                      <div className="employees-lite-badges">
                        <span className="employees-lite-badge">
                          {emp.salaryType === "hourly" ? "Hourly" : "Fixed"}
                        </span>

                        <span
                          className={`employees-lite-status ${
                            attendanceStatus === "Not Started"
                              ? "not-started"
                              : attendanceStatus === "Working"
                              ? "working"
                              : attendanceStatus === "Late"
                              ? "late"
                              : attendanceStatus === "Absent"
                              ? "absent"
                              : "finished"
                          }`}
                        >
                          {attendanceStatus}
                        </span>
                      </div>
                    </div>

                    <div className="employees-lite-grid">
                      <div className="employees-lite-box">
                        <span>Shift</span>
                        <strong>
                          {emp.workStart} - {emp.workEnd}
                        </strong>
                      </div>

                      <div className="employees-lite-box">
                        <span>Today</span>
                        <strong>
                          {todayRecord?.checkIn || "--"} /{" "}
                          {todayRecord?.checkOut || "--"}
                        </strong>
                        <small>{actualHours.toFixed(2)} h</small>
                      </div>

                      <div className="employees-lite-box">
                        <span>
                          {attendanceRange === "today"
                            ? "Net Today"
                            : attendanceRange === "week"
                            ? "Net Week"
                            : "Net Month"}
                        </span>
                        <strong
                          className={
                            netSalary >= 0
                              ? "employees-net-positive-text"
                              : "employees-net-negative-text"
                          }
                        >
                          ${netSalary.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    <div className="employees-lite-history">
                      <div className="employees-lite-history-head">
                        <span>Last 7 Days</span>
                        <small>Attendance</small>
                      </div>

                      <div className="employees-lite-history-strip">
                        {recentDays.map((day) => {
                          const status = getMiniHistoryStatus(emp, day.date);

                          return (
                            <div
                              key={`${emp.id}-${day.date}`}
                              className={`employees-lite-history-cell ${status}`}
                              title={`${day.date} - ${getAttendanceStatusLabel(
                                status
                              )}`}
                            >
                              <small>{day.day}</small>
                              <strong>{day.label}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {emp.notes ? (
                      <div className="employees-lite-notes">
                        <span>Notes</span>
                        <p>{emp.notes}</p>
                      </div>
                    ) : null}

                    <div className="employees-lite-actions">
                      <button
                        type="button"
                        className="quick-action-btn secondary"
                        onClick={() => openAdvanceDialog(emp)}
                      >
                        Advance
                      </button>

                      <button
                        type="button"
                        className="quick-action-btn secondary"
                        onClick={() => openEditModal(emp)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="quick-action-btn secondary"
                        onClick={() =>
                          setAttendanceHistoryDialog({
                            employeeId: emp.id,
                            employeeName: emp.name,
                          })
                        }
                      >
                        History
                      </button>

                      <button
                        type="button"
                        className="quick-action-btn delete-btn"
                        onClick={() => openDeleteDialog(emp)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="employees-empty-state employees-cards-empty-state">
              <strong>No employees found yet.</strong>
              <span>
                Add your first employee to start tracking attendance, salaries,
                and advances.
              </span>
            </div>
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
          onClose={closeEmployeeModal}
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
          onConfirm={handleDeleteConfirm}
        />
      )}

      {advanceDialog && (
        <AdvanceModal
          state={advanceDialog}
          onChange={(value) =>
            setAdvanceDialog((prev) =>
              prev ? { ...prev, amount: value, error: undefined } : prev
            )
          }
          onClose={() => setAdvanceDialog(null)}
          onConfirm={handleAdvanceConfirm}
        />
      )}

      {attendanceHistoryDialog && (
        <AttendanceHistoryModal
          employee={
            employees.find(
              (emp) => emp.id === attendanceHistoryDialog.employeeId
            ) as Employee
          }
          onClose={() => setAttendanceHistoryDialog(null)}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </>
  );
}