import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { existsSync, readdirSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "debug-manifest-output",
      buildStart() {
        // #region agent log
        fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "c404d9",
          },
          body: JSON.stringify({
            sessionId: "c404d9",
            runId: "pre-fix",
            hypothesisId: "H1",
            location: "vite.config.ts:8",
            message: "Build started with default Vite output pipeline",
            data: {},
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      },
      writeBundle(options) {
        const outDir = options.dir ?? resolve(__dirname, "dist");
        const manifestPath = resolve(outDir, "manifest.json");
        const manifestExists = existsSync(manifestPath);
        const distFiles = existsSync(outDir) ? readdirSync(outDir) : [];

        // #region agent log
        fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "c404d9",
          },
          body: JSON.stringify({
            sessionId: "c404d9",
            runId: "pre-fix",
            hypothesisId: "H2",
            location: "vite.config.ts:31",
            message: "Checked dist for manifest after bundle",
            data: { outDir, manifestPath, manifestExists, distFiles },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        // #region agent log
        fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "c404d9",
          },
          body: JSON.stringify({
            sessionId: "c404d9",
            runId: "pre-fix",
            hypothesisId: "H3",
            location: "vite.config.ts:54",
            message: "Manifest source file availability in repo root",
            data: { sourceManifestExists: existsSync(resolve(__dirname, "manifest.json")) },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        dashboard: resolve(__dirname, "src/dashboard/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
      },
    },
  },
});
