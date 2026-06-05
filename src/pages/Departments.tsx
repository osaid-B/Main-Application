import { useMemo, useState } from "react";
import {
  Plus, Search, Briefcase, Trash2, X, Loader2,
} from "lucide-react";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Grid } from "../components/layout/Grid";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TableActions } from "../components/ui/TableActions";
import { Modal } from "../components/ui/Modal";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useLoadingDelay } from "../hooks/useLoadingDelay";
import { type Department, type Employee } from "../data/types";
import styles from "./Departments.module.css";


type ViewMode = "table" | "orgChart";

export default function Departments() {
  const { t } = useSettings();
  const tc = t.departments;
  const { departments, addDepartment, updateDepartment, employees } = useData();
  const [view, setView] = useState<ViewMode>("table");
  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [detailDept, setDetailDept] = useState<Department | null>(null);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const activeEmployees = useMemo(() => employees.filter((e) => !e.isDeleted), [employees]);

  const filtered = useMemo(() => {
    let result = departments;

    if (activeFilter === "has_employees") {
      result = result.filter((d) => activeEmployees.some((e) => e.departmentId === d.id));
    } else if (activeFilter === "has_vacancies") {
      result = result.filter((d) => d.openPositions > 0);
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.nameAr?.toLowerCase().includes(q) ||
        (d.headName ?? "").toLowerCase().includes(q) ||
        (d.headId ?? "").toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q) ||
        String(activeEmployees.filter((e) => e.departmentId === d.id).length).includes(q) ||
        String(d.openPositions).includes(q)
      );
    }

    return result;
  }, [departments, query, activeFilter, activeEmployees]);

  const filterChipLabel = useMemo(() => {
    if (activeFilter === "has_employees") return "حسب الموظفين";
    if (activeFilter === "has_vacancies") return "حسب الشواغر";
    return null;
  }, [activeFilter]);

  const isLoading = useLoadingDelay();

  const getEmpCount = (deptId: string) =>
    activeEmployees.filter((e) => e.departmentId === deptId).length;

  const totalDepts = departments.length;
  const totalHead  = useMemo(() => activeEmployees.length, [activeEmployees]);
  const totalOpen  = useMemo(() => departments.reduce((s, d) => s + d.openPositions, 0), [departments]);
  const avgSize    = totalDepts > 0 ? (totalHead / totalDepts).toFixed(1) : "0";

  const PALETTE = ["#2563eb", "#7c3aed", "#16a34a", "#d97706", "#dc2626", "#0891b2", "#db2777", "#65a30d"];
  const topDepts = useMemo(
    () => [...departments].sort((a, b) => getEmpCount(b.id) - getEmpCount(a.id)).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [departments, activeEmployees],
  );
  const maxHc = topDepts.length > 0 ? getEmpCount(topDepts[0].id) : 1;

  function saveDepartment(data: Omit<Department, "id">) {
    if (editing) {
      updateDepartment({ ...editing, ...data });
      setEditing(null);
    } else {
      const id = `dept-${String(departments.length + 1).padStart(2, "0")}`;
      addDepartment({ ...data, id });
      setIsAdding(false);
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    if (pinValue !== "123") { setPinError(true); return; }
    setPinError(false); setDeleting(true);
    try {
      updateDepartment({ ...deleteTarget, status: "inactive" });
      setDeleteTarget(null); setPinValue("");
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  function kpiStyle(isActive: boolean, borderColor: string, bgColor: string): React.CSSProperties {
    const base: React.CSSProperties = {
      position: "relative",
      background: isActive ? bgColor : "var(--app-surface)",
      borderRadius: "var(--app-radius-lg)",
      padding: "var(--app-space-4)",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      boxShadow: "var(--app-shadow-soft)",
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 180ms ease",
    };
    if (isActive) {
      base.border = `2px solid ${borderColor}`;
    } else {
      base.border = "1px solid var(--app-border)";
    }
    return base;
  }

  return (
    <Container maxWidth="full" padding="md" className={styles.page}>
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAdding(true)}>
            {tc.addDept}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <div
            style={kpiStyle(activeFilter === null, "var(--atlas-blue)", "#EFF6FF")}
            onClick={() => setActiveFilter(null)}
          >
            <KpiLabel>{tc.kpi.total}</KpiLabel>
            <KpiValue>{String(totalDepts)}</KpiValue>
            <KpiSub>{tc.kpi.totalSub}</KpiSub>
          </div>
          <div
            style={kpiStyle(activeFilter === "has_employees", "var(--atlas-green)", "#F0FDF4")}
            onClick={() => setActiveFilter(activeFilter === "has_employees" ? null : "has_employees")}
          >
            <KpiLabel>{tc.kpi.headcount}</KpiLabel>
            <KpiValue>{String(totalHead)}</KpiValue>
            <KpiSub>{tc.kpi.headcountSub}</KpiSub>
          </div>
          <div
            style={kpiStyle(activeFilter === "has_vacancies", "var(--atlas-orange)", "#FFF7ED")}
            onClick={() => setActiveFilter(activeFilter === "has_vacancies" ? null : "has_vacancies")}
          >
            <KpiLabel>{tc.kpi.openPos}</KpiLabel>
            <KpiValue>{String(totalOpen)}</KpiValue>
            <KpiSub>{tc.kpi.openPosSub}</KpiSub>
          </div>
          <div
            style={kpiStyle(false, "var(--app-text-muted)", "#F8FAFC")}
            onClick={() => setActiveFilter(null)}
          >
            <KpiLabel>{tc.kpi.avgSize}</KpiLabel>
            <KpiValue>{avgSize}</KpiValue>
            <KpiSub>{tc.kpi.avgSizeSub}</KpiSub>
          </div>
        </Grid>

        {filterChipLabel && (
          <div className={styles.filterChip} style={{ animation: "chipIn 150ms ease forwards" }}>
            <span>{filterChipLabel}</span>
            <button type="button" onClick={() => setActiveFilter(null)} className={styles.filterChipClose}>
              <X size={12} />
            </button>
          </div>
        )}

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Input
              variant="search"
              placeholder={tc.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              fullWidth
            />
          </div>
          <div className={styles.viewToggle}>
            <button type="button" className={`${styles.viewBtn} ${view === "table" ? styles.viewBtnActive : ""}`} onClick={() => setView("table")}>
              {tc.views.table}
            </button>
            <button type="button" className={`${styles.viewBtn} ${view === "orgChart" ? styles.viewBtnActive : ""}`} onClick={() => setView("orgChart")}>
              {tc.views.orgChart}
            </button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton variant="rect" height={320} />
        ) : view === "table" ? (
          <div className={`${styles.tableWrap} atlas-table-wrapper`}>
            <div className={styles.tableSide}>
              <table className={`${styles.table} atlas-table`} style={{ flex: 1 }}>
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="col-entity">{tc.cols.name}</th>
                    <th>{tc.cols.head}</th>
                    <th className="col-num">{tc.cols.headcount}</th>
                    <th className="col-num">{tc.cols.openPositions}</th>
                    <th className="col-badge">{tc.cols.status}</th>
                    <th className="col-actions">{tc.cols.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.deptCell}>
                          <div className={styles.deptName}>{d.nameAr || d.name}</div>
                          <div className={styles.deptNameAr}>{d.name}</div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.headName}>{d.headName ?? "—"}</div>
                      </td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{getEmpCount(d.id)}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>
                        {d.openPositions > 0 ? (
                          <div className={styles.vacancyCell}>
                            <span className={styles.openPos}>{d.openPositions}</span>
                            <span className={styles.vacancyBadge}>شاغر</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="col-badge">
                        <Badge variant={d.status === "active" ? "success" : "neutral"} size="sm">
                          {d.status === "active" ? t.common.active : t.common.inactive}
                        </Badge>
                      </td>
                      <td className="col-actions">
                        <TableActions
                          onView={() => setDetailDept(d)}
                          onEdit={() => setEditing(d)}
                          onDelete={() => { setDeleteTarget(d); setPinValue(""); setPinError(false); }}
                        />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6}><EmptyState icon={<Briefcase size={28} />} title={tc.noDepts} /></td>
                    </tr>
                  )}
                </tbody>
              </table>
              <aside className={styles.chartSide}>
                <div className={styles.chartTitle}>عدد الموظفين</div>
                {topDepts.map((d, i) => {
                  const liveCount = getEmpCount(d.id);
                  const pct = maxHc > 0 ? (liveCount / maxHc) * 100 : 0;
                  const color = PALETTE[i % PALETTE.length];
                  return (
                    <div key={d.id} className={styles.chartRow}>
                      <span className={styles.chartLabel}>{d.nameAr || d.name}</span>
                      <div className={styles.chartBar}>
                        <div className={styles.chartFill} style={{ width: `${Math.max(pct, 4)}%`, background: color }} />
                        <div className={styles.chartTooltip}>
                          <span>{d.nameAr || d.name}</span>
                          <span className={styles.ttRow}><span>الموظفون</span><span>{liveCount}</span></span>
                          <span className={styles.ttRow}><span>الشواغر</span><span>{d.openPositions}</span></span>
                          <span className={styles.ttRow}><span>النسبة</span><span>{totalHead > 0 ? ((liveCount / totalHead) * 100).toFixed(1) : "0"}%</span></span>
                          <span className={styles.ttBadge} data-status={d.status}>{d.status === "active" ? "نشط" : "غير نشط"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </aside>
            </div>
          </div>
        ) : (
          <OrgChart departments={departments} activeEmployees={activeEmployees} />
        )}
      </Stack>

      {(isAdding || editing !== null) && (
        <DepartmentFormModal
          initial={editing ?? undefined}
          allDepts={departments}
          employees={activeEmployees}
          onSave={saveDepartment}
          onClose={() => { setIsAdding(false); setEditing(null); }}
        />
      )}

      {detailDept && (
        <Modal
          isOpen
          onClose={() => setDetailDept(null)}
          title={detailDept.nameAr || detailDept.name}
          description={detailDept.name}
          size="sm"
          footer={
            <div style={{ display: "flex", gap: "8px", justifyContent: "space-between", width: "100%" }}>
              <Button variant="ghost" onClick={() => setDetailDept(null)}>{t.common.close}</Button>
              <Button variant="primary" size="sm" onClick={() => { setDetailDept(null); setEditing(detailDept); }}>{t.common.edit}</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {detailDept.description && (
              <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>{detailDept.description}</p>
            )}
            <section>
              <div className={styles.drawerSectionTitle}>{tc.cols.head}</div>
              <div className={styles.drawerValue}>{detailDept.headName ?? "—"}</div>
            </section>
            <section>
              <div className={styles.drawerSectionTitle}>{tc.detail.members}</div>
              {activeEmployees.filter((e) => e.departmentId === detailDept.id).length > 0
                ? activeEmployees.filter((e) => e.departmentId === detailDept.id).map((e) => (
                    <div key={e.id} className={styles.memberRow}>{e.name}</div>
                  ))
                : <div style={{ fontSize: 12, color: "var(--app-text-muted)" }}>لا يوجد موظفون مرتبطون</div>}
            </section>
            <section>
              <div className={styles.drawerSectionTitle}>{tc.cols.headcount}</div>
              <div className={styles.drawerValue}>{getEmpCount(detailDept.id)}</div>
            </section>
            <section>
              <div className={styles.drawerSectionTitle}>{tc.detail.openPositions}</div>
              <div className={styles.drawerValue}>{detailDept.openPositions > 0 ? detailDept.openPositions : "—"}</div>
            </section>
          </div>
        </Modal>
      )}

      {/* Delete confirmation with PIN */}
      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => { setDeleteTarget(null); setPinValue(""); setPinError(false); }}
          title={t.common.delete}
          size="sm"
          footer={
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
              <Button variant="ghost" onClick={() => { setDeleteTarget(null); setPinValue(""); setPinError(false); }}>
                {t.common.cancel}
              </Button>
              <Button
                variant="primary"
                disabled={deleting || pinValue.length !== 3}
                onClick={handleDelete}
                style={{ background: "var(--atlas-red, #DC2626)" }}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t.common.delete}
              </Button>
            </div>
          }
        >
          <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>{tc.deleteConfirm}</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--app-text)", margin: "12px 0 0" }}>{deleteTarget.nameAr || deleteTarget.name}</p>
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--app-text-soft)" }}>{tc.pinRequired}</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={3}
              value={pinValue}
              onChange={(e) => { setPinValue(e.target.value.replace(/\D/g, "").slice(0, 3)); setPinError(false); }}
              autoFocus
              style={{
                width: "100%",
                marginTop: 4,
                height: 40,
                borderRadius: "var(--app-radius-sm)",
                border: pinError ? "2px solid #DC2626" : "1px solid var(--app-border)",
                textAlign: "center",
                fontSize: 18,
                letterSpacing: "0.5em",
                outline: "none",
                fontFamily: "var(--font-mono)",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleDelete();
                if (e.key === "Escape") { setDeleteTarget(null); setPinValue(""); setPinError(false); }
              }}
            />
            {pinError && <p style={{ fontSize: 12, color: "#DC2626", margin: "4px 0 0" }}>{tc.pinError}</p>}
          </div>
        </Modal>
      )}
    </Container>
  );
}

// ─── KPI sub-components ─────────────────────────────────────────────────────────

function KpiLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "var(--app-text-muted)" }}>{children}</span>;
}

function KpiValue({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--app-text)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{children}</strong>;
}

function KpiSub({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11, color: "var(--app-text-muted)" }}>{children}</span>;
}

// ─── Org Chart ────────────────────────────────────────────────────────────────

const ORG_LEVEL_STYLES = [
  { bg: "#eff6ff", border: "#2563eb", nameColor: "#1e3a8a" },
  { bg: "#f0fdf4", border: "#16a34a", nameColor: "#14532d" },
  { bg: "#f8fafc", border: "#94a3b8", nameColor: "#334155" },
] as const;

function OrgChart({ departments, activeEmployees }: { departments: Department[]; activeEmployees: Employee[] }) {
  const { t } = useSettings();
  const staffLabel = t.departments.orgNodeStaff;
  const topLevel = departments.filter((d) => !d.parentId);
  const getLiveCount = (deptId: string) => activeEmployees.filter((e) => e.departmentId === deptId).length;
  const maxHead = Math.max(...departments.map((d) => getLiveCount(d.id)), 1);

  return (
    <div className={styles.orgRoot}>
      {topLevel.map((dept) => (
        <OrgNode
          key={dept.id}
          dept={dept}
          level={0}
          staffLabel={staffLabel}
          maxHead={maxHead}
          getLiveCount={getLiveCount}
          children={departments.filter((d) => d.parentId === dept.id).map(child => ({
            ...child,
            _children: departments.filter((d) => d.parentId === child.id),
          }))}
          allDepts={departments}
        />
      ))}
    </div>
  );
}

type OrgNodeChild = Department & { _children: Department[] };

function OrgNode({ dept, level, children, staffLabel, maxHead, getLiveCount, allDepts }: {
  dept: Department; level: number; children: OrgNodeChild[]; staffLabel: string; maxHead: number;
  getLiveCount: (id: string) => number; allDepts: Department[];
}) {
  const ls = ORG_LEVEL_STYLES[Math.min(level, ORG_LEVEL_STYLES.length - 1)];
  const liveCount = getLiveCount(dept.id);
  const sizeScale = 1 + (liveCount / maxHead) * 0.4;
  const minW = Math.round(130 * sizeScale);

  return (
    <div className={styles.orgBranch}>
      <div className={styles.orgNode} style={{ background: ls.bg, borderColor: ls.border, minWidth: minW }}>
        <div className={styles.orgNodeName} style={{ color: ls.nameColor }}>{dept.nameAr || dept.name}</div>
        <div className={styles.orgNodeMeta}>{liveCount} {staffLabel}</div>
      </div>
      {children.length > 0 && (
        <div className={styles.orgChildren}>
          {children.map((child) => (
            <OrgNode key={child.id} dept={child} level={level + 1} staffLabel={staffLabel} maxHead={maxHead}
              getLiveCount={getLiveCount}
              children={child._children.map(gc => ({ ...gc, _children: allDepts.filter((d) => d.parentId === gc.id) }))}
              allDepts={allDepts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Department Form Modal ────────────────────────────────────────────────────

function DepartmentFormModal({ initial, allDepts, employees, onSave, onClose }: {
  initial?: Department; allDepts: Department[]; employees: Employee[]; onSave: (data: Omit<Department, "id">) => void; onClose: () => void;
}) {
  const { t } = useSettings();
  const tc = t.departments;

  const [nameAr,   setNameAr]   = useState(initial?.nameAr      ?? "");
  const [name,     setName]     = useState(initial?.name        ?? "");
  const [headId,   setHeadId]   = useState(initial?.headId      ?? "");
  const [parentId, setParentId] = useState(initial?.parentId    ?? "");
  const [status,   setStatus]   = useState<"active" | "inactive">(initial?.status ?? "active");
  const [desc,     setDesc]     = useState(initial?.description  ?? "");

  const selectedEmployee = employees.find((e) => e.id === headId);

  function handleSave() {
    if (!nameAr.trim() && !name.trim()) return;
    onSave({
      name: name.trim() || nameAr.trim(),
      nameAr: nameAr.trim() || name.trim(),
      headId: headId || undefined,
      headName: selectedEmployee?.name ?? undefined,
      parentId: parentId || undefined,
      headcount: initial?.headcount ?? 0,
      openPositions: initial?.openPositions ?? 0,
      monthlyRevenue: initial?.monthlyRevenue ?? 0,
      status,
      description: desc.trim() || undefined,
    });
  }

  const canSave = nameAr.trim().length > 0 || name.trim().length > 0;

  return (
    <Modal isOpen onClose={onClose} title={initial ? tc.form.editTitle : tc.form.createTitle} size="sm"
      footer={
        <div className={styles.formFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>{initial ? t.common.saveChanges : tc.addDept}</Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label className={styles.formLabel}>اسم القسم بالعربية *</label>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} fullWidth required />
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label className={styles.formLabel}>اسم القسم بالإنجليزية</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label className={styles.formLabel}>المسؤول</label>
          <select className={styles.formSelect} value={headId} onChange={(e) => setHeadId(e.target.value)}>
            <option value="">— بدون مسؤول —</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>{tc.form.parent}</label>
          <select className={styles.formSelect} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">{tc.form.none}</option>
            {allDepts.filter((d) => !initial || d.id !== initial.id).map((d) => (
              <option key={d.id} value={d.id}>{d.nameAr || d.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>{tc.form.status}</label>
          <select className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
            <option value="active">{t.common.active}</option>
            <option value="inactive">{t.common.inactive}</option>
          </select>
        </div>
        <div className={styles.formField} style={{ gridColumn: "1 / -1" }}>
          <label className={styles.formLabel}>الوصف</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="وصف مختصر للقسم..."
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--app-border)", borderRadius: "var(--app-radius-sm)", font: "inherit", fontSize: 13, color: "var(--app-text)", background: "var(--app-surface)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>
    </Modal>
  );
}


