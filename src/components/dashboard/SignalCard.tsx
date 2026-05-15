import { ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { SignalData } from "../../data/dashboardMock";
import styles from "./SignalCard.module.css";

interface Props {
  signal: SignalData;
}

const BADGE_VARIANT = {
  critical: "danger",
  operations: "warning",
  finance: "info",
} as const;

/**
 * Operational alert card — colored accent bar, semantic Badge, title,
 * description, and an action Button with arrow icon.
 */
export function SignalCard({ signal }: Props) {
  return (
    <article className={`${styles.card} ${styles[`tone_${signal.tone}`]}`}>
      <header className={styles.header}>
        <Badge variant={BADGE_VARIANT[signal.tone]} size="sm">{signal.badge}</Badge>
      </header>
      <h3 className={styles.title}>{signal.title}</h3>
      <p className={styles.desc}>{signal.description}</p>
      <div className={styles.action}>
        <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={12} />}>
          {signal.actionLabel}
        </Button>
      </div>
    </article>
  );
}
