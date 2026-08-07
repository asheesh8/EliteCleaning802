import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// eslint-config-next ships native flat configs, so no FlatCompat bridge
// is needed — routing them through it triggers a circular-structure crash.
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      "src/generated/**",
      ".next/**",
      "node_modules/**",
      "public/**",
    ],
  },
];

export default eslintConfig;
