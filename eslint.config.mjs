import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 자동 생성 폴더 및 불필요한 파일 제외
  {
    ignores: [".next/**", "out/**", "build/**", "dist/**", "node_modules/**"],
  },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Prettier와 충돌하는 ESLint 규칙 비활성화 (반드시 배열 마지막)
  ...compat.extends("prettier"),

  // 프로젝트 커스텀 규칙
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
