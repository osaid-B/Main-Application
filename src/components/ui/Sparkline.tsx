type SparklineProps = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
};

function curvePath(xs: number[], ys: number[]): string {
  if (xs.length < 2) return "";
  let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for (let i = 1; i < xs.length; i++) {
    const mx = ((xs[i - 1] + xs[i]) / 2).toFixed(1);
    d += ` C${mx},${ys[i - 1].toFixed(1)} ${mx},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`;
  }
  return d;
}

export function Sparkline({ data, color, width = 72, height = 26 }: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const px = 3;
  const py = 3;
  const innerW = width - 2 * px;
  const innerH = height - 2 * py;

  const xs = data.map((_, i) => px + (i / (data.length - 1)) * innerW);
  const ys = data.map(v => py + innerH * (1 - (v - min) / range));

  const trend = data[data.length - 1] - data[0];
  const lineColor = color ?? (trend > 4 ? "#16a34a" : trend < -4 ? "#ef4444" : "#94a3b8");

  const line = curvePath(xs, ys);
  const lx = xs[xs.length - 1];
  const ly = ys[ys.length - 1];
  const area = `${line} L${lx.toFixed(1)},${(height - py).toFixed(1)} L${px.toFixed(1)},${(height - py).toFixed(1)} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d={area} fill={lineColor} fillOpacity={0.1} />
      <path
        d={line}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r={2.5} fill={lineColor} />
    </svg>
  );
}

export function seededSparkline(seed: string, len = 9): number[] {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  const out: number[] = [];
  let cur = 25 + (Math.abs(h) % 50);
  for (let i = 0; i < len; i++) {
    h = ((h * 1664525) + 1013904223) | 0;
    const delta = ((Math.abs(h) >> 14) % 22) - 10;
    cur = Math.max(5, Math.min(95, cur + delta));
    out.push(cur);
  }
  return out;
}
