import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "./Popup.css";

const container = document.getElementById("root");

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
    hypothesisId: "H5",
    location: "src/popup/main.tsx:7",
    message: "Popup bootstrap evaluated",
    data: { hasContainer: Boolean(container) },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
