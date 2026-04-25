import { useState } from "react";
import { analyzeUsage } from "../utils/ai";
import type { AnalysisResult } from "../types/analysis";

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeUsage(prompt);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, analyze };
}
