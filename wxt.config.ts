import { defineConfig } from "wxt";
import vite from "./vite.config";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  runner: { disabled: true },
  manifest: {
    permissions: ["storage"],
  },
  vite: () => vite,
});
