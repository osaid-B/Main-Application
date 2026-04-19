import { mockChatResponse, mockInsights } from "../data/ai.mock";
import type { AIChatRequest, AIChatResponse, AIInsight } from "../types/ai.types";

const API_BASE_URL = "http://localhost:5000/api";

export const aiService = {
  async sendMessage(payload: AIChatRequest): Promise<AIChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      return await response.json();
    } catch (error) {
      return {
        ...mockChatResponse,
        reply: `Mock AI Response: ${payload.message}`,
      };
    }
  },

  async getInsights(): Promise<AIInsight[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/insights`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get AI insights");
      }

      return await response.json();
    } catch (error) {
      return mockInsights;
    }
  },
};