import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Restore theme preference (per-viewer convenience)
try {
  const t = localStorage.getItem("ll-theme");
  if (t === "dark") document.documentElement.classList.add("dark");
} catch {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
