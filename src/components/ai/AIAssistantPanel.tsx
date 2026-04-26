import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiService } from "../../services/ai.service";
import type { AIMessage, AIQuickAction } from "../../types/ai.types";
import AIChatMessage from "./AIChatMessage";

type AIAssistantPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
};

export default function AIAssistantPanel({
  isOpen,
  onClose,
  initialPrompt,
}: AIAssistantPanelProps) {
  const currentPage = window.location.pathname;

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content:
        "مرحبًا، أنا AI Copilot. أستطيع مساعدتك في فهم البيانات، تلخيص الصفحات، واقتراح الخطوات التالية.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSuggestions, setLastSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastInitialPromptRef = useRef("");

  const quickActions = useMemo<AIQuickAction[]>(() => {
    if (currentPage.includes("customers")) {
      return [
        {
          id: "customers-summary",
          label: "تلخيص العملاء",
          prompt: "لخص حالة العملاء الحاليين",
        },
        {
          id: "customers-risk",
          label: "عملاء يحتاجون متابعة",
          prompt: "من العملاء الذين يحتاجون متابعة الآن؟",
        },
        {
          id: "customers-growth",
          label: "فرص النمو",
          prompt: "ما فرص النمو أو التحسين في بيانات العملاء؟",
        },
      ];
    }

    if (currentPage.includes("invoices")) {
      return [
        {
          id: "invoices-overview",
          label: "تلخيص الفواتير",
          prompt: "لخص حالة الفواتير الحالية",
        },
        {
          id: "invoices-debit",
          label: "الفواتير المتأخرة",
          prompt: "ما وضع الفواتير المتأخرة أو غير المسددة؟",
        },
        {
          id: "invoices-actions",
          label: "إجراءات مقترحة",
          prompt: "اقترح أهم الإجراءات المطلوبة بخصوص الفواتير",
        },
      ];
    }

    if (currentPage.includes("products")) {
      return [
        {
          id: "products-stock",
          label: "تحليل المخزون",
          prompt: "حلل حالة المخزون الحالية",
        },
        {
          id: "products-alerts",
          label: "تنبيهات المخزون",
          prompt: "ما أهم تنبيهات المخزون الآن؟",
        },
        {
          id: "products-actions",
          label: "إجراءات سريعة",
          prompt: "ما الإجراءات المقترحة لتحسين حالة المنتجات؟",
        },
      ];
    }

    if (currentPage.includes("dashboard")) {
      return [
        {
          id: "dashboard-summary",
          label: "ملخص تنفيذي",
          prompt: "اعطني ملخصًا تنفيذيًا سريعًا عن الداشبورد",
        },
        {
          id: "dashboard-alerts",
          label: "أهم التنبيهات",
          prompt: "ما أهم التنبيهات في البيانات الحالية؟",
        },
        {
          id: "dashboard-actions",
          label: "الإجراء التالي",
          prompt: "ما أهم إجراء يجب اتخاذه الآن؟",
        },
      ];
    }

    return [
      {
        id: "general-summary",
        label: "تلخيص الصفحة",
        prompt: "لخص محتوى هذه الصفحة",
      },
      {
        id: "general-alerts",
        label: "أهم التنبيهات",
        prompt: "ما أهم التنبيهات أو الملاحظات في هذه الصفحة؟",
      },
      {
        id: "general-actions",
        label: "إجراءات مقترحة",
        prompt: "ما الإجراءات المقترحة بناءً على هذه الصفحة؟",
      },
    ];
  }, [currentPage]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  const handleSend = useCallback(async (customMessage?: string) => {
    const messageToSend = (customMessage || input).trim();

    if (!messageToSend || loading) return;

    const userMessage: AIMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: messageToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await aiService.sendMessage({
        message: messageToSend,
        context: {
          page: currentPage,
          language: "ar",
        },
      });

      const assistantMessage: AIMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: response.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastSuggestions(response.suggestions ?? []);
    } catch {
      const errorMessage: AIMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        content: "حدث خطأ أثناء الحصول على الرد. حاول مرة أخرى.",
      };

      setMessages((prev) => [...prev, errorMessage]);
      setLastSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, input, loading]);

  useEffect(() => {
    if (!isOpen || !initialPrompt) return;
    if (lastInitialPromptRef.current === initialPrompt) return;

    lastInitialPromptRef.current = initialPrompt;
    void handleSend(initialPrompt);
  }, [handleSend, initialPrompt, isOpen]);

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-message-reset",
        role: "assistant",
        content:
          "تم بدء محادثة جديدة. يمكنك سؤالي عن الصفحة الحالية أو اختيار اقتراح جاهز.",
      },
    ]);
    setLastSuggestions([]);
    setInput("");
    lastInitialPromptRef.current = "";
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <div style={styles.headerTopRow}>
              <h2 style={styles.title}>AI Copilot</h2>
              <span style={styles.statusBadge}>Ready</span>
            </div>

            <p style={styles.subtitle}>
              الصفحة الحالية: <strong>{currentPage}</strong>
            </p>
          </div>

          <div style={styles.headerActions}>
            <button type="button" onClick={handleClearChat} style={styles.headerButton}>
              Clear
            </button>
            <button type="button" onClick={onClose} style={styles.closeButton}>
              ×
            </button>
          </div>
        </div>

        <div style={styles.contextBox}>
          <div style={styles.contextTitle}>اقتراحات سريعة</div>
          <div style={styles.quickActionsRow}>
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                style={styles.quickActionButton}
                onClick={() => void handleSend(action.prompt)}
                disabled={loading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.messagesContainer}>
          {messages.map((message) => (
            <AIChatMessage key={message.id} message={message} />
          ))}

          {loading && (
            <AIChatMessage
              message={{
                id: "loading",
                role: "assistant",
                content: "جاري التحليل والتفكير...",
              }}
            />
          )}

          {!loading && lastSuggestions.length > 0 && (
            <div style={styles.followUpBox}>
              <div style={styles.followUpTitle}>أسئلة متابعة مقترحة</div>

              <div style={styles.followUpActions}>
                {lastSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    style={styles.followUpChip}
                    onClick={() => void handleSend(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={styles.footer}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="اسأل عن هذه الصفحة، أو اطلب ملخصًا أو إجراءً مقترحًا..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSend();
                }
              }}
              style={styles.input}
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => void handleSend()}
              style={styles.sendButton}
              disabled={loading || !input.trim()}
            >
              إرسال
            </button>
          </div>

          <p style={styles.footerHint}>
            استخدمه للتلخيص، التحليل، اقتراح الخطوات التالية، وشرح الأرقام بسرعة.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 9999,
  },
  panel: {
    width: "min(460px, 100vw)",
    maxWidth: "100%",
    height: "100dvh",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-8px 0 30px rgba(15, 23, 42, 0.14)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    padding: "18px",
    borderBottom: "1px solid #e5e7eb",
  },
  headerTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    backgroundColor: "#ecfdf5",
    color: "#059669",
    fontSize: "11px",
    fontWeight: 700,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  headerButton: {
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    color: "#374151",
    borderRadius: "10px",
    padding: "8px 10px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  closeButton: {
    border: "none",
    background: "#f3f4f6",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer",
    color: "#111827",
  },
  contextBox: {
    padding: "14px 18px",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#fafcff",
  },
  contextTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    marginBottom: "10px",
  },
  quickActionsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  quickActionButton: {
    border: "1px solid #dbeafe",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#fcfcfd",
  },
  followUpBox: {
    marginTop: "4px",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
  },
  followUpTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    marginBottom: "10px",
  },
  followUpActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  followUpChip: {
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    color: "#111827",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "12px",
    cursor: "pointer",
  },
  footer: {
    borderTop: "1px solid #e5e7eb",
    padding: "16px",
    backgroundColor: "#ffffff",
  },
  inputWrapper: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
  },
  sendButton: {
    border: "none",
    backgroundColor: "#111827",
    color: "#ffffff",
    padding: "13px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    minWidth: "84px",
  },
  footerHint: {
    margin: "10px 0 0",
    fontSize: "12px",
    color: "#6b7280",
    lineHeight: 1.5,
  },
};
