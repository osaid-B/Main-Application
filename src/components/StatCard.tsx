import type { ReactNode } from "react";

type Tone = "default" | "info" | "success" | "warning" | "danger" | "purple";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  helperText?: string;
  icon?: ReactNode;
  tone?: Tone;
  compact?: boolean;
};

const toneClasses: Record<
  Tone,
  {
    border: string;
    iconWrap: string;
    title: string;
    value: string;
    helper: string;
  }
> = {
  default: {
    border: "border-slate-200",
    iconWrap: "bg-slate-100 text-slate-700",
    title: "text-slate-500",
    value: "text-slate-900",
    helper: "text-slate-400",
  },
  info: {
    border: "border-sky-200",
    iconWrap: "bg-sky-50 text-sky-700",
    title: "text-sky-700",
    value: "text-slate-900",
    helper: "text-slate-500",
  },
  success: {
    border: "border-emerald-200",
    iconWrap: "bg-emerald-50 text-emerald-700",
    title: "text-emerald-700",
    value: "text-emerald-700",
    helper: "text-slate-500",
  },
  warning: {
    border: "border-amber-200",
    iconWrap: "bg-amber-50 text-amber-700",
    title: "text-amber-700",
    value: "text-amber-700",
    helper: "text-slate-500",
  },
  danger: {
    border: "border-rose-200",
    iconWrap: "bg-rose-50 text-rose-700",
    title: "text-rose-700",
    value: "text-rose-700",
    helper: "text-slate-500",
  },
  purple: {
    border: "border-violet-200",
    iconWrap: "bg-violet-50 text-violet-700",
    title: "text-violet-700",
    value: "text-violet-700",
    helper: "text-slate-500",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  helperText,
  icon,
  tone = "default",
  compact = false,
}: StatCardProps) {
  const styles = toneClasses[tone];

  return (
    <div
      className={`rounded-2xl border ${styles.border} bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>

          <h3
            className={`mt-3 font-bold tracking-tight ${styles.value} ${
              compact ? "text-3xl" : "text-4xl"
            }`}
          >
            {value}
          </h3>

          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          ) : null}

          {helperText ? (
            <p className={`mt-2 text-xs font-medium ${styles.helper}`}>
              {helperText}
            </p>
          ) : null}
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${styles.iconWrap}`}
        >
          {icon ?? "📊"}
        </div>
      </div>
    </div>
  );
}