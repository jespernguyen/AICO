import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";

function Popup() {
  return (
    <div className="page-shell popup-shell">
      <h1>Popup Works!</h1>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
