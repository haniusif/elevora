import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Web Admin prototype — React + Vite + TS
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
