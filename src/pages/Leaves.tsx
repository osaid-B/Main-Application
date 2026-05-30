import { useMemo, useState } from "react";
import "./Leaves.css";
import {
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Paperclip,
  Settings2,
  Shield,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { useNotifications } from "../context/NotificationsContext";
import type { LeaveBalance, LeavePolicy, LeaveRequest, LeaveStatus, LeaveType } from "../data/types";
import {
  getLeaveBalances,
  getLeavePolicy,
  getLeaveRequests,
  saveLeaveBalances,
  saveLeavePolicy,
  saveLeaveRequests,
} from "../data/storage";

// ─── Palestinian official holidays 2026 ───────────────────────────────────────
const PALESTINIAN_HOLIDAYS: string[] = [
  "2026-01-01", "2026-04-17", "2026-04-18", "2026-04-19",
  "2026-05-14", "2026-06-24", "2026-06-25", "2026-06-26",
  "2026-07-02", "2026-09-11", "2026-11-15", "2026-12-25",
];

function isWeekendDay(dow: number) { return dow === 5 || dow === 6; }

function countWorkingDays(start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  let count = 0;
  const cur = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  while (cur <= endDate) {
    const dow = cur.getDay();
    const iso = cur.toISOString().slice(0, 10);
    if (!isWeekendDay(dow) && !PALESTINIAN_HOLIDAYS.includes(iso)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function getMonthDaysGrid(year: number, month: number) {
  const days: Array<{ date: string; dow: number; isHoliday: boolean; isToday: boolean }> = [];
  const today = new Date().toISOString().slice(0, 10);
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(year, month, d);
    const iso = dt.toISOString().slice(0, 10);
    days.push({ date: iso, dow: dt.getDay(), isHoliday: PALESTINIAN_HOLIDAYS.includes(iso), isToday: iso === today });
  }
  return days;
}

type LeaveTab = "requests" | "balances" | "calendar" | "policy";
type ModalStep = 1 | 2 | 3;

const LEAVE_ICONS: Record<LeaveType, typeof Calendar> = {
  annual: CalendarDays, sick: FileText, maternity: Users, paternity: Users,
  emergency: Clock, hajj: Shield, unpaid: XCircle,
};

const LEAVE_COLORS: Record<LeaveType, string> = {
  annual: "#2563eb", sick: "#dc2626", maternity: "#db2777",
  paternity: "#7c3aed", emergency: "#ea580c", hajj: "#16a34a", unpaid: "#64748b",
};

const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "maternity", "paternity", "emergency", "hajj", "unpaid"];

const STATUS_VARIANT: Record<LeaveStatus, string> = {
  pending: "lv-badge-pending",
  approved: "lv-badge-approved",
  rejected: "lv-badge-rejected",
  cancelled: "lv-badge-cancelled",
};

function formatDMY(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getCurrentMonthISO() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RequestsTab({
  requests, employees, t, isArabic, onApprove, onReject, onCancel,
}: {
  requests: LeaveRequest[];
  employees: ReturnType<typeof useData>["employees"];
  t: ReturnType<typeof useSettings>["t"];
  isArabic: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onCancel: (id: string) => void;
}) {
  const [filter, setFilter] = useState<LeaveStatus | "all">("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(() => {
    return filter === "all" ? requests : requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  return (
    <div className="lv-requests-panel">
      <div className="lv-filter-row">
        {(["all", "pending", "approved", "rejected", "cancelled"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`lv-filter-chip ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? (isArabic ? "الكل" : "All") : t.leaves.status[s]}
            {s !== "all" && <span className="lv-chip-count">{requests.filter((r) => r.status === s).length}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="lv-empty">
          <CalendarDays size={40} color="#cbd5e1" />
          <strong>{t.leaves.empty.noRequests}</strong>
          <span>{t.leaves.empty.noRequestsDesc}</span>
        </div>
      ) : (
        <div className="lv-table-wrap atlas-table-wrapper">
          <table className="lv-table app-data-table atlas-table">
            <colgroup>
              <col />
              <col className="col-w-110" />
              <col className="col-date" />
              <col className="col-date" />
              <col className="col-w-72" />
              <col className="col-w-140" />
              <col className="col-w-90" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>{t.leaves.cols.employee}</th>
                <th>{t.leaves.cols.type}</th>
                <th className="col-date">{t.leaves.cols.start}</th>
                <th className="col-date">{t.leaves.cols.end}</th>
                <th className="col-num">{t.leaves.cols.days}</th>
                <th>{t.leaves.cols.reason}</th>
                <th>{t.leaves.cols.status}</th>
                <th className="col-actions">{t.leaves.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const emp = employees.find((e) => e.id === req.employeeId);
                const Icon = LEAVE_ICONS[req.leaveType] ?? CalendarDays;
                return (
                  <tr key={req.id}>
                    <td>
                      <div className="lv-emp-cell">
                        <div className="lv-emp-avatar">{emp?.name?.[0] ?? "?"}</div>
                        <div>
                          <strong>{emp?.name ?? req.employeeId}</strong>
                          <span>{emp?.jobTitle ?? "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="lv-type-chip" style={{ background: `${LEAVE_COLORS[req.leaveType]}18`, color: LEAVE_COLORS[req.leaveType] }}>
                        <Icon size={12} />
                        {t.leaves.types[req.leaveType]}
                      </span>
                    </td>
                    <td>{formatDMY(req.startDate)}</td>
                    <td>{formatDMY(req.endDate)}</td>
                    <td className="lv-days-cell">{req.totalDays}</td>
                    <td className="lv-reason-cell">{req.reason}</td>
                    <td>
                      <span className={`lv-status-badge ${STATUS_VARIANT[req.status]}`}>
                        {t.leaves.status[req.status]}
                      </span>
                    </td>
                    <td>
                      {req.status === "pending" && (
                        <div className="lv-row-actions">
                          <Button variant="icon" size="sm" title={t.leaves.actions.approve} onClick={() => onApprove(req.id)}>
                            <CheckCircle size={15} color="#16a34a" />
                          </Button>
                          <Button variant="icon" size="sm" title={t.leaves.actions.reject} onClick={() => { setRejectingId(req.id); setRejectReason(""); }}>
                            <XCircle size={15} color="#dc2626" />
                          </Button>
                          <Button variant="icon" size="sm" title={t.leaves.actions.cancel} onClick={() => onCancel(req.id)}>
                            <X size={15} color="#94a3b8" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectingId && (
        <div className="modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="modal-card confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><h2>{t.leaves.actions.rejectionReason}</h2></div>
              <Button variant="icon" size="md" onClick={() => setRejectingId(null)}>×</Button>
            </div>
            <div className="modal-form">
              <textarea
                className="modal-input"
                rows={3}
                value={rejectReason}
                placeholder={t.leaves.actions.rejectionPlaceholder}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="modal-actions">
                <Button variant="secondary" size="md" onClick={() => setRejectingId(null)}>{t.common.cancel}</Button>
                <Button variant="danger" size="md" disabled={!rejectReason.trim()} onClick={() => { onReject(rejectingId, rejectReason); setRejectingId(null); }}>
                  {t.leaves.actions.confirmReject}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BalancesTab({
  balances, employees, t,
}: {
  balances: LeaveBalance[];
  employees: ReturnType<typeof useData>["employees"];
  t: ReturnType<typeof useSettings>["t"];
}) {
  const [typeFilter, setTypeFilter] = useState<LeaveType | "all">("all");

  const displayTypes: LeaveType[] = typeFilter === "all" ? LEAVE_TYPES : [typeFilter];

  return (
    <div className="lv-balances-panel">
      <div className="lv-filter-row">
        <button type="button" className={`lv-filter-chip ${typeFilter === "all" ? "active" : ""}`} onClick={() => setTypeFilter("all")}>
          {t.leaves.balances.allTypes}
        </button>
        {LEAVE_TYPES.map((lt) => (
          <button key={lt} type="button" className={`lv-filter-chip ${typeFilter === lt ? "active" : ""}`} onClick={() => setTypeFilter(lt)}>
            {t.leaves.types[lt]}
          </button>
        ))}
      </div>

      <div className="lv-balance-grid">
        {employees.filter((e) => !e.isDeleted).map((emp) => {
          const bal = balances.find((b) => b.employeeId === emp.id);
          return (
            <div key={emp.id} className="lv-balance-card">
              <div className="lv-balance-card-head">
                <div className="lv-emp-avatar">{emp.name?.[0] ?? "?"}</div>
                <div>
                  <strong>{emp.name}</strong>
                  <span>{emp.jobTitle ?? emp.departmentId ?? "—"}</span>
                </div>
              </div>
              {bal ? (
                <div className="lv-balance-rows">
                  {displayTypes.map((lt) => {
                    const entry = bal[lt];
                    const remaining = Math.max(0, entry.entitled - entry.used - entry.pending);
                    const pct = entry.entitled > 0 ? Math.round(((entry.used + entry.pending) / entry.entitled) * 100) : 0;
                    const barColor = pct > 80 ? "var(--app-danger, #dc2626)" : pct > 50 ? "var(--app-warning, #ea580c)" : "var(--app-success, #16a34a)";
                    if (lt === "hajj" && entry.entitled === 0) return null;
                    return (
                      <div key={lt} className="lv-balance-row">
                        <div className="lv-bal-label">
                          <span className="lv-bal-type" style={{ color: LEAVE_COLORS[lt] }}>{t.leaves.types[lt]}</span>
                          <span className="lv-bal-meta">{remaining} {t.leaves.balances.remaining} / {entry.entitled} {t.leaves.balances.entitled}</span>
                        </div>
                        <div className="lv-bal-bar-wrap">
                          <div className="lv-bal-bar">
                            <div className="lv-bal-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
                            {entry.pending > 0 && (
                              <div className="lv-bal-bar-pending" style={{ width: `${Math.min(100, (entry.pending / entry.entitled) * 100)}%` }} />
                            )}
                          </div>
                          <span className="lv-bal-pct">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="lv-no-balance">{t.leaves.balances.noBalance}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarTab({
  requests, employees, t, locale,
}: {
  requests: LeaveRequest[];
  employees: ReturnType<typeof useData>["employees"];
  t: ReturnType<typeof useSettings>["t"];
  locale: string;
}) {
  const [calDate, setCalDate] = useState(() => getCurrentMonthISO());

  const { year, month } = calDate;
  const days = useMemo(() => getMonthDaysGrid(year, month), [year, month]);

  const goBack = () => setCalDate((prev) => {
    const d = new Date(prev.year, prev.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const goForward = () => setCalDate((prev) => {
    const d = new Date(prev.year, prev.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });

  const activeEmployees = employees.filter((e) => !e.isDeleted);
  const approvedReqs = requests.filter((r) => r.status === "approved");
  const pendingReqs = requests.filter((r) => r.status === "pending");

  return (
    <div className="lv-calendar-panel">
      <div className="lv-cal-toolbar">
        <Button variant="icon" size="sm" onClick={goBack}><ChevronLeft size={16} /></Button>
        <span className="lv-cal-month">{monthLabel}</span>
        <Button variant="icon" size="sm" onClick={goForward}><ChevronRight size={16} /></Button>
      </div>

      <div className="lv-cal-legend">
        <span className="lv-leg-item"><span className="lv-leg-dot approved" />{t.leaves.calendar.legend.approved}</span>
        <span className="lv-leg-item"><span className="lv-leg-dot pending" />{t.leaves.calendar.legend.pending}</span>
        <span className="lv-leg-item"><span className="lv-leg-dot holiday" />{t.leaves.calendar.legend.holiday}</span>
        <span className="lv-leg-item"><span className="lv-leg-dot today" />{t.leaves.calendar.legend.today}</span>
      </div>

      <div className="lv-cal-wrap">
        <table className="lv-cal-table">
          <thead>
            <tr>
              <th className="lv-cal-emp-th">{t.leaves.cols.employee}</th>
              {days.map((d) => (
                <th key={d.date} className={[
                  "lv-cal-day-th",
                  isWeekendDay(d.dow) ? "lv-cal-weekend" : "",
                  d.isHoliday ? "lv-cal-holiday" : "",
                  d.isToday ? "lv-cal-today" : "",
                ].filter(Boolean).join(" ")}>
                  <span className="lv-cal-day-num">{new Date(d.date + "T00:00:00").getDate()}</span>
                  <span className="lv-cal-day-dow">
                    {new Date(d.date + "T00:00:00").toLocaleDateString(locale, { weekday: "short" })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp) => (
              <tr key={emp.id}>
                <td className="lv-cal-emp-td">
                  <span className="lv-cal-emp-name">{emp.name}</span>
                </td>
                {days.map((d) => {
                  const approved = approvedReqs.find((r) => r.employeeId === emp.id && r.startDate <= d.date && r.endDate >= d.date);
                  const pending = pendingReqs.find((r) => r.employeeId === emp.id && r.startDate <= d.date && r.endDate >= d.date);
                  const base = [
                    "lv-cal-cell",
                    isWeekendDay(d.dow) ? "lv-cal-weekend" : "",
                    d.isHoliday ? "lv-cal-holiday" : "",
                    d.isToday ? "lv-cal-today" : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <td key={d.date} className={base}>
                      {approved && <span className="lv-cal-block approved" title={`${emp.name} — ${t.leaves.types[approved.leaveType]}`} />}
                      {!approved && pending && <span className="lv-cal-block pending" title={`${emp.name} — ${t.leaves.status.pending}`} />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PolicyTab({
  policy, t, onSave,
}: {
  policy: LeavePolicy;
  t: ReturnType<typeof useSettings>["t"];
  onSave: (p: LeavePolicy) => void;
}) {
  const [form, setForm] = useState<LeavePolicy>(policy);

  const field = (key: keyof LeavePolicy) => (
    <div key={key} className="lv-policy-field">
      <label className="modal-label">{t.leaves.policy[key as keyof typeof t.leaves.policy] as string}</label>
      <input
        className="modal-input"
        type="number"
        min={0}
        value={form[key]}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
      />
    </div>
  );

  return (
    <div className="lv-policy-panel">
      <div className="lv-policy-note">
        <Shield size={16} color="#16a34a" />
        <span>{t.leaves.policy.laborLawNote}</span>
      </div>
      <div className="lv-policy-grid">
        {(Object.keys(form) as (keyof LeavePolicy)[]).map((k) => field(k))}
      </div>
      <div className="lv-policy-footer">
        <Button variant="primary" size="md" onClick={() => onSave(form)}>
          {t.leaves.policy.save}
        </Button>
      </div>
    </div>
  );
}

// ─── 3-step Leave Request Modal ───────────────────────────────────────────────

function LeaveRequestModal({
  t, employees, balances, policy, onClose, onSubmit,
}: {
  t: ReturnType<typeof useSettings>["t"];
  employees: ReturnType<typeof useData>["employees"];
  balances: LeaveBalance[];
  policy: LeavePolicy;
  onClose: () => void;
  onSubmit: (req: Omit<LeaveRequest, "id" | "createdAt" | "status">) => void;
}) {
  const [step, setStep] = useState<ModalStep>(1);
  const [employeeId, setEmployeeId] = useState(employees.filter((e) => !e.isDeleted)[0]?.id ?? "");
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const currentBalance = useMemo(() => {
    return balances.find((b) => b.employeeId === employeeId);
  }, [balances, employeeId]);

  const remaining = useMemo(() => {
    if (!currentBalance) return 0;
    const entry = currentBalance[leaveType];
    return Math.max(0, entry.entitled - entry.used - entry.pending);
  }, [currentBalance, leaveType]);

  const totalDays = useMemo(() => countWorkingDays(startDate, endDate), [startDate, endDate]);

  const balanceError = totalDays > 0 && totalDays > remaining && leaveType !== "unpaid";

  const canSubmit = step === 3 && reason.trim() && !balanceError && totalDays > 0 &&
    (leaveType !== "sick" || totalDays <= policy.medCertAfterDays || attachmentName);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card lv-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{t.leaves.modal.title}</h2>
            <p className="lv-step-indicator">
              {[1, 2, 3].map((s) => (
                <span key={s} className={`lv-step-dot ${step === s ? "active" : step > s ? "done" : ""}`}>{s}</span>
              ))}
              <span style={{ marginInlineStart: 8, fontSize: 13, color: "#64748b" }}>
                {step === 1 ? t.leaves.modal.step1 : step === 2 ? t.leaves.modal.step2 : t.leaves.modal.step3}
              </span>
            </p>
          </div>
          <Button variant="icon" size="md" onClick={onClose}>×</Button>
        </div>

        <div className="lv-modal-body">
          {/* Step 1: Choose leave type */}
          {step === 1 && (
            <div className="lv-step">
              <div className="lv-step-header">
                <label className="modal-label">{t.leaves.cols.employee}</label>
                <select className="modal-input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  {employees.filter((e) => !e.isDeleted).map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="lv-type-grid">
                {LEAVE_TYPES.map((lt) => {
                  const bal = currentBalance?.[lt];
                  const rem = bal ? Math.max(0, bal.entitled - bal.used - bal.pending) : 0;
                  const Icon = LEAVE_ICONS[lt];
                  const isHajjDisabled = lt === "hajj" && currentBalance?.hajjEverUsed;
                  const isExhausted = lt !== "unpaid" && bal && rem === 0;
                  const disabled = isHajjDisabled || !!isExhausted;
                  return (
                    <button
                      key={lt}
                      type="button"
                      className={`lv-type-card ${leaveType === lt ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                      onClick={() => !disabled && setLeaveType(lt)}
                      disabled={!!disabled}
                    >
                      <div className="lv-type-icon" style={{ background: `${LEAVE_COLORS[lt]}18`, color: LEAVE_COLORS[lt] }}>
                        <Icon size={20} />
                      </div>
                      <strong>{t.leaves.types[lt]}</strong>
                      <p>{t.leaves.typeDesc[lt]}</p>
                      {bal && lt !== "unpaid" && (
                        <span className={`lv-type-rem ${isExhausted ? "exhausted" : ""}`}>
                          {isHajjDisabled ? t.leaves.balances.hajjUsed : isExhausted ? t.leaves.modal.exhausted : `${rem} ${t.leaves.modal.remaining}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Date range */}
          {step === 2 && (
            <div className="lv-step">
              <div className="employees-form-grid">
                <div>
                  <label className="modal-label">{t.leaves.modal.startDate}</label>
                  <input className="modal-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="modal-label">{t.leaves.modal.endDate}</label>
                  <input className="modal-input" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              {startDate && endDate && (
                <div className={`lv-days-info ${balanceError ? "error" : ""}`}>
                  <p>{t.leaves.modal.workDays.replace("{{count}}", String(totalDays))}</p>
                  {balanceError && (
                    <p className="lv-balance-error">{t.leaves.modal.balanceError.replace("{{remaining}}", String(remaining))}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="lv-step">
              <div>
                <label className="modal-label">{t.leaves.modal.reason} <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea
                  className="modal-input"
                  rows={4}
                  value={reason}
                  placeholder={t.leaves.modal.reasonPlaceholder}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div>
                <label className="modal-label">
                  {t.leaves.modal.attachment}
                  {leaveType === "sick" && totalDays > policy.medCertAfterDays
                    ? <span style={{ color: "#ef4444", marginInlineStart: 4 }}>*</span>
                    : <span style={{ color: "#94a3b8", marginInlineStart: 4, fontSize: 12 }}>({t.leaves.modal.attachmentOptional})</span>}
                </label>
                <div className="lv-file-row">
                  <label className="lv-file-btn">
                    <Paperclip size={14} />
                    {t.leaves.modal.choosefile}
                    <input
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? "")}
                    />
                  </label>
                  <span className="lv-file-name">{attachmentName || t.leaves.modal.nofile}</span>
                </div>
                {leaveType === "sick" && totalDays > policy.medCertAfterDays && (
                  <p style={{ fontSize: 12, color: "#ea580c", marginTop: 4 }}>
                    {t.leaves.modal.attachmentHint.replace("{{days}}", String(policy.medCertAfterDays))}
                  </p>
                )}
              </div>
              <div className="lv-summary-box">
                <div><span>{t.leaves.cols.type}:</span><strong>{t.leaves.types[leaveType]}</strong></div>
                <div><span>{t.leaves.cols.start}:</span><strong>{formatDMY(startDate)}</strong></div>
                <div><span>{t.leaves.cols.end}:</span><strong>{formatDMY(endDate)}</strong></div>
                <div><span>{t.leaves.cols.days}:</span><strong>{totalDays}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {step > 1 && <Button variant="secondary" size="md" onClick={() => setStep((s) => (s - 1) as ModalStep)}>{t.leaves.modal.back}</Button>}
          {step < 3 && (
            <Button
              variant="primary"
              size="md"
              disabled={step === 2 && (balanceError || !startDate || !endDate || totalDays === 0)}
              onClick={() => setStep((s) => (s + 1) as ModalStep)}
            >
              {t.leaves.modal.next}
            </Button>
          )}
          {step === 3 && (
            <Button
              variant="primary"
              size="md"
              disabled={!canSubmit}
              onClick={() => onSubmit({ employeeId, leaveType, startDate, endDate, totalDays, reason: reason.trim(), attachmentName: attachmentName || undefined })}
            >
              {t.leaves.modal.submit}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Leaves() {
  const { t, isArabic, locale } = useSettings();
  const { employees } = useData();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<LeaveTab>("requests");
  const [requests, setRequests] = useState<LeaveRequest[]>(() => getLeaveRequests());
  const [balances, setBalances] = useState<LeaveBalance[]>(() => getLeaveBalances());
  const [policy, setPolicy] = useState<LeavePolicy>(() => getLeavePolicy());
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 3000); };

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const kpi = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved" && r.reviewedAt?.slice(0, 7) === currentMonth).length,
    onLeaveToday: requests.filter((r) => r.status === "approved" && r.startDate <= today && r.endDate >= today).length,
    total: requests.length,
  }), [requests, today, currentMonth]);

  const handleApprove = (id: string) => {
    const ts = new Date().toISOString();
    const next = requests.map((r) => r.id === id ? { ...r, status: "approved" as LeaveStatus, reviewedAt: ts, reviewedBy: "المدير العام" } : r);
    setRequests(next); saveLeaveRequests(next);
    const req = next.find((r) => r.id === id);
    if (req) {
      const nextBal = balances.map((b) => {
        if (b.employeeId !== req.employeeId) return b;
        const entry = b[req.leaveType];
        return { ...b, [req.leaveType]: { ...entry, used: entry.used + req.totalDays, pending: Math.max(0, entry.pending - req.totalDays) } };
      });
      setBalances(nextBal); saveLeaveBalances(nextBal);
      const emp = employees.find((e) => e.id === req.employeeId);
      addNotification({
        title: "Leave Approved", titleAr: t.leaves.notify.approved,
        body: `${emp?.name ?? req.employeeId} — ${req.startDate} → ${req.endDate}`,
        bodyAr: `${emp?.name ?? req.employeeId} — ${req.startDate} → ${req.endDate}`,
        category: "hr", severity: "success",
        actionLabel: "View", actionLabelAr: t.leaves.actions.view,
        actionRoute: "/leaves", entityId: req.id,
      });
    }
    showToast(t.leaves.toast.approved);
  };

  const handleReject = (id: string, reason: string) => {
    const ts = new Date().toISOString();
    const next = requests.map((r) => r.id === id ? { ...r, status: "rejected" as LeaveStatus, reviewedAt: ts, reviewedBy: "المدير العام", rejectionReason: reason } : r);
    setRequests(next); saveLeaveRequests(next);
    const req = requests.find((r) => r.id === id);
    if (req) {
      const nextBal = balances.map((b) => {
        if (b.employeeId !== req.employeeId) return b;
        const entry = b[req.leaveType];
        return { ...b, [req.leaveType]: { ...entry, pending: Math.max(0, entry.pending - req.totalDays) } };
      });
      setBalances(nextBal); saveLeaveBalances(nextBal);
      const emp = employees.find((e) => e.id === req.employeeId);
      addNotification({
        title: "Leave Rejected", titleAr: t.leaves.notify.rejected,
        body: `${emp?.name ?? req.employeeId} — ${reason}`,
        bodyAr: `${emp?.name ?? req.employeeId} — ${reason}`,
        category: "hr", severity: "warning",
        actionLabel: "View", actionLabelAr: t.leaves.actions.view,
        actionRoute: "/leaves", entityId: req.id,
      });
    }
    showToast(t.leaves.toast.rejected);
  };

  const handleCancel = (id: string) => {
    const req = requests.find((r) => r.id === id);
    const next = requests.map((r) => r.id === id ? { ...r, status: "cancelled" as LeaveStatus } : r);
    setRequests(next); saveLeaveRequests(next);
    if (req) {
      const nextBal = balances.map((b) => {
        if (b.employeeId !== req.employeeId) return b;
        const entry = b[req.leaveType];
        return { ...b, [req.leaveType]: { ...entry, pending: Math.max(0, entry.pending - req.totalDays) } };
      });
      setBalances(nextBal); saveLeaveBalances(nextBal);
    }
    showToast(t.leaves.toast.cancelled);
  };

  const handleSubmitRequest = (payload: Omit<LeaveRequest, "id" | "createdAt" | "status">) => {
    const id = `LR-${Date.now()}`;
    const newReq: LeaveRequest = { ...payload, id, status: "pending", createdAt: new Date().toISOString() };
    const next = [newReq, ...requests];
    setRequests(next); saveLeaveRequests(next);
    const nextBal = balances.map((b) => {
      if (b.employeeId !== payload.employeeId) return b;
      const entry = b[payload.leaveType];
      return { ...b, [payload.leaveType]: { ...entry, pending: entry.pending + payload.totalDays } };
    });
    setBalances(nextBal); saveLeaveBalances(nextBal);
    // Check low balance after submission
    const updatedBal = nextBal.find((b) => b.employeeId === payload.employeeId);
    if (updatedBal) {
      const entry = updatedBal[payload.leaveType];
      const remaining = Math.max(0, entry.entitled - entry.used - entry.pending);
      if (payload.leaveType === "annual" && remaining < 3 && entry.entitled > 0) {
        const emp = employees.find((e) => e.id === payload.employeeId);
        addNotification({
          title: "Low Leave Balance", titleAr: t.leaves.notify.balanceLow,
          body: `${emp?.name ?? payload.employeeId} — ${remaining} days remaining`,
          bodyAr: `${emp?.name ?? payload.employeeId} — ${remaining} ${t.leaves.balances.remaining}`,
          category: "hr", severity: "warning",
          actionRoute: "/leaves", entityId: payload.employeeId,
        });
      }
    }
    const emp = employees.find((e) => e.id === payload.employeeId);
    addNotification({
      title: "New Leave Request", titleAr: t.leaves.notify.newRequest,
      body: `${emp?.name ?? payload.employeeId} — ${payload.totalDays} days ${payload.leaveType}`,
      bodyAr: `${emp?.name ?? payload.employeeId} — ${payload.totalDays} ${t.leaves.balances.remaining.replace("متبقي", "أيام")} ${t.leaves.types[payload.leaveType]}`,
      category: "hr", severity: "info",
      actionLabel: "Review", actionLabelAr: t.leaves.actions.approve,
      actionRoute: "/leaves", entityId: id,
    });
    setShowModal(false);
    showToast(t.leaves.toast.submitted);
  };

  const handleSavePolicy = (p: LeavePolicy) => {
    setPolicy(p); saveLeavePolicy(p);
    showToast(t.leaves.toast.policySaved);
  };

  const TABS: Array<{ key: LeaveTab; label: string; icon: typeof Calendar }> = [
    { key: "requests",  label: t.leaves.tabs.requests,  icon: FileText },
    { key: "balances",  label: t.leaves.tabs.balances,  icon: CalendarDays },
    { key: "calendar",  label: t.leaves.tabs.calendar,  icon: Calendar },
    { key: "policy",    label: t.leaves.tabs.policy,    icon: Settings2 },
  ];

  return (
    <div className="lv-page">
      {/* Header */}
      <header className="lv-header">
        <div>
          <p>{t.leaves.pageSubtitle}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          + {t.leaves.newRequest}
        </Button>
      </header>

      {/* KPI row */}
      <div className="lv-kpi-row">
        <div className="lv-kpi-card lv-kpi-amber">
          <Clock size={20} />
          <div>
            <span>{t.leaves.kpi.pending}</span>
            <strong>{kpi.pending}</strong>
          </div>
        </div>
        <div className="lv-kpi-card lv-kpi-green">
          <CheckCircle size={20} />
          <div>
            <span>{t.leaves.kpi.approved}</span>
            <strong>{kpi.approved}</strong>
          </div>
        </div>
        <div className="lv-kpi-card lv-kpi-blue">
          <Users size={20} />
          <div>
            <span>{t.leaves.kpi.onLeaveToday}</span>
            <strong>{kpi.onLeaveToday}</strong>
          </div>
        </div>
        <div className="lv-kpi-card lv-kpi-slate">
          <CalendarDays size={20} />
          <div>
            <span>{t.leaves.kpi.totalRequests}</span>
            <strong>{kpi.total}</strong>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="lv-tab-nav">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`lv-tab-btn ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} />
            {label}
            {key === "requests" && kpi.pending > 0 && <span className="lv-tab-badge">{kpi.pending}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="lv-tab-content">
        {activeTab === "requests" && (
          <RequestsTab requests={requests} employees={employees} t={t} isArabic={isArabic}
            onApprove={handleApprove} onReject={handleReject} onCancel={handleCancel} />
        )}
        {activeTab === "balances" && (
          <BalancesTab balances={balances} employees={employees} t={t} />
        )}
        {activeTab === "calendar" && (
          <CalendarTab requests={requests} employees={employees} t={t} locale={locale} />
        )}
        {activeTab === "policy" && (
          <PolicyTab policy={policy} t={t} onSave={handleSavePolicy} />
        )}
      </div>

      {/* Leave request modal */}
      {showModal && (
        <LeaveRequestModal
          t={t} employees={employees} balances={balances} policy={policy}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitRequest}
        />
      )}

      {/* Toast */}
      {toast && <div className="lv-toast">{toast}</div>}
    </div>
  );
}
