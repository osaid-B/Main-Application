import type { AIMessage } from "../../types/ai.types";

type AIChatMessageProps = {
  message: AIMessage;
};

export default function AIChatMessage({ message }: AIChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "12px 14px",
          borderRadius: "16px",
          backgroundColor: isUser ? "#dbeafe" : "#ffffff",
          border: isUser ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
          boxShadow: isUser
            ? "none"
            : "0 6px 18px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            marginBottom: "6px",
            color: "#64748b",
          }}
        >
          {isUser ? "أنت" : "AI Copilot"}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: 1.8,
            color: "#111827",
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}