import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PinnedAction } from "../../data/dashboardMock";
import { useSettings } from "../../context/SettingsContext";
import styles from "./PinnedActionButton.module.css";

interface Props {
  action: PinnedAction;
}

/** Tile-style quick-action button — text label + directional arrow, no icon. */
export function PinnedActionButton({ action }: Props) {
  const navigate = useNavigate();
  const { isArabic } = useSettings();

  return (
    <button
      type="button"
      className={`${styles.tile} ${styles[`tone_${action.color}`]}`}
      onClick={() => navigate(action.path)}
    >
      <span className={styles.label}>{isArabic ? action.labelAr : action.label}</span>
      <ArrowLeft size={13} className={styles.arrow} aria-hidden />
    </button>
  );
}
