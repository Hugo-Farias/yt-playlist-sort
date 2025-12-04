import { defineConfig } from "wxt";
import vite from "./vite.config";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],
  runner: { disabled: true },
  manifest: {
    default_locale: "en",
    permissions: ["storage"],
  },
  vite: () => vite,
});
