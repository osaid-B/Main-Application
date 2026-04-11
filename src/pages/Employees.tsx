import { useEffect, useMemo, useState } from "react";
import { getEmployees, saveEmployees } from "../data/storage";
import type { Employee, SalaryType } from "../data/types";

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

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const calculateHours = (start: string, end: string) => {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return Math.max(diff / 60, 0);
};

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
              {errors.workEnd && (
                <p className="form-error">{errors.workEnd}</p>
              )}
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
  const isValid = state.confirmText === "DELETE";

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
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            className="modal-input"
            type="text"
            placeholder="Type DELETE"
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

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [searchTerm, setSearchTerm] = useState("");

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});

  const [toast, setToast] = useState<ToastState>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);
  const [advanceDialog, setAdvanceDialog] = useState<AdvanceDialogState>(null);

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
      [
        emp.id,
        emp.name,
        emp.phone,
        emp.workStart,
        emp.workEnd,
        emp.salaryType,
        emp.notes || "",
        emp.checkIn || "",
        emp.checkOut || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [employees, searchTerm]);

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

  const calculateActualHours = (emp: Employee) => {
    if (!emp.checkIn || !emp.checkOut) return 0;
    return calculateHours(emp.checkIn, emp.checkOut);
  };

  const calculateSalary = (emp: Employee) => {
    const actualHours = calculateActualHours(emp);

    const gross =
      emp.salaryType === "hourly"
        ? actualHours * (emp.hourlyRate || 0)
        : emp.fixedSalary || 0;

    const net = gross - emp.advance;
    return Number.isNaN(net) ? 0 : net;
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
      isDeleted: false,
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    closeEmployeeModal();
    setToast({ type: "success", message: "Employee added successfully." });
  };

  const updateCheckIn = (id: string) => {
    const now = new Date().toTimeString().slice(0, 5);
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, checkIn: now } : emp))
    );
    setToast({ type: "success", message: "Check-in saved successfully." });
  };

  const updateCheckOut = (id: string) => {
    const now = new Date().toTimeString().slice(0, 5);
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, checkOut: now } : emp))
    );
    setToast({ type: "success", message: "Check-out saved successfully." });
  };

  const openDeleteDialog = (employee: Employee) => {
    setDeleteDialog({
      employeeId: employee.id,
      employeeName: employee.name,
      confirmText: "",
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteDialog || deleteDialog.confirmText !== "DELETE") return;

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
              cleaner and more comfortable workspace.
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
          <div className="employees-toolbar">
            <div className="dashboard-search-box employees-search-box">
              <label className="dashboard-search-label">Search employees</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by name, phone, ID, notes, schedule, or attendance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredEmployees.length} result(s)`
                  : "Search all employees"}
              </span>
            </div>
          </div>

          {filteredEmployees.length > 0 ? (
            <div className="employees-cards-grid">
              {filteredEmployees.map((emp) => {
                const actualHours = calculateActualHours(emp);
                const netSalary = calculateSalary(emp);

                return (
                  <article key={emp.id} className="employees-staff-card">
                    <div className="employees-card-top">
                      <div className="employees-user-block">
                        <div className="employees-avatar">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="employees-user-meta">
                          <h3>{emp.name}</h3>
                          <span>{emp.id}</span>
                          <span>{emp.phone}</span>
                        </div>
                      </div>

                      <div className="employees-type-badge">
                        {emp.salaryType === "hourly" ? "Hourly" : "Fixed Salary"}
                      </div>
                    </div>

                    <div className="employees-card-body">
                      <div className="employees-info-grid">
                        <div className="employees-info-panel">
                          <div className="employees-panel-title">
                            Work Schedule
                          </div>
                          <div className="employees-data-row">
                            <span>Start</span>
                            <strong>{emp.workStart}</strong>
                          </div>
                          <div className="employees-data-row">
                            <span>End</span>
                            <strong>{emp.workEnd}</strong>
                          </div>
                        </div>

                        <div className="employees-info-panel">
                          <div className="employees-panel-title">Attendance</div>
                          <div className="employees-data-row">
                            <span>Check In</span>
                            <strong>{emp.checkIn || "--"}</strong>
                          </div>
                          <div className="employees-data-row">
                            <span>Check Out</span>
                            <strong>{emp.checkOut || "--"}</strong>
                          </div>
                          <div className="employees-data-row">
                            <span>Actual Hours</span>
                            <strong>{actualHours.toFixed(2)} h</strong>
                          </div>
                        </div>

                        <div className="employees-info-panel">
                          <div className="employees-panel-title">Salary Info</div>
                          <div className="employees-data-row">
                            <span>Type</span>
                            <strong>
                              {emp.salaryType === "hourly"
                                ? "Hourly"
                                : "Fixed"}
                            </strong>
                          </div>

                          {emp.salaryType === "hourly" ? (
                            <div className="employees-data-row">
                              <span>Hourly Rate</span>
                              <strong>
                                ${(emp.hourlyRate || 0).toLocaleString()}
                              </strong>
                            </div>
                          ) : (
                            <div className="employees-data-row">
                              <span>Fixed Salary</span>
                              <strong>
                                ${(emp.fixedSalary || 0).toLocaleString()}
                              </strong>
                            </div>
                          )}

                          <div className="employees-data-row">
                            <span>Advance</span>
                            <strong className="employees-advance-text">
                              ${emp.advance.toLocaleString()}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {emp.notes ? (
                        <div className="employees-notes-box">
                          <span>Notes</span>
                          <p>{emp.notes}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="employees-card-footer">
                      <div className="employees-net-box">
                        <span>Net Salary</span>
                        <strong
                          className={
                            netSalary >= 0
                              ? "employees-net-positive"
                              : "employees-net-negative"
                          }
                        >
                          ${netSalary.toFixed(2)}
                        </strong>
                      </div>

                      <div className="actions-group employees-actions-group">
                        <button
                          type="button"
                          className="quick-action-btn secondary"
                          onClick={() => updateCheckIn(emp.id)}
                        >
                          Check In
                        </button>

                        <button
                          type="button"
                          className="quick-action-btn secondary"
                          onClick={() => updateCheckOut(emp.id)}
                        >
                          Check Out
                        </button>

                        <button
                          type="button"
                          className="quick-action-btn secondary"
                          onClick={() => openAdvanceDialog(emp)}
                        >
                          Add Advance
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
                          className="quick-action-btn delete-btn"
                          onClick={() => openDeleteDialog(emp)}
                        >
                          Delete
                        </button>
                      </div>
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

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </>
  );
}