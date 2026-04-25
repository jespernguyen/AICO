import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";

function Dashboard() {
  return (
    <div className="page-shell">
      <h1>Dashboard Works!</h1>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>,
);
