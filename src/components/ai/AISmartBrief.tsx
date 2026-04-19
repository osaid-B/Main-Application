type AISmartBriefItem = {
  id: string;
  label: string;
  value: string;
  prompt?: string;
};

type AISmartBriefProps = {
  items: AISmartBriefItem[];
  onOpenCopilot: (prompt?: string) => void;
};

export default function AISmartBrief({
  items,
  onOpenCopilot,
}: AISmartBriefProps) {
  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <span style={styles.badge}>AI Brief</span>
          <h2 style={styles.title}>Smart Brief</h2>
          <p style={styles.subtitle}>
            أهم الإشارات السريعة التي تستحق انتباهك الآن
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCopilot()}
          style={styles.button}
        >
          Open AI Copilot
        </button>
      </div>

      <div style={styles.grid}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenCopilot(item.prompt)}
            style={styles.cardButton}
          >
            <div style={styles.card}>
              <div style={styles.cardLabel}>{item.label}</div>
              <div style={styles.cardValue}>{item.value}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 800,
    color: "#0f172a",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  button: {
    border: "none",
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  cardButton: {
    border: "none",
    padding: 0,
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "16px",
    backgroundColor: "#f8fbff",
    transition: "all 0.2s ease",
  },
  cardLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  cardValue: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 800,
    lineHeight: 1.7,
  },
};