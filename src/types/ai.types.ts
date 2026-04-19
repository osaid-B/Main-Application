export type AIRole = "user" | "assistant";

export interface AIMessage {
  id: string;
  role: AIRole;
  content: string;
  timestamp?: string;
}

export interface AIChatRequest {
  message: string;
  context?: {
    page?: string;
    entityId?: string;
    language?: "ar" | "en";
  };
}

export interface AIChatResponse {
  reply: string;
  suggestions?: string[];
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type?: "info" | "warning" | "success";
}

export interface AIActionState {
  loading: boolean;
  error: string | null;
}

export interface AIQuickAction {
  id: string;
  label: string;
  prompt: string;
}