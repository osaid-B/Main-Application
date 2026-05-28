import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useFactory } from "../../context/FactoryContext";
import { aiService } from "../../services/ai.service";
import { buildAIContext, buildSmartAlerts, type AISmartAlert } from "../../services/aiDataService";
import type { AIMessage } from "../../types/ai.types";
import AIChatMessage from "./AIChatMessage";
import "./AIAssistantPanel.css";

type Tab = "chat" | "reports" | "alerts";

type AIAssistantPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
};

const QUICK_REPORTS = [
  { id: "summary",     icon: "📊", label: "ملخص اليوم",          prompt: "ما هو ملخص أداء اليوم؟" },
  { id: "overdue",     icon: "⚠️", label: "الفواتير المتأخرة",    prompt: "اعرض لي جميع الفواتير المتأخرة مع المبالغ" },
  { id: "low-stock",   icon: "📦", label: "المخزون المنخفض",      prompt: "ما هي المنتجات التي تحتاج إعادة طلب؟" },
  { id: "factory",     icon: "🏭", label: "حالة المصنع",          prompt: "ما هي حالة أوامر الإنتاج الحالية؟" },
  { id: "top-clients", icon: "💰", label: "أفضل العملاء",         prompt: "من هم أفضل 5 عملاء من حيث المبيعات؟" },
  { id: "revenue",     icon: "📈", label: "الإيرادات هذا الشهر",  prompt: "ما هو إجمالي الإيرادات هذا الشهر؟" },
] as const;

export default function AIAssistantPanel({
  isOpen,
  onClose,
  initialPrompt,
}: AIAssistantPanelProps) {
  const data = useData();
  const factory = useFactory();

  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "مرحبًا، أنا AI Copilot. أستطيع مساعدتك في فهم البيانات، تلخيص الصفحات، واقتراح الخطوات التالية.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSuggestions, setLastSuggestions] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AISmartAlert[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastInitialPromptRef = useRef("");

  // Compute alerts when panel opens
  useEffect(() => {
    if (isOpen) {
      setAlerts(buildSmartAlerts(data, factory));
    }
  }, [isOpen, data, factory]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  // Escape key closes panel
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSend = useCallback(
    async (customMessage?: string) => {
      const msg = (customMessage ?? input).trim();
      if (!msg || loading) return;

      const userMessage: AIMessage = { id: `${Date.now()}-user`, role: "user", content: msg };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      // Switch to chat tab when triggered from other tabs
      setTab("chat");

      try {
        const ctx = buildAIContext(data, factory);
        const response = await aiService.sendMessage({
          message: msg,
          context: {
            page: window.location.pathname,
            language: "ar",
            dataContext: ctx,
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
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-error`,
            role: "assistant",
            content: "حدث خطأ أثناء الحصول على الرد. حاول مرة أخرى.",
          },
        ]);
        setLastSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [data, factory, input, loading]
  );

  useEffect(() => {
    if (!isOpen || !initialPrompt) return;
    if (lastInitialPromptRef.current === initialPrompt) return;
    lastInitialPromptRef.current = initialPrompt;
    void handleSend(initialPrompt);
  }, [handleSend, initialPrompt, isOpen]);

  function handleClearChat() {
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        role: "assistant",
        content: "تم بدء محادثة جديدة.",
      },
    ]);
    setLastSuggestions([]);
    setInput("");
    lastInitialPromptRef.current = "";
  }

  return (
    <div className={`ai-panel-root${isOpen ? " is-open" : ""}`} dir="rtl">
      {/* Side tab */}
      <button type="button" className="ai-panel-tab" onClick={onClose} aria-label="أغلق لوحة الذكاء الاصطناعي">
        <Bot size={16} />
        <span className="ai-panel-tab-label">AI</span>
      </button>

      {/* Panel body */}
      <div className="ai-panel-body" role="dialog" aria-label="AI Copilot" aria-modal="false">
        {/* Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-header-left">
            <div className="ai-panel-header-icon">AI</div>
            <h2 className="ai-panel-header-title">AI Copilot</h2>
            <span className="ai-panel-status">Ready</span>
          </div>
          <div className="ai-panel-header-actions">
            <button type="button" className="ai-panel-clear-btn" onClick={handleClearChat}>
              مسح
            </button>
            <button type="button" className="ai-panel-close-btn" onClick={onClose} aria-label="إغلاق">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tabs nav */}
        <div className="ai-panel-tabs-nav" role="tablist">
          {(["chat", "reports", "alerts"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`ai-panel-tab-btn${tab === t ? " is-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "chat" && "محادثة"}
              {t === "reports" && "تقارير سريعة"}
              {t === "alerts" && `تنبيهات${alerts.length > 0 ? ` (${alerts.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── Chat tab ── */}
        {tab === "chat" && (
          <div className="ai-panel-tab-content">
            <div className="ai-chat-messages">
              {messages.map((message) => (
                <AIChatMessage key={message.id} message={message} />
              ))}

              {loading && (
                <AIChatMessage
                  message={{ id: "loading", role: "assistant", content: "جاري التحليل..." }}
                />
              )}

              {!loading && lastSuggestions.length > 0 && (
                <div className="ai-followup-box">
                  <div className="ai-followup-label">أسئلة متابعة مقترحة</div>
                  <div className="ai-followup-chips">
                    {lastSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="ai-followup-chip"
                        onClick={() => void handleSend(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="ai-chat-footer">
              <div className="ai-chat-input-row">
                <input
                  type="text"
                  className="ai-chat-input"
                  placeholder="اسأل عن بياناتك..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSend();
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="ai-chat-send-btn"
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                >
                  إرسال
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Reports tab ── */}
        {tab === "reports" && (
          <div className="ai-panel-tab-content">
            <div className="ai-reports-grid">
              <p className="ai-report-section-label">اختر تقريرًا لإرساله تلقائيًا للمحادثة</p>
              {QUICK_REPORTS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="ai-report-btn"
                  disabled={loading}
                  onClick={() => void handleSend(r.prompt)}
                >
                  <span className="ai-report-btn-icon">{r.icon}</span>
                  <span>
                    {r.label}
                    <span className="ai-report-btn-desc">{r.prompt}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Smart Alerts tab ── */}
        {tab === "alerts" && (
          <div className="ai-panel-tab-content">
            <div className="ai-alerts-list">
              {alerts.length === 0 ? (
                <div className="ai-alerts-empty">
                  <span style={{ fontSize: "28px" }}>✅</span>
                  <span>لا توجد تنبيهات حالية</span>
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div key={i} className={`ai-alert-card ai-alert-card--${alert.severity}`}>
                    <span className="ai-alert-dot" />
                    <div className="ai-alert-content">
                      <p className="ai-alert-title">{alert.title}</p>
                      <p className="ai-alert-detail">{alert.detail}</p>
                    </div>
                    <button
                      type="button"
                      className="ai-alert-ask-btn"
                      onClick={() => void handleSend(`أخبرني المزيد عن: ${alert.title}`)}
                    >
                      اسأل
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
