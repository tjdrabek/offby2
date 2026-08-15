/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// vite-plugin-pwa (MIT) wraps workbox-build (MIT) to emit a scoped service
// worker plus a precache manifest of the production build output.
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The application registers the worker itself (see
      // src/pwa/serviceWorkerRegistration.ts) so a registration failure can be
      // surfaced as a warning instead of silently disabling offline support.
      injectRegister: null,
      // Updates are activated only through an explicit reload; the worker never
      // takes over a running page on its own.
      registerType: "prompt",
      scope: "/",
      manifest: {
        id: "/",
        name: "Reusable Label Printing",
        short_name: "Label Printing",
        description:
          "Create label projects, model sheet layouts, and generate deterministic printable PDFs entirely in your browser.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#1b2a4a",
        background_color: "#1b2a4a",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,woff2}"],
        // Offline startup must not depend on the network: any in-scope
        // navigation falls back to the precached shell document.
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
