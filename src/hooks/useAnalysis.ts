import { useCallback, useState } from "react";
import type { PromptAnalysis, PromptComparison } from "../types/analysis";
import { DEFAULT_MODEL, type ModelMetrics } from "../constants/models";
import { analyzePrompt, comparePromptAnalyses } from "../utils/metrics";

export function useAnalysis(model: ModelMetrics = DEFAULT_MODEL) {
  const [lastAnalysis, setLastAnalysis] = useState<PromptAnalysis | null>(null);
  const [lastComparison, setLastComparison] = useState<PromptComparison | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);

    try {
      const analysis = analyzePrompt(text, model);
      setLastAnalysis(analysis);
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [model]);

  const compare = useCallback(
    async (originalText: string, optimizedText: string) => {
      setLoading(true);
      setError(null);

      try {
        const originalAnalysis = analyzePrompt(originalText, model);
        const optimizedAnalysis = analyzePrompt(optimizedText, model);
        const comparison = comparePromptAnalyses(originalAnalysis, optimizedAnalysis);

        setLastAnalysis(optimizedAnalysis);
        setLastComparison(comparison);

        return { originalAnalysis, optimizedAnalysis, comparison };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [model]
  );

  return { analyze, compare, lastAnalysis, lastComparison, loading, error };
}
