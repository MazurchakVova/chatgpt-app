module.exports = {
    parser: "@typescript-eslint/parser",
    extends: [
      "plugin:react/recommended",
      "plugin:@typescript-eslint/recommended",
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      quotes: ["off"],
      indent: ["error", 2, { SwitchCase: 1 }],
      "react/jsx-indent": ["error", 2],
      "react/jsx-indent-props": ["error", 2],
      "@typescript-eslint/indent": ["error", 2],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-var": "error",
      "react/no-children-prop": "off",
      "react/prop-types": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  };
  