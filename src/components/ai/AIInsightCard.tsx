import type { AIInsight } from "../../types/ai.types";

type AIInsightCardProps = {
  insight: AIInsight;
};

const getBorderColor = (type?: AIInsight["type"]) => {
  switch (type) {
    case "warning":
      return "#f59e0b";
    case "success":
      return "#10b981";
    case "info":
    default:
      return "#3b82f6";
  }
};

export default function AIInsightCard({ insight }: AIInsightCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "16px",
        borderLeft: `5px solid ${getBorderColor(insight.type)}`,
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {insight.title}
        </h3>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#6b7280",
            backgroundColor: "#f3f4f6",
            padding: "4px 8px",
            borderRadius: "999px",
          }}
        >
          AI Insight
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: "14px",
          lineHeight: 1.7,
          color: "#4b5563",
        }}
      >
        {insight.description}
      </p>
    </div>
  );
}