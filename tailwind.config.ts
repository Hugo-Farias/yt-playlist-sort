import type { Config } from "tailwindcss";

export default {
  content: ["./entrypoints/**/*.{html,tsx}", "./components/**/*.{html,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
