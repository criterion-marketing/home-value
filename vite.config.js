import { defineConfig } from "vite";
import { DESCRIPTION, TITLE, site } from "./site.config.js";

function pageUrl() {
  return site.pageUrl.endsWith("/") ? site.pageUrl : `${site.pageUrl}/`;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

export default defineConfig({
  base: "/home-value/",
  server: {
    host: "0.0.0.0",
    port: 4321,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4322,
    strictPort: true,
  },
  plugins: [
    {
      name: "site-meta",
      transformIndexHtml(html) {
        const shareImage = new URL("home-worth-share.jpg", pageUrl()).href;
        return html
          .replaceAll("__TITLE__", esc(TITLE))
          .replaceAll("__DESCRIPTION__", esc(DESCRIPTION))
          .replaceAll("__PAGE_URL__", esc(pageUrl()))
          .replaceAll("__SHARE_IMAGE_URL__", esc(shareImage));
      },
    },
  ],
});
