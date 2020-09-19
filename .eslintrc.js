module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:jest/recommended"],
  plugins: ["jest"],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {},
};
