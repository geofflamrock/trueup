import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import netlifyReactRouter from "@netlify/vite-plugin-react-router";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    netlifyReactRouter(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.ico"],
      manifest: {
        id: "true-up",
        name: "True Up",
        short_name: "True Up",
        description: "Track your group's expenses and true up",
        theme_color: "#030712",
        background_color: "#030712",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
        screenshots: [
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
      // workbox: {
      //   globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      //   runtimeCaching: [
      //     {
      //       urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      //       handler: "CacheFirst",
      //       options: {
      //         cacheName: "google-fonts-cache",
      //         expiration: {
      //           maxEntries: 10,
      //           maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      //         },
      //         cacheableResponse: {
      //           statuses: [0, 200],
      //         },
      //       },
      //     },
      //     {
      //       urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      //       handler: "CacheFirst",
      //       options: {
      //         cacheName: "gstatic-fonts-cache",
      //         expiration: {
      //           maxEntries: 10,
      //           maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      //         },
      //         cacheableResponse: {
      //           statuses: [0, 200],
      //         },
      //       },
      //     },
      //   ],
      // },
    }),
  ],
});
