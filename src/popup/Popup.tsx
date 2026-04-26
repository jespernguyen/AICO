import React, { useEffect, useMemo, useState } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import { useStorage } from "../hooks/useStorage";
import { optimizePrompt } from "../utils/ai";
import { analyzePrompt } from "../utils/metrics";
import { quickTrim } from "../utils/quickTrim";
import { DEFAULT_MODEL, MODELS, getModelById } from "../constants/models";
import type { ModelMetrics } from "../constants/models";
import { getSelectedModel, saveSelectedModel } from "../utils/storage";
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
  const [selectedModel, setSelectedModel] = useState<ModelMetrics>(DEFAULT_MODEL);
  const { compare, loading: analysisLoading, error: analysisError } = useAnalysis(selectedModel);
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
  const [tokenWarning, setTokenWarning] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSelectedModel().then((id) => {
      if (id) setSelectedModel(getModelById(id));
    }).catch(() => {});
  }, []);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const model = getModelById(event.target.value);
    setSelectedModel(model);
    void saveSelectedModel(model.id);
  };

  const isBusy = optimizing || analysisLoading || storageLoading;
  const canOptimize = promptText.trim().length > 0;
  const liveAnalysis = useMemo(
    () => (canOptimize ? analyzePrompt(promptText, selectedModel) : null),
    [canOptimize, promptText, selectedModel]
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

  const handleQuickTrim = () => {
    if (!canOptimize) {
      return;
    }
    setPromptText((current) => quickTrim(current));
    setStatusMessage("Quick trim applied locally.");
    setUiError(null);
    setTokenWarning(null);
  };

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
        setComparisonBundle(comparisonBundle);
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
      <div className="popup-shell">
        <section className="popup-col popup-col--input">
          <div className="popup-header">
            <svg className="popup-icon" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" rx="25" fill="#2563eb"/>
              <path d="M27.3379 143.568C25.2549 134.798 25.835 60.73 27.5015 53.695C28.4583 49.6562 34.2984 48.8325 35.1806 48.5291C43.1967 48.6973 107.243 46.4482 113.608 46.275C119.974 46.1017 154.971 44.9617 163.916 49.0763C167.364 50.662 167.278 50.7833 169.518 55.3034C171.912 60.1317 174 90.5956 174 97.3581C174 104.121 174 137.933 170.639 142.016C169.646 143.223 166.171 147.084 162.796 148.077C158.199 149.429 148.437 149.204 143.859 149.204C138.257 149.204 99.1531 149.047 96.8024 149.204C94.5616 149.204 91.3856 153.934 87.8393 157.35C85.1672 159.924 66.0244 174.574 64.1659 175.993C63.3315 176.327 62.7312 165.173 62.6109 157.35C62.5557 153.764 63.1905 149.369 62.0701 149.204C56.4003 148.367 35.9656 149.101 34.0602 148.63C31.8194 148.077 28.4583 148.285 27.3379 143.568Z" stroke="#D3EFFF" stroke-width="8" stroke-linecap="round"/>
              <path d="M133.226 116.174C134.388 114.074 139.581 100.899 137.756 92.8955C136.073 85.5133 128.332 72.7723 127.711 73.1617C127.478 73.3075 121.7 77.7279 121.452 77.8665C120.715 78.3729 125.081 83.2106 126.26 85.5432C127.597 88.1915 129.829 93.3684 130.185 94.5819C131.01 97.4016 128.086 107.376 125.932 112.081C123.423 117.56 118.709 120.779 113.63 123.812C109.741 126.134 98.6691 127.769 98.1554 126.99C97.1492 125.462 98.044 120.371 97.4449 120.743C96.989 121.299 87.0641 130.839 87.3427 131.511C87.5397 131.986 91.1094 135.025 91.6008 135.482C92.1352 135.963 97.7908 140.887 97.8254 140.102C97.8547 139.436 97.968 138.307 97.8878 137.623C97.8019 136.89 97.8644 135.886 97.9502 135.144C98.0003 134.71 99.5313 134.81 100.583 134.816C101.434 134.82 108.091 134.394 111.336 133.602C114.199 132.903 120.318 128.775 123.969 126.014C128.471 122.609 132.187 118.051 133.226 116.174Z" fill="#D3EFFF"/>
              <path d="M134.914 95.4574C135.037 95.4394 135.167 95.4581 135.284 95.5208C135.394 95.5795 135.465 95.6613 135.51 95.7269C135.591 95.8475 135.628 95.9835 135.647 96.0638C135.668 96.1541 135.683 96.2524 135.694 96.3265C135.7 96.3639 135.707 96.397 135.712 96.4261C135.747 96.4365 135.793 96.4477 135.852 96.4574C135.923 96.4691 135.988 96.4771 136.072 96.4886C136.527 96.5507 136.796 96.3642 137.277 96.1322C137.282 96.1287 137.303 96.1122 137.345 96.058C137.374 96.0203 137.392 95.9935 137.432 95.9398C137.463 95.8965 137.511 95.8332 137.569 95.7747L137.668 95.6927C137.776 95.6191 137.91 95.5735 138.063 95.5833C138.08 95.5845 138.096 95.5888 138.112 95.5912C138.526 103.564 134.265 114.297 133.226 116.174C132.187 118.051 128.471 122.61 123.969 126.014C120.318 128.775 114.199 132.903 111.336 133.602C108.091 134.394 101.435 134.82 100.583 134.816C99.5315 134.81 98.0004 134.71 97.9502 135.144C97.8644 135.887 97.8018 136.89 97.8877 137.623C97.9678 138.307 97.8546 139.436 97.8252 140.102C97.7907 140.887 92.1357 135.963 91.6006 135.483C91.1092 135.026 87.5398 131.986 87.3428 131.511C87.0657 130.838 96.9895 121.3 97.4454 120.743C98.0441 120.372 97.1492 125.462 98.1553 126.99C98.669 127.769 109.741 126.134 113.63 123.812C118.709 120.779 123.422 117.56 125.932 112.08C127.798 108.005 130.239 99.9771 130.323 96.0687C130.434 96.0364 130.539 96.0074 130.627 95.9808C130.837 95.917 131.004 95.8545 131.144 95.7689C131.162 95.7577 131.164 95.7552 131.207 95.7269C131.233 95.7096 131.294 95.6685 131.369 95.639C131.444 95.6096 131.603 95.5634 131.785 95.6302C131.927 95.6822 132.017 95.7774 132.071 95.8626L132.115 95.9417L132.163 96.0785C132.174 96.1212 132.182 96.1604 132.187 96.1888C132.198 96.2541 132.205 96.3244 132.212 96.3822C132.218 96.4357 132.224 96.4806 132.229 96.5179C132.84 96.489 133.246 96.2322 133.82 96.0199C134.054 95.9336 134.217 95.8308 134.354 95.7376C134.414 95.6967 134.501 95.6343 134.571 95.5912C134.642 95.5479 134.763 95.4795 134.914 95.4574Z" fill="#2F93FF"/>
              <path d="M65.8106 84.1054C64.7017 86.2338 59.8413 99.535 61.8671 107.49C63.7355 114.828 71.7951 127.37 72.4059 126.965C72.6347 126.813 78.2999 122.249 78.5447 122.104C79.2686 121.579 74.782 116.853 73.5453 114.551C72.1413 111.937 69.7799 106.818 69.394 105.614C68.4975 102.816 71.1696 92.771 73.2051 88.0137C75.5757 82.473 80.2073 79.136 85.2081 75.9766C89.0369 73.5576 100.064 71.6439 100.598 72.4104C101.642 73.912 100.876 79.0243 101.465 78.637C101.907 78.0693 111.588 68.2829 111.293 67.6181C111.084 67.148 107.439 64.1999 106.936 63.7554C106.39 63.2888 100.612 58.5082 100.598 59.2938C100.585 59.9601 100.5 61.0919 100.598 61.7737C100.702 62.5044 100.665 63.509 100.598 64.2536C100.558 64.6884 99.0254 64.6272 97.974 64.6479C97.1233 64.6646 90.4791 65.2582 87.255 66.1315C84.41 66.9021 78.3971 71.1837 74.8166 74.0356C70.4016 77.5523 66.8017 82.203 65.8106 84.1054Z" fill="#D3EFFF"/>
              <path d="M68.1692 95.7962C68.5417 95.9581 68.7255 96.2576 68.8303 96.4652C68.8566 96.5173 68.8803 96.5684 68.8997 96.6107C68.9203 96.6557 68.9351 96.6897 68.9504 96.7211C68.9587 96.7379 68.9656 96.7513 68.9709 96.7611C68.9834 96.7643 69.0006 96.7703 69.0237 96.7748C69.1629 96.8014 69.4198 96.827 69.9143 96.847C70.0677 96.8533 70.2189 96.8579 70.3674 96.8636C69.4547 100.574 68.9161 104.122 69.3938 105.614C69.7796 106.818 72.1411 111.937 73.5452 114.551C74.782 116.853 79.2681 121.579 78.5442 122.104C78.2963 122.251 72.6342 126.814 72.4055 126.965C71.7914 127.364 63.7357 114.827 61.8674 107.491C61.067 104.347 61.3419 100.369 62.0354 96.5755C63.1869 96.2447 64.1565 95.9649 64.4348 95.89L64.5832 95.8509L64.7288 95.9007C64.8573 95.9453 65.0077 96.0252 65.1164 96.1732C65.2334 96.3328 65.259 96.5117 65.2395 96.6625C65.21 96.8886 65.0745 97.081 64.9846 97.1957C65.248 97.1226 65.562 96.9971 65.8967 96.8382C66.5705 96.5183 67.2684 96.0983 67.7092 95.8285L67.9309 95.6927L68.1692 95.7962Z" fill="#2F93FF"/>
            </svg>
            <div>
              <h1>AICO</h1>
              <p className="popup-subtitle">Analyze and optimize your AI prompts.</p>
            </div>
          </div>

          {!hasApiKey && (
            <p className="popup-warning">
              Add your Gemini API key in Options before optimizing.
            </p>
          )}

          <label htmlFor="model-select">Which AI are you prompting?</label>
          <select
            id="model-select"
            value={selectedModel.id}
            onChange={handleModelChange}
            disabled={isBusy}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>

          <label htmlFor="prompt-input">Your Prompt</label>
          <textarea
            id="prompt-input"
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="Paste your prompt here "
            rows={5}
            disabled={isBusy}
          />

          <div id="live-metrics" className="live-metrics" aria-live="polite">
            <span className={`score--${scoreTier}`}>Score: {liveScore}</span>
            <span>{liveTokens} tokens</span>
          </div>

          <button
            type="button"
            className="popup-button-secondary"
            onClick={handleQuickTrim}
            disabled={!canOptimize || isBusy}
          >
            Quick Trim
          </button>

          <button
            type="button"
            onClick={handleOptimize}
            disabled={!canOptimize || isBusy}
          >
            {isBusy ? "Optimizing..." : "Optimize (API)"}
          </button>

          {tokenWarning && <p className="popup-warning">{tokenWarning}</p>}
          {combinedError && <p className="popup-error">{combinedError}</p>}
        </section>

        {expanded &&
          <div
            id="optimized-panel"
            className="popup-col popup-col--output"
          >
            <section className="optimized-section">
              <div className="optimized-header">
                <h2>Optimized Prompt</h2>
                { optimizedText && (copied ?
                  <p>Copied</p>
                :
                  <div className="copy-button" onClick={handleCopy}>
                    <svg className="copy-icon" width="63" height="64" viewBox="0 0 63 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M38.3096 0.00390625C43.3997 0.1328 47.7006 3.43184 49.3154 8H43.7432C42.4781 6.18708 40.3783 5 38 5H12C8.13401 5 5 8.13401 5 12V38C5 39.9069 5.76326 41.635 7 42.8975V48.9072C2.8699 47.0108 0 42.8423 0 38V12C2.53686e-07 5.47608 5.20608 0.168106 11.6904 0.00390625L12 0H38L38.3096 0.00390625Z" fill="#999999"/>
                      <rect x="15.5" y="16.5" width="45" height="45" rx="9.5" stroke="#999999" stroke-width="5"/>
                    </svg>
                  </div>
                )}
              </div>
              <p className="optimized-text">{optimizedText}</p>
            </section>

            <div className="result-metrics">       
              <svg className="water-icon" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="100" fill="#F5F5F5"/>
                <path d="M74.2907 94.6948C77.2657 88.9659 94.7296 34.458 94.8875 32.7795C95.4913 26.3613 95.4983 35.1187 95.8326 35.981C96.4963 37.6928 96.956 39.3978 97.2109 41.0711C98.1013 44.8875 113.661 75.7662 116.052 78.9921C118.443 82.218 120.392 86.3971 122.807 91.0335C127.447 99.9429 131.621 106.209 133.182 111.318C134.455 115.483 136.56 120.963 138.245 125.646C140.214 131.117 141.446 140.093 138.28 151.481C137.764 153.338 135.815 154.576 134.219 156.161C131.367 158.993 128.17 162.928 122.022 164.829C115.09 166.974 109.181 169.298 101.922 168.407C86.9772 166.574 78.3186 162.667 71.1271 158.879C65.8835 156.117 61.577 150.017 60.2925 145.721C59.1157 141.784 57.48 135.002 62.6604 120.548C64.9134 114.262 66.8871 110.315 68.731 106.57C70.7776 102.413 72.5952 97.9597 74.2907 94.6948Z" fill="#9DD3FF" stroke="#416FA7" stroke-width="5" stroke-linecap="round"/>
                <path d="M101.474 154.838C108.735 154.838 119.956 152.724 121.939 152.183C128.541 150.38 135.221 149.355 137.783 147.562C144.385 142.941 147.685 141.62 149.863 136.339C150.696 134.317 150.986 129.368 150.986 127.097C150.986 123.837 148.346 120.287 145.705 118.514C143.925 117.32 141.121 115.874 137.783 115.874C136.738 115.874 134.441 121.601 134.003 121.743C131.541 122.54 116.658 130.054 102.831 130.054C98.0657 130.054 89.776 129.526 84.9694 128.131C77.7076 126.022 77.7076 126.437 73.0864 123.837C71.1857 122.767 63.8018 119.451 63.1839 117.402C62.5237 115.214 65.8246 114.553 62.5237 113.233C59.8298 112.156 56.9884 111.913 53.2813 114.553C51.0645 116.133 48 120.888 48 125.116C48 128.153 49.5689 134.015 51.961 136.339C53.947 138.269 58.7325 143.024 60.7025 143.954C62.6354 144.867 64.4888 146.12 66.6573 146.904C68.4292 147.545 74.6238 149.625 78.3677 150.38C81.3209 150.976 86.4974 152.828 89.5906 153.338C94.1611 154.093 98.3526 154.838 101.474 154.838Z" fill="white" stroke="#555555" stroke-width="5" stroke-linecap="round"/>
                <path d="M58.0669 118.585C59.0672 118.206 60.9735 118.111 61.8231 118.111C62.727 118.66 83.7294 127.026 82.9889 127.757C82.8212 127.922 79.0501 128.73 77.7076 129.204C76.8265 129.516 73.7466 131.058 73.0864 133.37C72.7617 134.507 72.049 138.32 72.4263 139.64C73.7466 144.261 73.728 143.129 75.0669 146.242C77.0474 150.845 77.2055 149.542 76.3873 149.542C75.0669 149.542 60.549 144.301 58.5627 143.601C57.6355 143.274 50.3242 135.754 49.9805 135.019C49.5543 134.107 48.568 133.037 48.568 132.221C48.568 131.058 48.7648 129.129 49.3204 127.757C49.8244 126.512 50.5881 124.365 51.3009 123.515C53.2814 121.155 55.1944 119.93 56.394 119.175C57.2286 118.649 56.8664 119.041 58.0669 118.585Z" fill="#FC4242"/>
                <path d="M101.474 138.98C101.474 136.339 99.6177 131.001 99.5764 130.711C100.725 130.586 110.011 129.928 111.376 129.737C113.624 129.424 119.865 126.102 120.623 126.708C120.999 127.439 123.919 129.077 125.24 131.058C126.78 133.368 128.729 136.47 129.201 137.659C129.515 138.451 129.861 140.96 129.861 143.601C129.861 147.433 129.146 149.381 128.107 150.548C127.606 151.111 114.785 152.703 114.017 153.191C112.717 153.066 99.4565 154.954 98.9495 154.004C98.8256 153.772 98.8094 153.439 98.8468 153.191C98.9094 152.776 99.299 152.572 99.3687 152.212C99.4938 151.564 99.6588 150.898 99.8273 150.209C100.037 149.352 100.481 148.549 100.704 147.433C100.996 145.97 101.474 141.739 101.474 138.98Z" fill="#FC4242"/>
                <path d="M139.474 121.529C137.783 120.495 135.142 121.118 135.142 120.495C135.142 120.015 137.015 116.543 137.481 116.182C138.017 116.379 148.385 121.451 149.006 121.529C149.142 122.883 151.021 133.12 150.994 134.28C151.004 134.285 151.002 134.311 150.986 134.359C150.991 134.341 150.993 134.314 150.994 134.28C150.784 134.167 145.293 142.85 145.705 140.96C145.903 140.051 147.136 135.019 147.136 133.038C147.136 132.166 147.136 131.599 146.797 129.737C146.526 128.247 146.08 127.577 144.385 125.116C143.947 124.482 142.635 123.462 139.474 121.529Z" fill="#FC4242"/>
                <path d="M101.474 154.838C108.735 154.838 119.956 152.724 121.939 152.183C128.541 150.38 135.221 149.355 137.783 147.562C144.385 142.941 147.685 141.62 149.863 136.339C150.696 134.317 150.986 129.368 150.986 127.097C150.986 123.837 148.346 120.287 145.705 118.514C143.925 117.32 141.121 115.874 137.783 115.874C136.738 115.874 134.441 121.601 134.003 121.743C131.541 122.54 116.658 130.054 102.831 130.054C98.0657 130.054 89.776 129.526 84.9694 128.131C77.7076 126.022 77.7076 126.437 73.0864 123.837C71.1857 122.767 63.8018 119.451 63.1839 117.402C62.5237 115.214 65.8246 114.553 62.5237 113.233C59.8298 112.156 56.9884 111.913 53.2813 114.553C51.0645 116.133 48 120.888 48 125.116C48 128.153 49.5689 134.015 51.961 136.339C53.947 138.269 58.7325 143.024 60.7025 143.954C62.6354 144.867 64.4888 146.12 66.6573 146.904C68.4292 147.545 74.6238 149.625 78.3677 150.38C81.3209 150.976 86.4974 152.828 89.5906 153.338C94.1611 154.093 98.3526 154.838 101.474 154.838Z" stroke="#555555" stroke-width="5" stroke-linecap="round"/>
              </svg>
              <div>
                <div className="result-metrics-main">
                  <div>
                    <h1>Water Saved</h1>
                    <p><span>{waterSavedMl.toFixed(3)}</span> mL</p>
                  </div>
                  <div>
                    <h1>CO2 Saved</h1>
                    <p><span>{co2SavedGrams.toFixed(4)}</span> g</p>
                  </div>
                </div>
                <div>
                  New score: <strong>{optimizedScore}</strong> ({scoreImprovement >= 0 ? "+" : ""}{scoreImprovement})
                </div>
                <div>
                  Tokens saved: <strong>{tokensSaved}</strong> ({percentReduction.toFixed(1)}%)
                </div>
              </div>
            </div>

            {statusMessage && (
              <p className="popup-status" role="status" aria-live="polite">
                {statusMessage}
              </p>
            )}
          </div>
        }
      </div>
    </main>
  );
}
