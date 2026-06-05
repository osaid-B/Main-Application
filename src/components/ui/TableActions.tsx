import { Check, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import styles from "./TableActions.module.css";

export interface TableActionsProps {
  onView?:    () => void;
  onEdit?:    () => void;
  onDelete?:  () => void;
  onAdd?:     () => void;
  onApprove?: () => void;
  onReject?:  () => void;
}

interface ActionConfig {
  Icon: React.ComponentType<{ size?: number }>;
  title: string;
  hoverColor: string;
  hoverBg: string;
  isDelete?: boolean;
}

const CONFIGS: Record<string, ActionConfig> = {
  add:     { Icon: Plus,    title: "إضافة",  hoverColor: "#2563EB", hoverBg: "rgba(37,99,235,0.08)" },
  approve: { Icon: Check,   title: "موافقة", hoverColor: "#16A34A", hoverBg: "rgba(22,163,74,0.08)" },
  reject:  { Icon: X,       title: "رفض",    hoverColor: "#DC2626", hoverBg: "rgba(220,38,38,0.08)" },
  view:    { Icon: Eye,     title: "عرض",    hoverColor: "#0891B2", hoverBg: "rgba(8,145,178,0.08)" },
  edit:    { Icon: Pencil,  title: "تعديل",  hoverColor: "#16A34A", hoverBg: "rgba(22,163,74,0.08)" },
  delete:  { Icon: Trash2,  title: "حذف",    hoverColor: "#DC2626", hoverBg: "rgba(220,38,38,0.08)", isDelete: true },
};

function ActionButton({ configKey, onClick }: { configKey: string; onClick: () => void }) {
  const cfg = CONFIGS[configKey];
  const { Icon } = cfg;
  return (
    <button
      type="button"
      title={cfg.title}
      className={`${styles.btn}${cfg.isDelete ? ` ${styles.btnDelete}` : ""}`}
      style={{ "--ta-hover-color": cfg.hoverColor, "--ta-hover-bg": cfg.hoverBg } as React.CSSProperties}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <Icon size={15} />
    </button>
  );
}

export function TableActions({
  onView, onEdit, onDelete, onAdd, onApprove, onReject,
}: TableActionsProps) {
  const actions = [
    onAdd     && { key: "add",     handler: onAdd },
    onApprove && { key: "approve", handler: onApprove },
    onReject  && { key: "reject",  handler: onReject },
    onView    && { key: "view",    handler: onView },
    onEdit    && { key: "edit",    handler: onEdit },
    onDelete  && { key: "delete",  handler: onDelete },
  ].filter(Boolean) as Array<{ key: string; handler: () => void }>;

  return (
    <div className={`${styles.wrap} table-actions-container`}>
      {actions.map(({ key, handler }, index) => (
        <div key={key} style={{ display: "flex", alignItems: "center" }}>
          {key === "delete" && index > 0 && (
            <div className={styles.divider} />
          )}
          <ActionButton configKey={key} onClick={handler} />
        </div>
      ))}
    </div>
  );
}
