import baseConfig from "@ticketverse/config/eslint.config.js";
import globals from "globals";

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
    },
  },
];
