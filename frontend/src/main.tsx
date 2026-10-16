import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth";
import { Toaster } from "./lib/ui";
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
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
