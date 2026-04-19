import type { AIChatResponse, AIInsight } from "../types/ai.types";

export const mockChatResponse: AIChatResponse = {
  reply: "يوجد 8 فواتير متأخرة وعميلان يحتاجان متابعة.",
  suggestions: [
    "اعرض الفواتير المتأخرة",
    "لخص العملاء",
    "ما أهم التنبيهات؟",
  ],
};

export const mockInsights: AIInsight[] = [
  {
    id: "1",
    title: "ارتفاع الفواتير المتأخرة",
    description: "زاد عدد الفواتير المتأخرة بنسبة 12% هذا الأسبوع.",
    type: "warning",
  },
  {
    id: "2",
    title: "أفضل عميل هذا الشهر",
    description: "شركة النور هي الأعلى مساهمة في الإيرادات هذا الشهر.",
    type: "success",
  },
  {
    id: "3",
    title: "تنبيه بيانات",
    description: "بعض سجلات العملاء تحتوي على بيانات ناقصة وتحتاج مراجعة.",
    type: "info",
  },
];