import type { TimelineEventData } from "../../data/dashboardMock";
import styles from "./TimelineEvent.module.css";

interface Props {
  event: TimelineEventData;
}

/** Single timeline row — monospace time + colored pulsing dot + title/description. */
export function TimelineEvent({ event }: Props) {
  return (
    <li className={styles.row}>
      <span className={styles.time}>{event.time}</span>
      <span
        className={`status-dot status-dot--${event.dot} status-dot--pulse ${styles.dot}`}
        aria-hidden
      />
      <div className={styles.body}>
        <strong>{event.title}</strong>
        <p>{event.description}</p>
      </div>
    </li>
  );
}
