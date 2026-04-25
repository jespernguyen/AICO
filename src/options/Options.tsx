import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";

function Options() {
  return (
    <div className="page-shell">
      <h1>Options Works!</h1>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
