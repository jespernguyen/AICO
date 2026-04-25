import React, { useEffect, useState } from "react";
import { useStorage } from "../hooks/useStorage";

type StatusKind = "success" | "error" | null;

export default function Options() {
  const { apiKey, saveKey, removeKey, storageLoading, storageError } = useStorage();
  const [inputValue, setInputValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({
    kind: null,
    message: "",
  });

  useEffect(() => {
    setInputValue(apiKey ?? "");
  }, [apiKey]);

  useEffect(() => {
    if (storageError) {
      setStatus({ kind: "error", message: storageError });
    }
  }, [storageError]);

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setStatus({ kind: "error", message: "API key cannot be empty." });
      return;
    }
    if (trimmed.length < 20) {
      setStatus({
        kind: "error",
        message: "API key looks too short (must be at least 20 characters).",
      });
      return;
    }

    setSubmitting(true);
    setStatus({ kind: null, message: "" });
    try {
      await saveKey(trimmed);
      setInputValue(trimmed);
      setStatus({ kind: "success", message: "API key saved." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save API key.";
      setStatus({ kind: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    const confirmed = window.confirm("Remove the saved API key?");
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setStatus({ kind: null, message: "" });
    try {
      await removeKey();
      setInputValue("");
      setStatus({ kind: "success", message: "API key removed." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove API key.";
      setStatus({ kind: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || storageLoading;
  const statusClass =
    status.kind === "success"
      ? "status status--success"
      : status.kind === "error"
        ? "status status--error"
        : "status";

  return (
    <main className="options-page">
      <section className="options-card" aria-labelledby="settings-title">
        <h1 id="settings-title">AICO Settings</h1>
        <p className="options-description">
          Add your Gemini API key so AICO can optimize prompts. The key is masked
          in this form and stored in your browser using Chrome extension storage.
        </p>

        <div className="options-field">
          <label htmlFor="api-key">Gemini API key</label>
          <input
            id="api-key"
            type={showKey ? "text" : "password"}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Enter your API key"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="api-key-help api-key-status"
          />
        </div>

        <div className="button-row">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setShowKey((value) => !value)}
            aria-pressed={showKey}
            disabled={busy}
          >
            {showKey ? "Hide" : "Show"}
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleSave}
            disabled={busy || inputValue.trim().length === 0}
          >
            Save
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={handleRemove}
            disabled={busy}
          >
            Remove
          </button>
        </div>

        <p id="api-key-help" className="helper-text">
          You can generate a Gemini API key in{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
          >
            Google AI Studio
          </a>
          .
        </p>

        <p id="api-key-status" role="status" aria-live="polite" className={statusClass}>
          {status.message}
        </p>
      </section>
    </main>
  );
}
