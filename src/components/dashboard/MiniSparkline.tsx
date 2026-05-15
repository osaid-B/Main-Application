import type { WorkspaceTone } from "../../data/dashboardMock";

interface Props {
  data: number[];
  tone: WorkspaceTone;
  height?: number;
}

const COLOR_BY_TONE: Record<WorkspaceTone, string> = {
  blue: "var(--atlas-blue)",
  green: "var(--atlas-green)",
  purple: "var(--atlas-purple)",
};

const FILL_BY_TONE: Record<WorkspaceTone, string> = {
  blue: "var(--atlas-blue-100)",
  green: "var(--atlas-green-100)",
  purple: "var(--atlas-purple-100)",
};

/**
 * Pure-SVG sparkline. No grid, axes, or tooltips — pure trend shape.
 * Height defaults to 40px to match Atlas workspace card spec.
 */
export function MiniSparkline({ data, tone, height = 40 }: Props) {
  const w = 200;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });

  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
      style={{ display: "block" }}
      aria-hidden
    >
      <path d={area} fill={FILL_BY_TONE[tone]} opacity={0.55} />
      <path
        d={line}
        fill="none"
        stroke={COLOR_BY_TONE[tone]}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
