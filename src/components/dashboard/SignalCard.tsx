import { ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import type { SignalData } from "../../data/dashboardMock";
import { useSettings } from "../../context/SettingsContext";
import styles from "./SignalCard.module.css";

interface Props {
  signal: SignalData;
}

export function SignalCard({ signal }: Props) {
  const { isArabic } = useSettings();
  return (
    <article className={`${styles.card} ${styles[`tone_${signal.tone}`]}`}>
      <h3 className={styles.title}>{isArabic ? signal.titleAr : signal.title}</h3>
      <p className={styles.desc}>{isArabic ? signal.descriptionAr : signal.description}</p>
      <div className={styles.action}>
        <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={12} />}>
          {isArabic ? signal.actionLabelAr : signal.actionLabel}
        </Button>
      </div>
    </article>
  );
}
