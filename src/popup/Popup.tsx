import React, { useMemo, useState } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import { useStorage } from "../hooks/useStorage";
import { optimizePrompt } from "../utils/ai";
import { analyzePrompt } from "../utils/metrics";
import type { PromptAnalysis, PromptComparison } from "../types/analysis";

// #region agent log
fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "c404d9",
  },
  body: JSON.stringify({
    sessionId: "c404d9",
    runId: "pre-fix",
    hypothesisId: "H1",
    location: "src/popup/Popup.tsx:3",
    message: "Popup module evaluated",
    data: { hasRootElement: Boolean(document.getElementById("root")) },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

export default function Popup() {
  const { compare, loading: analysisLoading, error: analysisError } = useAnalysis();
  const { saveRecord, loading: storageLoading, error: storageError, hasApiKey } =
    useStorage();
  const [promptText, setPromptText] = useState("");
  const [optimizedText, setOptimizedText] = useState("");
  const [comparisonBundle, setComparisonBundle] = useState<{
    originalAnalysis: PromptAnalysis;
    optimizedAnalysis: PromptAnalysis;
    comparison: PromptComparison;
  } | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBusy = optimizing || analysisLoading || storageLoading;
  const canOptimize = promptText.trim().length > 0;
  const liveAnalysis = useMemo(
    () => (canOptimize ? analyzePrompt(promptText) : null),
    [canOptimize, promptText]
  );
  const liveScore = liveAnalysis ? Math.round(liveAnalysis.efficiencyScore) : 0;
  const liveTokens = liveAnalysis?.tokenCount ?? 0;
  const scoreTier = liveScore >= 70 ? "good" : liveScore >= 40 ? "ok" : "bad";

  // #region agent log
  fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "c404d9",
    },
    body: JSON.stringify({
      sessionId: "c404d9",
      runId: "post-fix",
      hypothesisId: "H6",
      location: "src/popup/Popup.tsx:33",
      message: "Popup render state snapshot",
      data: { hasApiKey, promptLength: promptText.length, hasOptimized: Boolean(optimizedText) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const handleOptimize = async () => {
    if (!canOptimize) {
      setUiError("Please enter a prompt first.");
      setStatusMessage(null);
      return;
    }

    const trimmedPrompt = promptText.trim();
    setExpanded(true);
    setOptimizing(true);
    setCopied(false);
    setUiError(null);
    setStatusMessage(null);

    // #region agent log
    fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "c404d9",
      },
      body: JSON.stringify({
        sessionId: "c404d9",
        runId: "post-fix",
        hypothesisId: "H7",
        location: "src/popup/Popup.tsx:61",
        message: "Optimize requested",
        data: { promptLength: trimmedPrompt.length, hasApiKey },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    try {
      const optimized = await optimizePrompt(trimmedPrompt);
      setOptimizedText(optimized);
      const comparisonBundle = await compare(trimmedPrompt, optimized);

      if (comparisonBundle) {
        setComparisonBundle(comparisonBundle);
        await saveRecord({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          originalAnalysis: comparisonBundle.originalAnalysis,
          optimizedAnalysis: comparisonBundle.optimizedAnalysis,
          comparison: comparisonBundle.comparison,
        });
      }

      // #region agent log
      fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "c404d9",
        },
        body: JSON.stringify({
          sessionId: "c404d9",
          runId: "post-fix",
          hypothesisId: "H8",
          location: "src/popup/Popup.tsx:97",
          message: "Optimize completed successfully",
          data: {
            optimizedLength: optimized.length,
            comparisonComputed: Boolean(comparisonBundle),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      setStatusMessage("Prompt optimized successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to optimize prompt.";
      setUiError(message);
      setStatusMessage(null);

      // #region agent log
      fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "c404d9",
        },
        body: JSON.stringify({
          sessionId: "c404d9",
          runId: "post-fix",
          hypothesisId: "H9",
          location: "src/popup/Popup.tsx:121",
          message: "Optimize failed",
          data: { errorMessage: message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = async () => {
    if (!optimizedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(optimizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setUiError("Failed to copy optimized prompt.");
    }
  };

  const combinedError = uiError ?? analysisError ?? storageError;
  const optimizedScore = comparisonBundle
    ? Math.round(comparisonBundle.optimizedAnalysis.efficiencyScore)
    : 0;
  const scoreImprovement = comparisonBundle
    ? Math.round(comparisonBundle.comparison.efficiencyImprovement)
    : 0;
  const tokensSaved = comparisonBundle?.comparison.tokensSaved ?? 0;
  const percentReduction = comparisonBundle
    ? Math.max(0, comparisonBundle.comparison.percentTokenReduction)
    : 0;
  const waterSavedMl = comparisonBundle
    ? Math.max(0, comparisonBundle.comparison.waterSavedMl)
    : 0;
  const co2SavedGrams = comparisonBundle
    ? Math.max(0, comparisonBundle.comparison.co2SavedGrams)
    : 0;

  return (
    <main className={`popup-root ${expanded ? "popup-root--expanded" : ""}`}>
      <h1>AICO</h1>
      <p className="popup-subtitle">Analyze and optimize your AI prompts.</p>

      {!hasApiKey && (
        <p className="popup-warning">
          Add your Gemini API key in Options before optimizing.
        </p>
      )}

      <div className="popup-shell">
        <section className="popup-col popup-col--input">
          <label htmlFor="prompt-input">Prompt</label>
          <textarea
            id="prompt-input"
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="Paste your prompt here..."
            rows={8}
            disabled={isBusy}
          />

          <div id="live-metrics" className="live-metrics" aria-live="polite">
            <span className={`score--${scoreTier}`}>Score: {liveScore}</span>
            <span>{liveTokens} tokens</span>
          </div>

          <button
            type="button"
            onClick={handleOptimize}
            disabled={!canOptimize || isBusy}
          >
            {isBusy ? "Optimizing..." : "Optimize"}
          </button>

          {combinedError && <p className="popup-error">{combinedError}</p>}
        </section>

        <aside
          id="optimized-panel"
          className="popup-col popup-col--output"
          aria-hidden={!expanded}
        >
          <section className="optimized-section">
            <h2>Optimized Prompt</h2>
            <textarea readOnly value={optimizedText} rows={8} />
          </section>

          <div className="result-metrics">
            <div>New score: <strong>{optimizedScore}</strong> ({scoreImprovement >= 0 ? "+" : ""}{scoreImprovement})</div>
            <div>
              Tokens saved: <strong>{tokensSaved}</strong> ({percentReduction.toFixed(1)}%)
            </div>
            <div>Water saved: <strong>{waterSavedMl.toFixed(3)} mL</strong></div>
            <div>CO2 saved: <strong>{co2SavedGrams.toFixed(4)} g</strong></div>
          </div>

          <button type="button" onClick={handleCopy} disabled={!optimizedText}>
            {copied ? "Copied" : "Copy to Clipboard"}
          </button>

          {statusMessage && (
            <p className="popup-status" role="status" aria-live="polite">
              {statusMessage}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
