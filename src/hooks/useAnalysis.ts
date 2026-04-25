import { useCallback, useState } from "react";
import type { PromptAnalysis, PromptComparison } from "../types/analysis";
import { analyzePrompt, comparePromptAnalyses } from "../utils/metrics";

export function useAnalysis() {
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
      const analysis = analyzePrompt(text);
      setLastAnalysis(analysis);
      return analysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const compare = useCallback(
    async (originalText: string, optimizedText: string) => {
      setLoading(true);
      setError(null);

      try {
        const originalAnalysis = analyzePrompt(originalText);
        const optimizedAnalysis = analyzePrompt(optimizedText);
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
    []
  );

  return { analyze, compare, lastAnalysis, lastComparison, loading, error };
}
