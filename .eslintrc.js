module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-functions": "off",
    "@typescript-eslint/no-extra-semi": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
  },
  globals: {
    React: "writable",
  },
  overrides: [
    {
      files: ["*.js"],
      env: {
        node: true,
      },
    },
  ],
}
