import { Building2, Coffee, Hammer, TrendingUp } from "lucide-react";
import type { WorkspaceStats } from "../../data/dashboardMock";
import { MiniSparkline } from "./MiniSparkline";
import styles from "./WorkspaceCard.module.css";

interface Props {
  data: WorkspaceStats;
}

const ICON_BY_COLOR = {
  blue: Building2,
  green: Coffee,
  purple: Hammer,
} as const;

/**
 * Atlas workspace KPI card. Renders the colored accent bar, icon,
 * revenue figure with trend, embedded sparkline, and a 3-cell stats grid.
 */
export function WorkspaceCard({ data }: Props) {
  const Icon = ICON_BY_COLOR[data.color];
  return (
    <article className={`${styles.card} ${styles[`tone_${data.color}`]}`}>
      <span className={styles.accentBar} aria-hidden />
      <header className={styles.header}>
        <span className={styles.iconWrap}>
          <Icon size={16} />
        </span>
        <div className={styles.titleBlock}>
          <h3 className={styles.name}>{data.name}</h3>
          <span className={styles.trend}>
            <TrendingUp size={11} aria-hidden /> +{data.trend}% vs last week
          </span>
        </div>
      </header>

      <div className={styles.revenue}>{data.revenueFmt}</div>

      <MiniSparkline data={data.sparkline} tone={data.color} height={40} />

      <ul className={styles.stats}>
        {data.stats.map((s) => (
          <li key={s.label} data-tone={s.tone}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}
