module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    browser: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-console': 'off',
    'no-empty': 'off',
    'no-await-in-loop': 'off',
    'no-use-before-define': ['error', { functions: false }],
    'no-param-reassign': 'off',
    'no-shadow': 'off',
    'prefer-destructuring': 'off',
  },
};
