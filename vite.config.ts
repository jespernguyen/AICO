import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const rootManifestPath = resolve(__dirname, "public/manifest.json");
const distManifestPath = resolve(__dirname, "dist/manifest.json");

// #region agent log
fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1f66e1" },
  body: JSON.stringify({
    sessionId: "1f66e1",
    runId: "pre-fix",
    hypothesisId: "H1",
    location: "vite.config.ts:11",
    message: "Vite config evaluation started",
    data: { cwd: process.cwd(), dirname: __dirname },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

const rootManifestExists = existsSync(rootManifestPath);
const distManifestExists = existsSync(distManifestPath);

// #region agent log
fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1f66e1" },
  body: JSON.stringify({
    sessionId: "1f66e1",
    runId: "pre-fix",
    hypothesisId: "H2",
    location: "vite.config.ts:28",
    message: "Manifest existence check",
    data: { rootManifestPath, rootManifestExists, distManifestPath, distManifestExists },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

if (!rootManifestExists) {
  // #region agent log
  fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1f66e1" },
    body: JSON.stringify({
      sessionId: "1f66e1",
      runId: "pre-fix",
      hypothesisId: "H3",
      location: "vite.config.ts:44",
      message: "Root manifest missing before CRX plugin init",
      data: { attemptedPath: rootManifestPath },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  throw new Error(`Manifest not found at ${rootManifestPath}`);
}

const manifest = JSON.parse(readFileSync(rootManifestPath, "utf-8"));

// #region agent log
fetch("http://127.0.0.1:7827/ingest/8e464713-5bad-45a3-86cc-936ff08489fe", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "1f66e1" },
  body: JSON.stringify({
    sessionId: "1f66e1",
    runId: "post-fix",
    hypothesisId: "H5",
    location: "vite.config.ts:63",
    message: "Manifest loaded successfully from root",
    data: { rootManifestPath, rootManifestExists, manifestVersion: manifest.manifest_version },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
        dashboard: resolve(__dirname, "src/dashboard/index.html"),
      },
    },
  },
});
