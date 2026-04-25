import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { useAnalysis } from "../hooks/useAnalysis";
import { setStorageItem } from "../utils/storage";
import "../index.css";

function Popup() {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const { result, loading, error, analyze } = useAnalysis();

  const saveKey = async () => {
    await setStorageItem("geminiApiKey", apiKey);
    setKeySaved(true);
  };

  const handleOptimize = () => {
    if (prompt.trim()) analyze(prompt);
  };

  return (
    <div style={{ padding: 16, width: 320, fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: 12 }}>AICO – Prompt Optimizer</h2>

      <label style={labelStyle}>Gemini API Key</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setKeySaved(false); }}
          placeholder="AIza..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={saveKey} style={btnStyle}>
          {keySaved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <label style={labelStyle}>Your Prompt</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter prompt to optimize..."
        rows={4}
        style={{ ...inputStyle, width: "100%", resize: "vertical" }}
      />

      <button
        onClick={handleOptimize}
        disabled={loading || !prompt.trim()}
        style={{ ...btnStyle, marginTop: 8, width: "100%" }}
      >
        {loading ? "Optimizing..." : "Optimize"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 10, fontSize: 13 }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Optimized Prompt</label>
          <div style={resultStyle}>{result.summary}</div>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Tokens used: {result.tokens}
          </p>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 13,
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  fontSize: 13,
  cursor: "pointer",
};

const resultStyle: React.CSSProperties = {
  background: "#f1f5f9",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  whiteSpace: "pre-wrap",
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
