import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/i18n/module"],
  runner: { disabled: true },
  vite: () => ({
    plugins: [tailwindcss(), preact()],
  }),
  manifest: {
    manifest_version: 3,
    name: "__MSG_extName__",
    description: "__MSG_extDescription__",
    version: "0.0.8",
    action: {
      default_popup: "entrypoints/popup/index.html",
    },
    default_locale: "en",
    permissions: ["storage"],
  },
});
