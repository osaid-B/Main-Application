import { useMemo, useState } from "react";
import { Plus, Search, Briefcase } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Grid } from "../components/layout/Grid";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useLoadingDelay } from "../hooks/useLoadingDelay";
import { type Department } from "../data/types";
import styles from "./Departments.module.css";

type ViewMode = "table" | "orgChart";


export default function Departments() {
  const { t, formatCurrency } = useSettings();
  const tc = t.departments;
  const { departments, addDepartment, updateDepartment, employees } = useData();
  const [view, setView] = useState<ViewMode>("table");
  const [query, setQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [detailDept, setDetailDept] = useState<Department | null>(null);

  const activeEmployees = useMemo(() => employees.filter((e) => !e.isDeleted), [employees]);

  const filtered = useMemo(() => departments.filter((d) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.nameAr.includes(q) || (d.headName ?? "").toLowerCase().includes(q);
  }), [departments, query]);

  const isLoading = useLoadingDelay();
  const totalDepts    = departments.length;
  const totalHead     = useMemo(() => activeEmployees.filter((e) => departments.some((d) => d.id === e.departmentId)).length, [activeEmployees, departments]);
  const totalOpen     = useMemo(() => departments.reduce((s, d) => s + d.openPositions, 0), [departments]);
  const avgSize       = totalDepts > 0 ? (activeEmployees.length / totalDepts).toFixed(1) : "0";

  function parentName(parentId?: string) {
    if (!parentId) return null;
    return departments.find((d) => d.id === parentId)?.name ?? null;
  }

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

  return (
    <Container maxWidth="full" padding="md">
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
          <Kpi label={tc.kpi.total}     value={String(totalDepts)} sub={tc.kpi.totalSub}     tone="info"    />
          <Kpi label={tc.kpi.headcount} value={String(totalHead)}  sub={tc.kpi.headcountSub} tone="success" />
          <Kpi label={tc.kpi.openPos}   value={String(totalOpen)}  sub={tc.kpi.openPosSub}   tone="warning" />
          <Kpi label={tc.kpi.avgSize}   value={avgSize}            sub={tc.kpi.avgSizeSub}   tone="neutral" />
        </Grid>

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
            <button
              type="button"
              className={`${styles.viewBtn} ${view === "table" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("table")}
            >
              {tc.views.table}
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === "orgChart" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("orgChart")}
            >
              {tc.views.orgChart}
            </button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton variant="rect" height={320} />
        ) : view === "table" ? (
          <div className={`${styles.tableWrap} atlas-table-wrapper`}>
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col />
                <col className="col-w-130" />
                <col className="col-w-90" />
                <col className="col-currency" />
                <col className="col-w-110" />
                <col className="col-w-90" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-entity">{tc.cols.name}</th>
                  <th>{tc.cols.head}</th>
                  <th className="col-num">{tc.cols.headcount}</th>
                  <th className="col-num">{tc.cols.revenue}</th>
                  <th className="col-num">{tc.cols.openPositions}</th>
                  <th className="col-badge">{tc.cols.status}</th>
                  <th className="col-actions">{tc.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const parent = parentName(d.parentId);
                  return (
                    <tr key={d.id} onClick={() => setDetailDept(d)} style={{ cursor: "pointer" }}>
                      <td>
                        <div className={`${styles.deptCell} ${d.parentId ? styles.deptCellChild : ""}`}>
                          <div className={styles.deptName}>{d.name}</div>
                          <div className={styles.deptNameAr}>{d.nameAr}</div>
                          {parent && <span className={styles.parentBadge}>{parent}</span>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.headName}>{d.headName ?? "—"}</div>
                        {d.headId && <div className={styles.headId}>{d.headId}</div>}
                      </td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{d.headcount}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>
                        {d.monthlyRevenue > 0 ? formatCurrency(d.monthlyRevenue) : "—"}
                      </td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>
                        {d.openPositions > 0 ? (
                          <span className={styles.openPos}>{d.openPositions}</span>
                        ) : "—"}
                      </td>
                      <td className="col-badge">
                        <Badge variant={d.status === "active" ? "success" : "neutral"} size="sm">
                          {d.status === "active" ? t.common.active : t.common.inactive}
                        </Badge>
                      </td>
                      <td className="col-actions">
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={(e) => { e.stopPropagation(); setEditing(d); }}
                        >
                          {t.common.edit}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}><EmptyState icon={<Briefcase size={28} />} title={tc.noDepts} /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <OrgChart departments={departments} />
        )}
      </Stack>

      {/* Add/Edit modal */}
      {(isAdding || editing !== null) && (
        <DepartmentFormModal
          initial={editing ?? undefined}
          allDepts={departments}
          onSave={saveDepartment}
          onClose={() => { setIsAdding(false); setEditing(null); }}
        />
      )}

      {/* Detail drawer */}
      {detailDept && (
        <DeptDetailDrawer
          dept={detailDept}
          members={activeEmployees.filter((e) => e.departmentId === detailDept.id).map((e) => e.name)}
          onClose={() => setDetailDept(null)}
        />
      )}
    </Container>
  );
}

function OrgChart({ departments }: { departments: Department[] }) {
  const { t } = useSettings();
  const staffLabel = t.departments.orgNodeStaff;
  const topLevel = departments.filter((d) => !d.parentId);

  return (
    <div className={styles.orgRoot}>
      {topLevel.map((dept) => (
        <OrgNode
          key={dept.id}
          dept={dept}
          staffLabel={staffLabel}
          children={departments.filter((d) => d.parentId === dept.id)}
        />
      ))}
    </div>
  );
}

function OrgNode({ dept, children, staffLabel }: { dept: Department; children: Department[]; staffLabel: string }) {
  return (
    <div className={styles.orgBranch}>
      <div className={styles.orgNode}>
        <div className={styles.orgNodeName}>{dept.name}</div>
        <div className={styles.orgNodeMeta}>{dept.headcount} {staffLabel}</div>
      </div>
      {children.length > 0 && (
        <div className={styles.orgChildren}>
          {children.map((child) => (
            <div key={child.id} className={styles.orgChildNode}>
              <div className={styles.orgNode}>
                <div className={styles.orgNodeName}>{child.name}</div>
                <div className={styles.orgNodeMeta}>{child.headcount} {staffLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentFormModal({
  initial,
  allDepts,
  onSave,
  onClose,
}: {
  initial?: Department;
  allDepts: Department[];
  onSave: (data: Omit<Department, "id">) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const tc = t.departments;

  const [name,     setName]     = useState(initial?.name        ?? "");
  const [nameAr,   setNameAr]   = useState(initial?.nameAr      ?? "");
  const [head,     setHead]     = useState(initial?.headName     ?? "");
  const [parentId, setParentId] = useState(initial?.parentId     ?? "");
  const [status,   setStatus]   = useState<"active" | "inactive">(initial?.status ?? "active");

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      nameAr: nameAr.trim(),
      headName: head.trim() || undefined,
      headId: undefined,
      parentId: parentId || undefined,
      headcount: initial?.headcount ?? 0,
      openPositions: initial?.openPositions ?? 0,
      monthlyRevenue: initial?.monthlyRevenue ?? 0,
      status,
    });
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={initial ? tc.form.editTitle : tc.form.createTitle}
      size="sm"
      footer={
        <div className={styles.formFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {initial ? t.common.saveChanges : tc.addDept}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <div className={styles.formRow}>
          <Input label={tc.form.name}   value={name}   onChange={(e) => setName(e.target.value)}   required />
          <Input label={tc.form.nameAr} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </div>
        <Input label={tc.form.head} value={head} onChange={(e) => setHead(e.target.value)} placeholder="e.g. Ahmad Qasim" />
        <div className={styles.formRow}>
          <div>
            <label className={styles.formLabel}>{tc.form.parent}</label>
            <select className={styles.formSelect} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">{tc.form.none}</option>
              {allDepts.filter((d) => !initial || d.id !== initial.id).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.formLabel}>{tc.form.status}</label>
            <select className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")}>
              <option value="active">{t.common.active}</option>
              <option value="inactive">{t.common.inactive}</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DeptDetailDrawer({
  dept,
  members,
  onClose,
}: {
  dept: Department;
  members: string[];
  onClose: () => void;
}) {
  const { t, formatCurrency } = useSettings();
  const tc = t.departments;

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerTitle}>{dept.name}</div>
            <div className={styles.drawerSub}>{dept.nameAr}</div>
          </div>
          <button type="button" className={styles.drawerClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.drawerBody}>
          <section className={styles.drawerSection}>
            <div className={styles.drawerSectionTitle}>{tc.detail.members}</div>
            {members.map((m) => (
              <div key={m} className={styles.memberRow}>{m}</div>
            ))}
          </section>
          {dept.monthlyRevenue > 0 && (
            <section className={styles.drawerSection}>
              <div className={styles.drawerSectionTitle}>{tc.detail.revenue}</div>
              <div className={styles.drawerValue}>{formatCurrency(dept.monthlyRevenue)}</div>
            </section>
          )}
          <section className={styles.drawerSection}>
            <div className={styles.drawerSectionTitle}>{tc.detail.openPositions}</div>
            <div className={styles.drawerValue}>
              {dept.openPositions > 0 ? dept.openPositions : "—"}
            </div>
          </section>
        </div>
        <div className={styles.drawerFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.close}</Button>
        </div>
      </aside>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "success" | "info" | "warning" | "neutral" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span className={styles.kpiSub}>{sub}</span>
    </article>
  );
}
