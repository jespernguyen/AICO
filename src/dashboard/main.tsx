import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "./Dashboard";
import "./Dashboard.css";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>
  );
}
