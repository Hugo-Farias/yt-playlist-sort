import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      react: react,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // Apply to all JS/TS files in the project
    files: ["**/*.{js,ts,jsx,tsx}"],
    rules: {
      "import/no-unused-modules": ["error", { unusedExports: true }],
    },
    settings: {
      "import/resolver": {
        typescript: true, // resolves path aliases
      },
    },
  },
  {
    ignores: [
      ".git/",
      "node_modules/",
      "dist/",
      ".output/",
      ".wxt/",
      ".scratch/",
      "eslint.config.js", // prevent self-linting
    ],
  },
];
