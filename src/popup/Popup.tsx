import React, { useState } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import { useStorage } from "../hooks/useStorage";
import { optimizePrompt } from "../utils/ai";

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
  const [uiError, setUiError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [tokenWarning, setTokenWarning] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const isBusy = optimizing || analysisLoading || storageLoading;

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
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt) {
      setUiError("Please enter a prompt first.");
      setStatusMessage(null);
      return;
    }

    setOptimizing(true);
    setUiError(null);
    setStatusMessage(null);
    setTokenWarning(null);

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
        if (comparisonBundle.comparison.tokensSaved < 0) {
          setTokenWarning(
            `Your original prompt uses fewer tokens (${comparisonBundle.comparison.originalTokens} vs ${comparisonBundle.comparison.optimizedTokens}). Consider keeping the original.`
          );
        }
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

  const combinedError = uiError ?? analysisError ?? storageError;

  return (
    <main className="popup-root">
      <h1>AICO</h1>
      <p className="popup-subtitle">Analyze and optimize your AI prompts.</p>

      {!hasApiKey && (
        <p className="popup-warning">
          Add your Gemini API key in Options before optimizing.
        </p>
      )}

      <label htmlFor="prompt-input">Prompt</label>
      <textarea
        id="prompt-input"
        value={promptText}
        onChange={(event) => setPromptText(event.target.value)}
        placeholder="Paste your prompt here..."
        rows={7}
        disabled={isBusy}
      />

      <button type="button" onClick={handleOptimize} disabled={isBusy}>
        {isBusy ? "Working..." : "Optimize Prompt"}
      </button>

      {statusMessage && (
        <p className="popup-status" role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}

      {tokenWarning && <p className="popup-warning">{tokenWarning}</p>}
      {combinedError && <p className="popup-error">{combinedError}</p>}

      {optimizedText && (
        <section className="optimized-section">
          <h2>Optimized Prompt</h2>
          <pre>{optimizedText}</pre>
        </section>
      )}
    </main>
  );
}
