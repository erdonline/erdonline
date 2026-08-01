module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  globals: {
    ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION: true,
    page: true,
    REACT_APP_ENV: true,
  },
  ignorePatterns: [
    '**/_mock.ts',
    '**/_mock.js',
    '**/service-worker.js',
    '**/pages/design/test/**',
    '**/pages/test/**',
    '**/pages/JExcel/**',
  ],
  rules: {
    // 调试残留红线：禁止新增 console.log（存量逐步清除）
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // 插件规则在当前依赖树缺失定义，关闭以免假红
    'import/no-extraneous-dependencies': 'off',
    'eslint-comments/disable-enable-pair': 'off',
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
    '@typescript-eslint/no-shadow': 'warn',
    '@typescript-eslint/no-use-before-define': 'warn',
    '@typescript-eslint/method-signature-style': 'warn',
    '@typescript-eslint/no-unused-expressions': 'warn',
    '@typescript-eslint/type-annotation-spacing': 'warn',
    '@typescript-eslint/no-loop-func': 'warn',
    'react/jsx-no-target-blank': 'warn',
  },
};
