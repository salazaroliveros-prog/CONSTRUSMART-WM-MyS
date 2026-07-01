import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "assets/**", "docs/assets/**", "src/functions/**", "CONSTRUSMART-DEVELOP/**", "app_ejemplo/**", ".kilo/**", "eslint.config.js", "postcss.config.js", "tailwind.config.ts", "vitest.config.ts", "vitest.setup.ts", "public/sw.js", "*.cjs", "*.mjs", "*.js", "scripts/*.js", "scripts/*.cjs", "scripts/*.mjs", "scripts/**", "supabase/**", "e2e/**"],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{cjs,js,jsx,ts,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": hooksPlugin,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      ...hooksPlugin.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["off"],
      "no-empty": ["warn", { "allowEmptyCatch": true }],
    },
  },
];
