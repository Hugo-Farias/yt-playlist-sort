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
    rules: {
      "import/no-unused-modules": ["error", { unusedExports: true }],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: [
      ".output/",
      ".wxt/",
      ".scratch/",
      "node_modules/",
      "dist/",
      "eslint.config.js", // prevent self-linting
    ],
  },
];

