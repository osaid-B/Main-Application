import { FileText, Hammer, ShoppingCart, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PinnedAction } from "../../data/dashboardMock";
import styles from "./PinnedActionButton.module.css";

interface Props {
  action: PinnedAction;
}

const ICONS = {
  FileText,
  Hammer,
  ShoppingCart,
  UserPlus,
} as const;

/** Tile-style quick-action button. Icon in a colored circle + label. */
export function PinnedActionButton({ action }: Props) {
  const navigate = useNavigate();
  const Icon = ICONS[action.icon];

  return (
    <button
      type="button"
      className={`${styles.tile} ${styles[`tone_${action.color}`]}`}
      onClick={() => navigate(action.path)}
    >
      <span className={styles.iconCircle} aria-hidden>
        <Icon size={16} />
      </span>
      <span className={styles.label}>{action.label}</span>
    </button>
  );
}
