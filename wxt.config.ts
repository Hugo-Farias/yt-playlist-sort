import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

const prodValues = {
  key:
    process.env.NODE_ENV === "development"
      ? "gjlhchkmfhpnneacpincjkiadkionpfe"
      : "pknlkjehmikkbfpmfoiboncjnlopopjf",
  clientId:
    process.env.NODE_ENV === "development"
      ? "1076131773903-sksoj6ub3i5gec01f7744do2hpj65tko.apps.googleusercontent.com"
      : "1076131773903-1cl3ks6m9cvh1gaocu87a177kimo3qj0.apps.googleusercontent.com",
} as const;

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/i18n/module"],
  runner: { disabled: true },
  vite: () => ({
    plugins: [tailwindcss(), preact()],
  }),
  manifest: {
    name: "__MSG_extName__",
    key: prodValues.key,
    description: "__MSG_extDescription__",
    action: {
      default_popup: "entrypoints/popup/index.html",
    },
    default_locale: "en",
    permissions: ["storage", "identity"],
    oauth2: {
      client_id: prodValues.clientId,
      scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
    },
  },
});
