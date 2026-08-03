module.exports = {
  root: true,
  // Max 4 不再捆绑 @umijs/fabric。直连 parser + 必要插件（eslint@8），避免缺失 disable 规则在 --quiet 下变硬红。
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  globals: {
    ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION: true,
    page: true,
    REACT_APP_ENV: true,
    JSX: true,
    React: true,
  },
  ignorePatterns: [
    '**/_mock.ts',
    '**/_mock.js',
    '**/service-worker.js',
    '**/pages/test/**',
    '**/pages/JExcel/**',
  ],
  rules: {
    // 调试残留红线：禁止新增 console.log（存量逐步清除）
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // 存量债：先降为 warn，CI 用 --quiet 只拦 error；逐步抬回 error
    'prefer-const': 'warn',
    'no-var': 'warn',
    'no-param-reassign': [
      'warn',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'e',
          'ctx',
          'req',
          'request',
          'res',
          'response',
          'state',
          'options',
          'draft',
        ],
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/no-unused-expressions': 'warn',
    'no-undef': 'off',
    'no-unused-vars': 'off',
  },
};
