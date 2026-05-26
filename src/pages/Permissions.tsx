import { useState } from "react";
import { Plus } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { useSettings } from "../context/SettingsContext";
import { ROLES } from "../data/permissionsMock";
import { type Role, type PermissionAction, type PermissionModule } from "../data/types";
import styles from "./Permissions.module.css";

const ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "export"];

const VIEW_ONLY: Record<PermissionAction, boolean> = {
  view: true, create: false, edit: false, delete: false, export: false,
};

const MODULES = ["pos", "customers", "invoices", "inventory", "reports", "employees", "settings"];
const MODULE_LABELS: Record<string, { label: string; labelAr: string }> = {
  pos:       { label: "POS",       labelAr: "نقطة البيع" },
  customers: { label: "Customers", labelAr: "الزبائن"   },
  invoices:  { label: "Invoices",  labelAr: "الفواتير"  },
  inventory: { label: "Inventory", labelAr: "المخزون"   },
  reports:   { label: "Reports",   labelAr: "التقارير"  },
  employees: { label: "Employees", labelAr: "الموظفون"  },
  settings:  { label: "Settings",  labelAr: "الإعدادات" },
};

export default function Permissions() {
  const { t } = useSettings();
  const tc = t.permissions;

  const [roles, setRoles] = useState<Role[]>(ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  function togglePermission(roleId: string, module: string, action: PermissionAction) {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId || r.isSystem) return r;
        return {
          ...r,
          permissions: r.permissions.map((p) => {
            if (p.module !== module) return p;
            return { ...p, actions: { ...p.actions, [action]: !p.actions[action] } };
          }),
        };
      }),
    );
  }

  function addRole(name: string, nameAr: string, description: string) {
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name,
      nameAr,
      description,
      descriptionAr: "",
      userCount: 0,
      isSystem: false,
      permissions: MODULES.map((m) => ({
        module: m,
        ...MODULE_LABELS[m],
        actions: { ...VIEW_ONLY },
      })),
    };
    setRoles((prev) => [...prev, newRole]);
    setIsAdding(false);
    setSelectedRoleId(newRole.id);
  }

  function deleteRole(role: Role) {
    if (role.userCount > 0) {
      if (!window.confirm(tc.confirm.deleteMsg.replace("{{n}}", String(role.userCount)))) return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    setDeleteTarget(null);
    if (selectedRoleId === role.id) setSelectedRoleId(null);
  }

  return (
    <Container maxWidth="full" padding="md">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{tc.pageTitle}</h1>
          <p className={styles.subtitle}>{tc.pageSubtitle}</p>
        </div>
      </header>

      <div className={styles.twoPanel}>
        {/* Left: roles list */}
        <aside className={styles.rolesPanel}>
          <div className={styles.rolesPanelHeader}>
            <span className={styles.rolesPanelTitle}>{tc.roles.title}</span>
            <Button variant="ghost" size="sm" leftIcon={<Plus size={12} />} onClick={() => setIsAdding(true)}>
              {tc.roles.addRole}
            </Button>
          </div>
          {roles.map((role) => (
            <div
              key={role.id}
              className={`${styles.roleCard} ${selectedRoleId === role.id ? styles.roleCardActive : ""}`}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <div className={styles.roleCardMain}>
                <div className={styles.roleName}>{role.name}</div>
                <div className={styles.roleNameAr}>{role.nameAr}</div>
                <div className={styles.roleDesc}>{role.description}</div>
              </div>
              <div className={styles.roleCardMeta}>
                <span className={styles.roleUserCount}>
                  {tc.roles.userCount.replace("{{n}}", String(role.userCount))}
                </span>
                {role.isSystem && (
                  <span className={styles.systemBadge}>{tc.roles.systemRole}</span>
                )}
                {!role.isSystem && (
                  <button
                    type="button"
                    className={styles.deleteRoleBtn}
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(role); }}
                  >
                    {tc.roles.deleteRole}
                  </button>
                )}
              </div>
            </div>
          ))}
        </aside>

        {/* Right: permissions matrix */}
        <section className={styles.matrixPanel}>
          {!selectedRole ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>{tc.matrix.selectRole}</p>
            </div>
          ) : (
            <>
              <div className={styles.matrixHeader}>
                <div>
                  <div className={styles.matrixTitle}>{selectedRole.name} — {tc.matrix.title}</div>
                  <div className={styles.matrixSub}>{selectedRole.nameAr}</div>
                </div>
                {selectedRole.isSystem && (
                  <span className={styles.systemBadge}>{tc.roles.systemRole}</span>
                )}
              </div>
              <div className={styles.matrixWrap}>
                <table className={styles.matrix}>
                  <thead>
                    <tr>
                      <th>{tc.matrix.modules}</th>
                      {ACTIONS.map((a) => (
                        <th key={a} className={styles.actionCol}>{tc.matrix.actions[a]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRole.permissions.map((perm: PermissionModule) => (
                      <tr key={perm.module}>
                        <td>
                          <div className={styles.moduleCell}>
                            <span className={styles.moduleLabel}>{perm.label}</span>
                            <span className={styles.moduleLabelAr}>{perm.labelAr}</span>
                          </div>
                        </td>
                        {ACTIONS.map((action) => (
                          <td key={action} className={styles.checkboxCell}>
                            <input
                              type="checkbox"
                              checked={perm.actions[action]}
                              disabled={selectedRole.isSystem}
                              onChange={() => togglePermission(selectedRole.id, perm.module, action)}
                              className={styles.checkbox}
                              aria-label={`${perm.label} ${action}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!selectedRole.isSystem && (
                <div className={styles.matrixFooter}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.alert("Changes saved (mock).")}
                  >
                    {t.common.saveChanges}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Add Role Modal */}
      {isAdding && (
        <AddRoleModal
          onSave={addRole}
          onClose={() => setIsAdding(false)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => setDeleteTarget(null)}
          title={tc.confirm.deleteTitle}
          size="sm"
          footer={
            <div className={styles.confirmFooter}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t.common.cancel}</Button>
              <Button variant="primary" onClick={() => deleteRole(deleteTarget)}>
                {tc.roles.deleteRole}
              </Button>
            </div>
          }
        >
          <p className={styles.confirmMsg}>
            {tc.confirm.deleteMsg.replace("{{n}}", String(deleteTarget.userCount))}
          </p>
        </Modal>
      )}
    </Container>
  );
}

function AddRoleModal({
  onSave,
  onClose,
}: {
  onSave: (name: string, nameAr: string, description: string) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const tc = t.permissions;

  const [name,        setName]        = useState("");
  const [nameAr,      setNameAr]      = useState("");
  const [description, setDescription] = useState("");

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={tc.roles.addRole}
      size="sm"
      footer={
        <div className={styles.confirmFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={() => onSave(name, nameAr, description)} disabled={!name.trim()}>
            {tc.roles.addRole}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <Input label={tc.form.name}        value={name}        onChange={(e) => setName(e.target.value)}        required />
        <Input label={tc.form.nameAr}      value={nameAr}      onChange={(e) => setNameAr(e.target.value)}      />
        <Input label={tc.form.description} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </Modal>
  );
}
