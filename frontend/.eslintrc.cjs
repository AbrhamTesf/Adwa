module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "no-constant-condition": "off",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "react-hooks/exhaustive-deps": "off",
  },
};
