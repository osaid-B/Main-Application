import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePoint } from "../../data/dashboardMock";
import { useSettings } from "../../context/SettingsContext";

interface Props {
  data: RevenuePoint[];
}

const TOOLTIP_STYLE = {
  background: "var(--app-surface)",
  border: "1px solid var(--app-border)",
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
};

const formatThousands = (v: number | string) => `₪${(Number(v) / 1000).toFixed(0)}k`;

function RevenueYTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  return (
    <text x={(x ?? 0) - 20} y={y ?? 0} dy={4} textAnchor="end" fontSize={11} fill="var(--app-text-muted)">
      {formatThousands(payload?.value ?? 0)}
    </text>
  );
}

/**
 * Atlas revenue trend chart — 3 lines (Company / POS / Factory) over 14 days.
 * Uses recharts with token-driven colors and a custom tooltip style.
 */
export function RevenueChart({ data }: Props) {
  const { isArabic } = useSettings();
  const chartData = isArabic
    ? data.map((d) => ({ ...d, date: d.dateAr }))
    : data;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--app-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={<RevenueYTick />}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v) => formatThousands(v as number)}
        />
        <Line type="monotone" dataKey="company" name={isArabic ? "الشركة" : "Company"} stroke="var(--atlas-blue)"   strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="pos"     name={isArabic ? "نقطة البيع" : "POS"} stroke="var(--atlas-green)"  strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="factory" name={isArabic ? "المصنع" : "Factory"} stroke="var(--atlas-purple)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
