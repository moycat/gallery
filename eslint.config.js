import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["build/**", "coverage/**", "dist/**", "node_modules/**", "src/cloudflare-env.d.ts"]
  },
  {
    files: ["**/*.{js,cjs,mjs}"],
    ...js.configs.recommended
  },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "no-console": "off"
    }
  }
);
