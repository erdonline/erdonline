/**
 * 运行：cd frontend && npx tsx src/utils/getAntdLocale.test.ts
 */

import {
  DEFAULT_APP_LOCALE,
  getAntdLocale,
  getAppLocale,
  resolveAppLocale,
} from './getAntdLocale';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

run('default locale is zh-CN', () => {
  if (DEFAULT_APP_LOCALE !== 'zh-CN') throw new Error(DEFAULT_APP_LOCALE);
  if (resolveAppLocale(undefined) !== 'zh-CN') throw new Error('undefined');
  if (resolveAppLocale('') !== 'zh-CN') throw new Error('empty');
  if (resolveAppLocale('  ') !== 'zh-CN') throw new Error('blank');
});

run('resolve zh variants', () => {
  if (resolveAppLocale('zh-CN') !== 'zh-CN') throw new Error('zh-CN');
  if (resolveAppLocale('zh_CN') !== 'zh-CN') throw new Error('zh_CN');
  if (resolveAppLocale('ZH-cn') !== 'zh-CN') throw new Error('ZH-cn');
});

run('resolve en-US', () => {
  if (resolveAppLocale('en-US') !== 'en-US') throw new Error('en-US');
  if (resolveAppLocale('en_US') !== 'en-US') throw new Error('en_US');
});

run('unknown falls back to zh-CN', () => {
  if (resolveAppLocale('fr-FR') !== 'zh-CN') throw new Error('fr-FR');
});

run('getAntdLocale default has Modal okText 确定', () => {
  const prev = globalThis.window;
  // @ts-expect-error test shim
  globalThis.window = { _env_: {} };
  try {
    if (getAppLocale() !== 'zh-CN') throw new Error('app locale');
    const locale = getAntdLocale();
    if (locale.Modal?.okText !== '确定') {
      throw new Error(`okText=${locale.Modal?.okText}`);
    }
  } finally {
    globalThis.window = prev;
  }
});
