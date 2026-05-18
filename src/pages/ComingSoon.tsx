import { Construction } from "lucide-react";

interface Props {
  title: string;
}

export default function ComingSoon({ title }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        minHeight: "60vh",
        textAlign: "center",
        color: "var(--color-text-secondary, #6b7280)",
      }}
    >
      <Construction
        size={48}
        strokeWidth={1.25}
        style={{ color: "var(--color-accent, #2563eb)", opacity: 0.7 }}
        aria-hidden
      />
      <h1
        style={{
          fontSize: "1.375rem",
          fontWeight: 700,
          color: "var(--color-text-primary, #111827)",
          margin: 0,
        }}
      >
        {title}
      </h1>
      <p style={{ margin: 0, maxWidth: 340, lineHeight: 1.6 }}>
        هذه الصفحة قيد الإنشاء وستكون متاحة قريباً.
      </p>
    </div>
  );
}