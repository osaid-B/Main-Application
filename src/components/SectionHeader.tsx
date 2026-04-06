type SectionHeaderProps = {
  badge: string;
  title: string;
  description: string;
  buttonLabel: string;
};

export default function SectionHeader({
  badge,
  title,
  description,
  buttonLabel,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <span className="inline-flex rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700">
          {badge}
        </span>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {title}
        </h1>

        <p className="mt-3 text-lg leading-8 text-slate-500">{description}</p>
      </div>

      <button className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2">
        {buttonLabel}
      </button>
    </div>
  );
}