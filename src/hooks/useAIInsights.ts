import { useEffect, useState } from "react";
import { aiService } from "../services/ai.service";
import type { AIInsight } from "../types/ai.types";

export default function useAIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await aiService.getInsights();
        setInsights(data);
      } catch (err) {
        setError("فشل تحميل التحليلات الذكية.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return {
    insights,
    loading,
    error,
  };
}